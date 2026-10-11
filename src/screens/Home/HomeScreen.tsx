import type { TabsRef } from "@/components/Tabs";
import { Tabs } from "@/components/Tabs";
import { AnnouncementModals } from "@/features/announcements";
import {
  AskFredOHomePill,
  shouldExpandAskFredOHomePill,
} from "@/features/ask-fred-o";
import { useUpcomingCalendarEvents } from "@/features/calendar";
import { useLiveMeetings } from "@/features/live";
import { usePersonalAssistant } from "@/features/personal-assistant";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { isDesktop } from "@/utils/device";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ParamList } from "../types";
import {
  PaywallBanners,
  useShowPaywallBanners,
} from "./Banners/PaywallBanners";
import { UpdateBanner, useShowUpdateBanner } from "./Banners/UpdateBanner";
import {
  OfflineModeBanner,
  useShowOfflineBanner,
} from "./Banners/OfflineModeBanner";
import {
  MaintenanceBanner,
  useShowMaintenanceBanner,
} from "@/features/maintenance";
import { useIsNotificationBarsVisible } from "../components";
import { Feed } from "./Feed/Feed";
import { HomeScreenWalkthrough } from "./HomeScreenWalkthrough";
import { SideView } from "./Side/Side";
import { Tasks } from "./Tasks/Tasks";
import { SolidAddButton } from "./components/AddButton";
import { LeftEdgeSwipe } from "./components/LeftEdgeSwipe";
import { RecapBanner } from "@/features/yearly-recap";
import { PersonalAssistantSection } from "./PersonalAssistant/PersonalAssistantSection";

const LANDSCAPE_HEADER_HEIGHT = 64;
const IOS_PORTRAIT_HEADER_HEIGHT = 110;
const ANDROID_PORTRAIT_HEADER_CONTENT_HEIGHT = 51;

enum TabNames {
  Feed = "feed",
  Tasks = "tasks",
}

export const HomeScreen: FC<NativeStackScreenProps<ParamList, "Home">> = () => {
  const theme = useTheme();
  const isLargeScreen = theme.breakpoint === Breakpoint.Large;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isNotificationBarVisible = useIsNotificationBarsVisible();

  useLayoutEffect(() => {
    const landscapeContainerStyle = isLandscape
      ? { paddingHorizontal: 0 }
      : undefined;

    // When the notification bar is visible above the header, react-navigation
    // sets `headerStatusBarHeight: 0` (no status bar inset reserved inside the
    // header). The header height must shrink by `insets.top` to keep the
    // content area constant — otherwise the header appears stretched.
    const statusBarReserved = isNotificationBarVisible ? 0 : insets.top;

    const portraitHeight =
      Platform.OS === "android"
        ? statusBarReserved + ANDROID_PORTRAIT_HEADER_CONTENT_HEIGHT
        : IOS_PORTRAIT_HEADER_HEIGHT - (insets.top - statusBarReserved);

    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.colors.layerMuted,
        height: isLandscape ? LANDSCAPE_HEADER_HEIGHT : portraitHeight,
      },
      headerLeftContainerStyle: landscapeContainerStyle,
      headerRightContainerStyle: { paddingHorizontal: 0 },
    });
  }, [
    isLandscape,
    navigation,
    insets.top,
    theme.colors.layerMuted,
    isNotificationBarVisible,
  ]);

  const shouldShowPaywallBanner = useShowPaywallBanners();
  const shouldShowUpdateBanner = useShowUpdateBanner();
  const shouldShowMaintenanceBanner = useShowMaintenanceBanner();

  const { shouldShowSection: showPersonalAssistant } = usePersonalAssistant();
  const showOfflineBanner = useShowOfflineBanner();

  const ListHeaderComponent = useMemo(
    () => (
      <>
        {shouldShowMaintenanceBanner && <MaintenanceBanner />}
        {shouldShowUpdateBanner && <UpdateBanner />}
        {shouldShowPaywallBanner && <PaywallBanners />}
        {showOfflineBanner ? (
          <OfflineModeBanner />
        ) : (
          showPersonalAssistant && <PersonalAssistantSection />
        )}
      </>
    ),
    [
      shouldShowMaintenanceBanner,
      shouldShowPaywallBanner,
      shouldShowUpdateBanner,
      showPersonalAssistant,
      showOfflineBanner,
    ],
  );

  const [isAskFredOPillExpanded, setIsAskFredOPillExpanded] = useState(true);

  const cardStyle = styles.card(theme);

  // Desktop (Breakpoint.Large) path — preserved for Electron
  if (isLargeScreen) {
    return (
      <LargeScreenHome
        cardStyle={cardStyle}
        ListHeaderComponent={ListHeaderComponent}
      />
    );
  }

  // Mobile + Web path — single feed view, no tabs
  const mainContent = (
    <View style={styles.main}>
      <View style={[cardStyle]}>
        <RecapBanner screen="Home" />
        <Feed
          ListHeaderComponent={ListHeaderComponent}
          onScroll={(e) => {
            const isNearTop = shouldExpandAskFredOHomePill(
              e.nativeEvent.contentOffset.y,
            );
            // Once collapsed, the pill stays collapsed even back at the top.
            setIsAskFredOPillExpanded((isExpanded) => isExpanded && isNearTop);
          }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Edge swipe is mobile-only: Electron desktop runs this code via the
          web compatibility layer and uses ProfileMenu instead. */}
      {Platform.OS !== "web" ? (
        <LeftEdgeSwipe>{mainContent}</LeftEdgeSwipe>
      ) : (
        mainContent
      )}
      <AskFredOHomePill isExpanded={isAskFredOPillExpanded} />
      <AnnouncementModals />
      <HomeScreenWalkthrough />
    </View>
  );
};

