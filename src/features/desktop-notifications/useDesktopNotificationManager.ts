import { useEffect, useState } from "react";
import type { CalendarEvents, MeetingStatusData } from "@/graphql";
import {
  useCreateMeetingInMediaStorageWithUrlMutation,
  useToggleUpcomingEventMutation,
} from "@/graphql";
import { useMeetingPrepNotification } from "./hooks/useMeetingPrepNotification";
import { useCalendarEventNotification } from "./hooks/useCalendarEventNotification";
import { RootNavigation } from "@/screens/RootNavigation";
import { toast } from "@/components/Toast";
import { Config, RouteNames } from "@/constants";
import { openURL } from "@/features/navigation/utils";
import { format } from "date-fns";
import { liveMeetingsApi, openLiveDestination } from "@/features/live";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { DesktopNotificationType } from "./utils";
import {
  claimCalendarMeetingFromNotificationAction,
  meetingDetectionApi,
} from "@/features/desktop-meeting-detection";
import { useLocalSettings } from "@/features/settings";

const NOTIFICATION_NAVIGATION_DEDUP_MS = 1000;
let recentNotificationNavigation: { path: string; timestamp: number } | null =
  null;

/**
 * Determine notification type from action URL pattern
 */
function getNotificationTypeFromUrl(path: string): DesktopNotificationType {
  if (
    path.startsWith("/start-recording") &&
    path.includes("trigger=calendar_event")
  ) {
    return "calendar_event";
  }
  if (path.startsWith("/add-to-meeting")) {
    return "add_to_live";
  }
  if (path.startsWith("/meeting-prep")) {
    return "meeting_prep";
  }
  if (path.startsWith("/live/")) {
    return "live_assist";
  }
  if (path.startsWith("/start-recording")) {
    return "system_audio";
  }
  if (path.startsWith("/skip-auto-join")) {
    return "auto_join_skip";
  }
  if (path.startsWith("/welcome/ai-skills/")) {
    return "daily_brief";
  }
  if (path.startsWith("/calendar-event-action")) {
    return "calendar_event";
  }
  // Default fallback
  return "add_to_live";
}

function shouldFocusMainWindow(
  path: string,
  pathname: string,
  url: URL,
): boolean {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return false;
  }
  if (pathname.startsWith("/live/")) {
    return false;
  }
  if (pathname.startsWith("/welcome/")) {
    return false;
  }
  if (pathname.startsWith("/skip-auto-join")) {
    return false;
  }
  if (pathname.startsWith("/start-recording")) {
    return false;
  }
  if (pathname.startsWith("/calendar-event-action")) {
    return false;
  }
  if (pathname.startsWith("/add-to-meeting")) {
    const meetingUrl = url.searchParams.get("url") || "";
    return meetingUrl.trim() === "";
  }
  return true;
}

function focusMainWindowForNotification(
  path: string,
  pathname: string,
  url: URL,
): void {
  if (!shouldFocusMainWindow(path, pathname, url)) {
    return;
  }
  if (!window.electron?.window.showMain) {
    return;
  }
  void window.electron.window.showMain().catch((error: Error) => {
    console.error(
      "[DesktopNotificationManager] Failed to show main window:",
      error,
    );
  });
}

function openExternalFromNotification(url: string): void {
  if (window.electron) {
    window.open(url, "_blank", "noopener");
    return;
  }
  openURL(url, { newTab: true });
}

export interface CalendarEventPropsLike {
  events?: CalendarEvents[];
  isLoadingEvents?: boolean;
  liveMeetings?: MeetingStatusData[];
  refetch?: () => void;
  error?: Error;
}

export interface DesktopNotificationManagerReturn {
  selectedEventIdForPrep: string | null;
  setSelectedEventIdForPrep: (id: string | null) => void;
  isBrowserMeetingModalOpen: boolean;
  openBrowserMeetingModal: () => void;
  closeBrowserMeetingModal: () => void;
  selectedMeetingUrl: string;
  setSelectedMeetingUrl: (url: string) => void;
  pendingInviteActionUrl: string | null;
  setPendingInviteActionUrl: (url: string | null) => void;
}

