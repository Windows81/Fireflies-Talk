import { IconClose, IconMeetingPrepArcs } from "@/assets/svg";
import { useHoverWithin } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { type FC, useRef } from "react";
import { Pressable, View } from "react-native";
import { MeetingPrepActionItems } from "@/screens/MainDesktop/components/MeetingBanner/MeetingPrepActionItems";
import { useMeetingPrepSummary } from "@/screens/MainDesktop/hooks/useMeetingPrepSummary";

// Tuned so the truncated summary plus "Read more" lands within the 3-line cap
// at the realtime panel's notes width.
const SUMMARY_CHAR_LIMIT = 150;

interface MeetingPrepBannerProps {
  meetingId: string;
  onPress: () => void;
  onDismiss: () => void;
}

/**
 * "In the last meeting" banner shown above the notes editor in the realtime
 * panel when meeting prep is available for the current meeting. Tapping it opens
 * the full meeting prep screen; a close button (revealed on hover) dismisses it.
 */
export const MeetingPrepBanner: FC<MeetingPrepBannerProps> = ({
  meetingId,
  onPress,
  onDismiss,
}) => {
  const theme = useTheme();
  const cardRef = useRef<View>(null);
  // Coordinate-based hover (not enter/leave) so revealing the close button
  // and moving over the inner Pressables can't make the hover state flicker.
  const isHovered = useHoverWithin(cardRef);
  const { truncatedSummary, isTruncated, taskCount, participants, hasContent } =
    useMeetingPrepSummary(undefined, undefined, SUMMARY_CHAR_LIMIT, meetingId);

  if (!hasContent) return null;

  return (
    // Plain View wrapper: the close button sits as a sibling of the openable
    // area so pressing it can't also open prep.
    <View ref={cardRef} style={styles.card(theme)}>
      <Pressable style={styles.pressable} onPress={onPress}>
        <View style={styles.leading}>
          <IconMeetingPrepArcs size={24} />
          <View style={styles.content}>
            <View style={styles.summary}>
              <Text variant="body1Weight" color="textSecondary">
                In the last meeting
              </Text>
              {!!truncatedSummary && (
                <Text
                  variant="body2LongRegular"
                  color="textHint"
                  numberOfLines={3}
                >
                  {truncatedSummary}
                  {isTruncated && (
                    <Text
                      variant="body2LongRegular"
                      color="textSecondary"
                      style={styles.readMore}
                    >
                      {" "}
                      Read more
                    </Text>
                  )}
                </Text>
              )}
            </View>
            <MeetingPrepActionItems
              participants={participants}
              taskCount={taskCount}
              showArrow
            />
          </View>
        </View>
      </Pressable>
      {/* Always mounted so revealing it on hover can't disrupt hover tracking
          (a conditionally-mounted child under the cursor causes flicker). */}
      <Pressable
        style={[styles.closeButton, { opacity: isHovered ? 1 : 0 }]}
        pointerEvents={isHovered ? "auto" : "none"}
        onPress={onDismiss}
        hitSlop={8}
        aria-label="Dismiss"
        role="button"
      >
        <IconClose
          color={theme.colors.commandHintDefault}
          width={16}
          height={16}
        />
      </Pressable>
    </View>
  );
};

const styles = createStyles({
  card: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Default,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 12,
    // Extra gap from the notes navigation menu on the right.
    marginRight: 16,
    overflow: "hidden",
  }),
  // paddingVertical lives here (not on `card`) so the whole visual card,
  // including its top/bottom bands, stays part of the Pressable hit area.
  pressable: {
    paddingVertical: 20,
  },
  leading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    gap: 24,
  },
  summary: {
    gap: 4,
  },
  readMore: {
    textDecorationLine: "underline",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
});
