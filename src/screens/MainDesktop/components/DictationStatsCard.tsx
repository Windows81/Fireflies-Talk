import { IconSettings } from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import { getWordsByDay } from "@/hooks/dictationDayWords";
import { useDictationDayFocus } from "@/hooks/dictationDayFocus";
import { showMilestoneShare } from "@/hooks/milestoneShare.store";
import {
  clearPendingMilestone,
  getActiveDays,
  getLifetimeWords,
  getPendingMilestone,
  useDictationHistory,
} from "@/hooks/dictationHistory";
import {
  formatWordCount,
  getMilestoneProgress,
  getMonthActivity,
  getStreakDays,
  toDictationDayKeys,
  type DictationDayCell,
} from "@/hooks/dictationStats";
import { useCurrentDayKey } from "@/hooks/useCurrentDayKey";
import { navigationRef } from "@/screens/RootNavigation";
import { useIsFocused } from "@react-navigation/native";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { pluralize } from "@/utils/pluralize";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, type FC } from "react";
import { Pressable, View } from "react-native";
import { DictationMilestones } from "./DictationMilestones";
import { DictationStatCard } from "./DictationStatCard";
import { DictationShareFeedbackButton } from "./DictationShareFeedbackButton";

// 13 cells of 12px with 4px gaps fill the card's 204px inner width.
const CELLS_PER_ROW = 13;

const toRows = (cells: DictationDayCell[]): DictationDayCell[][] => {
  const rows: DictationDayCell[][] = [];
  for (let index = 0; index < cells.length; index += CELLS_PER_ROW) {
    rows.push(cells.slice(index, index + CELLS_PER_ROW));
  }
  return rows;
};

