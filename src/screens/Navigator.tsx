import { BottomSheet } from "@/components/BottomSheet";
import { PromptConfirmationDialog } from "@/components/Dialog";
import { RouteNames } from "@/constants";
import { setSentryContext, setSentryTag } from "@/errors";
import { useScreenTimeTracker } from "@/features/app-review";
import { AiPinExperience } from "@/features/ai-pin";
import { LoginPopup } from "@/features/auth";
import { useAutoDownloadRecent } from "@/features/downloads";
import { ForceUpdateScreen, useForceUpdate } from "@/features/force-update";
import { GlobalModals } from "@/features/global-modals";
import { LiveMeetingFloatingCard } from "@/features/live/components/LiveMeetingFloatingCard";
import { LiveRecordController } from "@/features/live-record/components/LiveRecordController";
import {
  useAutoUploadRecords,
  useCameraRecordingEnforcement,
  useRecorder,
  useReconcileAbandonedRecording,
  useRecordListeners,
} from "@/features/live-record";
import {
  useDesktopScreenOptions,
  useDesktopNavigation,
} from "@/features/navigation";
import { ShortcutRedirectComponent } from "@/features/os-shortcuts";
import { ShareTargetComponent } from "@/features/share-target";
import { useDesktopAppLifecycle } from "@/features/user-flags";
import { Logger } from "@/logger";
import {
  darkTheme,
  darkVibrantTheme,
  FontStyles,
  lightTheme,
  useTheme,
  vars,
} from "@/styles";
import { persistReferral, tracker } from "@/tracking";
import { isDesktop, isDictationPillWindow } from "@/utils/device";
import { useRecorderMargin } from "@/utils/screen-type";
import type { Theme } from "@react-navigation/native";
import { NavigationContainer } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { JsonMap } from "@segment/analytics-react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { AppState, Platform, View } from "react-native";
import BiteRouteConfig from "./Bite";
import DesktopOnboardingRouteConfig from "./DesktopOnboarding";
import DesktopNotepadRouteConfig from "./DesktopNotepad";
import DesktopSettingsRouteConfig from "./DesktopSettings";
import DiagnosticRouteConfig from "./Diagnostic";
import DownloadsRouteConfig from "./Downloads";
import ExtensionsRouteConfig from "./Extensions";
import IntegrationsRouteConfig from "./Integrations";
import LibraryRouteConfig from "./Library";
import LiveRouteConfig from "./Live";
import { LoginRouteConfig } from "./Login";
import MainRouteConfig from "./Main";
import MainDesktopRouteConfig from "./MainDesktop";
import { MeetingStatusRouteConfig } from "./MeetingStatus";
import MeetingStartingRouteConfig from "./MeetingStarting";
import DictationPillRouteConfig from "./DictationPill";
import { NotFoundRouteConfig } from "./NotFound";
import NotebookRouteConfig from "./Notebook";
import NotepadRouteConfig from "./Notepad";
import OnboardingRouteConfig, {
  IntroVideoRouteConfig,
  OnboardingRedirectComponent,
} from "./Onboarding";
import PlaylistRouteConfig from "./Playlist";
import RecordRouteConfig from "./Record";
import ReferRouteConfig from "./Refer";
import { navigationRef, useNavigationStateStore } from "./RootNavigation";
import SearchRouteConfig from "./Search";
import SettingsRouteConfig from "./Settings";
import TeamRouteConfig from "./Team";
import TopicTrackerRouteConfig from "./TopicTracker";
import UpgradeRouteConfig from "./Upgrade";
import {
  DailyBriefRouteConfig,
  MeetingPrepRouteConfig,
  TasksRouteConfig,
} from "./PersonalAssistant";
import UploadRouteConfig from "./Upload";
import YouRouteConfig from "./You";
import { NotificationBars, useIsNotificationBarsVisible } from "./components";
import { linking } from "./linking";
import type { ParamList, StackRouteConfig } from "./types";
import { WelcomeModal } from "@/screens/MainDesktop/WelcomeModal";
import { KeepEveryoneInTheLoopModal } from "@/screens/MainDesktop/KeepEveryoneInTheLoopModal";
import { SpeakerLabelsAnnouncementModal } from "@/screens/MainDesktop/SpeakerLabelsAnnouncementModal";
import { DesktopLoginPopup } from "@/features/auth/components/desktop/DesktopLoginPopup";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends ParamList {}
  }
}

