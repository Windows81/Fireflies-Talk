import type {
  CreateMarkMutationVariables,
  LiveActionItem,
  LiveInsights,
  LiveNote,
  LiveTranscriptItem,
  Meeting,
  NewMeetingNoteCommentMutationVariables,
} from "@/graphql";
import {
  GetMeetingDocument,
  GetMeetingSummaryQueryDocument,
  MeetingNotesPrivacy,
} from "@firefliesai/mobile-ff.graphql-client";
import {
  GetWelcomeMeetingsDocument,
  useEndLiveMeetingCallMutation,
  useDeleteMeetingsMutation,
  GetCurrentUserDocument,
} from "@/graphql";
import { Logger } from "@/logger";
import { useApolloClient, useQuery } from "@apollo/client";
import type { Emitter } from "mitt";
import mitt from "mitt";
import {
  meetingEndAnimationApi,
  useMeetingEndAnimationStore,
} from "@/features/meeting-end-animation";
import type { FC, PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LiveMeetingEvents, isLiveMeeting } from "@/features/live";
import type {
  ClientSpeakerInsight,
  DeleteLiveMeetingActivityEvent,
  EntitiesDetectedPayload,
  EventEmitterEventMaps,
  LiveMeetingActivity,
  UpdateActionItem,
} from "@/features/live";

import {
  formatSectionContent,
  transformSectionKey,
  KEY_TAKEAWAYS_KEY,
} from "@/utils/summary-formatting";
import type { RealtimeLiveAssist } from "@/features/ask-fred";
import { useLiveActivities } from "./useLiveActivities";
import {
  type ChapterizedNotes,
  type FormattedChapter,
  useLiveInsights,
} from "./useLiveInsights";
import { type LiveTranscript, useLiveTranscript } from "./useLiveTranscript";
import { useLiveMeetingSocket } from "./useLiveMeetingSocket";
import { useMeetingLivenessFallback } from "./useMeetingLivenessFallback";
import {
  isDesktop,
  isMainDesktopWindow,
  markAsMainDesktopWindow,
  resetMainDesktopWindowCache,
} from "@/utils/device";
import { useAuth } from "@/features/auth";
import { useManualNotesAutoUpload } from "@/features/manual-notes";
import { storage as localStorageOrMemory } from "@/features/storage";
import { useKnowledgebase } from "src/hooks/useKnowledgebase";
import type { AssistMode } from "src/features/live/types";
import { ASSIST_MODES } from "src/features/live/types";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { usePuppetPauseState } from "./usePuppetPauseState";
import type { ConsentDeliveryStatus } from "@/features/live-record/consent-delivery.store";
import { incrementRealRecordingsCount } from "@/features/live-record/real-recordings-count.store";
import { useIsDesktopNotepadEnabled } from "@/screens/DesktopNotepad/hooks/useIsDesktopNotepadEnabled";
import {
  beginDesktopMeetingDiscard,
  discardDesktopMeeting,
} from "@/features/live-record/discard-desktop-meeting";
import { toast } from "@/components/Toast";
import { stopRealtimeMeeting } from "@/features/live-record/puppet-sync";
import {
  STOP_DESKTOP_RECORDING_FAILED_MESSAGE,
  stopLiveMeeting,
} from "@/features/live-record/stop-live-meeting";

interface PuppetPauseState {
  isPaused: boolean;
  togglePause: () => void;
}

interface LiveScreenContextValue {
  liveInsights: LiveInsights | null;
  loadingLiveInsights: boolean;
  refetchLiveInsights: () => void;
  liveActivities: LiveMeetingActivity[];
  refetchLiveActivities: () => void;
  meeting: Meeting;
  meetingId: string;
  isMeetingEnded: boolean;
  isEndingMeeting: boolean;
  endLiveMeeting: () => Promise<void>;
  discardLiveMeeting: () => Promise<void>;
  updateActionItem: (data: UpdateActionItem) => void;
  createMark: (variables: CreateMarkMutationVariables) => Promise<unknown>;
  createComment: (
    variables: NewMeetingNoteCommentMutationVariables,
  ) => Promise<unknown>;
  deleteActivity: (activity: LiveMeetingActivity) => Promise<unknown>;
  ee: Emitter<EventEmitterEventMaps>;
  formattedChapters: FormattedChapter[];
  liveTranscript: LiveTranscript;
  assistActions: Array<RealtimeLiveAssist>;
  assistMode: AssistMode;
  setAssistMode: (mode: AssistMode) => void;
  clickedDynamicActions: Set<string>;
  markDynamicActionAsClicked: (actionKey: string) => void;
  sectionContent: Record<string, string>;
  completedSections: Set<string>;
  isSummaryProcessing: boolean;
  summaryError: string | null;
  knowledgeBases: string[];
  setKnowledgeBases: (knowledgeBases: string[]) => void;
  recordingContext: RecordingContextSnapshot | null | undefined;
  showSalesAssistPaywall: boolean;
  triggerSalesAssistPaywall: () => void;
  entitiesDetected: EntitiesDetectedPayload | null;
  activeSpeakerInsights: ClientSpeakerInsight[];
  puppetPauseState: PuppetPauseState;
  isSelfRecordingSession: boolean | undefined;
}

type RecordingContextSnapshot = {
  meetingId?: string;
  title?: string;
  notesPrivacy?: MeetingNotesPrivacy;
  state: "inactive" | "recording" | "paused";
  enableSystemAudio?: boolean;
  defaultShowLiveAssist?: boolean;
  defaultShowNotes?: boolean;
  isDemo?: boolean;
  consentDelivery?: ConsentDeliveryStatus;
  audioConsentDelivery?: ConsentDeliveryStatus;
  platform?: string;
};

type ElectronRecordingContextSnapshot = {
  meetingId?: string;
  title?: string;
  notesPrivacy?: string;
  state: RecordingContextSnapshot["state"];
  enableSystemAudio?: boolean;
  defaultShowLiveAssist?: boolean;
  defaultShowNotes?: boolean;
  isDemo?: boolean;
  consentDelivery?: ConsentDeliveryStatus;
  audioConsentDelivery?: ConsentDeliveryStatus;
  platform?: string;
};

const meetingNotesPrivacyValues = new Set(
  Object.values(MeetingNotesPrivacy) as MeetingNotesPrivacy[],
);

