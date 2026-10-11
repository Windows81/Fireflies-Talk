import { IconMeetingPrepArcs } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { type CalendarEvents } from "@/graphql";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { DESKTOP_FLOATING_SHADOW } from "@/styles/elevation";
import { type FC } from "react";
import { Pressable, View } from "react-native";
import { createPortal } from "react-dom";
import { useMeetingPrepSummary } from "../hooks/useMeetingPrepSummary";
import { MeetingPrepActionItems } from "./MeetingBanner/MeetingPrepActionItems";

interface MeetingPrepHoverCardProps {
  event: CalendarEvents;
  anchor: { top: number; left: number } | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onPress?: () => void;
}

const SUMMARY_CHAR_LIMIT = 90;

export const MeetingPrepHoverCard: FC<MeetingPrepHoverCardProps> = ({
  event,
  anchor,
  onMouseEnter,
  onMouseLeave,
  onPress,
}) => {
  const {
    summaryText,
    truncatedSummary,
    isTruncated,
    taskCount,
    participants,
  } = useMeetingPrepSummary(event, undefined, SUMMARY_CHAR_LIMIT);

  if (!anchor) return null;

  // Hide the card entirely if there's nothing to show
  if (!summaryText && taskCount === 0) return null;

  // onMouseEnter/onMouseLeave aren't in RN's View type but are passed through
  // by react-native-web — cast to bypass the type mismatch.
  const webHoverProps = { onMouseEnter, onMouseLeave } as object;
  const content = (
    <Pressable
      onPress={onPress}
      style={[styles.card, { top: anchor.top, left: anchor.left }]}
      {...webHoverProps}
    >
      {/* Top: Meeting Prep card (sits 11px on top of the App card below) */}
      <View style={styles.prepSection}>
        <IconMeetingPrepArcs size={24} color={DESKTOP_THEME.purple500} />
        <View style={styles.summary}>
          <Text variant="body2Weight" style={styles.summaryTitle}>
            In the last meeting
          </Text>
          {!!truncatedSummary && (
            <Text variant="body2LongRegular" style={styles.summaryBody}>
              {truncatedSummary}
              {isTruncated && (
                <Text variant="body2LongRegular" style={styles.readMore}>
                  {" "}
                  Read more
                </Text>
              )}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom: App card (behind, with 11px overlap) */}
      {taskCount > 0 && (
        <View style={styles.actionItems}>
          <MeetingPrepActionItems
            participants={participants}
            taskCount={taskCount}
          />
        </View>
      )}
    </Pressable>
  );

  return createPortal(content, document.body);
};

const styles = createStyles({
  card: {
    position: "fixed" as "absolute",
    width: 388,
    zIndex: 10000,
    flexDirection: "column",
    alignItems: "flex-start",
    boxShadow: DESKTOP_FLOATING_SHADOW,
  },
  prepSection: {
    width: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: DESKTOP_THEME.grey950,
    borderRadius: 12,
    // Overlap the App card by 11px while sitting on top of it
    marginBottom: -11,
    zIndex: 1,
  },
  summary: {
    width: "100%",
    gap: 4,
  },
  summaryTitle: {
    color: DESKTOP_THEME.grey500,
    letterSpacing: -0.16,
  },
  summaryBody: {
    color: DESKTOP_THEME.grey550,
    letterSpacing: -0.16,
    lineHeight: 24,
  },
  readMore: {
    color: DESKTOP_THEME.grey500,
    textDecorationLine: "underline",
  },
  actionItems: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: DESKTOP_THEME.grey1050,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 0,
  },
});
