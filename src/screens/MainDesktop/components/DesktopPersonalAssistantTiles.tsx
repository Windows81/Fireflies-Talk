import {
  IconFeed,
  IconInfo,
  IconListCheck,
  IconMeetingPrep,
  IconSparkle,
} from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { DAILY_BRIEF_APP_TITLE } from "@/constants/ai";
import { Config } from "@/constants/config";
import { useUpcomingCalendarEvents } from "@/features/calendar";
import { openURL } from "@/features/navigation/utils";
import { usePersonalAssistant } from "@/features/personal-assistant";
import { useListMeetingPreps } from "@/hooks/useListMeetingPreps";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { pluralize } from "@/utils/pluralize";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { memo, useCallback, useMemo, useState, type FC } from "react";
import { Pressable, View } from "react-native";
import type { CalendarEvents } from "@/graphql";
import { DesktopPersonalAssistantModal } from "./DesktopPersonalAssistantModal";
import { Tile } from "./DesktopPersonalAssistantTile";

const PA_TOOLTIP = "Each AI Skill consumes 1 AI credit / meeting";

function getMeetingPrepBadge(target: Date): string {
  const now = new Date();
  const hours = differenceInHours(target, now);
  if (hours <= 0) {
    const minutes = differenceInMinutes(target, now);
    return minutes <= 0 ? "LIVE" : `IN ${minutes}M`;
  }
  return `IN ${hours}HR`;
}

interface DesktopPersonalAssistantTilesProps {
  onMeetingPrepClick?: (event: CalendarEvents) => void;
}