export function useDesktopNotificationManager(
  calendarEventProps: CalendarEventPropsLike,
): DesktopNotificationManagerReturn {
  const [isBrowserMeetingModalOpen, setIsBrowserMeetingModalOpen] =
    useState(false);
  const [selectedMeetingUrl, setSelectedMeetingUrl] = useState<string>("");
  const [pendingInviteActionUrl, setPendingInviteActionUrl] = useState<
    string | null
  >(null);
  const [selectedEventIdForPrep, setSelectedEventIdForPrep] = useState<
    string | null
  >(null);
  const [createMeeting] = useCreateMeetingInMediaStorageWithUrlMutation();
  const [toggleUpcomingEvent] = useToggleUpcomingEventMutation({
    errorPolicy: "none",
  });
  const setAutoStartNotes = useLocalSettings((s) => s.setAutoStartNotes);

  // Meeting prep scheduling
  useMeetingPrepNotification(calendarEventProps.events);
  useCalendarEventNotification(calendarEventProps.events);

  // Navigate actions from notifications (internal routes) - SINGLE POINT for all notification actions
  useEffect(() => {
    const inviteBotWithMeetingUrl = (
      meetingUrl: string,
      actionUrlForState: string,
    ) => {
      createMeeting({
        variables: {
          url: meetingUrl,
          title: format(new Date(), "MMM dd, hh:mm aa"),
        },
      })
        .then((response) => {
          if (response.data?.createMeetingInMediaStorageWithURL?.meeting) {
            liveMeetingsApi.refetch();
            meetingDetectionApi.markLocalMeetingInvited(actionUrlForState);

            // Show "bot invited" notification only after successful invite
            window.electron?.notification?.show?.(
              "Fireflies notetaker invited",
              "The notetaker will join the meeting in few secs.",
              "",
              "",
              {
                showProgress: false,
                showCloseAlways: true,
                timeout: 3000,
              },
            );

            // Track explicitly invited meeting ID so we auto-open live pane on SSE event
            const meetingId = (
              response.data.createMeetingInMediaStorageWithURL.meeting as {
                meeting?: string;
              }
            )?.meeting;
            if (meetingId) {
              meetingDetectionApi.addExplicitlyInvitedMeetingId(meetingId);
            }
          }
        })
        .catch((error: Error) => {
          console.error(
            "[DesktopNotificationManager] Failed to invite Fireflies:",
            error,
          );
          toast("Failed to invite Fireflies to the meeting.");
        });
    };

    const unsubscribe = window.electron?.notifications?.onNavigate?.(
      (path: string) => {
        const now = Date.now();
        if (
          recentNotificationNavigation?.path === path &&
          now - recentNotificationNavigation.timestamp <
            NOTIFICATION_NAVIGATION_DEDUP_MS
        ) {
          return;
        }
        recentNotificationNavigation = { path, timestamp: now };

        const url = new URL(path, "https://local");
        const pathname = url.pathname;

        // Track notification click
        const notificationType = getNotificationTypeFromUrl(path);
        tracker.track(TRACKING_EVENTS.DESKTOP_NOTIFICATION_CLICKED, {
          notificationType,
        });

        focusMainWindowForNotification(path, pathname, url);

        if (pathname.startsWith("/calendar-event-action")) {
          const meetingUrl = (url.searchParams.get("url") || "").trim();
          const mode = url.searchParams.get("mode");
          if (!meetingUrl) {
            return;
          }

          const normalizedMeetingUrl = meetingUrl.startsWith("http")
            ? meetingUrl
            : `https://${meetingUrl}`;

          claimCalendarMeetingFromNotificationAction(url, normalizedMeetingUrl);
          openExternalFromNotification(normalizedMeetingUrl);

          if (mode === "join_invite") {
            inviteBotWithMeetingUrl(normalizedMeetingUrl, path);
          }
          return;
        }

        // Absolute URLs — open externally and skip in-app routing
        if (path.startsWith("http://") || path.startsWith("https://")) {
          openExternalFromNotification(path);
          return;
        }

        // Dashboard routes — open in external browser with full URL
        if (pathname.startsWith("/welcome/")) {
          const dashboardUrl = `${Config.DASHBOARD_URL.replace(/\/+$/, "")}${pathname}`;
          openExternalFromNotification(dashboardUrl);
          return;
        }

        // /add-to-meeting: handle meeting invitations
        if (pathname.startsWith("/add-to-meeting")) {
          const meetingUrl = url.searchParams.get("url") || "";

          // Case 1: Browser-detected meeting with URL -> directly invite bot
          if (meetingUrl && meetingUrl.trim() !== "") {
            let fixedUrl = meetingUrl.trim();
            if (!fixedUrl.startsWith("http")) {
              fixedUrl = `https://${fixedUrl}`;
            }
            inviteBotWithMeetingUrl(fixedUrl, path);
          } else {
            // Case 2: Audio-detected meeting without URL.
            // Try a live browser scan to resolve the URL without user input.
            // If the scan finds nothing (or fails), fall back to the manual entry modal.
            const openManualModal = () => {
              setSelectedMeetingUrl("");
              setPendingInviteActionUrl(path);
              setIsBrowserMeetingModalOpen(true);
              RootNavigation.navigate(RouteNames.MainDesktop);
            };
            window.electron?.browserMeetings
              .scan()
              .then((data) => {
                const browserUrl = data?.matchedUrls?.[0];
                if (browserUrl) {
                  inviteBotWithMeetingUrl(browserUrl, path);
                } else {
                  openManualModal();
                }
              })
              .catch(openManualModal);
          }
          return;
        }

        // skip-auto-join: toggle fred off for the meeting
        if (pathname.startsWith("/skip-auto-join")) {
          const eventId = url.searchParams.get("eventId");
          const iCalUID = url.searchParams.get("iCalUID") || undefined;
          const calendarType =
            url.searchParams.get("calendarType") || undefined;
          if (eventId) {
            toggleUpcomingEvent({
              variables: {
                meetingId: eventId,
                fredAdded: false,
                iCalUID,
                scheduleType: "desktop",
                calendarType,
              },
            }).catch((error: Error) => {
              console.error(
                "[DesktopNotificationManager] Failed to skip auto-join:",
                error,
              );
            });
          }
          return;
        }

        // meeting-prep: open meeting prep by eventId (custom action key)
        if (pathname.startsWith("/meeting-prep")) {
          const eventId = url.searchParams.get("eventId");
          if (eventId) {
            setSelectedEventIdForPrep(eventId);
            // Ensure we are on the main desktop route
            RootNavigation.navigate(RouteNames.MainDesktop);
          }
          return;
        }

        // Live route: forward to RN router
        if (pathname.startsWith("/live/")) {
          const meetingId = pathname.split("/")[2];
          if (!meetingId) {
            return;
          }
          const liveUrl = `${pathname}${url.search}${url.hash}`;
          openLiveDestination(liveUrl);
          return;
        }

        // Enable auto-start notes from upsell notification
        if (pathname.startsWith("/enable-auto-start-notes")) {
          setAutoStartNotes(true);
          tracker.track(TRACKING_EVENTS.DESKTOP_AUTO_START_NOTES_TOGGLED, {
            enabled: true,
            source: "notification",
          });
          return;
        }

        // Fallback: try to route by first segment name
        const first = pathname.split("/")[1];
        if (first) {
          RootNavigation.navigate(first);
        }
      },
    );
    return () => {
      unsubscribe?.();
    };
  }, [createMeeting, toggleUpcomingEvent, setAutoStartNotes]);

  // Track notification dismissals
  useEffect(() => {
    const unsubscribe = window.electron?.notifications?.onDismissed?.(
      (actionUrl: string) => {
        const notificationType = getNotificationTypeFromUrl(actionUrl);
        tracker.track(TRACKING_EVENTS.DESKTOP_NOTIFICATION_DISMISSED, {
          notificationType,
        });
        meetingDetectionApi.markLocalMeetingDismissed(actionUrl);
      },
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  return {
    selectedEventIdForPrep,
    setSelectedEventIdForPrep,
    isBrowserMeetingModalOpen,
    openBrowserMeetingModal: () => setIsBrowserMeetingModalOpen(true),
    closeBrowserMeetingModal: () => {
      setIsBrowserMeetingModalOpen(false);
      setPendingInviteActionUrl(null);
    },
    selectedMeetingUrl,
    setSelectedMeetingUrl,
    pendingInviteActionUrl,
    setPendingInviteActionUrl,
  };
}
