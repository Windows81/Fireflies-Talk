import {
  IconFeed,
  IconInfo,
  IconListCheck,
  IconMeetingPrep,
  IconPaTrialClock,
  IconPaTrialClockAlert,
  IconPaTrialLoader,
  IconPaTrialSparkle,
  IconSettings,
} from "@/assets/svg";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useUpcomingCalendarEvents } from "@/features/calendar";
import { usePersonalAssistant } from "@/features/personal-assistant";
import { BriefCardAudioButton } from "@/screens/PersonalAssistant/DailyBrief/components/BriefCardAudioButton";
import { useListMeetingPreps } from "@/hooks/useListMeetingPreps";
import { GLOBAL } from "@/styles/color";
import { createStyles, useTheme, type Theme } from "@/styles";
import { useNavigation } from "@react-navigation/native";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { memo, useCallback, useMemo, useState, type FC } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { PersonalAssistantCard } from "./PersonalAssistantCard";
import { PersonalAssistantCardSkeleton } from "./PersonalAssistantCardSkeleton";
import { PersonalAssistantInfoTooltip } from "./PersonalAssistantInfoTooltip";
import { PersonalAssistantTrialView } from "./PersonalAssistantTrialView";
import { PersonalAssistantCreditsPaywallBanner } from "./PersonalAssistantCreditsPaywallBanner";
import { Switch } from "@/components/Switch";
import type { PersonalAssistantTrialStage } from "@/features/personal-assistant";
import {
  PersonalAssistantSettingsSheet,
  type PersonalAssistantAppId,
} from "./PersonalAssistantSettingsSheet";
import { pluralize } from "@/utils/pluralize";
import { TRACKING_EVENTS, tracker } from "@/tracking";

const CARD_LAYOUT_TRANSITION = LinearTransition.duration(250);

// Returns the next event's Date, or null if none
function getNextMeetingDate(
  events: { date?: string | null }[] | undefined,
): Date | null {
  if (!events?.length || !events[0].date) return null;
  return new Date(events[0].date);
}

// Format time until a future date as a compact label (e.g. "2HR", "30M", "LIVE")
function formatTimeUntil(target: Date): string {
  const now = new Date();
  const hours = differenceInHours(target, now);
  if (hours <= 0) {
    const minutes = differenceInMinutes(target, now);
    if (minutes <= 0) return "LIVE";
    return `${minutes}M`;
  }
  return `${hours}HR`;
}

type TrialBannerConfig = {
  title: string;
  subtitle: string;
  backgroundColor: string;
  borderColor?: string;
  iconColor?: string;
  Icon: FC<{ width?: number; height?: number; color?: string }>;
};

const getTrialBannerConfig = (
  theme: Theme,
): Record<PersonalAssistantTrialStage, TrialBannerConfig> => ({
  "access-start": {
    title: "Personal Assistant — free for 2 weeks",
    subtitle:
      "Enjoy personalized insights without any interruption. You can disable it anytime.",
    backgroundColor: theme.colors.rainbowStaticTealSubtle,
    borderColor:
      theme.name === "dark" ? theme.colors.borderStaticSubtle : GLOBAL.teal100,
    Icon: IconPaTrialSparkle,
  },
  "7-day": {
    title: "Personal Assistant trial ends in {{days}}",
    subtitle:
      "Personal Assistant will keep running by automatically charging AI credits.",
    backgroundColor: theme.colors.layerStrong,
    iconColor: theme.colors.textMuted,
    Icon: IconPaTrialLoader,
  },
  "2-day": {
    title: "{{days}} left for free personal assistant access",
    subtitle:
      "Keep it on to continue getting personalized insights, or turn it off before AI credits apply.",
    backgroundColor: theme.colors.informationStaticBlueSubtle,
    iconColor: theme.colors.informationStaticBlueText,
    Icon: IconPaTrialClock,
  },
  "access-end": {
    title: "Your 2-week free personal assistant access has ended",
    subtitle:
      "Toggle on to continue viewing latest daily brief and meeting topics.",
    backgroundColor: theme.colors.informationStaticYellowSubtle,
    iconColor: theme.colors.informationStaticYellowText,
    Icon: IconPaTrialClockAlert,
  },
});

