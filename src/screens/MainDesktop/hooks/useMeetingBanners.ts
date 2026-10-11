import { useEffect, useMemo, useState } from "react";
import type { CalendarEvents, MeetingStatusData } from "@/graphql";
import {
  useMeetingDetectionStore,
  useBrowserMeetings,
  meetingMatchesCalendarEvent,
  liveMeetingMatchesCalendarEvent,
  botJoinedMatchesCalendarEvent,
  isBotLiveMeeting,
  isCalendarEventClaimed,
  normalizeUrl,
  type LocalMeetingRecord,
} from "@/features/desktop-meeting-detection";
import {
  useRecorder,
  getRecordingTitleFromSource,
} from "@/features/live-record";
import {
  usePendingAddToLiveStore,
  pendingAddToLiveApi,
  PENDING_ADD_TO_LIVE_TTL_MS,
  useBotJoinedStore,
  type PendingAddToLive,
} from "@/features/live";
import type { MeetingBannerState } from "../components/MeetingBanner";

/**
 * Banner kinds: calendar states, ad-hoc detected local meetings, and the
 * transient "pending" add-to-live state ("Notetaker will join shortly").
 */
export type MeetingBannerKind = MeetingBannerState | "detected" | "pending";

/** Show the upcoming banner starting this long before the meeting begins. */
const LEAD_TIME_MS = 15 * 60 * 1000;
/**
 * After a no-bot meeting starts, keep bridging it as a live banner for this long
 * (even once it drops from the calendar feed) so the user can still act.
 */
const CALENDAR_HANDOFF_WINDOW_MS = 15 * 60 * 1000;
/** Re-evaluate windows on this cadence so banners appear/disappear on time. */
const TICK_INTERVAL_MS = 30 * 1000;

export interface MeetingBannerItem {
  key: string;
  state: MeetingBannerKind;
  /** Present for calendar-driven banners (upcoming / live / live-joined). */
  event?: CalendarEvents;
  /** Present for live / live-joined banners: the backend meeting to open. */
  liveMeeting?: MeetingStatusData;
  /** Present for "detected" banners: the ad-hoc local detection record. */
  localRecord?: LocalMeetingRecord;
  /** Present for "pending" banners: the in-flight add-to-live request. */
  pending?: PendingAddToLive;
  /** True when the user has already joined the meeting (claimed, browser tab, etc.). */
  userJoined?: boolean;
}

/** Whether a pending add-to-live request now has a matching live meeting. */
const pendingIsLive = (
  entry: PendingAddToLive,
  liveMeetings: MeetingStatusData[],
): boolean =>
  liveMeetings.some(
    (meeting) =>
      (!!entry.meetingId && meeting.objectId === entry.meetingId) ||
      (!!meeting.url && normalizeUrl(meeting.url) === normalizeUrl(entry.url)),
  );

const getStartTime = (event: CalendarEvents): number | null => {
  if (!event.date) return null;
  const time = new Date(event.date).getTime();
  return Number.isNaN(time) ? null : time;
};

