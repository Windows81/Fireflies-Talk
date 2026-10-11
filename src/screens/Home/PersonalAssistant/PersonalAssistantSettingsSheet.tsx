import { IconFeed, IconListCheck, IconMeetingPrep } from "@/assets/svg";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { toast } from "@/components/Toast";
import { usePersonalAssistant } from "@/features/personal-assistant";
import { createStyles, useTheme } from "@/styles";
import { GLOBAL } from "@/styles/color";
import { useEffect, type FC, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

export type PersonalAssistantAppId = "dailyBrief" | "tasks" | "meetingPrep";

interface PersonalAssistantSettingsSheetProps {
  isOpen: boolean;
  close: () => void;
  highlightedItem?: PersonalAssistantAppId | null;
}

const HIGHLIGHT_COLOR = GLOBAL.purple100;
const HIGHLIGHT_FADE_DURATION_MS = 1200;

interface AppCardProps {
  Icon: FC<SvgProps>;
  iconColor: string;
  name: string;
  description: string;
  value: boolean;
  onToggle?: (active: boolean) => Promise<void>;
  highlighted: boolean;
  badge?: ReactNode;
  locked?: boolean;
  loading?: boolean;
  footer?: ReactNode;
}

const AppCard: FC<AppCardProps> = ({
  Icon,
  iconColor,
  name,
  description,
  value,
  onToggle,
  highlighted,
  badge,
  locked,
  loading,
  footer,
}) => {
  const theme = useTheme();
  const highlightProgress = useSharedValue(0);

  useEffect(() => {
    if (!highlighted) return;
    highlightProgress.value = 1;
    highlightProgress.value = withTiming(0, {
      duration: HIGHLIGHT_FADE_DURATION_MS,
    });
  }, [highlighted, highlightProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlightProgress.value,
      [0, 1],
      [theme.colors.layerMuted, HIGHLIGHT_COLOR],
    ),
  }));

  const handleToggle = async (newValue: boolean) => {
    if (!onToggle) return;
    try {
      await onToggle(newValue);
      if (!newValue) {
        toast({ message: `${name} disabled` });
      }
    } catch {
      toast({
        title: `Could not ${newValue ? "enable" : "disable"} ${name}`,
        message: "Please try again.",
        type: "error",
      });
    }
  };

  return (
    <Animated.View style={[styles.appCardWrapper(theme), animatedStyle]}>
      <View style={styles.appCardBody}>
        <View style={styles.appCardContent}>
          <View style={styles.appCardIcon}>
            <Icon width={20} height={20} color={iconColor} />
          </View>
          <View style={styles.appCardText}>
            <View style={styles.appCardTitleRow}>
              <Text variant="body1Weight" color="textSecondary">
                {name}
              </Text>
              {badge}
            </View>
            <Text variant="body2Regular" color="textMuted">
              {description}
            </Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={handleToggle}
          variant="dark"
          disabled={locked || loading}
          loading={loading}
        />
      </View>
      {footer ? (
        <View style={styles.appCardFooter(theme)}>{footer}</View>
      ) : null}
    </Animated.View>
  );
};

const FreeBadge: FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.freeBadge(theme)}>
      <Text variant="body3Regular" style={styles.freeBadgeText(theme)}>
        FREE
      </Text>
    </View>
  );
};

const TasksFooter: FC = () => (
  <Text variant="body3Regular" color="textMuted" style={styles.tasksFooterText}>
    Always on. Doesn&apos;t use AI credits.
  </Text>
);

export const PersonalAssistantSettingsSheet: FC<
  PersonalAssistantSettingsSheetProps
> = ({ isOpen, close, highlightedItem }) => {
  const { bottom } = useSafeAreaInsets();
  const {
    dailyBriefAppSettings,
    meetingPrepApp,
    setDailyBriefEnabled,
    setMeetingPrepEnabled,
    isTogglingDailyBrief,
    isTogglingMeetingPrep,
  } = usePersonalAssistant();

  return (
    <BottomSheet.Root isOpen={isOpen} close={close}>
      <BottomSheet.ScrollView bounces={false}>
        <View
          style={[styles.container, { paddingBottom: Math.max(bottom, 32) }]}
        >
          <View style={styles.titleRow}>
            <Text variant="title1Weight" color="textSecondary">
              Manage Personal Assistant
            </Text>
          </View>

          <AppCard
            Icon={IconListCheck}
            iconColor={GLOBAL.orange400}
            name="Tasks"
            description="Automatically track action items & task owners from your meetings."
            value
            locked
            highlighted={isOpen && highlightedItem === "tasks"}
            badge={<FreeBadge />}
            footer={<TasksFooter />}
          />

          <AppCard
            Icon={IconFeed}
            iconColor={GLOBAL.pink400}
            name="Daily Brief"
            description="Get a daily recap of action items, blockers, key mentions & popular topics."
            value={!!dailyBriefAppSettings?.active}
            onToggle={setDailyBriefEnabled}
            loading={isTogglingDailyBrief}
            highlighted={isOpen && highlightedItem === "dailyBrief"}
          />

          <AppCard
            Icon={IconMeetingPrep}
            iconColor={GLOBAL.cyan400}
            name="Meeting Prep"
            description="Prep for meetings with past context, open items & participant research."
            value={!!meetingPrepApp?.active}
            onToggle={setMeetingPrepEnabled}
            loading={isTogglingMeetingPrep}
            highlighted={isOpen && highlightedItem === "meetingPrep"}
          />

          <Button onPress={close} size="lg" style={styles.doneButton}>
            Done
          </Button>
        </View>
      </BottomSheet.ScrollView>
    </BottomSheet.Root>
  );
};

const styles = createStyles({
  container: {
    paddingHorizontal: 20,
    gap: 12,
  },
  titleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 28,
  },
  appCardWrapper: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 12,
    overflow: "hidden",
  }),
  appCardBody: {
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  appCardContent: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  appCardIcon: {
    paddingTop: 2,
  },
  appCardText: {
    flex: 1,
    gap: 4,
  },
  appCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appCardFooter: (theme) => ({
    backgroundColor: theme.colors.layerStrong,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  }),
  freeBadge: (theme) => ({
    backgroundColor: theme.colors.informationStaticBlueSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  }),
  freeBadgeText: (theme) => ({
    color: theme.colors.informationStaticBlueText,
  }),
  tasksFooterText: {
    textAlign: "center",
  },
  doneButton: {
    marginTop: 12,
  },
});