const coerceNotesPrivacy = (
  value: string | undefined,
): MeetingNotesPrivacy | undefined => {
  if (!value) return undefined;
  return meetingNotesPrivacyValues.has(value as MeetingNotesPrivacy)
    ? (value as MeetingNotesPrivacy)
    : undefined;
};

const normalizeRecordingContextSnapshot = (
  snapshot: ElectronRecordingContextSnapshot | null,
): RecordingContextSnapshot | null => {
  if (!snapshot) return null;
  return {
    ...snapshot,
    notesPrivacy: coerceNotesPrivacy(snapshot.notesPrivacy),
  };
};

const LiveScreenContext = createContext<LiveScreenContextValue | null>(null);

const logger = new Logger("LiveScreenProvider");

/** When instant-summary streaming is missed (socket disconnect during meeting end),
 *  retry fetching the summary from GraphQL after this delay.  */
const SUMMARY_FALLBACK_DELAY_MS = 10_000;
const SUMMARY_FALLBACK_MAX_RETRIES = 3;

export const LiveScreenProvider: FC<
  PropsWithChildren<{
    meeting: Meeting;
  }>
> = ({ meeting, children }) => {
  const isNotepadEnabled = useIsDesktopNotepadEnabled();
  const isAnimationShowing = useMeetingEndAnimationStore(
    (state) => state.isShowing,
  );

  const [assistMode, setAssistMode] = useState<AssistMode>(
    ASSIST_MODES.GENERAL,
  );
  const [showSalesAssistPaywall, setShowSalesAssistPaywall] = useState(false);
  // use a state to make sure we always clean up the previous socket instance
  const hasNotifiedMainOfEndRef = useRef(false);
  const isDiscardingRef = useRef(false);
  const hasRefetchedMeetingForSummaryRef = useRef(false);
  const hasTrackedInstantSummaryRef = useRef(false);
  const meetingTitleRefetchTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [ee] = useState(() => mitt<EventEmitterEventMaps>());

  const [assistActions, setAssistActions] = useState<Array<RealtimeLiveAssist>>(
    [],
  );

  const [clickedDynamicActions, setClickedDynamicActions] = useState<
    Set<string>
  >(new Set());

  // Instant summary streaming state
  const [sectionContent, setSectionContent] = useState<Record<string, string>>(
    {},
  );
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(),
  );
  const [isSummaryProcessing, setIsSummaryProcessing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryFallbackRetry, setSummaryFallbackRetry] = useState(0);
  const sectionContentRef = useRef<Record<string, string>>({});
  const [isMeetingEnded, setIsMeetingEnded] = useState(!isLiveMeeting(meeting));
  const prevIsMeetingEndedRef = useRef(isMeetingEnded);
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [recordingContext, setRecordingContext] = useState<
    RecordingContextSnapshot | null | undefined
  >(undefined);
  // Mirrors recordingContext for markMeetingEnded to read without depending
  // on it — recordingContext updates on every recorder tick, and depending
  // on it directly would churn the identity of markMeetingEnded's many
  // callers throughout this component.
  const recordingContextRef = useRef(recordingContext);
  recordingContextRef.current = recordingContext;
  // Guards against double-counting: multiple end-of-meeting paths (recorder
  // IPC, server broadcast, inactivity fallback) can all call
  // markMeetingEnded for the same session.
  const hasCountedRealRecordingRef = useRef(false);
  const [entitiesDetected, setEntitiesDetected] =
    useState<EntitiesDetectedPayload | null>(null);
  const [activeSpeakerInsights, setActiveSpeakerInsights] = useState<
    ClientSpeakerInsight[]
  >([]);
  const speakerInsightDismissTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  // Throttling state for speaker insights (per-type):
  // - Max 2 displays per type per call
  // - 15 min cooldown per type after each display
  const speakerInsightThrottleRef = useRef<
    Record<string, { count: number; lastShownAt: number }>
  >({});

  const { user } = useAuth();
  const { data: knowledgeBaseList, loading: knowledgeBaseLoading } =
    useKnowledgebase();

  // Persist manual-notes drafts per meeting and flush them to the
  // `uploadManualNotes` mutation when the meeting ends or the renderer is
  // about to unload.
  useManualNotesAutoUpload({
    meetingId: meeting.id,
    isMeetingEnded,
  });

  useEffect(() => {
    setAssistActions([]);
    setClickedDynamicActions(new Set());
    setSectionContent({});
    sectionContentRef.current = {};
    setCompletedSections(new Set());
    setIsSummaryProcessing(false);
    setSummaryError(null);
    setSummaryFallbackRetry(0);
    setIsMeetingEnded(!isLiveMeeting(meeting));
    setShowSalesAssistPaywall(false);
    setActiveSpeakerInsights([]);
    speakerInsightThrottleRef.current = {};
    for (const timer of speakerInsightDismissTimersRef.current.values()) {
      clearTimeout(timer);
    }
    speakerInsightDismissTimersRef.current.clear();
    hasRefetchedMeetingForSummaryRef.current = false;
    hasTrackedInstantSummaryRef.current = false;
    hasCountedRealRecordingRef.current = false;
    if (meetingTitleRefetchTimerRef.current) {
      clearTimeout(meetingTitleRefetchTimerRef.current);
      meetingTitleRefetchTimerRef.current = null;
    }
    const nextIsEnded = !isLiveMeeting(meeting);
    setIsMeetingEnded(nextIsEnded);
    prevIsMeetingEndedRef.current = nextIsEnded;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when navigating to a different meeting, not on field updates
  }, [meeting.id]);

  useEffect(() => {
    hasNotifiedMainOfEndRef.current = false;
  }, [meeting.id]);

  useEffect(() => {
    const dismissTimers = speakerInsightDismissTimersRef.current;
    return () => {
      for (const timer of dismissTimers.values()) {
        clearTimeout(timer);
      }
      dismissTimers.clear();
      if (meetingTitleRefetchTimerRef.current) {
        clearTimeout(meetingTitleRefetchTimerRef.current);
        meetingTitleRefetchTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const defaultKnowledgeBasesKey = `makeDefault-${user?.email}`;
    const defaultKnowledgeBases =
      localStorageOrMemory.getItem(defaultKnowledgeBasesKey) ?? "";

    if (defaultKnowledgeBases && !knowledgeBaseLoading) {
      setKnowledgeBases(
        defaultKnowledgeBases
          .split(",")
          .filter((kb) =>
            knowledgeBaseList?.some(
              (kbi) =>
                kbi.name.toLowerCase().trim() === kb.toLowerCase().trim(),
            ),
          ),
      );
    }
  }, [knowledgeBaseList, knowledgeBaseLoading, user?.email]);

  const apolloClient = useApolloClient();

  // Ref to hold the reconnect callback - allows breaking circular dependency
  // between useLiveMeetingSocket and hooks that depend on realtimeToken
  const onReconnectRef = useRef<(() => void) | undefined>(undefined);

  const stableOnReconnect = useCallback(() => onReconnectRef.current?.(), []);

  // Same shape as onReconnectRef: the liveness check this calls is created
  // further down, once the end-of-meeting flow it may run exists.
  const onSocketMeetingEndedRef = useRef<(() => void) | undefined>(undefined);
  const stableOnSocketMeetingEnded = useCallback(
    () => onSocketMeetingEndedRef.current?.(),
    [],
  );

  const isSelfRecordingSession = !isDesktop
    ? false
    : recordingContext === undefined
      ? undefined
      : recordingContext?.meetingId === meeting.id;

  // Socket lifecycle management - handles connection, reconnection, and inactivity timeout
  const { socket, realtimeToken, setLastActivityTime } = useLiveMeetingSocket({
    apolloClient,
    meetingId: meeting.id,
    assistMode,
    knowledgeBases,
    isLive: !isMeetingEnded,
    // Mirrors the transcript listeners below: a self-recording session takes
    // transcripts from Electron IPC, everything else from this socket.
    receivesTranscriptsOverSocket: isSelfRecordingSession !== true,
    onReconnect: stableOnReconnect,
    onMeetingEnded: stableOnSocketMeetingEnded,
  });

  const {
    liveInsights,
    loadingLiveInsights,
    upsertLiveInsightsCache,
    handleChaptersUpdate,
    refetchLiveInsights,
    formattedChapters,
  } = useLiveInsights({
    meeting,
    realtimeToken,
  });

  const {
    liveActivities,
    upsertLiveActivitiesCache,
    deleteLiveActivityCache,
    refetchLiveActivities,
    createMark,
    createComment,
    deleteActivity,
  } = useLiveActivities({
    meeting,
  });

  const {
    liveTranscript,
    ingestTranscript,
    ingestElectronTranscript,
    lastRealtimeTranscriptTimeRef,
    refetch: refetchTranscripts,
  } = useLiveTranscript({
    meetingId: meeting.id,
    realtimeToken,
  });

  // Shared pause state for puppet sync + inter-view consistency
  const puppetPauseState = usePuppetPauseState({
    meetingId: meeting.id,
    hasPuppet: Boolean(meeting.fredJoinedMeetingAt),
    recordingState: recordingContext?.state,
  });

  // Update the reconnect callback ref when refetch functions change
  useEffect(() => {
    onReconnectRef.current = () => {
      logger.info("Socket reconnected after inactivity, refetching data");
      // Apollo rejects a refetch whose query errors. This runs from a socket
      // watchdog with nobody awaiting it, so a meeting the realtime service no
      // longer has would otherwise surface as an unhandled rejection.
      const onRefetchFailed = (error: unknown) =>
        logger.warn("Refetch after socket reconnect failed", { error });

      void refetchLiveInsights().catch(onRefetchFailed);
      void refetchTranscripts().catch(onRefetchFailed);
      void refetchLiveActivities().catch(onRefetchFailed);
    };
  }, [refetchLiveInsights, refetchTranscripts, refetchLiveActivities]);

  const markMeetingEnded = useCallback(() => {
    setIsMeetingEnded(true);
    setIsSummaryProcessing(true);

    // Only count real recordings toward "Keep Everyone in the Loop" — the
    // onboarding demo recording shouldn't trigger it for new users. Every
    // meeting-end path (recorder IPC, server broadcast, inactivity fallback)
    // routes through here, so this is the single place to count a completed
    // recording exactly once per session.
    const context = recordingContextRef.current;
    if (!hasCountedRealRecordingRef.current && context && !context.isDemo) {
      hasCountedRealRecordingRef.current = true;
      incrementRealRecordingsCount();
    }
  }, []);

  const reparentToMainWindow = useCallback(async () => {
    if (!isDesktop || isMainDesktopWindow()) return;

    const attemptReparent = async (attempt: number) => {
      logger.info("Reparenting live view to main window", {
        meetingId: meeting.id,
        attempt,
      });
      // Move the WebContentsView from the live window into the main window.
      // The main process hides the view initially (zero-size bounds), sends
      // the "reparented-to-main" event so React re-renders, then reveals the
      // view after a short delay — so the user never sees the compact panel.
      const result = await window.electron?.liveView?.reparentToMain();
      if (result === false) {
        throw new Error("reparentToMain returned false");
      }
    };

    try {
      await attemptReparent(1);
    } catch (firstError) {
      const msg =
        firstError instanceof Error ? firstError.message : String(firstError);
      logger.warn("Reparent attempt 1 failed, retrying in 500ms", {
        error: msg,
      });
      // Retry once after a short delay — the main process may not have
      // finished setting up the handler or the WebContentsView may still
      // be mid-transition.
      try {
        await new Promise((r) => setTimeout(r, 500));
        await attemptReparent(2);
      } catch (retryError) {
        const retryMsg =
          retryError instanceof Error ? retryError.message : String(retryError);
        logger.error("Failed to reparent live view to main after retry", {
          error: retryMsg,
        });
      }
    }
  }, [meeting.id]);

  const openPostMeetingDestination = useCallback(async () => {
    if (isNotepadEnabled) {
      window.electron?.liveView?.notifyMeetingEndedInPlace?.();
      return;
    }

    await reparentToMainWindow();
  }, [reparentToMainWindow, isNotepadEnabled]);

  const skipMeetingEndAnimation = isNotepadEnabled;

  const runMeetingEndTransition = useCallback(
    (onComplete: () => Promise<void>) => {
      meetingEndAnimationApi.show(meeting.id, onComplete, {
        skipAnimation: skipMeetingEndAnimation,
      });
    },
    [meeting.id, skipMeetingEndAnimation],
  );

  // Listen for the reparented-to-main IPC event so isMainDesktopWindow()
  // returns true after the WebContentsView is moved to the main window.
  useEffect(() => {
    if (!isDesktop) return;
    const unsubscribe = window.electron?.liveView?.onReparentedToMain?.(() => {
      logger.info(
        "Live view reparented to main window, updating window identity",
      );
      // Clear the cached window identity so isMainDesktopWindow() re-queries
      // the main process via IPC (which now correctly recognises the
      // reparented WebContentsView as belonging to the main window).
      resetMainDesktopWindowCache();
      markAsMainDesktopWindow();
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    // A discard deliberately ends the puppet before deleting the meeting. Do
    // not turn that intermediate status into the post-meeting/save flow.
    if (isDiscardingRef.current) return;

    if (!isLiveMeeting(meeting)) {
      // Don't mark meeting as ended while animation is showing
      // The animation's onComplete callback will handle marking it as ended
      if (!isMeetingEnded && !isAnimationShowing) {
        markMeetingEnded();
      }

      return;
    }
  }, [
    isMeetingEnded,
    isAnimationShowing,
    markMeetingEnded,
    meeting,
    reparentToMainWindow,
  ]);

  const removeMeetingFromMainWindow = useCallback(() => {
    if (!isDesktop) return;
    // The live window is its own renderer, so its live-meetings store is not the
    // one the main window's carousel reads. Signal over IPC — the main window's
    // notifier is the single applier that marks the meeting ended in that store.
    window.electron?.notifyLiveMeetingEnded?.(meeting.id);
  }, [meeting.id]);

  const notifyMainMeetingEnded = useCallback(() => {
    if (!isDesktop || hasNotifiedMainOfEndRef.current) return;

    hasNotifiedMainOfEndRef.current = true;
    removeMeetingFromMainWindow();
    window.electron?.triggerMainRefetch?.();
  }, [removeMeetingFromMainWindow]);

  const [endLiveMeetingCall, { loading: isEndingMeeting }] =
    useEndLiveMeetingCallMutation({
      refetchQueries: [GetWelcomeMeetingsDocument],
    });

  const [deleteMeetings] = useDeleteMeetingsMutation();

  const stopRecordingFromLive = useCallback(async () => {
    if (!isDesktop || !window.electron?.recordingContext) return false;

    try {
      const snapshot = await window.electron.recordingContext.get();
      const currentRecording = normalizeRecordingContextSnapshot(snapshot);

      if (
        !currentRecording ||
        currentRecording.meetingId !== meeting.id ||
        currentRecording.state === "inactive"
      ) {
        return false;
      }

      return await window.electron.recordingContext.stop(meeting.id);
    } catch (error) {
      logger.error("Failed to stop recording from live view", { error });
      return false;
    }
  }, [meeting.id]);

  // Runs the end-of-meeting flow for a session the server has already ended,
  // reusing the animation that may already be on screen. The server needs no
  // end call, but a recorder still streaming to the ended meeting must stop.
  const finalizeMeetingEnd = useCallback(async () => {
    const endSession = async () => {
      await stopRecordingFromLive();
      notifyMainMeetingEnded();
      markMeetingEnded();
      await openPostMeetingDestination();
    };

    const animationState = useMeetingEndAnimationStore.getState();
    const isAnimationAlreadyShowing =
      animationState.isShowing && animationState.meetingId === meeting.id;

    if (isAnimationAlreadyShowing) {
      await endSession();
      return;
    }

    runMeetingEndTransition(endSession);
  }, [
    meeting.id,
    markMeetingEnded,
    notifyMainMeetingEnded,
    openPostMeetingDestination,
    runMeetingEndTransition,
    stopRecordingFromLive,
  ]);

  const endLiveMeeting = useCallback(async () => {
    runMeetingEndTransition(async () => {
      const recordingStopRequested = await stopRecordingFromLive();
      logger.info("end-live-meeting: recording stop requested", {
        recordingStopRequested,
      });
      if (!recordingStopRequested) {
        logger.info(
          "end-live-meeting: recorder inactive, ending meeting remotely",
          { addedBy: meeting.addedBy },
        );
        try {
          await stopLiveMeeting({
            meetingId: meeting.id,
            addedBy: meeting.addedBy,
            stopRealtime: stopRealtimeMeeting,
            endPuppetCall: () =>
              endLiveMeetingCall({ variables: { meetingId: meeting.id } }),
          });
        } catch (error) {
          logger.error("end-live-meeting: remote stop failed", { error });
          meetingEndAnimationApi.clearCompleted(meeting.id);
          meetingEndAnimationApi.hide();
          toast({
            title: "Failed to stop recording",
            message:
              error instanceof Error
                ? error.message
                : STOP_DESKTOP_RECORDING_FAILED_MESSAGE,
            type: "error",
          });
          return;
        }
      }
      notifyMainMeetingEnded();

      // Mark meeting as ended (React state update). This also counts the
      // recording toward "Keep Everyone in the Loop" if it wasn't a demo.
      markMeetingEnded();

      // Reparent the live view to the main window AFTER marking ended,
      // so the PostMeetingPanel is rendered when it appears on main
      await openPostMeetingDestination();
    });
  }, [
    endLiveMeetingCall,
    markMeetingEnded,
    meeting.addedBy,
    meeting.id,
    notifyMainMeetingEnded,
    stopRecordingFromLive,
    openPostMeetingDestination,
    runMeetingEndTransition,
  ]);

  // Discard the recording: stop the recorder without uploading, record the
  // non-transcribing lifecycle stop, delete the meeting, then close the live
  // window. Desktop-only (the live window is desktop).
  const discardLiveMeeting = useCallback(async () => {
    if (!beginDesktopMeetingDiscard(isDiscardingRef)) return;
    logger.info("discard-live-meeting: requesting recorder stop", {
      meetingId: meeting.id,
    });

    try {
      await discardDesktopMeeting({
        meetingId: meeting.id,
        addedBy: meeting.addedBy,
        discardRecording: async () =>
          window.electron?.recordingContext?.discardRecording(meeting.id) ??
          false,
        stopMeeting: async (options) => {
          await stopRealtimeMeeting(options);
        },
        endPuppetCall: () =>
          endLiveMeetingCall({ variables: { meetingId: meeting.id } }),
        deleteMeeting: () =>
          deleteMeetings({
            variables: {
              meetingIds: [meeting.id],
              source: "desktop-live-discard",
            },
          }),
      });
    } catch (error) {
      isDiscardingRef.current = false;
      logger.error("discard-live-meeting: failed", { error });
      toast({
        title: "Failed to discard recording",
        message: "Please try again.",
        type: "error",
      });
      return;
    }

    logger.info("discard-live-meeting: recorder stopped and meeting deleted", {
      meetingId: meeting.id,
    });

    // Drop the meeting from the main window's live list and refresh it.
    notifyMainMeetingEnded();

    // Close the live window (floating bar or realtime panel) and go home.
    await window.electron?.window?.closeAndFocusMain();
  }, [
    meeting.id,
    meeting.addedBy,
    deleteMeetings,
    endLiveMeetingCall,
    notifyMainMeetingEnded,
  ]);

  useEffect(() => {
    const transitionedToEnded =
      isMeetingEnded && !prevIsMeetingEndedRef.current;
    prevIsMeetingEndedRef.current = isMeetingEnded;

    if (transitionedToEnded) {
      notifyMainMeetingEnded();
    }
  }, [isMeetingEnded, notifyMainMeetingEnded]);

  useEffect(() => {
    if (!isDesktop || !window.electron?.recordingContext) return;
    let isMounted = true;

    window.electron.recordingContext.get().then((snapshot) => {
      if (isMounted) {
        setRecordingContext(normalizeRecordingContextSnapshot(snapshot));
      }
    });

    const unsubscribeUpdated = window.electron.recordingContext.onUpdated(
      (snapshot) => {
        setRecordingContext(normalizeRecordingContextSnapshot(snapshot));
      },
    );

    const unsubscribeEnded = window.electron.recordingContext.onEnded(
      async ({ meetingId }) => {
        if (meetingId !== meeting.id) return;
        if (isMeetingEnded || isEndingMeeting) return;
        // Discarding deletes the meeting and closes the window itself, so skip
        // the save/summary end flow that a normal recorder stop would trigger.
        if (isDiscardingRef.current) return;

        // Show animation before marking meeting as ended
        // This happens when instant recording stops via RecordControls
        runMeetingEndTransition(async () => {
          markMeetingEnded();
          notifyMainMeetingEnded();

          await openPostMeetingDestination();
        });
      },
    );

    return () => {
      isMounted = false;
      unsubscribeUpdated?.();
      unsubscribeEnded?.();
    };
  }, [
    isEndingMeeting,
    isMeetingEnded,
    markMeetingEnded,
    meeting.id,
    notifyMainMeetingEnded,
    openPostMeetingDestination,
    runMeetingEndTransition,
  ]);

  const onInstantSummaryBroadcast = useCallback(
    (data: {
      type: string;
      section?: string;
      delta?: string;
      content?: string;
      variant?: string;
      error?: string;
    }) => {
      if (!data || !data.type) return;

      if (data.type === "error") {
        logger.warn(
          "Instant summary streaming error, falling back to GraphQL",
          { error: data.error },
        );
        // Clear partial streaming content so the GraphQL fallback can run
        setSectionContent({});
        sectionContentRef.current = {};
        setCompletedSections(new Set());
        // Keep processing state active so the fallback retry effect triggers
        setIsSummaryProcessing(true);
        // Reset retry counter for fresh fallback attempts
        setSummaryFallbackRetry(0);
        // Don't set summaryError yet — let the fallback try first.
        // If all retries fail, the fallback effect will set the error.
      } else if (data.type === "summary_section.delta") {
        // Handle streaming delta: append delta to section content
        const { section, delta } = data;
        if (section && delta) {
          setSectionContent((prev) => ({
            ...prev,
            [section]: (prev[section] || "") + delta,
          }));
          // Hide loading indicator as soon as streaming starts
          setIsSummaryProcessing(false);
          // Clear any previous error to enable error recovery
          setSummaryError(null);
        }
      } else if (data.type === "summary_section.finish") {
        // Handle section completion: replace with final content, apply formatting, and transform key
        const { section, content, variant } = data;
        // Only process if section has content with minimum length
        if (section && content && content.length >= 5) {
          // Format the content based on section type
          const formattedContent = formatSectionContent(section, content);
          // Transform the key to match the display format (e.g., 'SHORTHAND_BULLET' -> 'Notes')
          const transformedKey = transformSectionKey(section, variant);

          setSectionContent((prev) => {
            const updated = { ...prev };
            // Remove the old entry with raw key if it exists (from streaming deltas)
            if (section !== transformedKey && prev[section]) {
              delete updated[section];
            }
            // Add/update with transformed key
            updated[transformedKey] = formattedContent;
            return updated;
          });

          setCompletedSections((prev) => {
            const updated = new Set(prev);
            // Remove raw key, add transformed key
            if (section !== transformedKey) {
              updated.delete(section);
            }
            updated.add(transformedKey);
            return updated;
          });

          setIsSummaryProcessing(false);
          // Clear any previous error to enable error recovery
          setSummaryError(null);
          // Debounce refetch: reset timer on each section finish,
          // fire once 5s after the last section completes to pick up auto-generated title
          if (!hasRefetchedMeetingForSummaryRef.current) {
            if (meetingTitleRefetchTimerRef.current) {
              clearTimeout(meetingTitleRefetchTimerRef.current);
            }
            meetingTitleRefetchTimerRef.current = setTimeout(() => {
              hasRefetchedMeetingForSummaryRef.current = true;
              meetingTitleRefetchTimerRef.current = null;
              apolloClient.refetchQueries({
                include: [GetMeetingDocument],
              });
            }, 5000);
          }
        }
      }
    },
    [apolloClient],
  );

  const triggerSalesAssistPaywall = useCallback(() => {
    setShowSalesAssistPaywall(true);
    // Refetch billing data to update isAllowedToUsePrompts
    apolloClient.refetchQueries({
      include: [GetCurrentUserDocument],
    });
  }, [apolloClient]);

  // Business logic event handlers - connection/disconnection is handled by useLiveMeetingSocket
  useEffect(() => {
    if (!socket) {
      return;
    }

    const onLiveMeetingActivityBroadcast = (data: LiveMeetingActivity) => {
      setLastActivityTime();
      upsertLiveActivitiesCache(data);
    };

    socket.on(
      LiveMeetingEvents.LIVE_MEETING_ACTIVITY_BROADCAST_EVENT,
      onLiveMeetingActivityBroadcast,
    );

    const onLiveMeetingActivityDeleted = (
      data: DeleteLiveMeetingActivityEvent,
    ) => {
      setLastActivityTime();
      deleteLiveActivityCache(data);
    };
    socket.on(
      LiveMeetingEvents.LIVE_MEETING_ACTIVITY_DELETED_EVENT,
      onLiveMeetingActivityDeleted,
    );

    const onRealtimeNoteBroadcast = (data: LiveNote) => {
      setLastActivityTime();
      upsertLiveInsightsCache({ notes: [data] });
    };
    socket.on(
      LiveMeetingEvents.REALTIME_NOTE_BROADCAST,
      onRealtimeNoteBroadcast,
    );

    const onRealtimeActionItemsBroadcast = (data: LiveActionItem[]) => {
      setLastActivityTime();
      upsertLiveInsightsCache({ actionItems: data });
    };
    socket.on(
      LiveMeetingEvents.REALTIME_ACTION_ITEMS_BROADCAST,
      onRealtimeActionItemsBroadcast,
    );

    const onRealtimeActionItemsUpdateBroadcast = (data: UpdateActionItem) => {
      setLastActivityTime();
      upsertLiveInsightsCache({ actionItems: [data] });
    };
    socket.on(
      LiveMeetingEvents.REALTIME_ACTION_ITEMS_UPDATE_BROADCAST,
      onRealtimeActionItemsUpdateBroadcast,
    );

    const onRealtimeNoteChaptersBroadcast = (data: ChapterizedNotes) => {
      setLastActivityTime();
      handleChaptersUpdate(data);
    };
    socket.on(
      LiveMeetingEvents.REALTIME_NOTE_CHAPTERS_BROADCAST,
      onRealtimeNoteChaptersBroadcast,
    );

    const onLiveTranscriptBroadcast = (data: LiveTranscriptItem) => {
      setLastActivityTime();
      ingestTranscript(data);
    };
    if (isSelfRecordingSession === false) {
      socket.on(
        LiveMeetingEvents.LIVE_TRANSCRIPT_BROADCAST_EVENT,
        onLiveTranscriptBroadcast,
      );
    }

    const onRealtimeAssistBroadcast = (
      realtimeAssists: RealtimeLiveAssist[],
    ) => {
      setLastActivityTime();
      setEntitiesDetected(null);

      for (const assist of realtimeAssists) {
        const event =
          assist.assistMode === ASSIST_MODES.SALES
            ? TRACKING_EVENTS.SALES_ASSIST_SUGGESTION_RECEIVED
            : TRACKING_EVENTS.GENERAL_ASSIST_SUGGESTION_RECEIVED;
        tracker.track(event, { meetingId: meeting.id });
      }

      setAssistActions((prev) => {
        const ids = new Set<string>();
        return [...prev, ...realtimeAssists].filter((assist) => {
          const assistId = (
            assist.title ??
            assist.suggestion ??
            assist.question ??
            ""
          )
            .toLowerCase()
            .trim();

          const dedupeKey =
            assistId +
            "|" +
            (assist.question ?? assist.suggestion ?? "").toLowerCase().trim();
          if (!ids.has(dedupeKey)) {
            ids.add(dedupeKey);
            return true;
          }
          return false;
        });
      });
    };

    socket.on(
      LiveMeetingEvents.REALTIME_ASSIST_BROADCAST,
      onRealtimeAssistBroadcast,
    );

    const onInstantSummaryBroadcastWrapper = (
      data: Parameters<typeof onInstantSummaryBroadcast>[0],
    ) => {
      setLastActivityTime();
      onInstantSummaryBroadcast(data);
    };
    socket.on(
      LiveMeetingEvents.INSTANT_SUMMARY_BROADCAST,
      onInstantSummaryBroadcastWrapper,
    );

    socket.on(
      LiveMeetingEvents.NO_AI_CREDITS_LEFT_BROADCAST,
      triggerSalesAssistPaywall,
    );

    const INSIGHT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_SHOWS_PER_TYPE = 2;
    const INSIGHT_DISPLAY_DURATION_MS = 30000; // 30 seconds
    const onSpeakerInsightBroadcast = (data: ClientSpeakerInsight) => {
      setLastActivityTime();
      logger.info(
        `[LiveScreen] Speaker insight received: ${data.type} - ${data.message}`,
      );

      const now = Date.now();
      const throttle = speakerInsightThrottleRef.current;
      const entry = throttle[data.type];

      // Check throttling: max 2 per type per call, 15 min cooldown
      if (entry) {
        if (entry.count >= MAX_SHOWS_PER_TYPE) {
          logger.info(
            `[LiveScreen] Speaker insight throttled (max ${MAX_SHOWS_PER_TYPE}): ${data.type}`,
          );
          return;
        }
        if (now - entry.lastShownAt < INSIGHT_COOLDOWN_MS) {
          logger.info(
            `[LiveScreen] Speaker insight throttled (cooldown): ${data.type}`,
          );
          return;
        }
      }

      // Update throttle tracking
      throttle[data.type] = {
        count: (entry?.count ?? 0) + 1,
        lastShownAt: now,
      };

      tracker.track(TRACKING_EVENTS.SPEAKER_NUDGE_SHOWN, {
        meetingId: meeting.id,
        nudgeType: data.type,
      });

      setActiveSpeakerInsights((prev) => [...prev, data]);

      const timerKey = `${data.type}-${data.timestamp}`;
      const timer = setTimeout(() => {
        setActiveSpeakerInsights((prev) =>
          prev.filter((insight) => insight !== data),
        );
        speakerInsightDismissTimersRef.current.delete(timerKey);
      }, INSIGHT_DISPLAY_DURATION_MS);
      speakerInsightDismissTimersRef.current.set(timerKey, timer);
    };
    socket.on(
      LiveMeetingEvents.SPEAKER_INSIGHT_BROADCAST,
      onSpeakerInsightBroadcast,
    );

    const onMeetingEndedBroadcast = (data: {
      meetingId: string;
      message: string;
    }) => {
      if (data.meetingId === meeting.id) {
        // Discarding kills the live session, which makes the server emit this
        // broadcast. The discard deletes the meeting and closes the window
        // itself, so skip the end flow — showing the end animation here would
        // orphan its floating window once this renderer closes.
        if (isDiscardingRef.current) return;

        logger.info(
          "Meeting ended broadcast received, refetching meeting data",
        );

        // Check if animation is already showing (e.g., from main window)
        const animationState = useMeetingEndAnimationStore.getState();
        const isAnimationAlreadyShowing =
          animationState.isShowing && animationState.meetingId === meeting.id;

        if (isAnimationAlreadyShowing) {
          // Animation already showing from main window, just update state
          // Don't try to show animation again to avoid duplicate detection issues
          logger.info(
            "broadcast: animation already showing, updating state only",
          );

          // Execute state updates immediately without waiting for animation
          (async () => {
            notifyMainMeetingEnded();
            await apolloClient.refetchQueries({
              include: [GetMeetingDocument],
            });

            markMeetingEnded();

            // Reparent the live view to the main window
            await openPostMeetingDestination();
          })();
        } else {
          // Animation not showing yet, show it now
          runMeetingEndTransition(async () => {
            notifyMainMeetingEnded();
            // Trigger refetch of the meeting query to update the UI immediately
            await apolloClient.refetchQueries({
              include: [GetMeetingDocument],
            });

            // Mark meeting as ended AFTER animation completes
            markMeetingEnded();

            await openPostMeetingDestination();
          });
        }
      }
    };
    socket.on(
      LiveMeetingEvents.MEETING_ENDED_BROADCAST,
      onMeetingEndedBroadcast,
    );

    const onEntitiesDetectedBroadcast = (data: EntitiesDetectedPayload) => {
      setLastActivityTime();
      setEntitiesDetected(data);
      const timeOut = setTimeout(() => {
        setEntitiesDetected(null);
        clearTimeout(timeOut);
      }, 5000);
    };
    socket.on(
      LiveMeetingEvents.ENTITIES_DETECTED_BROADCAST_EVENT,
      onEntitiesDetectedBroadcast,
    );

    return () => {
      // Only remove business logic handlers - socket lifecycle is managed by useLiveMeetingSocket
      socket.off(
        LiveMeetingEvents.LIVE_MEETING_ACTIVITY_BROADCAST_EVENT,
        onLiveMeetingActivityBroadcast,
      );
      socket.off(
        LiveMeetingEvents.LIVE_MEETING_ACTIVITY_DELETED_EVENT,
        onLiveMeetingActivityDeleted,
      );
      socket.off(
        LiveMeetingEvents.REALTIME_NOTE_BROADCAST,
        onRealtimeNoteBroadcast,
      );
      socket.off(
        LiveMeetingEvents.REALTIME_ACTION_ITEMS_BROADCAST,
        onRealtimeActionItemsBroadcast,
      );
      socket.off(
        LiveMeetingEvents.REALTIME_ACTION_ITEMS_UPDATE_BROADCAST,
        onRealtimeActionItemsUpdateBroadcast,
      );
      socket.off(
        LiveMeetingEvents.REALTIME_NOTE_CHAPTERS_BROADCAST,
        onRealtimeNoteChaptersBroadcast,
      );
      if (isSelfRecordingSession === false) {
        socket.off(
          LiveMeetingEvents.LIVE_TRANSCRIPT_BROADCAST_EVENT,
          onLiveTranscriptBroadcast,
        );
      }
      socket.off(
        LiveMeetingEvents.REALTIME_ASSIST_BROADCAST,
        onRealtimeAssistBroadcast,
      );
      socket.off(
        LiveMeetingEvents.INSTANT_SUMMARY_BROADCAST,
        onInstantSummaryBroadcastWrapper,
      );
      socket.off(
        LiveMeetingEvents.NO_AI_CREDITS_LEFT_BROADCAST,
        triggerSalesAssistPaywall,
      );
      socket.off(
        LiveMeetingEvents.SPEAKER_INSIGHT_BROADCAST,
        onSpeakerInsightBroadcast,
      );
      socket.off(
        LiveMeetingEvents.MEETING_ENDED_BROADCAST,
        onMeetingEndedBroadcast,
      );
      socket.off(
        LiveMeetingEvents.ENTITIES_DETECTED_BROADCAST_EVENT,
        onEntitiesDetectedBroadcast,
      );
    };
  }, [
    socket,
    upsertLiveInsightsCache,
    handleChaptersUpdate,
    deleteLiveActivityCache,
    upsertLiveActivitiesCache,
    ingestTranscript,
    onInstantSummaryBroadcast,
    triggerSalesAssistPaywall,
    meeting.id,
    apolloClient,
    markMeetingEnded,
    notifyMainMeetingEnded,
    openPostMeetingDestination,
    runMeetingEndTransition,
    setLastActivityTime,
    isSelfRecordingSession,
  ]);

  useEffect(() => {
    if (!isDesktop || isSelfRecordingSession !== true) return;

    const unsubscribe = window.electron?.streaming?.onTranscript?.(
      (payload: unknown) => {
        const didIngest = ingestElectronTranscript(payload);
        if (!didIngest) return;
        setLastActivityTime();
      },
    );

    return () => {
      unsubscribe?.();
    };
  }, [ingestElectronTranscript, isSelfRecordingSession, setLastActivityTime]);

  const updateActionItem = useCallback(
    (data: UpdateActionItem) => {
      if (!socket) {
        return;
      }
      // update the local cache first
      upsertLiveInsightsCache({ actionItems: [data] });
    },
    [socket, upsertLiveInsightsCache],
  );

  const markDynamicActionAsClicked = useCallback((actionKey: string) => {
    setClickedDynamicActions((prev) => new Set(prev).add(actionKey));
  }, []);

  // GraphQL fallback: fetch summary when meeting is not live and sectionContent is empty
  const {
    data: summaryData,
    error: summaryQueryError,
    loading: summaryLoading,
  } = useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId: meeting.id },
    skip:
      isLiveMeeting(meeting) ||
      Object.keys(sectionContent).length > 0 ||
      isSummaryProcessing,
  });

  useEffect(() => {
    // Only update if sectionContent is empty (to avoid overwriting streaming content)
    if (!isLiveMeeting(meeting) && Object.keys(sectionContent).length === 0) {
      // Guard: wait for query to complete before processing results
      if (summaryLoading) {
        return;
      }

      // Handle query error
      if (summaryQueryError) {
        setIsSummaryProcessing(false);
        setSummaryError("Failed to load summary");
        return;
      }

      // Handle missing or empty sections
      const sections = summaryData?.meetingSummary?.sections;
      if (!sections || sections.length === 0) {
        setIsSummaryProcessing(false);
        // Only set generic error if we don't already have a more specific one (e.g., "Meeting is too short")
        if (!summaryError) {
          setSummaryError("No summary available");
        }
        return;
      }

      // Format sections and filter by length
      const formattedSections: Record<string, string> = {};

      sections.forEach((section) => {
        if (section.key && section.value && section.value.length >= 5) {
          const formattedContent = formatSectionContent(
            section.key,
            section.value,
          );
          // Handle KEY_TAKEAWAYS_OVERVIEW if it's already in the DB
          // (preserve it as-is, don't transform it to "Key Takeaways Overview")
          // Otherwise transform normally
          const transformedKey =
            section.key === KEY_TAKEAWAYS_KEY
              ? KEY_TAKEAWAYS_KEY
              : transformSectionKey(section.key);
          formattedSections[transformedKey] = formattedContent;
        }
      });

      // If no sections passed the filter, set error and stop processing
      if (Object.keys(formattedSections).length === 0) {
        setIsSummaryProcessing(false);
        // Only set generic error if we don't already have a more specific one (e.g., "Meeting is too short")
        if (!summaryError) {
          setSummaryError("No summary available");
        }
        return;
      }

      // Success: set formatted sections
      setSectionContent(formattedSections);
      setCompletedSections(new Set(Object.keys(formattedSections)));
      setIsSummaryProcessing(false);
      setSummaryError(null);
    }
  }, [
    meeting,
    sectionContent,
    summaryData?.meetingSummary?.sections,
    summaryQueryError,
    summaryLoading,
    summaryError,
  ]);

  // Keep ref in sync for stale-closure safety inside timers
  useEffect(() => {
    sectionContentRef.current = sectionContent;
  }, [sectionContent]);

  // Fallback: when meeting ended locally but instant-summary streaming was missed
  // (e.g. socket disconnected right at meeting end), retry from GraphQL.
  useEffect(() => {
    const hasContent = Object.keys(sectionContent).length > 0;
    if (!isMeetingEnded || hasContent || !isSummaryProcessing) {
      return;
    }

    // Retries exhausted — stop spinner and show error
    if (summaryFallbackRetry >= SUMMARY_FALLBACK_MAX_RETRIES) {
      setIsSummaryProcessing(false);
      setSummaryError("Failed to load summary");
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      // Content may have arrived via streaming while we waited
      if (cancelled || Object.keys(sectionContentRef.current).length > 0)
        return;

      logger.info(
        `Summary fallback retry ${summaryFallbackRetry + 1}/${SUMMARY_FALLBACK_MAX_RETRIES}`,
      );

      try {
        const { data } = await apolloClient.query({
          query: GetMeetingSummaryQueryDocument,
          variables: { meetingId: meeting.id },
          fetchPolicy: "network-only",
        });

        // Stale response — effect was cleaned up or content arrived while query was in-flight
        if (cancelled || Object.keys(sectionContentRef.current).length > 0)
          return;

        const sections = data?.meetingSummary?.sections;
        if (sections && sections.length > 0) {
          const formattedSections: Record<string, string> = {};
          for (const section of sections) {
            if (section.key && section.value && section.value.length >= 5) {
              const formatted = formatSectionContent(
                section.key,
                section.value,
              );
              const transformedKey =
                section.key === KEY_TAKEAWAYS_KEY
                  ? KEY_TAKEAWAYS_KEY
                  : transformSectionKey(section.key);
              formattedSections[transformedKey] = formatted;
            }
          }
          if (Object.keys(formattedSections).length > 0) {
            setSectionContent(formattedSections);
            setCompletedSections(new Set(Object.keys(formattedSections)));
            setIsSummaryProcessing(false);
            setSummaryError(null);
            return;
          }
        }

        // Still nothing — schedule next retry
        if (!cancelled) setSummaryFallbackRetry((prev) => prev + 1);
      } catch (err) {
        logger.error("Summary fallback refetch failed", { error: err });
        if (!cancelled) setSummaryFallbackRetry((prev) => prev + 1);
      }
    }, SUMMARY_FALLBACK_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    isMeetingEnded,
    isSummaryProcessing,
    sectionContent,
    summaryFallbackRetry,
    meeting.id,
    apolloClient,
  ]);

  const { endSessionIfOver } = useMeetingLivenessFallback({
    apolloClient,
    meetingId: meeting.id,
    isMeetingEnded,
    isDiscardingRef,
    lastRealtimeTranscriptTimeRef,
    onSessionOver: finalizeMeetingEnd,
  });

  // realtime-ff refused the socket because the meeting ended: confirm with the
  // server before ending, so the screen stops reconnecting and polling for it.
  useEffect(() => {
    onSocketMeetingEndedRef.current = () => {
      void endSessionIfOver("Realtime socket rejected ended meeting");
    };
  }, [endSessionIfOver]);

  // Track instant summary generated — fires once when summary content first
  // becomes available after meeting ends (covers both streaming and GQL-fallback paths)
  useEffect(() => {
    if (!isMeetingEnded) return;
    if (hasTrackedInstantSummaryRef.current) return;
    const sectionsCount = completedSections.size;
    if (sectionsCount === 0) return;

    hasTrackedInstantSummaryRef.current = true;
    tracker.track(TRACKING_EVENTS.INSTANT_SUMMARY_GENERATED, {
      meetingId: meeting.id,
      sectionsCount,
    });
  }, [isMeetingEnded, completedSections, meeting.id]);

  return (
    <LiveScreenContext.Provider
      value={{
        liveInsights,
        refetchLiveInsights,
        loadingLiveInsights,
        refetchLiveActivities,
        liveActivities,
        updateActionItem,
        createMark,
        createComment,
        deleteActivity,
        meeting,
        meetingId: meeting.id,
        isMeetingEnded,
        isEndingMeeting,
        endLiveMeeting,
        discardLiveMeeting,
        ee,
        formattedChapters,
        liveTranscript,
        assistActions,
        assistMode,
        setAssistMode,
        clickedDynamicActions,
        markDynamicActionAsClicked,
        sectionContent,
        completedSections,
        isSummaryProcessing,
        summaryError,
        knowledgeBases,
        setKnowledgeBases,
        recordingContext,
        showSalesAssistPaywall,
        triggerSalesAssistPaywall,
        entitiesDetected,
        activeSpeakerInsights,
        puppetPauseState,
        isSelfRecordingSession,
      }}
    >
      {children}
    </LiveScreenContext.Provider>
  );
};

export const useLiveScreenContext = () => {
  const context = useContext(LiveScreenContext);
  if (!context) {
    throw new Error(
      "useLiveScreenContext must be used within LiveScreenProvider",
    );
  }
  return context;
};

export const useOptionalLiveScreenContext = () => useContext(LiveScreenContext);