const getEndTime = (event: CalendarEvents): number => {
  if (!event.endDate) return 0;
  const time = new Date(event.endDate).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const bannerStartMs = (banner: MeetingBannerItem): number => {
  if (banner.event?.date) return new Date(banner.event.date).getTime();
  if (banner.liveMeeting?.startTime) return banner.liveMeeting.startTime;
  if (banner.pending) return banner.pending.createdAt;
  return banner.localRecord?.createdAt ?? 0;
};

/**
 * Selects the meetings to surface as home banners:
 *  - "upcoming": calendar meeting starting within the next 15 minutes
 *  - "live": calendar meeting in its scheduled window. Shows prep + actions that
 *    adapt to the bot — "Join" when the bot was invited, else "Invite Notetaker"
 *    + "Join and Take Notes" (which opens the link and starts a desktop
 *    recording). No-bot meetings that started and dropped from the live feed are
 *    bridged here for up to 15 minutes from the detection store's retained
 *    events, until the user joins, audio is detected, a live meeting arrives, or
 *    the window elapses.
 *  - "live-joined": a backend live meeting with no calendar event (e.g.
 *    add-to-live) or the active local recording; same banner with a "View
 *    Notes" action.
 *  - "detected": an ad-hoc browser/audio detection (rendered via LocalMeetingItem)
 *  - "pending": an in-flight add-to-live request (pasted URL or a detected
 *    meeting the user invited) showing "Notetaker will join shortly" until the
 *    meeting goes live, or for at most 2 minutes (see pendingAddToLive store).
 *
 * An upcoming meeting the user has already joined early is suppressed. "Joined"
 * is inferred from desktop signals: an open browser tab, a local mic/URL
 * detection, an active recording, or an explicit join claim.
 *
 * When any live meeting (live / live-joined) is on screen, all "upcoming"
 * banners are suppressed so the in-progress meeting isn't competing with less
 * urgent reminders.
 */
export function useMeetingBanners(
  events: CalendarEvents[] | undefined,
  liveMeetings: MeetingStatusData[] = [],
): MeetingBannerItem[] {
  const [now, setNow] = useState(() => Date.now());
  const localMeetings = useMeetingDetectionStore(
    (state) => state.localMeetings,
  );
  const claimedCalendarMeetings = useMeetingDetectionStore(
    (state) => state.claimedCalendarMeetings,
  );
  // Retained calendar events (incl. ones the live feed dropped after start),
  // used to bridge no-bot meetings into a live banner.
  const storedCalendarEvents = useMeetingDetectionStore(
    (state) => state.calendarEvents,
  );
  const { browserMeetings } = useBrowserMeetings();
  const recordingState = useRecorder((state) => state.status.state);
  const recordingContext = useRecorder((state) => state.context);
  const pendingAddToLive = usePendingAddToLiveStore((state) => state.pending);
  // Real-time "Fred joined" signals (SSE), used to switch a calendar banner to
  // "View Notes" the moment the bot joins — before the live-meetings poll lands.
  const botJoined = useBotJoinedStore((state) => state.joined);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Drop pending add-to-live entries once their meeting goes live; the
  // standalone live banner takes over from here.
  useEffect(() => {
    for (const entry of pendingAddToLive) {
      if (pendingIsLive(entry, liveMeetings)) {
        pendingAddToLiveApi.remove(entry.id);
      }
    }
  }, [pendingAddToLive, liveMeetings]);

  return useMemo(() => {
    const calendarEvents = events ?? [];
    const openBrowserUrls = browserMeetings?.meetingsWithBrowser ?? [];
    const activeLocalMeetings = localMeetings.filter(
      (record) => record.status !== "ended" && record.status !== "dismissed",
    );

    const hasJoined = (event: CalendarEvents): boolean => {
      if (isCalendarEventClaimed(event, claimedCalendarMeetings, now)) {
        return true;
      }
      if (
        openBrowserUrls.some((tab) =>
          meetingMatchesCalendarEvent(event, { url: tab.url }, now),
        )
      ) {
        return true;
      }
      // A live meeting for this event from any non-calendar source means the
      // user (or their device/extension) joined it, not just the bot.
      if (
        liveMeetings.some(
          (meeting) =>
            liveMeetingMatchesCalendarEvent(event, meeting, now) &&
            !isBotLiveMeeting(meeting),
        )
      ) {
        return true;
      }
      return activeLocalMeetings.some((record) =>
        meetingMatchesCalendarEvent(
          event,
          {
            url: record.event.originalUrl,
            platform: record.event.platform,
          },
          now,
        ),
      );
    };

    // The bot has joined this call if we got a realtime signal for it.
    const botJoinedMeetingId = (event: CalendarEvents): string | undefined =>
      botJoined.find((entry) =>
        botJoinedMatchesCalendarEvent(event, entry, now),
      )?.meetingId;

    const banners: MeetingBannerItem[] = [];
    // Backend live meetings already represented by a calendar banner; tracked so
    // they are not surfaced a second time as standalone live-joined cards.
    const claimedLiveIds = new Set<string>();
    const claimMatch = (event: CalendarEvents) => {
      const match = liveMeetings.find((meeting) =>
        liveMeetingMatchesCalendarEvent(event, meeting, now),
      );
      if (match?.objectId) claimedLiveIds.add(match.objectId);
      return match;
    };

    for (const event of calendarEvents) {
      if (event.isValidMeeting === false || !event.url) continue;
      const start = getStartTime(event);
      if (start === null) continue;
      const end = getEndTime(event);

      const isUpcoming = start - LEAD_TIME_MS <= now && now < start;
      const isLive = now >= start && (end ? now < end : true);
      if (!isUpcoming && !isLive) continue;

      const key = event._id ?? `event-${start}`;
      const userJoined = hasJoined(event);

      // Upcoming meeting the user has already joined early: nothing to prompt.
      if (isUpcoming && userJoined) continue;

      // Claim any matching backend live meeting so the same call is not also
      // surfaced as a standalone card below. For a live meeting, this is also
      // the bot's call whose realtime panel the "Open Realtime" action opens.
      const liveMatch = claimMatch(event);

      // The bot's live meeting to open. Prefer the polled meeting; fall back to
      // the realtime "Fred joined" signal (fires ~1s after the bot joins, and
      // survives an id/url mismatch against the poll).
      const botMeetingId = liveMatch ? undefined : botJoinedMeetingId(event);
      const botLiveMeeting = botMeetingId
        ? ({
            objectId: botMeetingId,
            title: event.title,
            url: event.url,
          } as MeetingStatusData)
        : undefined;
      const liveMeeting = isUpcoming
        ? undefined
        : (liveMatch ?? botLiveMeeting);

      banners.push({
        key,
        state: isUpcoming ? "upcoming" : "live",
        event,
        liveMeeting,
        userJoined,
      });
    }

    // Calendar handoff: a no-bot meeting that started and dropped from the live
    // feed has no backend live meeting, so bridge it as a live banner for up to
    // 15 minutes using the detection store's retained events. It disappears once
    // the user joins, audio is detected, a live meeting arrives, or the window
    // elapses.
    const liveFeedEventIds = new Set(
      calendarEvents
        .map((event) => event._id)
        .filter((id): id is string => Boolean(id)),
    );
    for (const event of storedCalendarEvents) {
      if (!event._id || liveFeedEventIds.has(event._id)) continue;
      if (event.fredAdded) continue;
      if (event.isValidMeeting === false || !event.url) continue;
      const start = getStartTime(event);
      if (start === null) continue;
      if (now < start || now >= start + CALENDAR_HANDOFF_WINDOW_MS) continue;
      // User already joined, the bot joined (realtime signal), audio/detection
      // present, or a real live meeting exists → those flows take over instead
      // of this no-bot bridge.
      if (hasJoined(event)) continue;
      if (botJoinedMeetingId(event)) continue;
      if (
        liveMeetings.some((meeting) =>
          liveMeetingMatchesCalendarEvent(event, meeting, now),
        )
      ) {
        continue;
      }
      if (
        activeLocalMeetings.some((record) =>
          meetingMatchesCalendarEvent(
            event,
            {
              url: record.event.originalUrl,
              platform: record.event.platform,
            },
            now,
          ),
        )
      ) {
        continue;
      }
      banners.push({ key: event._id, state: "live", event });
    }

    // Ad-hoc live meetings (add-to-live, manual) with no calendar event: the
    // user is in them, so surface the banner with a "View Notes" action.
    for (const meeting of liveMeetings) {
      if (!meeting.objectId || claimedLiveIds.has(meeting.objectId)) continue;
      banners.push({
        key: meeting.objectId,
        state: "live-joined",
        liveMeeting: meeting,
      });
    }

    // Ad-hoc detected meetings (browser/audio) surfaced as detection prompts.
    // Skip ones already represented by a calendar banner or a backend live
    // meeting (matched by URL) to avoid showing the same call twice.
    const liveMeetingUrls = new Set(
      liveMeetings
        .map((meeting) => meeting.url && normalizeUrl(meeting.url))
        .filter((url): url is string => Boolean(url)),
    );
    for (const record of localMeetings) {
      if (
        record.status === "ended" ||
        record.status === "recording" ||
        record.status === "dismissed" ||
        // Invited records ride the "Notetaker will join shortly" pending banner
        // (2-minute cap, see pendingAddToLive store), not a detection card.
        record.status === "invited"
      ) {
        continue;
      }
      const url = record.event.originalUrl;
      if (url && liveMeetingUrls.has(normalizeUrl(url))) continue;
      const onCalendar = calendarEvents.some((event) =>
        meetingMatchesCalendarEvent(event, {
          url,
          platform: record.event.platform,
        }),
      );
      if (onCalendar) continue;
      banners.push({ key: record.id, state: "detected", localRecord: record });
    }

    // Active local recording: surface it as a "View Notes" banner so the home
    // screen no longer needs the separate "Live Now" card. Skip if the same
    // meeting is already represented (calendar event or backend live meeting).
    const recordingMeetingId =
      recordingState !== "inactive" ? recordingContext?.meetingId : undefined;
    const recordingAlreadyShown =
      !!recordingMeetingId &&
      banners.some(
        (banner) =>
          banner.liveMeeting?.objectId === recordingMeetingId ||
          banner.event?.meetingId === recordingMeetingId,
      );
    if (recordingMeetingId && !recordingAlreadyShown) {
      const source = recordingContext?.recordingSource;
      banners.push({
        key: recordingMeetingId,
        state: "live-joined",
        liveMeeting: {
          objectId: recordingMeetingId,
          title:
            recordingContext?.title?.trim() ||
            getRecordingTitleFromSource(source),
          startTime: recordingContext?.startTime,
          endTime: recordingContext?.endTime,
          url: source?.meetingUrl ?? source?.joinUrl,
        } as MeetingStatusData,
      });
    }

    // In-flight add-to-live requests: show "Notetaker will join shortly" until
    // the meeting goes live (handled above / by the cleanup effect) or the
    // 2-minute fallback elapses.
    for (const entry of pendingAddToLive) {
      if (now - entry.createdAt >= PENDING_ADD_TO_LIVE_TTL_MS) continue;
      if (pendingIsLive(entry, liveMeetings)) continue;
      banners.push({
        key: `pending-${entry.id}`,
        state: "pending",
        pending: entry,
      });
    }

    // A live meeting in progress takes priority: once any live banner is on
    // screen, drop the (less urgent) "upcoming" banners so they don't compete
    // for attention. Detected/pending banners are themselves in-the-moment, so
    // they stay.
    const hasLiveBanner = banners.some(
      (banner) => banner.state === "live" || banner.state === "live-joined",
    );
    const visibleBanners = hasLiveBanner
      ? banners.filter((banner) => banner.state !== "upcoming")
      : banners;

    // Joined live meetings (the call the user is actively in) always pin to the
    // top; everything else falls back to start-time order.
    return visibleBanners.sort((a, b) => {
      const aJoined = a.state === "live-joined";
      const bJoined = b.state === "live-joined";
      if (aJoined !== bJoined) return aJoined ? -1 : 1;
      return bannerStartMs(a) - bannerStartMs(b);
    });
  }, [
    events,
    now,
    localMeetings,
    claimedCalendarMeetings,
    browserMeetings,
    liveMeetings,
    recordingState,
    recordingContext,
    pendingAddToLive,
    storedCalendarEvents,
    botJoined,
  ]);
}
