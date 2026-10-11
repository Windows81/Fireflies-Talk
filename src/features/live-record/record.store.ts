import { toast } from "@/components/Toast";
import { scheduleNotificationAsync } from "@/utils/notifications";
import { Config, RouteNames } from "@/constants";
import {
  captureException,
  getErrorMessage,
  setSentryContext,
  setSentryTag,
} from "@/errors";
import { appReviewApi } from "@/features/app-review";
import {
  DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY,
  getLocalUserFlag,
  setLocalUserFlag,
} from "@/features/user-flags";
import { feedbackNudgeApi } from "@/features/feedback-nudge/feedback-nudge.store";
import {
  completeUpload,
  createMeetingForUpload,
  UPLOAD_CLIENT_KEYS,
  uploadApi,
} from "@/features/upload";
import { apolloClient, DeleteMeetingsDocument } from "@/graphql";
import {
  UpdateMeetingDocument,
  MeetingNotesPrivacy,
} from "@firefliesai/mobile-ff.graphql-client";
import { Logger } from "@/logger";
import * as AudioRecord from "@/modules/audio-record";
import {
  AudioRecordErrorCode,
  STREAM_FAILURE_CODE,
} from "@/modules/audio-record";
import { isRecordingWithinCalendarEvent } from "./calendarAttendees";
import { useRecordPreferencesStore } from "./record-preference.store";
import { RootNavigation } from "@/screens/RootNavigation";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { createDirectoryIfNotExist, deleteFile } from "@/utils/file";
import { getExtensionFromMimeType } from "@/utils/mime";
import { isOffline } from "@/utils/network";
import { randomUUID } from "expo-crypto";
import { CodedError } from "expo-modules-core";
import { useEffect } from "react";
import { Platform } from "react-native";
import { create } from "zustand";
import {
  MAX_RECORDING_DURATION_MS,
  MIME_TYPE_RECORDING_OPTIONS_MAP,
  MP4_RECORDING_OPTIONS,
  RECORDING_DIRECTORY,
} from "./constants";
import {
  AudioInputUnavailableError,
  SystemAudioPermissionDeniedError,
} from "./errors";
import {
  activeRecordingStoreApi,
  checkpointActiveRecording,
  claimActiveRecording,
} from "./active-recording.store";
import { localRecordStoreApi } from "./local-record.store";
import { ensureRecordingMeetingId } from "./ensure-upload";
import {
  resumeRealtimeMeetingBeforeStop,
  stopRealtimeMeeting,
  stopRealtimeMeetingForShutdown,
  updatePuppetStatus,
} from "./puppet-sync";
import { useManualNotesStore } from "@/features/manual-notes";
import { isAlreadyUploaded, hasActiveUploadForMeeting } from "./upload-dedup";
import { liveMeetingNotifier } from "@/features/desktop-notifications/live-meeting-notifier-state";
import type {
  RecordingContext,
  RecordingSource,
  RecordingStates,
} from "./types";
import {
  checkSystemAudioPermissionOrFail,
  getDefaultRecordingTitle,
  getRecordingErrorSentryFingerprint,
  requestMicrophonePermissionOrFail,
} from "./utils";
import { isDesktop } from "@/utils/device";
import { TimeoutError, withTimeout } from "@/utils/promise";
import { openLiveDestination } from "@/features/live/helpers/openLiveDestination";
import { authApi, useAuth } from "../auth";
import {
  type ConsentDeliveryStatus,
  useConsentDeliveryStore,
} from "./consent-delivery.store";
import { createRecordingFinalizationTracker } from "./recording-finalization";

export type StartRecordingOptions = Required<
  Pick<
    RecordingContext,
    | "title"
    | "notesPrivacy"
    | "usingStream"
    | "language"
    | "mimeType"
    | "fromDashboard"
  >
> & {
  recordingSource?: RecordingSource;
  defaultShowLiveAssist?: boolean;
  defaultShowNotes?: boolean;
  isDemo?: boolean;
  windowsLoopbackAllDevices?: boolean;
  playbackLatencyHint?: boolean;
};

interface RecorderStoreValue {
  status: RecordingStates;
  context: RecordingContext | null;

  setContext: (context: RecordingContext) => void;

  addEventListener: typeof AudioRecord.addEventListener;