export const DictationStatsCard: FC = () => {
  const userId = useAuth((s) => s.user?.id);
  const requestDay = useDictationDayFocus((s) => s.requestDay);
  const allEntries = useDictationHistory((s) => s.entries);
  const lifetimeWords = useDictationHistory((s) => s.lifetimeWords);
  const activeDays = useDictationHistory((s) => s.activeDays);
  const focused = useIsFocused();
  // Keeps the month, streak and grid honest when the day turns over.
  const dayKey = useCurrentDayKey();

  const { totalWords, streakDays, month, navigable, wordsByDay, rows } =
    useMemo(() => {
      // Derived from the day key so the memo actually re-runs at midnight.
      const now = parseISO(dayKey);
      const store = { entries: allEntries, lifetimeWords, activeDays };
      const words = getLifetimeWords(store, userId);
      // Day keys rather than entries, so the history cap cannot erase a streak.
      const days = getActiveDays(store, userId);
      const entries = allEntries.filter((entry) => entry.userId === userId);
      // Activity outlives the entries it came from, so a day can be genuinely
      // active with nothing left in the history to scroll to. Those cells stay
      // lit but are not clickable.
      const navigable = new Set(toDictationDayKeys(entries));

      return {
        totalWords: words,
        streakDays: getStreakDays(days, now),
        month: format(now, "MMMM"),
        navigable,
        wordsByDay: getWordsByDay(entries),
        rows: toRows(getMonthActivity(days, now)),
      };
    }, [activeDays, allEntries, dayKey, lifetimeWords, userId]);

  // The last milestone passed, which is the one the card offers to share.
  const earned = getMilestoneProgress(totalWords).reached;

  // A milestone that was already waiting when this screen came into view opens
  // on arrival, on the total it was earned at rather than whatever has been
  // said since. One earned while the screen is already open is left alone: the
  // words were dictated into another app, the paste may still be in flight, and
  // a dialog would take the focus away from it. The pill's nudge offers that
  // one instead, so it is read here rather than subscribed to.
  useEffect(() => {
    if (!focused || !userId) return;

    const earned = getPendingMilestone(useDictationHistory.getState(), userId);
    if (!earned) return;

    showMilestoneShare({
      userId: earned.userId,
      milestoneWords: earned.milestoneWords,
      totalWords: earned.totalWords,
      source: "stats_card",
    });
    clearPendingMilestone(earned.userId);
  }, [focused, userId]);

  return (
    <View style={styles.column}>
      {/*
        The share press covers the card's contents rather than the card itself,
        so the gear in the corner stays outside it. Before the first milestone
        there is nothing to share and this is disabled, and a disabled Pressable
        takes its whole subtree out of the pointer path with it — with the gear
        nested inside, settings were unreachable until 360 words in.
      */}
      <DictationStatCard action={<DictationSettingsButton />}>
        <HoverTooltip
          label="View last milestone"
          position="bottom"
          align="center"
          disabled={!earned}
        >
          <Pressable
            style={styles.total}
            disabled={!earned}
            onPress={() =>
              userId &&
              earned &&
              showMilestoneShare({
                userId,
                milestoneWords: earned.words,
                totalWords,
                source: "stats_card",
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`${formatWordCount(totalWords)} total words. View last milestone.`}
          >
            <View style={styles.totalRow}>
              <Text variant="title1Weight" color="textPrimary">
                {formatWordCount(totalWords)}
              </Text>
              <Text variant="body2Weight" color="textSecondary">
                Total Words
              </Text>
            </View>
            <DictationMilestones totalWords={totalWords} />
          </Pressable>
        </HoverTooltip>
      </DictationStatCard>

      <DictationStatCard>
        <View style={styles.stacked}>
          <Text variant="title1Weight" color="textPrimary">
            {streakDays} {pluralize("Day", streakDays)} streak
          </Text>
          <Text variant="body2Regular" color="textHint">
            {month}
          </Text>
        </View>
        <View style={styles.grid}>
          {rows.map((row) => (
            <View key={row[0].key} style={styles.gridRow}>
              {row.map((cell) => {
                const label = cellLabel(cell, wordsByDay.get(cell.key));
                return (
                  <HoverTooltip
                    key={cell.key}
                    label={label}
                    position="top"
                    align="center"
                  >
                    <Pressable
                      style={[
                        styles.cell,
                        cell.active && styles.cellActive,
                        cell.inStreak && styles.cellStreak,
                      ]}
                      disabled={!cell.active || !navigable.has(cell.key)}
                      onPress={() => requestDay(cell.key)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                    />
                  </HoverTooltip>
                );
              })}
            </View>
          ))}
        </View>
      </DictationStatCard>

      <View style={styles.feedback}>
        <DictationShareFeedbackButton />
      </View>
    </View>
  );
};

const DictationSettingsButton: FC = () => (
  <HoverTooltip label="Dictation settings" position="bottom" align="end">
    <Pressable
      onPress={() => {
        navigationRef.navigate(RouteNames.DesktopSettings, {
          activeContent: "dictation",
        });
      }}
      accessibilityRole="button"
      accessibilityLabel="Dictation settings"
    >
      <IconSettings width={16} height={16} color={DESKTOP_THEME.grey700} />
    </Pressable>
  </HoverTooltip>
);

/**
 * "Tue, Sep 1 · 1,204 words" — the day the cell stands for and what was said
 * on it. The count is left off when the history no longer holds that day.
 */
const cellLabel = (cell: DictationDayCell, words?: number): string => {
  const day = format(parseISO(cell.key), "eee, MMM d");
  if (words === undefined) return day;
  return `${day} · ${formatWordCount(words)} ${pluralize("word", words)}`;
};

const styles = createStyles({
  column: {
    gap: 16,
    flexShrink: 0,
  },
  // Stands in for the card's own gap, now that the card's children are one
  // element rather than two.
  total: {
    gap: 16,
    alignSelf: "stretch",
  },
  // Figure and label on one line, sitting on the same baseline.
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  stacked: {
    gap: 4,
    alignSelf: "stretch",
  },
  // Pulled right by its own padding so the label lines up with the cards' edge.
  feedback: {
    alignItems: "flex-end",
    marginRight: -8,
  },
  grid: {
    gap: 6,
    alignSelf: "stretch",
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: withAlpha(DESKTOP_THEME.grey500, 0.15),
  },
  cellActive: {
    backgroundColor: DESKTOP_THEME.grey600,
  },
  // Days in the live streak read brighter than earlier activity in the month.
  cellStreak: {
    backgroundColor: DESKTOP_THEME.grey300,
  },
});
