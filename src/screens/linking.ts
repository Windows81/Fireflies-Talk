import { Config, DAILY_BRIEF_APP_TITLE } from "@/constants";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import {
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
} from "@/utils/notifications";
import type { LinkingOptions, PathConfig } from "@react-navigation/native";
import * as Linking from "expo-linking";
import type * as Notifications from "expo-notifications";
import * as ShareTarget from "modules/share-target";
import { buildPushNotificationOpenedProps } from "./pushNotificationOpenedProps";
import type { ParamList } from "./types";

const prefix = Linking.createURL("/");

const DAILY_BRIEF_APP_PATH = encodeURIComponent(DAILY_BRIEF_APP_TITLE);
/** Pre-rename title, still carried by links already out in the wild. */
const LEGACY_DAILY_BRIEF_APP_PATH = encodeURIComponent("Daily Digest");

enum DeepLinkType {
  DAILY_BRIEF = "daily-brief",
  MEETING_PREP = "meeting-prep",
  MEETING_RECAP = "meeting-recap",
  MEETING_START_REMINDER = "meeting-start-reminder",
  LIVE_MEETING = "live-meeting",
  SOUNDBITE = "soundbite",
  NOTEBOOK = "notebook",
  SEARCH = "search",
  PLAYLIST = "playlist",
}

function getDeepLinkType(url: string): DeepLinkType | null {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.startsWith("/") ? url : `/${url}`;
  }

  if (path.includes(`/welcome/ai-skills/${DAILY_BRIEF_APP_PATH}:`))
    return DeepLinkType.DAILY_BRIEF;
  // Support old naming convention for daily brief for backwards compatibility
  if (path.includes(`/welcome/ai-skills/${LEGACY_DAILY_BRIEF_APP_PATH}:`))
    return DeepLinkType.DAILY_BRIEF;
  if (path.includes("/welcome/ai-skills/Meeting%20Prep:"))
    return DeepLinkType.MEETING_PREP;
  if (path.startsWith("/view/")) return DeepLinkType.MEETING_RECAP;
  if (path.includes("meeting-start-reminder"))
    return DeepLinkType.MEETING_START_REMINDER;
  if (path.startsWith("/live/")) return DeepLinkType.LIVE_MEETING;
  if (path.startsWith("/soundbites/")) return DeepLinkType.SOUNDBITE;
  if (path.startsWith("/notebook")) return DeepLinkType.NOTEBOOK;
  if (path.startsWith("/search")) return DeepLinkType.SEARCH;
  if (path.startsWith("/playlists/")) return DeepLinkType.PLAYLIST;
  return null;
}

const isMeetingStartReminder = (
  data: Record<string, any> | undefined,
): boolean =>
  typeof data?.url === "string" && data.url.includes("meeting-start-reminder");

const handlePushNotificationResponse = async (
  response: Notifications.NotificationResponse | null | undefined,
): Promise<string | undefined> => {
  if (!response) return undefined;

  const data = response.notification.request.content.data as
    | Record<string, any>
    | undefined;

  if (isMeetingStartReminder(data)) {
    tracker.track(TRACKING_EVENTS.MEETING_START_REMINDER_CTA_TAPPED, {
      cta: response.actionIdentifier,
      calId: data?.calId,
    });
  }

  return data?.url as string | undefined;
};

const onPushNotificationOpened = ({
  payload,
  fromBackground,
}: {
  payload: Record<string, any> | undefined;
  fromBackground: boolean;
}) => {
  if (!payload?.tId) return;

  const url = payload?.url as string | undefined;
  const deepLinkType = url ? getDeepLinkType(url) : null;

  tracker.track(
    TRACKING_EVENTS.PUSH_NOTIFICATION_OPENED,
    buildPushNotificationOpenedProps({ payload, fromBackground, deepLinkType }),
  );
};