/** Desktop-only layout with tabs + side panel (calendar, settings) */
const LargeScreenHome: FC<{
  cardStyle: ReturnType<typeof styles.card>;
  ListHeaderComponent: React.ReactElement | undefined;
}> = ({ cardStyle, ListHeaderComponent }) => {
  const calendarEventProps = useUpcomingCalendarEvents();
  const { liveMeetings } = useLiveMeetings({ calendarEventProps });

  const tabsRef = useRef<TabsRef>(null);
  useEffect(() => {
    tabsRef.current?.setTab(Math.min(tabsRef.current?.index ?? 0, 1));
  }, []);

  const tabBarStyle = [styles.tabList, styles.tabListLarge];
  const mainStyle = [styles.main, styles.mainLarge];

  // Web hides the tab view because the "Tasks" tab duplicates the Personal
  // Assistant Tasks card. Electron keeps the tabbed layout.
  const mainContent = isDesktop ? (
    <Tabs.Root ref={tabsRef} tabBarStyle={tabBarStyle}>
      <Tabs.Panel name={TabNames.Feed} title="My Feed">
        <View style={cardStyle}>
          <RecapBanner screen="Home" />
          <Feed ListHeaderComponent={ListHeaderComponent} />
        </View>
      </Tabs.Panel>
      <Tabs.Panel name={TabNames.Tasks} title="Tasks">
        <View style={cardStyle}>
          <Tasks />
        </View>
      </Tabs.Panel>
    </Tabs.Root>
  ) : (
    <View style={cardStyle}>
      <RecapBanner screen="Home" />
      <Feed ListHeaderComponent={ListHeaderComponent} />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={mainStyle}>{mainContent}</View>
      <View style={styles.side}>
        <SideView
          {...calendarEventProps}
          liveMeetings={liveMeetings}
          ListHeaderComponent={<SolidAddButton />}
        />
      </View>
      <AnnouncementModals />
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    flex: 1,
  },
  main: {
    flex: 1,
  },
  mainLarge: {
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  tabList: {
    minHeight: 40,
  },
  tabListLarge: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  card: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    ...(theme.breakpoint !== Breakpoint.Large && {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    }),
    flex: 1,
  }),
  contentSmall: {
    paddingHorizontal: 4,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  side: {
    paddingTop: 24,
    paddingRight: 24,
  },
});