export const DesktopPersonalAssistantTiles: FC<DesktopPersonalAssistantTilesProps> =
  memo(({ onMeetingPrepClick }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const {
      dailyBriefAppSettings,
      dailyBriefMeetingCount,
      taskCount,
      isDailyBriefActive,
      isMeetingPrepActive,
      isPersonalAssistantOn,
      isTogglingDailyBrief,
      isTogglingMeetingPrep,
      isTogglingPersonalAssistant,
      setDailyBriefEnabled,
      setMeetingPrepEnabled,
    } = usePersonalAssistant();

    const handleTogglePress = useCallback(() => {
      tracker.track(TRACKING_EVENTS.PERSONAL_ASSISTANT_TOGGLED, {
        from: "desktop",
        active: !isPersonalAssistantOn,
      });
      setSettingsOpen(true);
    }, [isPersonalAssistantOn]);

    const { events } = useUpcomingCalendarEvents();
    const { meetingPrepEventIds } = useListMeetingPreps();
    const dashboardUrl = Config.DASHBOARD_URL?.replace(/\/+$/, "") ?? "";

    const meetingPrepEvents = useMemo(() => {
      if (!events?.length || !meetingPrepEventIds) return [];
      return events.filter(
        (e) =>
          (e._id && meetingPrepEventIds.has(e._id)) ||
          (e.meetingId && meetingPrepEventIds.has(e.meetingId)),
      );
    }, [events, meetingPrepEventIds]);

    const nextMeetingEvent = meetingPrepEvents[0] ?? null;
    const nextMeetingDate = nextMeetingEvent?.date
      ? new Date(nextMeetingEvent.date)
      : null;

    const meetingPrepBadge =
      nextMeetingDate !== null &&
      differenceInHours(nextMeetingDate, new Date()) <= 12
        ? getMeetingPrepBadge(nextMeetingDate)
        : undefined;

    const meetingPrepDescription = nextMeetingEvent?.title
      ? `Next: ${nextMeetingEvent.title}`
      : `${meetingPrepEvents.length} Upcoming`;

    const handleDailyBriefPress = useCallback(async () => {
      if (!isDailyBriefActive) {
        tracker.track(TRACKING_EVENTS.DESKTOP_PA_CARD_ENABLED, {
          card: "daily_brief",
          source: "tile",
        });
        try {
          await setDailyBriefEnabled(true);
        } catch {
          toast({
            title: "Could not enable Daily Brief",
            message: "Please try again.",
            type: "error",
          });
        }
        return;
      }
      tracker.track(TRACKING_EVENTS.DESKTOP_PA_CARD_CLICKED, {
        card: "daily_brief",
      });
      const appId = dailyBriefAppSettings?.id;
      if (!appId) return;
      openURL(
        `${dashboardUrl}/welcome/ai-skills/${encodeURIComponent(DAILY_BRIEF_APP_TITLE)}:${appId}`,
        { newTab: true },
      );
    }, [
      isDailyBriefActive,
      setDailyBriefEnabled,
      dailyBriefAppSettings?.id,
      dashboardUrl,
    ]);

    const handleMeetingPrepPress = useCallback(async () => {
      if (!isMeetingPrepActive) {
        tracker.track(TRACKING_EVENTS.DESKTOP_PA_CARD_ENABLED, {
          card: "meeting_prep",
          source: "tile",
        });
        try {
          await setMeetingPrepEnabled(true);
        } catch {
          toast({
            title: "Could not enable Meeting Prep",
            message: "Please try again.",
            type: "error",
          });
        }
        return;
      }
      tracker.track(TRACKING_EVENTS.MEETING_PREP_OPENED, {
        from: "desktop-tile",
      });
      tracker.track(TRACKING_EVENTS.DESKTOP_PA_CARD_CLICKED, {
        card: "meeting_prep",
      });
      if (nextMeetingEvent && onMeetingPrepClick) {
        onMeetingPrepClick(nextMeetingEvent);
      }
    }, [
      isMeetingPrepActive,
      setMeetingPrepEnabled,
      nextMeetingEvent,
      onMeetingPrepClick,
    ]);

    const handleTasksPress = useCallback(() => {
      tracker.track(TRACKING_EVENTS.DESKTOP_PA_CARD_CLICKED, { card: "tasks" });
      openURL(`${dashboardUrl}/welcome/tasks`, { newTab: true });
    }, [dashboardUrl]);

    const [isSectionHovered, setIsSectionHovered] = useState(false);
    const sectionHoverProps = {
      onMouseEnter: () => setIsSectionHovered(true),
      onMouseLeave: () => setIsSectionHovered(false),
    };

    return (
      <View style={styles.section} {...sectionHoverProps}>
        {/* Always render controls so header height stays fixed at 36px */}
        <View style={styles.sectionHeader}>
          <IconSparkle color={DESKTOP_THEME.grey700} />
          <View style={styles.headerInner}>
            <Text variant="body2Regular" style={styles.headerTitle}>
              Personal Assistant
            </Text>
            <View
              style={[
                styles.headerRight,
                !isSectionHovered && styles.headerRightHidden,
              ]}
              pointerEvents={isSectionHovered ? "auto" : "none"}
            >
              <HoverTooltip label={PA_TOOLTIP} position="top" align="end">
                <IconInfo
                  width={16}
                  height={16}
                  color={DESKTOP_THEME.grey700}
                />
              </HoverTooltip>
              {/* Always-ON toggle — clicking opens the manage modal */}
              <Pressable
                onPress={handleTogglePress}
                disabled={isTogglingPersonalAssistant}
                style={styles.paToggle}
                accessibilityRole="switch"
                aria-checked={true}
                accessibilityLabel="Manage Personal Assistant"
              >
                <View style={styles.paToggleBall} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <Tile
            Icon={IconFeed}
            title="Daily Brief"
            description={`${dailyBriefMeetingCount} ${pluralize("Update", dailyBriefMeetingCount)}`}
            enableDescription="to update brief"
            gradientColors={["#1286B4", "#137526"]}
            disabled={!isDailyBriefActive}
            loading={isTogglingDailyBrief}
            onPress={handleDailyBriefPress}
          />
          <Tile
            Icon={IconMeetingPrep}
            title="Meeting Prep"
            description={meetingPrepDescription}
            enableDescription="to get meeting prep"
            gradientColors={["#2B379F", "#076E7C"]}
            badge={meetingPrepBadge}
            disabled={!isMeetingPrepActive}
            loading={isTogglingMeetingPrep}
            onPress={handleMeetingPrepPress}
          />
          <Tile
            Icon={IconListCheck}
            title="Tasks"
            description={`${taskCount} New ${pluralize("task", taskCount)}`}
            gradientColors={["#28209A", "#583C9B"]}
            onPress={handleTasksPress}
          />
        </View>

        <DesktopPersonalAssistantModal
          isOpen={settingsOpen}
          close={() => setSettingsOpen(false)}
        />
      </View>
    );
  });

DesktopPersonalAssistantTiles.displayName = "DesktopPersonalAssistantTiles";

const styles = createStyles({
  // Wrapper: column, gap 6px, padding 0 16px (Figma spec). Caps at the design
  // width but shrinks with the pane so the tiles stay fully visible instead of
  // clipping behind the sidebar when it expands.
  section: {
    gap: 6,
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 768,
  },
  // Header: row, height 36px, padding 8px 0px, gap 6px (Figma spec)
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingVertical: 8,
    gap: 6,
  },
  // Inner frame: row, flex 1, space-between to push controls right
  headerInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: DESKTOP_THEME.grey550,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerRightHidden: {
    opacity: 0,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  // Always-ON toggle pill (32×20, ball pinned right)
  paToggle: {
    width: 32,
    height: 20,
    borderRadius: 20,
    backgroundColor: DESKTOP_THEME.purple600,
    padding: 4,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  paToggleBall: {
    width: 12,
    height: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
  },
});
