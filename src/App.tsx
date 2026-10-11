import { PortalProvider } from "@gorhom/portal";
import { StatusBar } from "expo-status-bar";
import type { FC } from "react";
import { memo } from "react";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./App.css";
import { Toaster } from "./components/Toast";
import { wrapSentry } from "./errors/sentry";
import { useConsentEffect } from "./features/consent";
import { useSpeakerSourceConfigSync } from "./features/speaker-source";
import { FredProvider, polyfillTextDecoderStream } from "./features/ask-fred";
import { initEmailAssistantNudge } from "./features/dictation-email-assistant-nudge";
import { initSlackAssistantNudge } from "./features/dictation-slack-assistant-nudge";
import { FeatureFlagProvider } from "./features/feature-flags";
import { useDictationPillVisibility } from "./hooks/useDictationPillVisibility";
import { useDictationTalkPolicyRefresh } from "./hooks/useDictationTalkPolicyRefresh";
import { initStreamingTokenProvider } from "./features/live-record";
import { initMeetingTitleSync } from "./features/meeting";
import { GraphQLProvider } from "./graphql";
import { configureLogger } from "./logger";
import { Navigator } from "./screens/Navigator";
import { DictationAccessibilityOverlay } from "./screens/DictationPill/DictationAccessibilityOverlay";
import { DictationActionOrbsOverlay } from "./screens/DictationPill/DictationActionOrbsOverlay";
import { DictationEmailAssistantOverlay } from "./screens/DictationPill/DictationEmailAssistantOverlay";
import { DictationSlackAssistantOverlay } from "./screens/DictationPill/DictationSlackAssistantOverlay";
import { DictationFeedbackOverlay } from "./screens/DictationPill/DictationFeedbackOverlay";
import { DictationTalkTeaserOverlay } from "./screens/DictationPill/DictationTalkTeaserOverlay";
import { useTalkPillTeaser } from "./screens/MainDesktop/DictationOnboarding/useTalkPillTeaser";
import { useTalkFeedbackPopover } from "./screens/MainDesktop/hooks/useTalkFeedbackPopover";
import { ThemeProvider, useTheme } from "./styles";
import {
  isAccessibilityPromptWindow,
  isActionOrbsWindow,
  isDictationEmailAssistantWindow,
  isDictationSlackAssistantWindow,
  isDictationFeedbackWindow,
  isDictationPillWindow,
  isMainDesktopWindow,
  isTalkPillTeaserWindow,
} from "./utils/device";
import { setupNotifications } from "./utils/notifications";
import { setupProxyFetch } from "./utils/proxy-fetch";

if (__DEV__) {
  require("@expo/metro-runtime");
}

configureLogger();
setupNotifications();
polyfillTextDecoderStream();
setupProxyFetch();
// Every desktop window listens for renames made in the other windows.
initMeetingTitleSync();
// The main process asks this renderer for a streaming access token per attempt.
initStreamingTokenProvider();
initEmailAssistantNudge();
initSlackAssistantNudge();

const ConsentEffect: FC = () => {
  useConsentEffect();
  return null;
};

const DictationPillVisibilityEffect: FC = () => {
  useDictationPillVisibility();
  useDictationTalkPolicyRefresh();
  return null;
};

const TalkPillTeaserEffect: FC = () => {
  useTalkPillTeaser();
  return null;
};

const TalkFeedbackPopoverEffect: FC = () => {
  useTalkFeedbackPopover();
  return null;
};

const MeetSpeakerConfigEffect: FC = () => {
  useSpeakerSourceConfigSync();
  return null;
};

const Main = gestureHandlerRootHOC(
  memo(
    function Main() {
      const theme = useTheme();

      return (
        <>
          <StatusBar
            translucent={false}
            backgroundColor={theme.colors.pageBackground}
            style={theme.name === "light" ? "dark" : "light"}
          />
          <KeyboardProvider>
            <SafeAreaProvider>
              <PortalProvider>
                <Navigator />
                {!isDictationPillWindow() && <Toaster />}
              </PortalProvider>
            </SafeAreaProvider>
          </KeyboardProvider>
        </>
      );
    },
    () => true,
  ),
);

const BaseApp: FC = () => {
  // Own BrowserWindow above the grabber. Skip GraphQL/Navigator so this
  // overlay cannot boot MainDesktop (blank) the way an unknown route did.
  if (isAccessibilityPromptWindow()) {
    return (
      <ThemeProvider>
        <DictationAccessibilityOverlay />
      </ThemeProvider>
    );
  }

  // Same reasoning as the prompt above: its own window, so it skips Navigator
  // and the GraphQL bootstrap rather than booting a blank MainDesktop.
  if (isActionOrbsWindow()) {
    return (
      <ThemeProvider>
        <DictationActionOrbsOverlay />
      </ThemeProvider>
    );
  }

  if (isTalkPillTeaserWindow()) {
    return (
      <ThemeProvider>
        <DictationTalkTeaserOverlay />
      </ThemeProvider>
    );
  }

  // Same as the teaser: its own always-on-top window beside the pill, so it
  // skips the Navigator and the GraphQL bootstrap.
  if (isDictationFeedbackWindow()) {
    return (
      <ThemeProvider>
        <DictationFeedbackOverlay />
      </ThemeProvider>
    );
  }

  if (isDictationEmailAssistantWindow()) {
    return (
      <ThemeProvider>
        <DictationEmailAssistantOverlay />
      </ThemeProvider>
    );
  }

  if (isDictationSlackAssistantWindow()) {
    return (
      <ThemeProvider>
        <DictationSlackAssistantOverlay />
      </ThemeProvider>
    );
  }

  return (
    <GraphQLProvider>
      <FeatureFlagProvider>
        <ConsentEffect />
        <DictationPillVisibilityEffect />
        <TalkPillTeaserEffect />
        <TalkFeedbackPopoverEffect />
        {isMainDesktopWindow() && <MeetSpeakerConfigEffect />}
        <FredProvider>
          <ThemeProvider>
            <Main />
          </ThemeProvider>
        </FredProvider>
      </FeatureFlagProvider>
    </GraphQLProvider>
  );
};

export const App = wrapSentry(BaseApp);
