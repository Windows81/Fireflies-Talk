import { useMemo } from "react";
import {
  LIVE_RECORDER_HEIGHT,
  NAVBAR_HEIGHT,
  RouteNames,
  useBottomInset,
} from "@/constants";
import { useCurrentRouteName } from "@/screens/RootNavigation";
import { Breakpoint, useTheme } from "@/styles";

type RouteNamesType = (typeof RouteNames)[keyof typeof RouteNames];

const MAIN_ROUTES: RouteNamesType[] = [
  RouteNames.Home,
  RouteNames.MainDesktop,
  RouteNames.Notebook,
  RouteNames.Calendar,
  RouteNames.Library,
  RouteNames.Analytics,
  RouteNames.Phone,
  RouteNames.Main,
];

/**
 * Hook to determine the screen type based on current route and specified active route
 * useful for calculating custom bottom insets for floating cards or hide them entirely
 * @param activeRoute The route name that should be considered "active"
 * @returns Screen type: "active" | "main" | "other"
 */
export const useScreenType = (activeRoute: RouteNamesType) => {
  const currentRouteName = useCurrentRouteName();

  const screenType = useMemo<"active" | "main" | "other">(() => {
    if (!currentRouteName) return "main";

    if (currentRouteName === activeRoute) {
      return "active";
    } else if (MAIN_ROUTES.includes(currentRouteName as RouteNamesType)) {
      return "main";
    } else {
      return "other";
    }
  }, [currentRouteName, activeRoute]);

  return screenType;
};

/**
 * Bottom offset a floating overlay should use to sit flush above the current
 * screen's bottom chrome: the safe-area inset, plus the tab bar on the routes
 * that render one.
 */
export const useOverlayBottomInset = () => {
  const theme = useTheme();
  const bottomInset = useBottomInset();
  const currentRouteName = useCurrentRouteName();

  // Before the navigator reports a route, assume a main screen — those are the
  // app's entry points, so the tab bar is the right guess for the first frame.
  const hasTabBar =
    theme.breakpoint === Breakpoint.Small &&
    (!currentRouteName ||
      MAIN_ROUTES.includes(currentRouteName as RouteNamesType));

  return bottomInset + (hasTabBar ? NAVBAR_HEIGHT : 0);
};

/**
 * hook for calculating recorder bottom-margin for Navigator and MainScreen
 * @param options Configuration object
 * @param options.currentRoute Current route name (required)
 * @param options.applyToMainRoutes If true, returns margin for main routes; if false, for non-main routes
 * @param options.activeRoute For main screen usage, specify which route should be considered "active"
 * @returns Margin value for the recorder
 */
export const useRecorderMargin = (options: {
  applyToMainRoutes: boolean;
  recordingState: string;
  streamingState: string;
  streamingError: string | null;
}) => {
  const { applyToMainRoutes, recordingState, streamingState, streamingError } =
    options;
  const currentRoute = useCurrentRouteName();

  const screenType = useMemo<"active" | "main" | "other">(() => {
    if (currentRoute === RouteNames.Record) {
      return "active";
    } else if (MAIN_ROUTES.includes(currentRoute as RouteNamesType)) {
      return "main";
    } else {
      return "other";
    }
  }, [currentRoute]);

  return useMemo(() => {
    const isRecordFloatingCardVisible =
      recordingState !== "inactive" ||
      streamingState !== "inactive" ||
      !!streamingError;

    if (applyToMainRoutes) {
      return screenType === "main" && isRecordFloatingCardVisible
        ? LIVE_RECORDER_HEIGHT
        : 0;
    } else {
      return screenType === "other" && isRecordFloatingCardVisible
        ? LIVE_RECORDER_HEIGHT
        : 0;
    }
  }, [
    recordingState,
    streamingState,
    streamingError,
    applyToMainRoutes,
    screenType,
  ]);
};