export const linking: LinkingOptions<ParamList> =
  ShareTarget.withLinkingOptions({
    prefixes: [prefix, Config.MOBILE_APP_URL, Config.DASHBOARD_URL],
    config: {
      initialRouteName: "Main",
      screens: {
        Main: {
          initialRouteName: "Home",
          path: "",
          screens: {
            Home: "",
            Notebook: {
              path: "notebook/:channel?",
              parse: {
                channel: (channel: string) => {
                  if (!channel) return undefined;
                  // TODO: remove this once dashboard fixed %3A%3A format
                  channel = decodeURIComponent(channel);
                  if (channel.includes("::")) return channel.split("::")[1];
                  return channel;
                },
              },
            },
            Library: "library/:tab?",
            Analytics: "analytics",
          },
        } as PathConfig<ParamList>,
        MainDesktop: "MainDesktop",
        DictationPill: "dictation-pill",
        DictationActionOrbs: "dictation-action-orbs",
        Search: {
          path: "search",
          parse: {
            mine: (mine) => mine === "true" || mine === "1",
          },
        },
        You: "you",
        Record: {
          path: "record",
          parse: {
            title: (title: string) => decodeURIComponent(title),
          },
        },
        Notepad: {
          path: "view/:id",
          parse: {
            id: (id) => {
              if (id.includes("::")) return id.split("::")[1];
              return id;
            },
          },
        },
        Login: "login",
        Bite: {
          path: "soundbites/:id",
          parse: {
            index: (index) => parseInt(index),
          },
        },
        Playlist: "playlists/:id",
        Library: "playlists",
        Settings: "settings",
        MeetingStatus: "status",
        MeetingStarting: {
          path: "meeting-start-reminder",
          parse: {
            meetingTitle: (v: string) => decodeURIComponent(v),
            meetingUrl: (v: string) => decodeURIComponent(v),
          },
        },
        Upload: "upload",
        Downloads: "downloads",
        Integrations: "integrations",
        Extensions: "apps",
        TopicTracker: "topics",
        Team: "team",
        Refer: "refer",
        Onboarding: "setup",
        DesktopOnboarding: "desktop-setup",
        IntroVideo: "intro-video",
        Phone: "phone/:tab?",
        Live: "live/:id",
        Diagnostic: "diagnostic",
        DailyBrief: {
          // Old "Daily Digest" links must land here too. The alternation is
          // spelled out per title: React Navigation's path parser reads the
          // first `?` inside a param regex as the optional marker and
          // double-appends nested `)`, so `(?:a|b)` grouping breaks it.
          path: `welcome/ai-skills/:appId(${DAILY_BRIEF_APP_PATH}:[^/]+|${LEGACY_DAILY_BRIEF_APP_PATH}:[^/]+)`,
          parse: {
            appId: (raw: string) => raw.split(":")[1] ?? raw,
          },
        },
        MeetingPrep: {
          path: "welcome/ai-skills/:appId(Meeting%20Prep:[^/]+)",
          parse: {
            appId: (raw: string) => raw.split(":")[1] ?? raw,
          },
        },
        NotFound: "*",
      },
    },
    async getInitialURL() {
      // Check if app was cold started from a deep link
      const url = await Linking.getInitialURL();

      if (url != null) {
        return url;
      }

      // Check if there is an initial notification
      const message = await getLastNotificationResponseAsync();

      onPushNotificationOpened({
        payload: message?.notification.request.content.data,
        fromBackground: false,
      });

      return handlePushNotificationResponse(message);
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);

      // Listen to incoming links from deep linking
      const onReceiveUrlListener = Linking.addEventListener(
        "url",
        onReceiveURL,
      );

      // Listen to push notification actions(user tap) when the app is alive, background or foregound
      const pushActionSubscription = addNotificationResponseReceivedListener(
        (response) => {
          onPushNotificationOpened({
            payload: response?.notification.request.content.data,
            fromBackground: true,
          });

          handlePushNotificationResponse(response).then((url) => {
            if (url) listener(url as string);
          });
        },
      );

      return () => {
        onReceiveUrlListener.remove();
        pushActionSubscription.remove();
      };
    },
  });
