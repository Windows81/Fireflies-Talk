import { IconFeed, IconListCheck, IconMeetingPrep } from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Switch } from "@/components/Switch";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { Config, DAILY_BRIEF_APP_TITLE } from "@/constants";
import { useUpcomingCalendarEvents } from "@/features/calendar";
import { openURL } from "@/features/navigation";
import { usePersonalAssistant } from "@/features/personal-assistant";
import { useListMeetingPreps } from "@/hooks/useListMeetingPreps";
import { DESKTOP_THEME } from "@/styles/color";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { LinearGradient } from "expo-linear-gradient";
import { type FC, useCallback, useMemo } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import type { SvgProps } from "react-native-svg";

type AppId = "dailyBrief" | "meetingPrep" | "tasks";
type PACardKey = "daily_brief" | "meeting_prep" | "tasks";

interface AppCardProps {
  Icon: FC<SvgProps>;
  gradientColors: [string, string];
  title: string;
  description: string;
  cardKey: PACardKey;
  viewUrl?: string;
  badge?: { label: string; bg: string; textColor: string };
  value: boolean;
  locked?: boolean;
  loading?: boolean;
  badgeTooltip?: string;
  toggleTooltip?: string;
  onToggle?: (v: boolean) => Promise<void>;
}

const AppCard: FC<AppCardProps> = ({
  Icon,
  gradientColors,
  title,
  description,
  cardKey,
  viewUrl,
  badge,
  value,
  locked,
  loading,
  badgeTooltip,
  toggleTooltip,
  onToggle,
}) => {
  const handleToggle = useCallback(
    async (next: boolean) => {
      if (!onToggle) return;
      try {
        await onToggle(next);
        tracker.track(
          next
            ? TRACKING_EVENTS.DESKTOP_PA_CARD_ENABLED
            : TRACKING_EVENTS.DESKTOP_PA_CARD_DISABLED,
          { card: cardKey, source: "modal" },
        );
        if (!next) toast({ message: `${title} disabled` });
      } catch {
        toast({
          title: `Could not ${next ? "enable" : "disable"} ${title}`,
          message: "Please try again.",
          type: "error",
        });
      }
    },
    [onToggle, title, cardKey],
  );

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.left}>
        <LinearGradient colors={gradientColors} style={cardStyles.iconBox}>
          <Icon width={24} height={24} color="#FFFFFF" />
        </LinearGradient>
        <View style={cardStyles.textBlock}>
          <View style={cardStyles.titleRow}>
            <Text variant="body2Weight" style={cardStyles.title}>
              {title}
            </Text>
            {badge && (
              <HoverTooltip
                label={badgeTooltip ?? ""}
                position="top"
                align="center"
                disabled={!badgeTooltip}
              >
                <View style={[cardStyles.badge, { backgroundColor: badge.bg }]}>
                  <Text
                    variant="body3Regular"
                    style={[cardStyles.badgeText, { color: badge.textColor }]}
                  >
                    {badge.label}
                  </Text>
                </View>
              </HoverTooltip>
            )}
          </View>
          <View style={cardStyles.descriptionRow}>
            <Text
              variant="body2Regular"
              style={cardStyles.description}
              numberOfLines={1}
            >
              {description}
            </Text>
            {viewUrl && (
              <Pressable onPress={() => openURL(viewUrl, { newTab: true })}>
                <Text variant="body2Regular" style={cardStyles.viewLink}>
                  View
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
      {toggleTooltip ? (
        <HoverTooltip label={toggleTooltip} position="top" align="center">
          <Switch
            value={value}
            onValueChange={handleToggle}
            variant="desktop"
            disabled={locked || loading}
            loading={loading}
          />
        </HoverTooltip>
      ) : (
        <Switch
          value={value}
          onValueChange={handleToggle}
          variant="desktop"
          disabled={locked || loading}
          loading={loading}
        />
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DESKTOP_THEME.grey950,
    borderRadius: 12,
    padding: 20,
    gap: 24,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: DESKTOP_THEME.grey500,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  description: {
    color: DESKTOP_THEME.grey550,
    flexShrink: 1,
  },
  viewLink: {
    color: DESKTOP_THEME.grey500,
    textDecorationLine: "underline",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
  },
});

interface Props {
  isOpen: boolean;
  close: () => void;
  highlightedItem?: AppId | null;
}

export const DesktopPersonalAssistantModal: FC<Props> = ({ isOpen, close }) => {
  const dashboardUrl = Config.DASHBOARD_URL?.replace(/\/+$/, "") ?? "";

  const {
    dailyBriefAppSettings,
    dailyBriefMeetingCount,
    taskCount,
    meetingPrepApp,
    setDailyBriefEnabled,
    setMeetingPrepEnabled,
    isTogglingDailyBrief,
    isTogglingMeetingPrep,
  } = usePersonalAssistant();

  const { events } = useUpcomingCalendarEvents();
  const { meetingPrepEventIds } = useListMeetingPreps();

  const upcomingCount = useMemo(() => {
    if (!events?.length || !meetingPrepEventIds) return 0;
    return events.filter(
      (e) =>
        (e._id && meetingPrepEventIds.has(e._id)) ||
        (e.meetingId && meetingPrepEventIds.has(e.meetingId)),
    ).length;
  }, [events, meetingPrepEventIds]);

  const prepCount = meetingPrepEventIds?.size ?? 0;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <Pressable style={styles.overlay} onPress={close} aria-hidden>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text variant="body1Weight" style={styles.heading}>
              Manage Personal Assistant
            </Text>
          </View>

          <View style={styles.description}>
            <Text variant="body2Regular" style={styles.descriptionText}>
              {
                "Once disabled, you'll stop getting Daily Brief, Meeting Preps for your upcoming meetings."
              }
            </Text>
          </View>

          <View style={styles.list}>
            <AppCard
              Icon={IconListCheck}
              gradientColors={["#28209A", "#4D3C9B"]}
              title="Tasks"
              cardKey="tasks"
              description={`Generated ${taskCount} tasks so far.`}
              viewUrl={`${dashboardUrl}/welcome/tasks`}
              badge={{ label: "FREE", bg: "#002F53", textColor: "#76A7FA" }}
              value
              locked
              badgeTooltip="Tasks do not consume AI credits"
              toggleTooltip="Tasks cannot be disabled"
            />
            <AppCard
              Icon={IconFeed}
              gradientColors={["#1286B4", "#137526"]}
              title="Daily Brief"
              cardKey="daily_brief"
              description={`Generated ${dailyBriefMeetingCount} daily briefs so far.`}
              viewUrl={
                dailyBriefAppSettings?.id
                  ? `${dashboardUrl}/welcome/ai-skills/${encodeURIComponent(DAILY_BRIEF_APP_TITLE)}:${dailyBriefAppSettings.id}`
                  : undefined
              }
              value={!!dailyBriefAppSettings?.active}
              onToggle={setDailyBriefEnabled}
              loading={isTogglingDailyBrief}
            />
            <AppCard
              Icon={IconMeetingPrep}
              gradientColors={["#2B379F", "#07617C"]}
              title="Meeting Prep"
              cardKey="meeting_prep"
              description={`Generated ${prepCount} preps so far.`}
              viewUrl={`${dashboardUrl}/welcome/meeting-prep`}
              badge={
                upcomingCount > 0
                  ? {
                      label: `${upcomingCount} UPCOMING`,
                      bg: "#002E1B",
                      textColor: "#23C035",
                    }
                  : undefined
              }
              value={!!meetingPrepApp?.active}
              onToggle={setMeetingPrepEnabled}
              loading={isTogglingMeetingPrep}
            />
          </View>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.doneButtonPressed,
              ]}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text variant="label2Weight" style={styles.doneText}>
                Done
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: 548,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    color: DESKTOP_THEME.grey500,
  },
  description: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  descriptionText: {
    color: DESKTOP_THEME.grey550,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "flex-end",
  },
  doneButton: {
    backgroundColor: DESKTOP_THEME.purple600,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneButtonPressed: {
    backgroundColor: DESKTOP_THEME.purple700,
  },
  doneText: {
    color: "#FFFFFF",
  },
});
