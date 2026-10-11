import type {
  LastMeeting,
  Meeting,
} from "@firefliesai/mobile-ff.graphql-client";
import { useAssistThread } from "@/features/ask-fred";
import { getElapsedDuration } from "@/features/live";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/Typography";
import { storage as localStorageOrMemory } from "@/features/storage";

/** Show the button only after LiveScreen has been open for 5 minutes, for 1 minute (until 6 min). */
const VISIBLE_AFTER_SECONDS = 5 * 60; // 5 minutes
const VISIBLE_UNTIL_SECONDS = 6 * 60; // 6 minutes (visible for 1 minute)

export type RecurringMeetingSummarySegment = "summary" | "actionItems";

type RecurringMeetingSummaryButtonProps = {
  /** Current meeting; must have lastMeeting (recurring) – component returns null otherwise */
  meeting: Meeting | null;
  /** ID of the previous meeting in the series (from getMeetingPrep.lastMeeting.id) */
  lastMeetingId: string | null;
  /** Last meeting details (from getMeetingPrep.lastMeeting) for context in prompts */
  lastMeeting: LastMeeting | null;
  /** True when LiveScreen has been open for 5–6 minutes (computed by parent via useRecurringSummaryVisibilityWindow). */
  isInVisibilityWindow: boolean;
};

/** Display text only (shown in UI); context is stripped via parseUserDisplayContent */
const SUMMARY_DISPLAY =
  "Provide a concise summary of the most recent completed meeting prior to the current one. Use only information discussed in that previous meeting. Do not include, reference, infer, or combine any details from the current meeting or any ongoing discussion.";

const ACTION_ITEMS_DISPLAY =
  "Extract and list all action items in the most recent completed meeting prior to the current one. Base the response strictly on that previous meeting’s discussion and decisions. Do not use, reference, or infer any information from the current meeting.";

function buildLastMeetingContextBlock(lastMeeting: LastMeeting | null): string {
  if (!lastMeeting) return "";
  const parts: string[] = [];
  if (lastMeeting.id) parts.push(`Meeting ID: ${lastMeeting.id}`);

  if (parts.length === 0) return "";
  return `[CONTEXT_START] 
  Last meeting details: ${parts.join(". ")}. [CONTEXT_END]`;
}

/** Returns true only when LiveScreen has been open for 5–6 minutes. Used by parent to avoid rendering empty Dock. */
export function useRecurringSummaryVisibilityWindow(
  screenOpenedAt: Date | null,
  meetingId?: string,
): boolean {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(-1);
  const hasSeenRecurringMeetingSummaryPrompt = localStorageOrMemory.getItem(
    `recurring-meeting-${meetingId}`,
  );

  useEffect(() => {
    if (hasSeenRecurringMeetingSummaryPrompt) return;
    if (!screenOpenedAt) return;
    const tick = () => {
      const elapsed = getElapsedDuration(screenOpenedAt);
      if (elapsed >= 0) setElapsedSeconds(elapsed);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hasSeenRecurringMeetingSummaryPrompt, screenOpenedAt]);

  return (
    elapsedSeconds >= VISIBLE_AFTER_SECONDS &&
    elapsedSeconds < VISIBLE_UNTIL_SECONDS &&
    !hasSeenRecurringMeetingSummaryPrompt
  );
}

export const RecurringMeetingSummaryButton: FC<
  RecurringMeetingSummaryButtonProps
> = ({ meeting, lastMeetingId, lastMeeting = null, isInVisibilityWindow }) => {
  const theme = useTheme();
  const { askFred, setAssistPanelOpen } = useAssistThread();

  useEffect(() => {
    return () =>
      localStorageOrMemory.setItem(`recurring-meeting-${meeting?.id}`, "true");
  }, [meeting?.id]);

  if (!meeting || !lastMeetingId) {
    return null;
  }

  if (!isInVisibilityWindow) {
    return null;
  }

  const contextBlock = buildLastMeetingContextBlock(lastMeeting);

  const handleSummaryPress = () => {
    setAssistPanelOpen(true);
    const fullPrompt = SUMMARY_DISPLAY + contextBlock;
    askFred(fullPrompt, "recurring-meeting-summary", lastMeetingId);
  };

  const handleActionItemsPress = () => {
    setAssistPanelOpen(true);
    const fullPrompt = ACTION_ITEMS_DISPLAY + contextBlock;
    askFred(fullPrompt, "recurring-meeting-action-items", lastMeetingId);
  };

  return (
    <View style={styles.container}>
      <Text variant="body2Regular" color="textMuted" style={styles.label}>
        From last sync :
      </Text>
      <View style={styles.segments}>
        <Pressable
          onPress={handleSummaryPress}
          accessibilityRole="button"
          accessibilityLabel="View Summary"
          style={({ pressed: p }) => [
            styles.segment,
            p && styles.segmentPressed(theme),
          ]}
        >
          <Text variant="body2Weight" color="textSecondary">
            Summary
          </Text>
        </Pressable>
        <Text variant="body3Regular" color="textMuted" style={styles.divider}>
          |
        </Text>
        <Pressable
          onPress={handleActionItemsPress}
          accessibilityRole="button"
          accessibilityLabel="View Action Items"
          style={({ pressed: p }) => [
            styles.segment,
            p && styles.segmentPressed(theme),
          ]}
        >
          <Text variant="body2Weight" color="textSecondary">
            Action Items
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = createStyles({
  buttonPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  label: {
    marginRight: 2,
  },
  segments: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  segment: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    cursor: "pointer",
  },
  segmentPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  divider: {
    marginHorizontal: 2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
