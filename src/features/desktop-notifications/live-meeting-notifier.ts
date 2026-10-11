// Desktop-only owner of "did we already tell the user about this live meeting".
// Mounted once in the main desktop window. Both the poll list (live store) and
// SSE (FRED_JOINED) route every candidate through the single seeLiveMeeting
// decision, deduped by one notifiedIds set and gated by the self-start window.
import { useEffect } from "react";
import {
  useLiveMeetingsStore,
  liveMeetingsApi,
  isLiveMeeting,
  openLiveDestination,
} from "@/features/live";
import { showDesktopNotification } from "./utils";
import {
  meetingDetectionApi,
  registerCleanupCallback,
  initializeMeetingStateCleanup,
} from "@/features/desktop-meeting-detection";
import { useRecorder } from "@/features/live-record/record.store";
import { getLocalSettings } from "@/features/settings";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { Logger } from "@/logger";
import {
  useRealtimeNotifications,
  type FredJoinedMeetingData,
} from "./useRealtimeNotifications";
import { isLiveMeetingNotificationSuppressed } from "./live-meeting-notifier-state";

const logger = new Logger("live-meeting-notifier");

// --- single dedup ledger --------------------------------------------------
const notifiedIds = new Set<string>();

async function route(id: string, title?: string | null): Promise<void> {
  // Explicitly invited the bot -> open the live pane directly, no notification.
  if (meetingDetectionApi.isExplicitlyInvitedMeeting(id)) {
    meetingDetectionApi.removeExplicitlyInvitedMeetingId(id);
    meetingDetectionApi.suppressNotifications();
    openLiveDestination(`/live/${id}?source=invite`);
    return;
  }

  // Live window already shows this meeting -> nothing to notify.
  try {
    const activeId = await window.electron?.liveView?.getMeetingId();
    if (activeId && activeId === id) {
      meetingDetectionApi.suppressNotifications();
      return;
    }
  } catch (error) {
    logger.info("Failed to read active live meeting before notify", {
      id,
      error: String(error),
    });
  }

  const shown = await showDesktopNotification(
    `Meeting is live: ${title ?? ""}`,
    "Get real-time notes and transcription.",
    `/live/${id}`,
    "Live Assist",
    "live_assist",
  );
  meetingDetectionApi.suppressNotifications();
  logger.info("Live meeting desktop notification result", { id, shown });
}

/** The single decision point. Called for every poll + SSE live-meeting signal. */
function seeLiveMeeting(id: string, title?: string | null): void {
  if (isLiveMeetingNotificationSuppressed()) return;
  if (!getLocalSettings().notetakerJoinedNotification) return; // user opted out
  if (id === useRecorder.getState().context?.meetingId) return; // recording this one
  if (notifiedIds.has(id)) return; // already shown this session
  notifiedIds.add(id);
  void route(id, title);
}

/** Mounted exactly once in the main desktop window. */
export function useLiveMeetingNotifier(): void {
  const meetings = useLiveMeetingsStore((s) => s.meetings);

  // Bound the session dedup ledger: the periodic cleanup (6h) clears it so a
  // long-lived desktop session cannot grow notifiedIds without limit.
  useEffect(() => {
    if (!isDesktop) return;
    initializeMeetingStateCleanup();
    return registerCleanupCallback(() => notifiedIds.clear());
  }, []);

  // Cross-window end: the live window signals (over IPC) when a meeting ends;
  // instantly drop it from the main window's list ahead of the next refetch.
  useEffect(() => {
    if (!isDesktop || !window.electron?.onLiveMeetingEnded) return;
    return window.electron.onLiveMeetingEnded((meetingId) => {
      liveMeetingsApi.markEnded(meetingId);
    });
  }, []);

  // 1) Register the refetch callback used by OS-signal meeting detection.
  useEffect(() => {
    if (!isDesktop) return;
    meetingDetectionApi.setRefetchLiveMeetings(async () => {
      const result = await liveMeetingsApi.refetch();
      // A failed fetch has no list; throw so detection keeps its last known
      // meetings instead of treating them all as gone.
      if (result.errors?.length) throw new Error(result.errors[0].message);
      const list = result?.data?.liveMeetings?.meetings ?? [];
      return [...list].sort((a, b) =>
        a?.startTime && b?.startTime ? a.startTime - b.startTime : 0,
      );
    });
    return () => meetingDetectionApi.setRefetchLiveMeetings(null);
  }, []);

  // 2) SSE: instant signal -> refetch the authoritative list + attempt notify.
  const handleMeetingStarted = (data: FredJoinedMeetingData) => {
    void liveMeetingsApi.refetch();
    if (data?.meetingId) seeLiveMeeting(data.meetingId, data.title);
  };
  useRealtimeNotifications({
    enabled: isDesktop,
    onMeetingStarted: handleMeetingStarted,
  });

  // 3) Poll: every live meeting in the authoritative list runs the decision.
  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow()) return;
    meetings.forEach((m) => {
      if (m && isLiveMeeting(m) && m.objectId) {
        seeLiveMeeting(m.objectId, m.title);
      }
    });
  }, [meetings]);
}