const Stack = createNativeStackNavigator<ParamList>();

const navigationLightTheme: Theme = {
  dark: false,
  colors: {
    background: isDesktop ? "transparent" : lightTheme.colors.pageBackground,
    border: lightTheme.colors.borderStaticSubtle,
    card: lightTheme.colors.layerDefault,
    primary: lightTheme.colors.layerBrand,
    notification: lightTheme.colors.layerBrand,
    text: lightTheme.colors.textSecondary,
  },
  fonts: FontStyles,
};

const navigationDarkTheme: Theme = {
  dark: true,
  colors: {
    background: isDesktop ? "transparent" : darkTheme.colors.pageBackground,
    border: darkTheme.colors.borderStaticSubtle,
    card: darkTheme.colors.layerDefault,
    primary: darkTheme.colors.layerBrand,
    notification: darkTheme.colors.layerBrand,
    text: darkTheme.colors.textSecondary,
  },
  fonts: FontStyles,
};

// Create dark vibrant theme with dynamic background based on route.
// Live (per-panel glass) and the DictationPill (a transparent floating pill in
// its own frameless window) manage their own backgrounds and need the nav
// container transparent; every other desktop screen uses an opaque background
// for the full-window glass.
const createNavigationDarkVibrantTheme = (
  isTransparentBackgroundRoute: boolean,
): Theme => ({
  dark: true,
  colors: {
    background:
      isDesktop && isTransparentBackgroundRoute
        ? "transparent"
        : darkVibrantTheme.colors.layerStrong,
    border: darkVibrantTheme.colors.borderStaticSubtle,
    card: darkVibrantTheme.colors.layerDefault,
    primary: darkVibrantTheme.colors.layerBrand,
    notification: darkVibrantTheme.colors.layerBrand,
    text: darkVibrantTheme.colors.textSecondary,
  },
  fonts: FontStyles,
});

const screenOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerTitleStyle: vars.typography.title1Weight,
  headerBackButtonDisplayMode: "minimal",
};

const logger = new Logger("navigator");

const NAVIGATOR_ROOT_STYLE = { flex: 1 };
// Desktop pill window only. RN Web clips overflow-hidden descendants, which
// would crop the expanded hover rail that paints past the nav root.
const DICTATION_PILL_NAVIGATOR_ROOT_STYLE = {
  flex: 1,
  overflow: "visible" as const,
};