  start(ctx: StartRecordingOptions): Promise<{
    fileUri: string;
    context: RecordingContext;
  }>;
  startUpload(): Promise<void>;
  stop(options?: { forShutdown?: boolean }): Promise<{
    fileUri: string;
    context: RecordingContext;
  }>;
  discard(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  release(): void;
}

const logger = new Logger("AudioRecord");

// Streaming keeps reconnecting on transient failures, so only these terminal
// codes reach the user — anything else stays a silent Sentry report.
const TERMINAL_STREAM_FAILURE_MESSAGE: Record<string, string | undefined> = {
  [STREAM_FAILURE_CODE.authFailed]:
    "Your session expired, so this recording is no longer being transcribed. Please sign in again and restart the recording.",
  [STREAM_FAILURE_CODE.disconnected]:
    "We lost the connection to Fireflies, so this recording is no longer being transcribed. Please check your internet connection and restart the recording.",
};

// Meetings the user discarded. Their recordings must never be uploaded, so the
// streamCompleted handler skips the upload/complete step for these ids.
const discardedMeetingIds = new Set<string>();

// The UI awaits stop() behind a blocking modal that also gates start, so any
// wait inside it must end. GraphQL calls fail fast when the network answers,
// but a connection that hangs (asleep-then-woken laptop, captive portal) has
// no client-side deadline of its own. The request keeps running past this — we
// just stop making the user wait for it.
const STOP_NETWORK_DEADLINE_MS = 15000;
const recordingFinalization = createRecordingFinalizationTracker(() => {
  syncRecordingContextSnapshot(useRecorder.getState());
});

// A start publishes its context only after createMeetingForUpload and
// AudioRecord.startRecording resolve. Until then the recorder looks inactive to
// the main process, so a quit arriving mid-start would see nothing to stop and
// exit while the meeting it just created goes live. Tracked separately from
// finalization: a start has no meeting id to report yet, which is the whole
// problem.
let pendingStart: Promise<void> | null = null;

function trackRecordingStart(): { settle: () => void } {
  let settle = () => {};
  const inFlight = new Promise<void>((resolve) => {
    settle = resolve;
  });
  pendingStart = inFlight;
  syncRecordingContextSnapshot(useRecorder.getState());
  void inFlight.then(() => {
    if (pendingStart !== inFlight) return;
    pendingStart = null;
    syncRecordingContextSnapshot(useRecorder.getState());
  });
  return { settle };
}

async function withStopDeadline<T>(
  promise: Promise<T>,
  label: string,
): Promise<T> {
  try {
    return await withTimeout(promise, STOP_NETWORK_DEADLINE_MS, label);
  } catch (err) {
    if (err instanceof TimeoutError) logger.warn(`stop: ${err.message}`);
    throw err;
  }
}

/**
 * The deadline above, unless the caller needs the request to actually land.
 *
 * Abandoning the wait is only safe while this window survives to finish the
 * request. On the app-shutdown path it does not: the renderer goes away with
 * the process, so a request we stopped waiting for is a request that never
 * completes — and for the realtime stop that means the meeting stays live,
 * which is the bug the shutdown handshake exists to prevent. The main process
 * bounds that wait instead, with its own shutdown budget.
 */
function maybeWithStopDeadline<T>(
  promise: Promise<T>,
  label: string,
  forShutdown?: boolean,
): Promise<T> {
  return forShutdown ? promise : withStopDeadline(promise, label);
}

async function syncCalendarAttendees(
  recordingSource: RecordingSource | undefined,
  meetingId: string | undefined,
  forShutdown?: boolean,
): Promise<void> {
  const attendees = recordingSource?.attendees;
  if (!attendees?.length || !meetingId) return;

  if (!isRecordingWithinCalendarEvent(recordingSource, Date.now())) {
    logger.info(
      "skipped calendar attendee sync: recording ran past its calendar event",
      { meetingId, eventEndTime: recordingSource?.eventEndTime },
    );
    return;
  }

  try {
    await maybeWithStopDeadline(
      apolloClient.mutate({
        mutation: UpdateMeetingDocument,
        variables: { id: meetingId, attendees },
      }),
      "syncCalendarAttendees",
      forShutdown,
    );
    logger.info("synced calendar attendees to meeting", {
      meetingId,
      count: attendees.length,
    });
    // Prompt the user to configure recap email recipients the first time (desktop only).
    if (
      isDesktop &&
      !getLocalUserFlag(DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY)
    ) {
      setLocalUserFlag(DESKTOP_RECAP_EMAIL_PROMPT_SHOWN_FLAG_KEY, false);
    }
  } catch (err) {
    logger.error("Failed to sync calendar attendees", err);
    captureException(
      new Error(getErrorMessage(err, "recorder: syncCalendarAttendees")),
      { tags: { section: "record-store", meetingId } },
    );
  }
}

export const useRecorder = create<RecorderStoreValue>((set, get) => {
  return {
    status: AudioRecord.getStatus(),
    context: AudioRecord.getContext() as RecordingContext,
    addEventListener: AudioRecord.addEventListener,

    setContext(context) {
      AudioRecord.setContext(context);
      set({ context });
    },

    async start(ctx) {
      logger.info("record starting", ctx);
      let createdMeetingId: string | undefined;
      // Held for the whole start so a quit arriving before the context is
      // published still sees work in flight; see trackRecordingStart.
      const started = trackRecordingStart();

      // Desktop streams audio instead of writing a local file. Only these run
      // as realtime meetings.
      const transcriptOnly = isDesktop && ctx.usingStream;
      // Every streaming recording runs a realtime transcription session during
      // the meeting; on mobile the upload path still owns processing.
      const enableRealtime = ctx.usingStream;

      try {
        await requestMicrophonePermissionOrFail();

        // Check system audio permission on desktop when using system audio
        if (isDesktop) {
          await checkSystemAudioPermissionOrFail();
        }

        // create directory if it doesn't exist
        if (Platform.OS !== "web") {
          await createDirectoryIfNotExist(RECORDING_DIRECTORY);
        }

        const startTime = new Date();

        const title = ctx.title || getDefaultRecordingTitle(startTime);

        // Realtime activation happens server-side during createMeeting, so its
        // FRED_JOINED notification can arrive before we learn the meeting id.
        // Open the self-start window so that event is suppressed, not notified.
        if (enableRealtime) {
          liveMeetingNotifier.beginSelfStart();
        }

        const meetingId = await createMeetingForUpload({
          title,
          notesPrivacy: ctx.notesPrivacy,
          ...(ctx.language && { customLanguage: ctx.language }),
          startTime,
          client: isDesktop
            ? UPLOAD_CLIENT_KEYS.DESKTOP_RECORD
            : UPLOAD_CLIENT_KEYS.MOBILE_RECORD,
          ...(enableRealtime && { enableRealtime: true }),
          ...(ctx.recordingSource?.iCalUID && {
            iCalUID: ctx.recordingSource.iCalUID,
          }),
          ...(ctx.recordingSource?.attendees?.length && {
            attendees: ctx.recordingSource.attendees,
          }),
        })
          .then((meeting) => meeting.id)
          .catch(async (err) => {
            // Airplane mode must not block capture: record to a local id and
            // let the upload create the meeting. Streaming needs the server
            // throughout, so it never falls back. A server-side rejection
            // (plan limits, auth) still fails the start.
            if (ctx.usingStream || !(await isOffline())) throw err;
            logger.warn("offline start: recording without a meeting", err);
            return undefined;
          });
        createdMeetingId = meetingId;

        // Transcript-only (desktop) recordings have no local file to recover,
        // so the live meeting is the only thing a crash would leave behind.
        if (transcriptOnly && meetingId) {
          await claimActiveRecording(meetingId);
        }

        const mimeType = ctx.mimeType;
        // Strip codec info for map lookup (e.g., "audio/webm;codecs=opus" -> "audio/webm")
        const baseMimeType = mimeType.split(";")[0];
        const recordingOptions =
          MIME_TYPE_RECORDING_OPTIONS_MAP[baseMimeType] ??
          MP4_RECORDING_OPTIONS;

        const fileExtension = getExtensionFromMimeType(mimeType);
        const fileId = meetingId ?? randomUUID();
        const fileUri = `${RECORDING_DIRECTORY}${fileId}.${fileExtension}`;

        let socketAuthToken: string | undefined | null;
        if (ctx.usingStream) {
          const tokens = await authApi.getOrRefreshTokens();
          socketAuthToken = tokens?.accessToken;
          if (!socketAuthToken) {
            throw new Error("Failed to get auth token for streaming");
          }
        }

        const user = useAuth.getState().user;
        const userId = user?.id;

        // Capture from the device the user picked in the mic dropdown. Without
        // this, start falls back to the OS "default" input, which yields no
        // audio for some external mics; the explicit deviceId is
        // the same path the live mic-switch uses. No-op on native.
        const preferredInputDeviceId =
          useRecordPreferencesStore.getState().audioInputDeviceId;
        if (preferredInputDeviceId) {
          await AudioRecord.setInputDevice?.(preferredInputDeviceId);
        }

        await AudioRecord.startRecording({
          ...recordingOptions,
          // Same value as the meeting id whenever one exists; offline it is
          // the local id the module echoes back on its events.
          meetingId: fileId,
          socketUrl: Config.REALTIME_FF_STREAMING_HOST_WS,
          ...(socketAuthToken && { socketAuthToken }),
          fileUri,
          mimeType,
          useUploader: !ctx.usingStream,
          enableSystemAudio: isDesktop,
          systemAudioLoopbackAllDevices:
            isDesktop && ctx.windowsLoopbackAllDevices === true,
          // The web recorder's AudioContext, on desktop and the website alike.
          playbackLatencyHint:
            Platform.OS === "web" && ctx.playbackLatencyHint === true,
          language: ctx.language || "en",
          // Ingest rejects x-user-id from mobile clients.
          ...(isDesktop && { userId }),
          transcriptOnly,
          realtimeBufferMs: -1,
          maxDurationMs: MAX_RECORDING_DURATION_MS,
          notificationAndroid: {
            channelId: "ff_recording",
            channelName: "Recording",
            notificationId: 100,
            contentTitle: "Fireflies",
            contentText: "A recording is in progress.",
            uploadContentText: "Uploading recording...",
          },
        });

        logger.info(`recording started to ${fileUri}`);

        const context: RecordingContext = {
          ...ctx,
          title,
          fileUri: fileUri,
          meetingId,
          startTime: startTime.getTime(),
          fromDashboard: ctx.fromDashboard,
          audioSamplingRate: recordingOptions.sampleRate,
          recordingSource: ctx.recordingSource,
          transcriptOnly,
          realtimeEnabled: enableRealtime,
          defaultShowLiveAssist: ctx.defaultShowLiveAssist,
          defaultShowNotes: ctx.defaultShowNotes,
          isDemo: ctx.isDemo,
        };

        AudioRecord.setContext(context);
        set({ context });

        tracker.track(TRACKING_EVENTS.AUDIO_RECORD_STARTED, {
          meetingId: context.meetingId,
          language: context.language,
          notesPrivacy: context.notesPrivacy,
          usingStream: context.usingStream,
          mimeType: context.mimeType,
          fromDashboard: ctx.fromDashboard,
          recordingSourceType: ctx.recordingSource?.type,
          recordingSourceApp: ctx.recordingSource?.displayName,
          recordingSourceProcess: ctx.recordingSource?.processName,
        });

        // Open the live window now that local capture has started.
        if (isDesktop && context.meetingId) {
          const liveUrl = `/live/${context.meetingId}?source=calendar`;
          openLiveDestination(liveUrl);
        }

        return {
          fileUri,
          context,
        };
      } catch (err) {
        // Release any held FRED_JOINED events for other meetings if the start
        // was abandoned before/at meeting creation (idempotent if already
        // registered — the started id stays suppressed via the set).
        if (enableRealtime) {
          liveMeetingNotifier.cancelSelfStart();
        }

        // createMeetingForUpload activates realtime, so a failure after it
        // leaves a meeting live server-side that nothing else will end.
        // Tracked rather than detached: a quit arriving here would otherwise
        // read the recorder as idle and take the renderer down with the
        // request still in flight, which is the stranded-meeting bug this
        // whole path exists to prevent. Not awaited, so the start error still
        // surfaces immediately.
        if (enableRealtime && createdMeetingId) {
          const cleanupMeetingId = createdMeetingId;
          void recordingFinalization
            .track(
              stopRealtimeMeeting({ meetingId: cleanupMeetingId }).then(
                (stopped) => {
                  // Resolving false means the request never landed. Surface it
                  // as a rejection so the shutdown scan retries instead of
                  // acknowledging a meeting that is still live.
                  if (!stopped) {
                    throw new Error(
                      "failed-start realtime cleanup did not land",
                    );
                  }
                },
              ),
              cleanupMeetingId,
            )
            .catch(() => undefined);
        }
        scheduleNotificationAsync({
          content: {
            title: "Recording failed to start",
            body: "Something went wrong. Try starting a new recording.",
          },
          trigger: null,
          identifier: "live-record/recording",
        });
        captureException(new Error(getErrorMessage(err, "recorder: start")), {
          contexts: {
            status: { ...get().status },
            context: { ...get().context },
          },
          tags: {
            section: "record-store",
          },
          fingerprint: [`{{ default }}`, String(err.code || err.message)],
        });

        set({ status: AudioRecord.getStatus() });

        // Re-throw specific error types without wrapping
        if (err instanceof SystemAudioPermissionDeniedError) {
          throw err;
        }
        if (
          err instanceof CodedError &&
          err.code === AudioRecordErrorCode.ErrAudioInputUnavailable
        ) {
          throw new AudioInputUnavailableError();
        }
        throw err;
      } finally {
        started.settle();
      }
    },
    stop({ forShutdown }: { forShutdown?: boolean } = {}) {
      const meetingId = get().context?.meetingId;
      return recordingFinalization.track(
        (async () => {
          logger.info("record stopping");

          // Captured before the local stop: a backend-paused meeting must be
          // resumed before the completed stop or it never transcribes.
          const wasPaused = get().status.state === "paused";
          const ctx = {
            ...get().context,
            endTime: Date.now(),
            durationMillis: get().status?.durationMillis,
          } as RecordingContext;

          let stopError: unknown = null;
          let uri: string | undefined;

          try {
            const result = await AudioRecord.stopRecording();
            uri = result.uri;
            ctx.fileUri = uri;

            logger.info(`record stopped`, ctx);
          } catch (err) {
            stopError = err;
            logger.error("stopRecording failed", err);

            captureException(
              new Error(getErrorMessage(err, "recorder: stop")),
              {
                tags: {
                  section: "record-store",
                },
                fingerprint: getRecordingErrorSentryFingerprint(err),
              },
            );
          }

          set({ context: ctx });

          await finalizeRecording(ctx, {
            skipFileUpload: !!stopError,
            forShutdown,
            wasPaused,
          });

          if (stopError) {
            set({ status: AudioRecord.getStatus() });
            throw stopError;
          }

          return {
            fileUri: uri!,
            context: ctx,
          };
        })(),
        meetingId,
      );
    },
    async discard() {
      logger.info("record discarding");

      const ctx = get().context;
      const meetingId = ctx?.meetingId;

      // Captured before teardown: the local record lists every segment file
      // written for this recording, and all of them must go.
      const record = meetingId
        ? localRecordStoreApi.findByMeetingId(meetingId)
        : ctx?.fileUri
          ? localRecordStoreApi.findByUri(ctx.fileUri)
          : undefined;

      // Mark the meeting as discarded BEFORE stopping so the streamCompleted
      // handler skips upload if the streamer flushes a completion mid-teardown.
      let realtimeStopped: Promise<unknown> | undefined;
      if (meetingId) {
        discardedMeetingIds.add(meetingId);
        if (ctx?.transcriptOnly) {
          activeRecordingStoreApi.remove(meetingId);
        }
        // A discarded meeting must not keep (or later upload) its notes draft.
        useManualNotesStore.getState().clearMeeting(meetingId);
        if (ctx?.realtimeEnabled && !ctx.transcriptOnly) {
          realtimeStopped = stopRealtimeMeeting({ meetingId });
        }
      }

      // A recording that never got a meeting keeps its notes under the file uri.
      if (ctx?.fileUri) {
        useManualNotesStore.getState().clearMeeting(ctx.fileUri);
      }

      try {
        // Stop capture so the mic/system-audio endpoints are released.
        await AudioRecord.stopRecording();
      } catch (err) {
        logger.error("recorder: discard: stopRecording failed", err);
      } finally {
        AudioRecord.release();
        set({ status: AudioRecord.getStatus(), context: null });
      }

      // Drop the local record and its audio. Clearing only the meetingId
      // would leave a pending, never-uploaded recording behind, which
      // useAutoUploadRecords then creates a fresh meeting for and uploads —
      // the exact opposite of discarding.
      const fileUris = record?.fileUris ?? (ctx?.fileUri ? [ctx.fileUri] : []);
      for (const fileUri of fileUris) {
        localRecordStoreApi.removeByUri(fileUri);
        try {
          await deleteFile(fileUri);
        } catch (err) {
          logger.error("recorder: discard: deleting file failed", err);
        }
      }

      // Discarding promises permanent deletion, so the meeting the recording
      // created has to go too. Desktop's discard is driven by
      // discardDesktopMeeting, which already deletes it — deleting here as
      // well would be a second, racing call.
      if (isDesktop || !meetingId) return;
      // Not awaited: the caller dismisses the recording UI as soon as discard()
      // resolves, and the local teardown above is already irreversible. Ordered
      // like the desktop flow — end the realtime session, then delete.
      void Promise.resolve(realtimeStopped)
        .then(() =>
          apolloClient.mutate({
            mutation: DeleteMeetingsDocument,
            variables: {
              meetingIds: [meetingId],
              source: "mobile-record-discard",
            },
          }),
        )
        .catch((err) => {
          logger.error("recorder: discard: deleting meeting failed", err);
          toast({
            message: "Recording deleted, but its meeting could not be removed.",
            type: "error",
          });
        });
    },
    async pause() {
      logger.info("[record.store] pause() called");

      const ctx = get().context;
      const status = get().status;

      logger.info("[record.store] pause() context", {
        hasMeetingId: !!ctx?.meetingId,
        meetingId: ctx?.meetingId,
        usingStream: ctx?.usingStream,
        isDesktop,
        statusState: status.state,
      });

      try {
        await AudioRecord.pauseRecording();
        logger.info("[record.store] AudioRecord.pauseRecording() succeeded");

        // Pause the server-side transcription session with the mic
        // (fire-and-forget). Desktop mirrors pause through its own live flow.
        if (!isDesktop && ctx?.realtimeEnabled && ctx.meetingId) {
          updatePuppetStatus(ctx.meetingId, "paused");
        }

        tracker.track(TRACKING_EVENTS.AUDIO_RECORD_PAUSED, {
          meetingId: ctx?.meetingId,
          language: ctx?.language,
          notesPrivacy: ctx?.notesPrivacy,
          durationMins: Math.round((status.durationMillis || 0) / 1000 / 60),
          usingStream: ctx?.usingStream,
          mimeType: ctx?.mimeType,
          fromDashboard: ctx?.fromDashboard,
        });
      } catch (err) {
        captureException(new Error(getErrorMessage(err, "recorder: pause")), {
          tags: {
            section: "record-store",
          },
          fingerprint: getRecordingErrorSentryFingerprint(err),
        });

        // reset states if error
        set({ status: AudioRecord.getStatus() });

        throw err;
      }
    },
    async resume() {
      logger.info("[record.store] resume() called");

      try {
        await AudioRecord.resumeRecording();
        logger.info("[record.store] AudioRecord.resumeRecording() succeeded");

        const ctx = get().context;
        const status = get().status;

        logger.info("[record.store] resume() context", {
          hasMeetingId: !!ctx?.meetingId,
          meetingId: ctx?.meetingId,
          usingStream: ctx?.usingStream,
          isDesktop,
          statusState: status.state,
        });

        // Resume the server-side transcription session with the mic
        // (fire-and-forget). Desktop mirrors resume through its own live flow.
        if (!isDesktop && ctx?.realtimeEnabled && ctx.meetingId) {
          updatePuppetStatus(ctx.meetingId, "active");
        }

        tracker.track(TRACKING_EVENTS.AUDIO_RECORD_RESUMED, {
          meetingId: ctx?.meetingId,
          language: ctx?.language,
          notesPrivacy: ctx?.notesPrivacy,
          durationMins: Math.round((status.durationMillis || 0) / 1000 / 60),
          usingStream: ctx?.usingStream,
          mimeType: ctx?.mimeType,
          fromDashboard: ctx?.fromDashboard,
        });
      } catch (err) {
        captureException(new Error(getErrorMessage(err, "recorder: resume")), {
          tags: {
            section: "record-store",
          },
          fingerprint: getRecordingErrorSentryFingerprint(err),
        });

        set({ status: AudioRecord.getStatus() });

        if (
          err instanceof CodedError &&
          err.code === AudioRecordErrorCode.ErrAudioInputUnavailable
        ) {
          throw new AudioInputUnavailableError();
        } else {
          throw err;
        }
      }
    },
    async startUpload() {
      const ctx = get().context;
      if (!ctx) {
        throw new Error("Recording context is not set");
      }
      return startUploadRecording(ctx);
    },
    release() {
      AudioRecord.release();
    },
  };
});

/** Shared by manual stop and the max-duration auto-stop. */
async function finalizeRecording(
  ctx: RecordingContext,
  {
    skipFileUpload,
    forShutdown,
    wasPaused,
  }: {
    skipFileUpload?: boolean;
    forShutdown?: boolean;
    wasPaused?: boolean;
  } = {},
) {
  tracker.track(TRACKING_EVENTS.AUDIO_RECORD_STOPPED, {
    meetingId: ctx.meetingId,
    language: ctx.language,
    notesPrivacy: ctx.notesPrivacy,
    durationMins: Math.round((ctx.durationMillis || 0) / 1000 / 60),
    usingStream: ctx.usingStream,
    mimeType: ctx.mimeType,
    fromDashboard: ctx.fromDashboard,
    recordingSourceType: ctx.recordingSource?.type,
    recordingSourceApp: ctx.recordingSource?.displayName,
    recordingSourceProcess: ctx.recordingSource?.processName,
  });

  // For calendar-linked desktop recordings, sync attendees to the meeting
  // before the meeting ends or the audio uploads, so the post-processing
  // pipeline can send recap emails.
  await syncCalendarAttendees(ctx.recordingSource, ctx.meetingId, forShutdown);

  // Audio was already streamed, so end the meeting even if stopRecording failed.
  if (ctx.transcriptOnly && ctx.meetingId) {
    const stopArgs = {
      meetingId: ctx.meetingId,
      duration: ctx.durationMillis,
      completed: true,
    };
    try {
      if (wasPaused) {
        await resumeRealtimeMeetingBeforeStop(ctx.meetingId);
      }
      // The request aborts at its own 15s deadline either way. Off the quit
      // path that is recoverable — this window survives, and the toast below
      // asks the user to retry. On the quit path there is no next time: the
      // renderer dies with the app, so the shutdown variant spends the
      // acknowledgement window on fresh attempts instead.
      const stopped = forShutdown
        ? await stopRealtimeMeetingForShutdown(stopArgs)
        : await maybeWithStopDeadline(
            stopRealtimeMeeting(stopArgs),
            "stopRealtimeMeeting",
            forShutdown,
          );
      if (!stopped && forShutdown) {
        // Nobody is left to read a toast. Recorded for the log, and the
        // meeting is reconciled server-side after the reconnect grace period.
        logger.error("finalize: realtime stop never landed before quit", {
          meetingId: ctx.meetingId,
        });
      }
      if (!stopped && !forShutdown) {
        toast({
          title: "Recording could not be finished",
          message: "Press Stop on the live meeting to retry.",
          type: "error",
          duration: 8000,
        });
      }
      // A stop that never landed keeps the record so the next launch can
      // finish the meeting; a landed one is final.
      if (stopped && ctx.meetingId) {
        activeRecordingStoreApi.remove(ctx.meetingId);
      }
    } catch (stopErr) {
      // stopRealtimeMeeting reports request failures itself. A timeout only
      // abandons this wait; the in-flight request continues to completion.
      if (!(stopErr instanceof TimeoutError)) {
        logger.error("finalize: realtime stop failed", stopErr);
      }
    }
    return;
  }

  // Mobile realtime sessions only run DURING the meeting — end the realtime
  // side without completing it; the unchanged upload path owns processing.
  if (ctx.realtimeEnabled && !ctx.transcriptOnly && ctx.meetingId) {
    void stopRealtimeMeeting({
      meetingId: ctx.meetingId,
      duration: ctx.durationMillis,
      completed: false,
    });
  }

  // Streamed recordings finish in the streamCompleted listener. A file upload
  // needs a clean stop.
  if (ctx.usingStream || skipFileUpload) return;

  // The dedup guards inside startUploadRecording (upload store + local record)
  // prevent a second cycle if one already ran.
  try {
    // uploadApi.create() registers the task before awaiting its signed URL, so
    // a timeout abandons this wait while the underlying upload continues.
    await withStopDeadline(startUploadRecording(ctx), "startUpload");
  } catch (uploadErr) {
    logger.error("finalize: upload failed", uploadErr);
    if (!(uploadErr instanceof TimeoutError)) {
      toast({
        message: "Could not start upload. Please try again.",
        type: "error",
      });
    }
  }
}

async function startUploadRecording(ctx: RecordingContext) {
  try {
    if (ctx.meetingId && isAlreadyUploaded(ctx.meetingId)) {
      logger.info("skipping duplicate upload - already uploaded", {
        meetingId: ctx.meetingId,
      });
      return;
    }

    if (ctx.meetingId && hasActiveUploadForMeeting(ctx.meetingId)) {
      logger.info("skipping duplicate upload - upload in progress", {
        meetingId: ctx.meetingId,
      });
      return;
    }

    AudioRecord.release();

    // stop() returns this context and its callers persist it, so the id has to
    // land here too or it would be written back as undefined.
    const meetingId = await ensureRecordingMeetingId(ctx);
    ctx.meetingId = meetingId;

    await uploadApi.create(ctx.fileUri, {
      title: ctx.title || "Recording",
      meetingId,
      uploadType: "recording",
      durationMillis: ctx.durationMillis,
      audioSamplingRate: ctx.audioSamplingRate,
      onCompleted() {
        localRecordStoreApi.updateByMeetingId(meetingId, {
          uploaded: true,
        });

        const durationMins = Math.ceil((ctx.durationMillis || 0) / 1000 / 60);
        tracker.track(TRACKING_EVENTS.AUDIO_RECORD_UPLOAD_COMPLETED, {
          meetingId,
          durationMins,
          fromDashboard: ctx.fromDashboard,
        });

        toast({
          message: "Recording is processing.",
          type: "success",
          duration: 10000,
          action: !isDesktop
            ? {
                onPress: () => {
                  if (ctx.fromDashboard) {
                    window.open(`${Config.DASHBOARD_URL}/status`, "_self");
                  } else {
                    RootNavigation.navigate(RouteNames.MeetingStatus);
                  }
                },
                label: "View Status",
              }
            : undefined,
        });

        appReviewApi.increaseRecordCount();
        feedbackNudgeApi.incrementRecordingsCount();
        feedbackNudgeApi.requestNudge();
      },
      onError(err) {
        toast({
          message:
            "Failed to upload recording. Please try again later in the Local Recordings screen.",
          type: "error",
          duration: 10000,
        });

        captureException(
          new Error(getErrorMessage(err, "recorder: startUploadRecording")),
          {
            tags: {
              section: "record-store",
              meetingId: ctx.meetingId,
            },
            contexts: {
              status: { ...useRecorder.getState().status },
              context: { ...useRecorder.getState().context },
            },
            fingerprint: getRecordingErrorSentryFingerprint(err),
          },
        );
      },
    });

    tracker.track(TRACKING_EVENTS.AUDIO_RECORD_UPLOAD_STARTED, {
      meetingId,
      durationMins: Math.ceil((ctx.durationMillis || 0) / 1000 / 60),
      fromDashboard: ctx.fromDashboard,
    });
  } catch (err) {
    const offline = await isOffline();

    // Reported either way: being offline does not mean offline caused it, and a
    // real failure here must not hide behind the deferral toast.
    captureException(
      new Error(getErrorMessage(err, "recorder: startUploadRecording")),
      {
        tags: {
          section: "record-store",
          meetingId: ctx.meetingId,
          offline: String(offline),
        },
        contexts: {
          status: { ...useRecorder.getState().status },
          context: { ...useRecorder.getState().context },
        },
        fingerprint: getRecordingErrorSentryFingerprint(err),
      },
    );

    // The audio is already on disk and still listed in the local record store,
    // so the next scan (reconnect or app launch) finishes the job.
    if (offline) {
      toast({
        message:
          "Recording saved on this device. It will upload when you're back online.",
        type: "info",
        duration: 10000,
      });
      return;
    }

    AudioRecord.setStreamingError(err.message);

    throw err;
  }
}

export const recorderApi = useRecorder.getState() as Pick<
  RecorderStoreValue,
  | "start"
  | "stop"
  | "discard"
  | "pause"
  | "resume"
  | "addEventListener"
  | "setContext"
  | "startUpload"
  | "release"
>;

export const useRecordListeners = () => {
  useEffect(() => {
    // The native module publishes `inactive` before maxDurationReached, so
    // the listener reads the last live state to know if we were paused.
    let lastLiveState: RecordingStates["state"] | undefined;
    const statusListener = AudioRecord.addEventListener("status", (status) => {
      if (status.state !== "inactive") lastLiveState = status.state;
      useRecorder.setState({ status });
      checkpointActiveRecording(status, useRecorder.getState().context);
    });

    const streamCompleteListener = AudioRecord.addEventListener(
      "streamCompleted",
      async (e) => {
        const meetingId = e.meetingId;
        if (!meetingId) return;

        // Discarded recordings must never be uploaded or processed.
        if (discardedMeetingIds.has(meetingId)) {
          discardedMeetingIds.delete(meetingId);
          localRecordStoreApi.updateByMeetingId(meetingId, {
            meetingId: undefined,
          });
          return;
        }

        if (hasActiveUploadForMeeting(meetingId)) {
          logger.info("skipping duplicate stream completion", { meetingId });
          return;
        }

        try {
          if (isAlreadyUploaded(meetingId)) {
            logger.info("skipping stream completion - already uploaded", {
              meetingId,
            });
            return;
          }

          const record = localRecordStoreApi.findByMeetingId(meetingId);
          localRecordStoreApi.updateByMeetingId(meetingId, {
            streamed: true,
          });

          const durationMins = Math.ceil(
            (record?.durationMillis || 0) / 1000 / 60,
          );

          if (!record?.mimeType) {
            // We can ensure new versions of the app will have the mimeType set
            throw new Error("MIME type is not set");
          }

          // Realtime recordings end via stopRealtimeMeeting.
          if (!record.transcriptOnly) {
            await completeUpload({
              meetingId,
              mimeType: record.mimeType,
              audioSamplingRate: record.audioSamplingRate,
              duration: record.durationMillis,
            });
          }

          localRecordStoreApi.updateByMeetingId(meetingId, {
            uploaded: true,
          });

          if (record?.usingStream) {
            tracker.track(TRACKING_EVENTS.AUDIO_RECORD_STREAM_COMPLETED, {
              meetingId: meetingId,
              durationMins,
              fromDashboard: record?.fromDashboard,
            });
          } else {
            tracker.track(TRACKING_EVENTS.AUDIO_RECORD_UPLOAD_COMPLETED, {
              meetingId: meetingId,
              durationMins,
              fromDashboard: record?.fromDashboard,
            });
          }

          if (!record.transcriptOnly) {
            toast({
              message: "Recording is processing.",
              type: "success",
              duration: 10000,
              action: !isDesktop
                ? {
                    onPress: () => {
                      if (record?.fromDashboard) {
                        window.open(`${Config.DASHBOARD_URL}/status`, "_self");
                      } else {
                        RootNavigation.navigate(RouteNames.MeetingStatus);
                      }
                    },
                    label: "View Status",
                  }
                : undefined,
            });
          }

          appReviewApi.increaseRecordCount();
          feedbackNudgeApi.incrementRecordingsCount();
          feedbackNudgeApi.requestNudge();
        } catch (err) {
          toast({
            message:
              "Failed to upload recording. Please try again later in the Local Recordings screen.",
            type: "error",
            duration: 10000,
          });

          captureException(
            new Error(getErrorMessage(err, "recorder: streamCompleted")),
            {
              tags: {
                section: "record-store",
                meetingId,
              },
              contexts: {
                error: {
                  ...err,
                },
                status: { ...useRecorder.getState().status },
                context: { ...useRecorder.getState().context },
              },
              fingerprint: getRecordingErrorSentryFingerprint(err),
            },
          );
        }
      },
    );
    const streamFailedListener = AudioRecord.addEventListener(
      "streamFailed",
      async (e) => {
        const meetingId = e.meetingId;

        captureException(
          new Error(
            getErrorMessage(
              {
                message: e.message,
              },
              "recorder: streamFailed",
            ),
          ),
          {
            tags: {
              section: "record-store",
              meetingId,
              streamType: e.type,
            },
            contexts: {
              error: {
                ...e,
              },
              status: { ...useRecorder.getState().status },
              context: { ...useRecorder.getState().context },
            },
            fingerprint: getRecordingErrorSentryFingerprint(e),
          },
        );

        const userMessage = TERMINAL_STREAM_FAILURE_MESSAGE[e.code];
        if (userMessage) {
          toast({
            title: "Live transcription stopped",
            message: userMessage,
            type: "error",
            duration: 10000,
          });
        }
      },
    );
    const errorListener = AudioRecord.addEventListener("error", (err) => {
      captureException(
        new Error(`recorder: error: ${err.message} (${err.code})`),
        {
          tags: {
            section: "record-store",
            meetingId: useRecorder.getState().context?.meetingId,
          },
          contexts: {
            error: {
              ...err,
            },
            status: { ...useRecorder.getState().status },
            context: { ...useRecorder.getState().context },
          },
          extra: {
            stack: err.stack,
          },
          fingerprint: getRecordingErrorSentryFingerprint(err),
        },
      );

      // Pause/resume failures are already surfaced to the user via
      // RecordActionsContext catch blocks — skip the toast here to avoid duplicates.
      const handledByCallerUI =
        err.code === "E_PAUSE_FAILED" || err.code === "E_RESUME_FAILED";

      if (!handledByCallerUI) {
        toast({
          message:
            err.code === "E_STOP_FAILED"
              ? "Recording stopped due to an unexpected error. Please try again to restart the recording."
              : err.message,
          type: "error",
        });
      }
    });
    const logListener = AudioRecord.addEventListener("log", (event) => {
      logger.info(`[AudioRecordModule] ${event.message}`);
    });
    const interruptListener = AudioRecord.addEventListener(
      "interrupt",
      (event) => {
        // interruptions are normal lifecycle events (calls, Siri) — breadcrumb
        // only, not a Sentry error
        logger.info(`[AudioRecordModule] interrupted: ${event.reason}`);
      },
    );
    const maxDurationListener = AudioRecord.addEventListener(
      "maxDurationReached",
      async (e) => {
        logger.info(`[AudioRecordModule] maxDurationReached: ${e.meetingId}`);

        const ctx = useRecorder.getState().context;
        if (!ctx) return;

        const endedCtx: RecordingContext = {
          ...ctx,
          endTime: Date.now(),
          durationMillis: useRecorder.getState().status?.durationMillis,
        };
        const wasPaused = lastLiveState === "paused";
        lastLiveState = undefined;

        useRecorder.setState({ context: endedCtx });

        // The module stopped capture itself, so recorderApi.stop() never runs.
        await recordingFinalization.track(
          finalizeRecording(endedCtx, { wasPaused }),
          endedCtx.meetingId,
        );

        toast({
          title: "Recording stopped",
          message: "The 4-hour recording limit was reached.",
          type: "info",
          duration: 10000,
        });

        scheduleNotificationAsync({
          content: {
            title: "Recording stopped",
            body: "Your recording was automatically stopped after reaching the 4-hour limit.",
          },
          trigger: null,
          identifier: "live-record/max-duration",
        });
      },
    );
    return () => {
      statusListener.remove();
      streamCompleteListener.remove();
      streamFailedListener.remove();
      errorListener.remove();
      logListener.remove();
      interruptListener.remove();
      maxDurationListener.remove();
    };
  }, []);
};

let recordingTrackTimer: ReturnType<typeof setInterval> | undefined;
useRecorder.subscribe((state, prevState) => {
  if (state.status.state !== prevState.status.state) {
    clearInterval(recordingTrackTimer);
    if (state.status.state !== "inactive") {
      setSentryContext("recorder", {
        status: state.status,
        context: state.context,
      });
      setSentryTag("is_recording", "true");

      if (state.status.state === "recording") {
        recordingTrackTimer = setInterval(
          () => {
            const latestState = useRecorder.getState();
            setSentryContext("recorder", {
              status: latestState.status,
              context: latestState.context,
            });
          },
          // track every 2 minutes
          2 * 60 * 1000,
        );
      }
    } else {
      setSentryContext("recorder", null);

      setSentryTag("is_recording", undefined);
    }
  }
});

type RecordingContextSnapshot = {
  meetingId?: string;
  finalizingMeetingId?: string;
  isFinalizing?: boolean;
  isStarting?: boolean;
  title?: string;
  notesPrivacy?: RecordingContext["notesPrivacy"];
  state: "inactive" | "recording" | "paused";
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
): RecordingContext["notesPrivacy"] | undefined => {
  if (!value) return undefined;
  return meetingNotesPrivacyValues.has(value as MeetingNotesPrivacy)
    ? (value as MeetingNotesPrivacy)
    : undefined;
};

const buildRecordingContextSnapshot = (
  state: RecorderStoreValue,
): RecordingContextSnapshot | null => {
  const meetingId = state.context?.meetingId;
  const pendingFinalization = recordingFinalization.getPendingFinalization();
  const isStarting = pendingStart !== null;
  if (
    (!meetingId || state.status.state === "inactive") &&
    !pendingFinalization &&
    !isStarting
  ) {
    return null;
  }

  return {
    meetingId,
    finalizingMeetingId: pendingFinalization?.meetingId,
    isFinalizing: pendingFinalization !== null,
    isStarting,
    title: state.context?.title,
    notesPrivacy: state.context?.notesPrivacy,
    state: state.status.state,
    defaultShowLiveAssist: state.context?.defaultShowLiveAssist,
    defaultShowNotes: state.context?.defaultShowNotes,
    isDemo: state.context?.isDemo,
    consentDelivery: useConsentDeliveryStore.getState().status,
    audioConsentDelivery: useConsentDeliveryStore.getState().audio,
    platform: state.context?.recordingSource?.platform,
  };
};

function syncRecordingContextSnapshot(state: RecorderStoreValue) {
  if (
    !isDesktop ||
    typeof window === "undefined" ||
    !window.electron?.recordingContext
  ) {
    return;
  }

  const snapshot = buildRecordingContextSnapshot(state);
  window.electron.recordingContext.sync(snapshot);
}

// Patch the live recording context, ignoring updates for a meeting this window
// isn't recording.
export const patchRecordingContext = (
  meetingId: string,
  patch: Partial<RecordingContext>,
) => {
  const { context, setContext } = useRecorder.getState();
  if (!context?.meetingId || context.meetingId !== meetingId) return;

  const nextContext = { ...context, ...patch };
  setContext(nextContext);
  localRecordStoreApi.updateByMeetingId(meetingId, nextContext);
};

if (
  isDesktop &&
  typeof window !== "undefined" &&
  window.electron?.recordingContext
) {
  const { recordingContext } = window.electron;

  recordingContext.onUpdateRequested?.((update) => {
    const nextNotesPrivacy = coerceNotesPrivacy(update.notesPrivacy);
    patchRecordingContext(update.meetingId, {
      ...(update.title !== undefined ? { title: update.title } : {}),
      ...(nextNotesPrivacy !== undefined
        ? { notesPrivacy: nextNotesPrivacy }
        : {}),
    });
  });

  recordingContext.onStopRequested?.(async (payload) => {
    const notifyCompleted = (success: boolean) =>
      window.electron?.recordingContext?.notifyStopCompleted?.({
        meetingId: payload?.meetingId,
        success,
      });
    // A start in flight has not published its meeting id yet, so the snapshot
    // the main process read could not name it. Let it settle before deciding,
    // bounded by the acknowledgement timeout on the other side.
    if (pendingStart) await pendingStart;
    const { context, status } = useRecorder.getState();
    recordingFinalization.handleStopRequest({
      requestedMeetingId: payload?.meetingId,
      activeMeetingId: context?.meetingId,
      isActive: status.state !== "inactive",
      stop: () =>
        // forShutdown comes from the main process: the app is quitting, so this
        // window will not outlive the request and every wait has to be real.
        recorderApi.stop({ forShutdown: payload?.forShutdown }).catch((err) => {
          logger.error("[recorder] stop failed from ipc", { err });
          throw err;
        }),
      notifyCompleted,
    });
  });

  recordingContext.onDiscardRequested?.((payload) => {
    // Let the main process know teardown is done so it can resolve the pending
    // discardRecording() call. Always ack — even on the early-return paths —
    // so the caller never waits out the full timeout when there's nothing to
    // discard.
    const ackDiscarded = (success: boolean) =>
      window.electron?.recordingContext?.notifyDiscarded?.({
        meetingId: payload?.meetingId,
        success,
      });

    const { context, status } = useRecorder.getState();
    if (status.state === "inactive") return ackDiscarded(true);
    if (payload?.meetingId && context?.meetingId !== payload.meetingId) {
      return ackDiscarded(true);
    }
    recorderApi
      .discard()
      .then(() => ackDiscarded(true))
      .catch((err) => {
        logger.error("[recorder] discard failed from ipc", { err });
        ackDiscarded(false);
      });
  });

  syncRecordingContextSnapshot(useRecorder.getState());
}

// A rename in another window has to move the recorder's own title too: the home
// banner and LocalMeetingItem read the in-progress meeting's title from the
// recording context, so it would otherwise mask the new title indefinitely.
if (isDesktop && typeof window !== "undefined" && window.electron?.meeting) {
  window.electron.meeting.onTitleUpdated((update) => {
    const context = useRecorder.getState().context;
    // A failed rename only rolls back while the recorder still holds the title
    // that never saved, so a newer rename isn't clobbered by a late failure.
    if (
      update.revertedFrom !== undefined &&
      context?.title !== update.revertedFrom
    ) {
      return;
    }
    patchRecordingContext(update.meetingId, { title: update.title });
  });
}

// Re-sync the recording context when consent delivery status changes so
// the live view window sees the updated status.
if (
  isDesktop &&
  typeof window !== "undefined" &&
  window.electron?.recordingContext
) {
  useConsentDeliveryStore.subscribe(() => {
    syncRecordingContextSnapshot(useRecorder.getState());
  });
}

let lastRecordingContextSnapshot = "";

useRecorder.subscribe((state, prevState) => {
  if (
    !isDesktop ||
    typeof window === "undefined" ||
    !window.electron?.recordingContext
  ) {
    return;
  }

  const nextSnapshot = buildRecordingContextSnapshot(state);
  const nextSnapshotKey = JSON.stringify(nextSnapshot);
  if (nextSnapshotKey !== lastRecordingContextSnapshot) {
    lastRecordingContextSnapshot = nextSnapshotKey;
    syncRecordingContextSnapshot(state);
  }

  if (
    prevState.status.state !== "inactive" &&
    state.status.state === "inactive" &&
    state.context?.meetingId
  ) {
    window.electron.recordingContext.notifyEnded({
      meetingId: state.context.meetingId,
    });
  }
});

// Listen to recording context updates from other windows and sync the local store
if (
  isDesktop &&
  typeof window !== "undefined" &&
  window.electron?.recordingContext
) {
  window.electron.recordingContext.onUpdated((snapshot) => {
    if (!snapshot) return;

    const currentState = useRecorder.getState();
    const currentSnapshot = buildRecordingContextSnapshot(currentState);

    // Only update if the snapshot is different and we're not the source of the update
    if (
      currentSnapshot &&
      snapshot.meetingId === currentSnapshot.meetingId &&
      snapshot.state !== currentSnapshot.state
    ) {
      // Update the store's status.state to match the synced state
      useRecorder.setState({
        status: {
          ...currentState.status,
          state: snapshot.state,
        },
      });

      logger.info("Synced recording state from IPC", {
        meetingId: snapshot.meetingId,
        newState: snapshot.state,
        previousState: currentSnapshot.state,
      });
    }
  });
}
