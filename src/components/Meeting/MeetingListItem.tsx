import { IconChevronRight } from "@/assets/svg";
import type { Source } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { format, isValid } from "date-fns";
import { type FC } from "react";
import { View } from "react-native";
import { Avatar } from "../Avatar";
import { SkeletonLoading } from "../Loading";
import { Text } from "../Typography";
import { HighlightedText } from "./HighlightedText";
import { MeetingAddedByIcon } from "./MeetingAddedByIcon";

interface MeetingListItemProps {
  meeting: Source;
  /** Tighter vertical spacing, used in grouped search results. */
  compact?: boolean;
}

const now = new Date();

export const MEETING_LIST_ITEM_HEIGHT = 114;

export const MeetingListItem: FC<MeetingListItemProps> = ({
  meeting,
  compact,
}) => {
  const theme = useTheme();
  const date = meeting.date ? new Date(meeting.date) : null;
  const isSameYear = date?.getFullYear() === now.getFullYear();

  const meetingCreatorName =
    meeting.creatorProfile?.name || meeting.creator_email;
  const organizerFirstName =
    meeting.creatorProfile?.name?.trim().split(/\s+/)[0] ||
    meeting.creator_email;
  const durationMins = Math.round(
    meeting.durationMins || meeting.duration || 0,
  );
  const dateLabel =
    date && isValid(date)
      ? format(date, isSameYear ? "MMM d" : "MMM d, yyyy")
      : "";
  const highlightedTitle = compact ? meeting._highlight?.title?.[0] : undefined;

  return (
    <View style={compact ? styles.rootCompact : styles.root}>
      <View style={styles.container}>
        <View style={styles.meta}>
          <Avatar
            size={40}
            name={meetingCreatorName}
            picture={meeting.creatorProfile?.picture}
            shape="square"
          />
          <View style={styles.content}>
            <View style={styles.titleWrapper}>
              {highlightedTitle ? (
                <HighlightedText
                  sentence={highlightedTitle}
                  color="textPrimary"
                  variant="title3Weight"
                  numberOfLines={1}
                  style={styles.title}
                />
              ) : (
                <Text
                  variant="title3Weight"
                  numberOfLines={1}
                  style={styles.title}
                >
                  {meeting.title}
                </Text>
              )}
              <MeetingAddedByIcon meeting={meeting} iconOnly />
            </View>
            {compact ? (
              <View style={styles.sub}>
                {!!organizerFirstName && (
                  <>
                    <Text
                      variant="body2Regular"
                      color="textMuted"
                      numberOfLines={1}
                      style={styles.organizer}
                    >
                      {organizerFirstName}
                    </Text>
                    <Text variant="body2Regular" color="textMuted">
                      ·
                    </Text>
                  </>
                )}
                {!!dateLabel && (
                  <>
                    <Text variant="body2Regular" color="textMuted">
                      {dateLabel}
                    </Text>
                    <Text variant="body2Regular" color="textMuted">
                      ·
                    </Text>
                  </>
                )}
                <Text variant="body2Regular" color="textMuted">
                  {durationMins} mins
                </Text>
              </View>
            ) : (
              <>
                <Text variant="body2Regular" color="textMuted">
                  {meetingCreatorName}
                </Text>
                <View style={styles.sub}>
                  <Text variant="body2Regular" color="textMuted">
                    {!!date &&
                      isValid(date) &&
                      format(
                        date,
                        isSameYear ? "MMM d · h:mm a" : "MMM d, yyyy · h:mm a",
                      )}
                  </Text>
                  <Text variant="body2Regular" color="textMuted">
                    ·
                  </Text>
                  <Text color="textMuted" variant="body2Regular">
                    {durationMins} mins
                  </Text>
                </View>
              </>
            )}
          </View>
          {compact && (
            <IconChevronRight
              width={20}
              height={20}
              color={theme.colors.textMuted}
              style={styles.chevron}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export const LoadingMeetingListItem: FC = () => {
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <View style={styles.meta}>
          <SkeletonLoading width={40} height={40} variant="rounded" />
          <View style={styles.contentLoading}>
            <SkeletonLoading width={220} height={18} />
            <SkeletonLoading width={100} height={16} />
            <View style={styles.sub}>
              <SkeletonLoading width={50} height={16} />
              <SkeletonLoading width={60} height={16} />
              <SkeletonLoading width={45} height={16} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    minHeight: MEETING_LIST_ITEM_HEIGHT,
    paddingVertical: 10,
    justifyContent: "center",
  },
  rootCompact: {
    paddingVertical: 6,
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 8,
    flexDirection: "column",
    gap: 8,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  contentLoading: {
    flex: 1,
    gap: 4,
  },
  sub: {
    flexDirection: "row",
    gap: 4,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    flexShrink: 1,
  },
  organizer: {
    flexShrink: 1,
  },
  chevron: {
    alignSelf: "center",
  },
});
