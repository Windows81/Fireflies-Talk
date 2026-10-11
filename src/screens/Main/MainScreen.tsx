import { usePaywallConfig } from "@/features/billing";
import { Breakpoint, useTheme, vars } from "@/styles";
import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import AnalyticsRouteConfig from "../Analytics";
import CalendarRouteConfig from "../Calendar";
import HomeRouteConfig from "../Home";
import NotebookRouteConfig from "../Notebook";
import { useIsNotificationBarsVisible } from "../components";
import type { ParamList } from "../types";
import { SIDEBAR_WIDTH, Sidebar } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import { useAuth } from "@/features/auth";
import { usePushNotificationRegistration } from "@/features/push-notifications";
import { MeetingStatusTabRouteConfig } from "../MeetingStatus";
import { RecordActionsContextProvider } from "@/features/live-record";
import { useRecorderMargin } from "@/utils/screen-type";
import { useRecorder } from "@/features/live-record";

const MainStack = createBottomTabNavigator<ParamList>();
const BottomTabNavigator = () => {
  const { hidePaidFeatures } = usePaywallConfig();

  const recordingState = useRecorder((state) => state.status.state);
  const streamingState = useRecorder((state) => state.status.streamingState);
  const streamingError = useRecorder((state) => state.status.streamingError);

  const recorderMargin = useRecorderMargin({
    applyToMainRoutes: true,
    recordingState,
    streamingState,
    streamingError,
  });

  const theme = useTheme();

  const showSidebar = theme.breakpoint >= Breakpoint.Medium;

  const tabBar = useCallback(
    (props: BottomTabBarProps) => (
      <RecordActionsContextProvider>
        {showSidebar ? <Sidebar {...props} /> : <TabBar {...props} />}
      </RecordActionsContextProvider>
    ),
    [showSidebar],
  );

  const containerStyle = useMemo(() => {
    if (showSidebar) {
      return styles.largeContainer;
    }
    return { marginBottom: recorderMargin };
  }, [showSidebar, recorderMargin]);

  const isNotificationBarVisible = useIsNotificationBarsVisible();
  const screenOptions: BottomTabNavigationOptions = useMemo(
    () => ({
      headerTitleStyle: vars.typography.title1Weight,
      headerShadowVisible: false,
      ...(isNotificationBarVisible && {
        headerStatusBarHeight: 0,
      }),
    }),
    [isNotificationBarVisible],
  );

  return (
    <MainStack.Navigator
      screenOptions={{ ...screenOptions, sceneStyle: containerStyle }}
      tabBar={tabBar}
    >
      <MainStack.Screen {...HomeRouteConfig} />
      <MainStack.Screen {...NotebookRouteConfig} />
      <MainStack.Screen {...CalendarRouteConfig} />
      {hidePaidFeatures ? (
        <MainStack.Screen {...MeetingStatusTabRouteConfig} />
      ) : (
        <MainStack.Screen {...AnalyticsRouteConfig} />
      )}
    </MainStack.Navigator>
  );
};

export const MainScreen = () => {
  const { user } = useAuth();
  usePushNotificationRegistration(user);

  return (
    <View style={styles.root}>
      <BottomTabNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  largeContainer: {
    paddingLeft: SIDEBAR_WIDTH,
  },
});
