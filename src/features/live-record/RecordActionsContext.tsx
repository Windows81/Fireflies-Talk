import { promptConfirmation } from "@/components/Dialog";
import { LoadingScreen } from "@/components/Loading";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import {
  findCalendarTitleForActiveMeetings,
  meetingDetectionApi,
} from "@/features/desktop-meeting-detection";
import { checkConsentEnforcementBeforeStart } from "@/features/consent-policy";
import { useMeetingPrivacyOptions } from "@/features/meeting";
import { resolveAllowedMeetingPrivacy } from "@/features/meeting/utils/meeting-privacy-options";
import { useFindLanguageBest } from "@/features/remote-constants";
import { getLocalUserFlag, setLocalUserFlag } from "@/features/user-flags";
import { useGetCurrentUserQuery } from "@/graphql";
import * as AudioRecord from "@/modules/audio-record";
import { isDesktop } from "@/utils/device";
import { useHasNewUpdates } from "@/utils/updates";
import { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { Linking, Modal } from "react-native";
import { PromptLanguageDialog } from "./components/PromptLanguageDialog";
import { SilentRecordingDialog } from "./components/SilentRecordingDialog";
import { AudioInputUnavailableError } from "./errors";
import { recordEventEmitter } from "./events";
import { localRecordStoreApi } from "./local-record.store";
import {
  RECORD_STARTING_LABEL,
  recordPhaseApi,
  useRecordPhase,
} from "./record-phase.store";
import { useRecordPreferencesStore } from "./record-preference.store";
import { recorderApi, useRecorder } from "./record.store";
import type { RecordingSource } from "./types";
import { useExperimentalRecordConfig } from "./use-experimental-record-config";
import { useWindowsLoopbackAllDevices } from "./use-windows-loopback-all-devices";
import {
  permissionDeniedError,
  useStorageCheck,
  warnNewUpdatesBeforeRecording,
} from "./utils";
import { Logger } from "@/logger";

const logger = new Logger("RecordActionsContext");

export type StartInputs = {
  title: string;
  notesPrivacy: MeetingNotesPrivacy;
  language: string;
  skipLanguagePrompt?: boolean;
  fromDashboard?: boolean;
  recordingSource?: RecordingSource;
  /** Default visibility for Live Assist panel when Live screen opens (desktop compact). */
  defaultShowLiveAssist?: boolean;
  /** Default visibility for Notes panel when Live screen opens (desktop compact). */
  defaultShowNotes?: boolean;
  /** When true, recording is a demo walkthrough — skip paywalls and post-recording processing. */
  isDemo?: boolean;
};

interface RecordActionsContextType {
  startRecording: (inputs?: StartInputs) => Promise<void>;
  stopRecording: () => Promise<boolean>;
  toggleRecording: () => Promise<void>;
  expandFloatingCard: () => void;
  focusToTitleInput: () => void;
  startInputs: StartInputs;
  setStartInputs: React.Dispatch<React.SetStateAction<StartInputs>>;
}

const RecordActionsContext = createContext({} as RecordActionsContextType);

const getInitialStartInputs = (fromDashboard?: boolean): StartInputs => ({
  title: "",
  language: useRecordPreferencesStore.getState().language || "en",
  notesPrivacy: MeetingNotesPrivacy.Owner,
  fromDashboard: fromDashboard,
  skipLanguagePrompt: isDesktop,
});

export const RecordActionsContextProvider: FC<
  PropsWithChildren<{
    fromDashboard?: boolean;
  }>
> = ({ children, fromDashboard }) => {
  const hasNewUpdate = useHasNewUpdates();

  const phase = useRecordPhase();
  const recordConfig = useExperimentalRecordConfig();
  const windowsLoopbackAllDevices = useWindowsLoopbackAllDevices();

  // Desktop-only blocking overlay: desktop's capture screen has no inline
  // phase UI (mobile's RecordLiveView renders the phase pill instead).
  const [loading, setLoading] = useState<string | null>(null);

  const [isOpenPromptLanguage, setIsOpenPromptLanguage] = useState(false);

  const [showAudioInputUnavailableBanner, setShowAudioInputUnavailableBanner] =
    useState(false);

  const [startInputs, setStartInputs] = useState<StartInputs>(() =>
    getInitialStartInputs(fromDashboard),
  );

  const { user } = useAuth();
  const privacyOptions = useMeetingPrivacyOptions();
  const { data: dataUser, refetch: refetchCurrentUser } =
    useGetCurrentUserQuery({ skip: !user });
  const findLanguageBest = useFindLanguageBest();

  // Seed notesPrivacy from the server query rather than the cached auth-store
  // user, whose privacy can be stale.
  const serverPrivacy = dataUser?.user?.privacy;
  const userResolved = Boolean(dataUser?.user);
  const hasRefetchedPrivacyRef = useRef(false);

  // Key on the primitive privacy value, not the Apollo User object — that
  // object's reference churns on any User cache write and would re-seed,
  // clobbering a privacy the user picked in the record form.
  useEffect(() => {
    if (!serverPrivacy) return;
    setStartInputs((prev) => ({
      ...prev,
      notesPrivacy: serverPrivacy as MeetingNotesPrivacy,
    }));
  }, [serverPrivacy]);

  // When the query resolves without a privacy value, refetch once so we use
  // the server value instead of falling back to the default.
  useEffect(() => {
    if (!userResolved || serverPrivacy || hasRefetchedPrivacyRef.current)
      return;
    hasRefetchedPrivacyRef.current = true;
    refetchCurrentUser();
  }, [userResolved, serverPrivacy, refetchCurrentUser]);

  // Seed startInputs with the user's server-side preferredLanguage once the
  // query resolves: desktop has no language picker, and on web/mobile the
  // account language is the default until the user picks one in the recorder.
  useEffect(() => {
    const preferredLang = dataUser?.user?.preferredLanguage;
    if (!preferredLang) return;
    const normalizedLang = findLanguageBest(preferredLang)?.code || "en";
    if (!isDesktop) {
      const { syncLanguageFromAccount, hasExplicitLanguage } =
        useRecordPreferencesStore.getState();
      syncLanguageFromAccount(normalizedLang);
      if (hasExplicitLanguage) return;
    }
    setStartInputs((prev) => ({
      ...prev,
      language: normalizedLang,
    }));
  }, [dataUser?.user?.preferredLanguage, findLanguageBest]);

  const checkStorageBeforeRecording = useStorageCheck(300);

  const startRecording = useCallback(
    async (customStartInputs?: StartInputs) => {
      if (recordPhaseApi.isBusy()) return;

      const { status } = useRecorder.getState();
      const inputs = customStartInputs ?? startInputs;
      const resolvedInputs: StartInputs =
        isDesktop && !inputs.recordingSource
          ? {
              ...inputs,
              recordingSource: { type: "manual" },
            }
          : inputs;

      if (status.state !== "inactive") {
        return;
      }

      // Claim the transition before the first await: several providers
      // coexist (screen + floating card), and two near-simultaneous calls
      // would both pass isBusy() if the claim waited until after the checks.
      // Every early return and failure below releases it via the finally.
      recordPhaseApi.beginTransition("starting");

      try {
        // Claimed before the gate: its policy read can take seconds, and a silent button reads as broken.
        setLoading(RECORD_STARTING_LABEL);

        // The team can require the camera notice. A refused start has already
        // brought home forward with the guidance, so there is nothing to show
        // here. The onboarding demo records nobody but the member, so it is
        // exempt.
        if (isDesktop && !resolvedInputs.isDemo) {
          const verdict = await checkConsentEnforcementBeforeStart();
          if (!verdict.allowed) return;
        }

        const hasEnoughStorage = await checkStorageBeforeRecording();
        if (!hasEnoughStorage) return;

        const shownLanguageSelectBeforeRecording = getLocalUserFlag(
          "record.language-select-prompt.shown",
        );

        if (
          !isDesktop &&
          !shownLanguageSelectBeforeRecording &&
          !resolvedInputs?.skipLanguagePrompt
        ) {
          setStartInputs((prev) => ({ ...prev, ...resolvedInputs }));
          setIsOpenPromptLanguage(true);
          setLocalUserFlag("record.language-select-prompt.shown", true);
          return;
        }

        if (hasNewUpdate) {
          const recordAnyway = await warnNewUpdatesBeforeRecording();
          if (!recordAnyway) return;
        }

        // The desktop session can stay alive for days, during which the user
        // may change their privacy or preferredLanguage on another platform.
        // useGetCurrentUserQuery is cache-first and only refetches on auth
        // change, so pull fresh values from the network before recording.
        // Fall back to the last known cache values on failure.
        const freshUser = (await refetchCurrentUser().catch(() => null))?.data
          ?.user;
        const freshPrivacy =
          (freshUser?.privacy as MeetingNotesPrivacy | undefined) ??
          (serverPrivacy as MeetingNotesPrivacy | undefined);

        // Keep a privacy the user explicitly chose for this recording in the
        // form; otherwise record with the freshly fetched account default.
        const accountOrFormPrivacy =
          resolvedInputs.notesPrivacy === serverPrivacy && freshPrivacy
            ? freshPrivacy
            : resolvedInputs.notesPrivacy;
        const resolvedPrivacy =
          resolveAllowedMeetingPrivacy(accountOrFormPrivacy, privacyOptions) ??
          accountOrFormPrivacy;

        // Resolve language from the server-side preferredLanguage unless the
        // user picked a recording language themselves (web/mobile only, since
        // desktop has no picker). "multi" and "auto" variants default to "en".
        const usesAccountLanguage =
          isDesktop ||
          !useRecordPreferencesStore.getState().hasExplicitLanguage;
        const resolvedLanguage = usesAccountLanguage
          ? (() => {
              const preferredLang =
                freshUser?.preferredLanguage ??
                dataUser?.user?.preferredLanguage;
              const lang = preferredLang
                ? findLanguageBest(preferredLang)?.code || "en"
                : resolvedInputs.language || "en";
              return lang.startsWith("multi") || lang.startsWith("auto")
                ? "en"
                : lang;
            })()
          : // Each provider keeps its own startInputs, so a pick made in another one
            // (e.g. the recording menu) only reaches the stored preference.
            (customStartInputs?.language ??
            useRecordPreferencesStore.getState().language);

        const { context, fileUri } = await recorderApi.start({
          mimeType: recordConfig.mimeType,
          usingStream: recordConfig.enableStreaming,
          playbackLatencyHint: recordConfig.playbackLatencyHint,
          windowsLoopbackAllDevices,
          language: resolvedLanguage,
          notesPrivacy: resolvedPrivacy,
          // Untitled desktop manual/tray starts adopt the calendar event
          // title only when the detected call matches exactly one live event.
          title:
            resolvedInputs.title.trim() ||
            (isDesktop &&
            !resolvedInputs.isDemo &&
            (resolvedInputs.recordingSource?.type === "manual" ||
              resolvedInputs.recordingSource?.type === "tray") &&
            !resolvedInputs.recordingSource.trigger
              ? (findCalendarTitleForActiveMeetings(
                  meetingDetectionApi.getState().localMeetings,
                  meetingDetectionApi.getState().calendarEvents,
                ) ?? "")
              : ""),
          fromDashboard: resolvedInputs.fromDashboard ?? false,
          recordingSource: resolvedInputs.recordingSource,
          defaultShowLiveAssist: resolvedInputs.defaultShowLiveAssist,
          defaultShowNotes: resolvedInputs.defaultShowNotes,
          isDemo: resolvedInputs.isDemo,
        });

        localRecordStoreApi.add({
          ...context,
          fileUris: [fileUri],
          uploaded: false,
          streamed: false,
        });

        setStartInputs((prev) => ({
          ...getInitialStartInputs(fromDashboard),
          language: resolvedLanguage,
          notesPrivacy: freshPrivacy ?? prev.notesPrivacy,
        }));
      } catch (err) {
        if (err === permissionDeniedError) {
          toast({
            message: (err as Error).message,
            type: "error",
            action: {
              label: "Settings",
              onPress: () =>
                isDesktop
                  ? window.electron?.permissions.openSettings("microphone")
                  : Linking.openSettings(),
            },
            duration: 6000,
          });
        } else if (err instanceof AudioInputUnavailableError) {
          setShowAudioInputUnavailableBanner(true);
        } else {
          toast({
            title: "Could not start recording",
            message: (err as Error).message,
            type: "error",
          });
        }
      } finally {
        setLoading(null);
        recordPhaseApi.endTransition();
      }
    },
    [
      hasNewUpdate,
      recordConfig.mimeType,
      recordConfig.enableStreaming,
      recordConfig.playbackLatencyHint,
      windowsLoopbackAllDevices,
      startInputs,
      checkStorageBeforeRecording,
      fromDashboard,
      serverPrivacy,
      privacyOptions,
      refetchCurrentUser,
      dataUser?.user?.preferredLanguage,
      findLanguageBest,
    ],
  );

  const toggleRecording = useCallback(async () => {
    const { status, context } = useRecorder.getState();

    logger.info("[toggleRecording] called", {
      statusState: status.state,
      phase,
      hasMeetingId: !!context?.meetingId,
      usingStream: context?.usingStream,
    });

    if (recordPhaseApi.isBusy()) {
      logger.warn("[toggleRecording] skipped: a transition is running", {
        phase,
      });
      return;
    }

    const intent: "pause" | "resume" | undefined =
      status.state === "paused"
        ? "resume"
        : status.state === "recording"
          ? "pause"
          : undefined;

    if (!intent) {
      logger.warn("[toggleRecording] skipped: no intent for state", {
        statusState: status.state,
      });
      return;
    }

    logger.info(
      `[toggleRecording] intent=${intent}, calling recorderApi.${intent}()`,
    );

    try {
      if (intent === "resume") {
        await recorderApi.resume();
      } else {
        await recorderApi.pause();
      }
      logger.info(
        `[toggleRecording] recorderApi.${intent}() completed successfully`,
      );
    } catch (err) {
      if (err === permissionDeniedError) {
        toast({
          message: (err as Error).message,
          type: "error",
          action: {
            label: "Settings",
            onPress: () =>
              isDesktop
                ? window.electron?.permissions.openSettings("microphone")
                : Linking.openSettings(),
          },
          duration: 6000,
        });
      } else if (err instanceof AudioInputUnavailableError) {
        setShowAudioInputUnavailableBanner(true);
      } else {
        toast({
          message:
            "Recording stopped due to an unexpected error. Please try again to restart the recording.",
          type: "error",
        });
      }
    }
  }, [phase]);

  const stopRecording = useCallback(async (): Promise<boolean> => {
    if (recordPhaseApi.isBusy()) return false;

    const { context } = useRecorder.getState();

    if (!context?.title) {
      const confirmedProceedWithDefaultTitle = await new Promise<boolean>(
        (resolve) =>
          promptConfirmation({
            title: "Proceed without meeting title?",
            children:
              "Adding a title makes it easier to find the recording later.",
            cancelText: "Proceed anyway",
            confirmText: "Add title",
            hideCloseOnHeader: true,
            onCancel: () => {
              // TODO: on iOS, if a dialog leads to another dialog, it will lead to undefined behavior
              // Since another dialog may open right after this, we need to delay the resolution
              setTimeout(() => resolve(true), 1000);
            },
            onConfirm: () => {
              // The recording UI may be collapsed into the floating card —
              // expand it so the title input is on screen before focusing.
              recordEventEmitter.emit("expandFloatingCard");
              setTimeout(() => {
                recordEventEmitter.emit("focusTitle");
              }, 300);
              resolve(false);
            },
          }),
      );

      if (!confirmedProceedWithDefaultTitle) {
        return false;
      }
    }

    recordPhaseApi.beginTransition("ending");
    setLoading("Finalizing recording...");

    try {
      const { context } = await recorderApi.stop();

      localRecordStoreApi.updateByUri(context.fileUri, context);
      return true;
    } catch {
      // Toast is handled by the error-event listener in record.store.ts,
      // which also covers IPC and auto-stop callers.
      return false;
    } finally {
      setLoading(null);
      recordPhaseApi.endTransition();
    }
  }, []);

  const expandFloatingCard = useCallback(() => {
    recordEventEmitter.emit("expandFloatingCard");
  }, []);

  const focusToTitleInput = useCallback(() => {
    recordEventEmitter.emit("focusTitle");
  }, []);

  // Listen for pause/resume toggle requests from other windows (e.g., live view)
  useEffect(() => {
    if (!isDesktop || !window.electron?.recordingContext) {
      logger.info("[RecordActionsContext] IPC listener not set up", {
        isDesktop,
        hasRecordingContext: !!window.electron?.recordingContext,
      });
      return;
    }

    logger.info(
      "[RecordActionsContext] Setting up toggle-pause-resume IPC listener",
    );

    const unsubscribe =
      window.electron.recordingContext.onTogglePauseResumeRequested(() => {
        const { status, context } = useRecorder.getState();
        logger.info("[RecordActionsContext] IPC toggle-pause-resume received", {
          statusState: status.state,
          hasMeetingId: !!context?.meetingId,
          usingStream: context?.usingStream,
        });
        toggleRecording();
      });

    return () => {
      unsubscribe?.();
    };
  }, [toggleRecording]);

  // Apply live mic-input switches requested from another window (e.g. the
  // realtime panel's recording controls). The recorder lives in this window,
  // so the cross-window dropdown can only reach it through the bridge.
  useEffect(() => {
    if (!isDesktop || !window.electron?.recordingContext) return;

    const unsubscribe =
      window.electron.recordingContext.onSetInputDeviceRequested((deviceId) => {
        void AudioRecord.setInputDevice?.(deviceId);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      startRecording,
      toggleRecording,
      stopRecording,
      expandFloatingCard,
      focusToTitleInput,
      startInputs,
      setStartInputs,
    }),
    [
      startRecording,
      toggleRecording,
      stopRecording,
      expandFloatingCard,
      focusToTitleInput,
      startInputs,
      setStartInputs,
    ],
  );

  return (
    <RecordActionsContext.Provider value={value}>
      {children}
      <PromptLanguageDialog
        isOpen={isOpenPromptLanguage}
        close={() => setIsOpenPromptLanguage(false)}
        startInputs={startInputs}
        startRecording={startRecording}
      />
      <SilentRecordingDialog
        title="Recording Unavailable"
        isOpen={showAudioInputUnavailableBanner}
        close={() => setShowAudioInputUnavailableBanner(false)}
      />
      {isDesktop && (
        <Modal transparent visible={!!loading}>
          <LoadingScreen withOverlay title={loading || ""} />
        </Modal>
      )}
    </RecordActionsContext.Provider>
  );
};

export const useRecordActionsContext = () => useContext(RecordActionsContext);