export const PersonalAssistantSection: FC = memo(() => {
  const {
    showCreditsPaywall,
    dailyBriefAppSettings,
    dailyBriefAudioUrl,
    dailyBriefMeetingCount,
    taskCount,
    meetingPrepApp,
    trial,
    isTrialBannerDismissed,
    dismissTrialBanner,
    isDailyBriefActive,
    isMeetingPrepActive,
    isPersonalAssistantOn,
    togglePersonalAssistant,
    isTogglingPersonalAssistant,
    loading: isLoadingPersonalAssistant,
  } = usePersonalAssistant();

  const { events } = useUpcomingCalendarEvents();
  const { meetingPrepEventIds } = useListMeetingPreps();
  const navigation = useNavigation();
  const theme = useTheme();

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightedItem, setHighlightedItem] =
    useState<PersonalAssistantAppId | null>(null);

  // Only count events that have a meeting prep output available
  const meetingPrepEvents = useMemo(() => {
    if (!events?.length || !meetingPrepEventIds) return [];
    return events.filter(
      (e) =>
        (e._id && meetingPrepEventIds.has(e._id)) ||
        (e.meetingId && meetingPrepEventIds.has(e.meetingId)),
    );
  }, [events, meetingPrepEventIds]);

  const upcomingCount = meetingPrepEvents.length;

  const handleMasterToggle = useCallback(
    (next: boolean) => {
      tracker.track(TRACKING_EVENTS.PERSONAL_ASSISTANT_TOGGLED, {
        from: "mobile",
        active: next,
      });
      void togglePersonalAssistant(next);
    },
    [togglePersonalAssistant],
  );

  const trialBanner = useMemo(() => {
    if (!trial) return null;
    if (trial.stage === "access-end" && isTrialBannerDismissed) return null;
    const config = getTrialBannerConfig(theme)[trial.stage];
    const daysLabel = `${trial.daysLeft} ${pluralize("day", trial.daysLeft)}`;
    const title = config.title.replace("{{days}}", daysLabel);
    return (
      <PersonalAssistantTrialView
        title={title}
        subtitle={config.subtitle}
        backgroundColor={config.backgroundColor}
        borderColor={config.borderColor}
        icon={<config.Icon width={20} height={20} color={config.iconColor} />}
        isOn={isPersonalAssistantOn}
        onToggle={handleMasterToggle}
        onDismiss={
          trial.stage === "access-end" ? dismissTrialBanner : undefined
        }
      />
    );
  }, [
    trial,
    isTrialBannerDismissed,
    isPersonalAssistantOn,
    handleMasterToggle,
    dismissTrialBanner,
    theme,
  ]);

  const openSettingsWithHighlight = useCallback(
    (item: PersonalAssistantAppId) => {
      setHighlightedItem(item);
      setSettingsOpen(true);
    },
    [],
  );

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setHighlightedItem(null);
  }, []);

  const handleDailyBriefPress = useCallback(() => {
    tracker.track(TRACKING_EVENTS.DAILY_BRIEF_CARD_CLICKED);
    if (!isDailyBriefActive) {
      openSettingsWithHighlight("dailyBrief");
      return;
    }
    const appId = dailyBriefAppSettings?.id;
    if (!appId) return;
    navigation.navigate(RouteNames.DailyBrief, { appId });
  }, [
    isDailyBriefActive,
    dailyBriefAppSettings?.id,
    navigation,
    openSettingsWithHighlight,
  ]);

  const handleTasksPress = useCallback(() => {
    tracker.track(TRACKING_EVENTS.TASKS_CARD_CLICKED);
    navigation.navigate(RouteNames.Tasks);
  }, [navigation]);

  const handleMeetingPrepPress = useCallback(() => {
    tracker.track(TRACKING_EVENTS.MEETING_PREP_OPENED, { from: "mobile-card" });
    if (!isMeetingPrepActive) {
      openSettingsWithHighlight("meetingPrep");
      return;
    }
    const appId = meetingPrepApp?.id;
    if (!appId) return;
    navigation.navigate(RouteNames.MeetingPrep, { appId });
  }, [
    isMeetingPrepActive,
    meetingPrepApp?.id,
    navigation,
    openSettingsWithHighlight,
  ]);

  const nextMeetingDate = getNextMeetingDate(meetingPrepEvents);
  const showMeetingPrepBadge =
    nextMeetingDate !== null &&
    differenceInHours(nextMeetingDate, new Date()) <= 12;

  const orderedCards = useMemo(() => {
    const cards = [
      {
        id: "dailyBrief",
        active: isDailyBriefActive,
        node: (
          <PersonalAssistantCard
            Icon={IconFeed}
            title="Daily Brief"
            description={`${dailyBriefMeetingCount} ${pluralize("meeting", dailyBriefMeetingCount || 0)}`}
            backgroundColor={
              theme.name === "dark"
                ? theme.colors.layerSubtle
                : theme.colors.rainbowStaticPinkSubtle
            }
            iconColor={GLOBAL.pink400}
            disabled={!isDailyBriefActive}
            onPress={handleDailyBriefPress}
            subtitleAction={
              dailyBriefAppSettings?.id ? (
                <BriefCardAudioButton
                  appId={dailyBriefAppSettings.id}
                  audioUrl={dailyBriefAudioUrl}
                  iconColor={GLOBAL.pink400}
                />
              ) : undefined
            }
          />
        ),
      },
      {
        id: "meetingPrep",
        active: isMeetingPrepActive,
        node: (
          <PersonalAssistantCard
            Icon={IconMeetingPrep}
            title="Meeting Prep"
            description={`${upcomingCount} Upcoming`}
            backgroundColor={
              theme.name === "dark"
                ? theme.colors.layerSubtle
                : theme.colors.rainbowStaticCyanSubtle
            }
            iconColor={GLOBAL.cyan400}
            badge={
              showMeetingPrepBadge
                ? `IN ${formatTimeUntil(nextMeetingDate!)}`
                : undefined
            }
            badgeColor={theme.colors.rainbowStaticCyanText}
            disabled={!isMeetingPrepActive}
            onPress={handleMeetingPrepPress}
          />
        ),
      },
      {
        id: "tasks",
        active: true,
        node: (
          <PersonalAssistantCard
            Icon={IconListCheck}
            title="Tasks"
            description={`${taskCount} ${pluralize("Task", taskCount || 0)}`}
            backgroundColor={
              theme.name === "dark"
                ? theme.colors.layerSubtle
                : theme.colors.rainbowStaticOrangeSubtle
            }
            iconColor={GLOBAL.orange400}
            onPress={handleTasksPress}
          />
        ),
      },
    ];
    // Stable sort: active cards first, preserving original order within each group.
    return cards
      .map((card, index) => ({ card, index }))
      .sort((a, b) => {
        if (a.card.active === b.card.active) return a.index - b.index;
        return a.card.active ? -1 : 1;
      })
      .map(({ card }) => card);
  }, [
    isDailyBriefActive,
    isMeetingPrepActive,
    dailyBriefMeetingCount,
    upcomingCount,
    taskCount,
    showMeetingPrepBadge,
    nextMeetingDate,
    handleDailyBriefPress,
    handleMeetingPrepPress,
    handleTasksPress,
    dailyBriefAppSettings?.id,
    dailyBriefAudioUrl,
    theme,
  ]);

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text variant="title2Weight" color="textMuted">
            Personal Assistant
          </Text>
          <View>
            <Pressable
              onPress={() => setTooltipVisible((v) => !v)}
              hitSlop={8}
              accessibilityLabel="Info about AI credits"
            >
              <IconInfo width={18} height={18} color={theme.colors.textHint} />
            </Pressable>
            <PersonalAssistantInfoTooltip
              visible={tooltipVisible}
              onDismiss={() => setTooltipVisible(false)}
            />
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              setHighlightedItem(null);
              setSettingsOpen(true);
            }}
            hitSlop={8}
            accessibilityLabel="Personal Assistant settings"
            style={({ pressed }) => [
              styles.gearButton,
              pressed && { backgroundColor: theme.colors.layerStrong },
            ]}
          >
            <IconSettings
              width={20}
              height={20}
              color={theme.colors.textHint}
            />
          </Pressable>
          <Switch
            value={isPersonalAssistantOn}
            onValueChange={handleMasterToggle}
            variant="dark"
            disabled={isTogglingPersonalAssistant}
            loading={isTogglingPersonalAssistant}
            accessibilityLabel="Toggle Personal Assistant"
          />
        </View>
      </View>

      {trialBanner}
      {showCreditsPaywall && <PersonalAssistantCreditsPaywallBanner />}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardScrollView}
        contentContainerStyle={styles.cardRow}
      >
        {isLoadingPersonalAssistant ? (
          <>
            <PersonalAssistantCardSkeleton />
            <PersonalAssistantCardSkeleton />
            <PersonalAssistantCardSkeleton />
          </>
        ) : (
          orderedCards.map(({ id, node }) => (
            <Animated.View key={id} layout={CARD_LAYOUT_TRANSITION}>
              {node}
            </Animated.View>
          ))
        )}
      </ScrollView>

      <PersonalAssistantSettingsSheet
        isOpen={settingsOpen}
        close={closeSettings}
        highlightedItem={highlightedItem}
      />
    </>
  );
});

PersonalAssistantSection.displayName = "PersonalAssistantSection";

const styles = createStyles({
  headerRow: {
    // Sits above the sibling cards ScrollView on web, where every View is its
    // own stacking context, so tooltips in the header can paint over the cards.
    zIndex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gearButton: {
    padding: 8,
    borderRadius: 8,
  },
  cardScrollView: {
    marginHorizontal: -20,
  },
  cardRow: {
    gap: 8,
    paddingHorizontal: 20,
  },
});