export const Navigator: FC = () => {
  const theme = useTheme();
  const showForceUpdate = useForceUpdate();
  useRecordListeners();
  useCameraRecordingEnforcement();
  useAutoUploadRecords();
  useReconcileAbandonedRecording();

  // If feature enabled, auto-download recent meetings
  useAutoDownloadRecent();

  useDesktopAppLifecycle();
  useDesktopNavigation();
  const { onNavigationStateChange } = useScreenTimeTracker();

  const routeParamsRef = useRef<JsonMap | undefined>(undefined);
  const routeNameRef = useRef<string | undefined>(undefined);

  // Initialize with expected initial route for proper glass setup
  const initialRouteName = isDictationPillWindow()
    ? RouteNames.DictationPill
    : isDesktop
      ? RouteNames.MainDesktop
      : RouteNames.Main;
  const [currentRouteName, setCurrentRouteName] =
    useState<string>(initialRouteName);

  const setCurrentRoute = useNavigationStateStore(
    (state) => state.setCurrentRoute,
  );

  const recordingState = useRecorder((state) => state.status.state);
  const streamingState = useRecorder((state) => state.status.streamingState);
  const streamingError = useRecorder((state) => state.status.streamingError);

  const recorderMargin = useRecorderMargin({
    applyToMainRoutes: false,
    recordingState,
    streamingState,
    streamingError,
  });

  // Routes that render their own background and must keep the nav container
  // transparent: Live (per-panel glass), MainDesktop (full-window glass host),
  // and the DictationPill (a floating pill in its own transparent window — an
  // opaque nav background would fill that window as a grey box around the pill).
  const isTransparentBackgroundRoute =
    currentRouteName === RouteNames.Live ||
    currentRouteName === RouteNames.MainDesktop ||
    currentRouteName === RouteNames.DictationPill;

  const onReady = useCallback(() => {
    const initialRoute = navigationRef.current?.getCurrentRoute();
    if (initialRoute) {
      setCurrentRoute(initialRoute.name, initialRoute.params);
      setCurrentRouteName(initialRoute.name);
      // Mobile-web has its own page tracking; native and desktop do not
      if (Platform.OS !== "web" || isDesktop) {
        tracker.screen(initialRoute.name);
      }
    }
    persistReferral(navigationRef);
  }, [setCurrentRoute]);

  const onStateChange = useCallback(() => {
    if (!navigationRef.current?.isReady()) return;
    const currentRoute = navigationRef.current?.getCurrentRoute();
    if (!currentRoute) return;
    if (
      routeNameRef.current !== currentRoute.name ||
      routeParamsRef.current !== currentRoute.params
    ) {
      routeParamsRef.current = currentRoute.params as JsonMap | undefined;
      routeNameRef.current = currentRoute.name;

      // Update current route name for glass visibility
      setCurrentRouteName(currentRoute.name);

      // Sync with the navigation state store for components outside navigation context
      setCurrentRoute(currentRoute.name, currentRoute.params);

      onNavigationStateChange(currentRoute.name);

      logger.info(`navigated to ${currentRoute.name}`, {
        type: "navigation",
        ...currentRoute.params,
      });

      setSentryContext("navigation", {
        route: currentRoute.name,
        params: currentRoute.params,
      });
      setSentryTag("route", currentRoute.name);

      // Mobile-web has its own page tracking; native and desktop do not
      if (Platform.OS !== "web" || isDesktop) {
        tracker.screen(currentRoute.name);
      }

      // When a meeting ends, the live view is reparented onto the main window
      // as a full-window post-meeting overlay. If something navigates the main
      // window underneath it (e.g. clicking a notification), the overlay would
      // hide the navigated content. Tell the main process to tear it down. The
      // main process ignores this unless the sender is the real main window and
      // an overlay is actually present, so it's a harmless no-op otherwise.
      if (isDesktop) {
        window.electron?.liveView?.notifyMainNavigated?.();
      }
    }
  }, [onNavigationStateChange, setCurrentRoute]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setSentryTag("appState", state);
      logger.info("app state changed", {
        state,
      });
    });
    return () => {
      sub.remove();
    };
  }, []);

  const isNotificationBarVisible = useIsNotificationBarsVisible();
  const baseScreenOptions = useMemo<NativeStackNavigationOptions>(
    () => ({
      ...screenOptions,
      // Paint every scene with a solid page background. Without it, screens with
      // no explicit background (e.g. You) are transparent and the white window
      // shows through during custom transitions (slide_from_left), causing a
      // white flash in dark mode. Desktop keeps a transparent scene for glass.
      ...(!isDesktop && {
        contentStyle: { backgroundColor: theme.colors.pageBackground },
      }),
      // When the top notification bar is visible it covers the status bar,
      // so stack headers must drop their own status bar inset to avoid
      // appearing stretched below the bar.
      ...(isNotificationBarVisible && {
        headerStatusBarHeight: 0,
        // Android: `headerStatusBarHeight: 0` isn't fully honored by
        // react-native-screens' native Toolbar, which still positions the
        // header below the system status bar inset. Force the Material
        // toolbar height (56dp) so no gap remains under the banner.
        ...(Platform.OS === "android" && {
          headerStyle: {
            height: 56,
          } as NativeStackNavigationOptions["headerStyle"],
        }),
      }),
    }),
    [isNotificationBarVisible, theme.colors.pageBackground],
  );
  const screenOptionsWithMargin = useDesktopScreenOptions({
    baseOptions: baseScreenOptions,
    recorderMargin,
  });

  if (showForceUpdate) return <ForceUpdateScreen />;

  return (
    <View
      style={[
        isDictationPillWindow()
          ? DICTATION_PILL_NAVIGATOR_ROOT_STYLE
          : NAVIGATOR_ROOT_STYLE,
        !isDesktop && { backgroundColor: theme.colors.pageBackground },
      ]}
    >
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        theme={
          theme.name === "light"
            ? navigationLightTheme
            : theme.name === "dark-vibrant"
              ? createNavigationDarkVibrantTheme(isTransparentBackgroundRoute)
              : navigationDarkTheme
        }
        onReady={onReady}
        onStateChange={onStateChange}
      >
        {/* Inside the container so sheets nested in sheet content keep navigation context. */}
        <BottomSheet.ModalProvider>
          {!isDesktop && <NotificationBars />}
          <Stack.Navigator
            screenOptions={screenOptionsWithMargin}
            initialRouteName={initialRouteName}
          >
            {!isDesktop && <Stack.Screen {...MainRouteConfig} />}
            <Stack.Screen {...RecordRouteConfig} />
            <Stack.Screen {...NotepadRouteConfig} />
            <Stack.Screen {...BiteRouteConfig} />
            <Stack.Screen {...PlaylistRouteConfig} />
            <Stack.Screen {...LibraryRouteConfig} />
            <Stack.Screen {...SettingsRouteConfig} />
            <Stack.Screen {...MeetingStatusRouteConfig} />
            <Stack.Screen {...MeetingStartingRouteConfig} />
            <Stack.Screen {...DictationPillRouteConfig} />
            <Stack.Screen {...UploadRouteConfig} />
            <Stack.Screen {...DownloadsRouteConfig} />
            <Stack.Screen {...IntegrationsRouteConfig} />
            <Stack.Screen {...ExtensionsRouteConfig} />
            <Stack.Screen {...TopicTrackerRouteConfig} />
            <Stack.Screen {...TeamRouteConfig} />
            <Stack.Screen {...YouRouteConfig} />
            <Stack.Screen {...SearchRouteConfig} />
            <Stack.Screen {...ReferRouteConfig} />
            <Stack.Screen {...LoginRouteConfig} />
            <Stack.Screen {...IntroVideoRouteConfig} />
            <Stack.Screen {...OnboardingRouteConfig} />
            <Stack.Screen {...NotFoundRouteConfig} />
            {/* <Stack.Screen {...PhoneCallRouteConfig} /> */}
            <Stack.Screen {...LiveRouteConfig} />
            <Stack.Screen {...DiagnosticRouteConfig} />
            <Stack.Screen {...DailyBriefRouteConfig} />
            <Stack.Screen {...MeetingPrepRouteConfig} />
            <Stack.Screen {...TasksRouteConfig} />
            <Stack.Screen {...UpgradeRouteConfig} />
            {isDesktop && !isDictationPillWindow() && (
              <Stack.Screen {...MainDesktopRouteConfig} />
            )}
            {isDesktop && <Stack.Screen {...DesktopOnboardingRouteConfig} />}
            {isDesktop && <Stack.Screen {...DesktopSettingsRouteConfig} />}
            {isDesktop && <Stack.Screen {...DesktopNotepadRouteConfig} />}
            {isDesktop && (
              <Stack.Screen
                {...(NotebookRouteConfig as StackRouteConfig<"Notebook">)}
              />
            )}
          </Stack.Navigator>
          {!isDesktop && <LiveRecordController />}
          {!isDictationPillWindow() && (
            <>
              <ShareTargetComponent />
              <OnboardingRedirectComponent />
              <ShortcutRedirectComponent />
              {!isDesktop && <LiveMeetingFloatingCard />}
              {isDesktop ? (
                <DesktopLoginPopup navigationRef={navigationRef} />
              ) : (
                <LoginPopup navigationRef={navigationRef} />
              )}
              <PromptConfirmationDialog />
              <GlobalModals />
              <WelcomeModal />
              <KeepEveryoneInTheLoopModal />
              <SpeakerLabelsAnnouncementModal />
              <AiPinExperience />
            </>
          )}
        </BottomSheet.ModalProvider>
      </NavigationContainer>
    </View>
  );
};
