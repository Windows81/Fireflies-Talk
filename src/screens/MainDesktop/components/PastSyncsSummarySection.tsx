import { useState, type FC } from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/Typography";
import { Avatar } from "@/components/Avatar";
import { createStyles, useTheme } from "@/styles";
import { format, isSameYear } from "date-fns";
import { IconCalendar } from "@/assets/svg";
import { Config } from "@/constants";
import { pluralize } from "@/utils/pluralize";
import { Markdown } from "@/components/Markdown";
import type { PastSyncsSummary } from "@/graphql";

interface PastSyncsSummarySectionProps {
  pastSyncsSummary: PastSyncsSummary;
}

const INITIAL_COUNT = 5;

const formatMeetingDate = (dateString: string) => {
  const date = new Date(dateString);
  const isInSameYearVal = isSameYear(date, new Date());
  return format(date, isInSameYearVal ? "MMM d" : "MMM d, yyyy");
};

export const PastSyncsSummarySection: FC<PastSyncsSummarySectionProps> = ({
  pastSyncsSummary,
}) => {
  const theme = useTheme();
  const { summary, meetings } = pastSyncsSummary;
  const [showAll, setShowAll] = useState(false);

  if (!meetings.length) return null;

  const visibleMeetings = showAll ? meetings : meetings.slice(0, INITIAL_COUNT);
  const remainingCount = meetings.length - INITIAL_COUNT;

  return (
    <View style={styles.container}>
      <Text variant="title2Weight" color="textPrimary">
        {meetings.length} past {pluralize("meeting", meetings.length)} with the
        same people
      </Text>

      {summary && (
        <View style={styles.summarySection}>
          <Text variant="body2Weight" color="textMuted">
            What was discussed:
          </Text>
          <View style={styles.markdownContainer}>
            <Markdown color="textSecondary">{summary}</Markdown>
          </View>
        </View>
      )}

      <View style={styles.meetingsSection}>
        <View style={styles.sourceMeetingsHeader}>
          <IconCalendar width={16} height={16} color={theme.colors.textHint} />
          <Text variant="body2Regular" color="textHint">
            {meetings.length} Source {pluralize("Meeting", meetings.length)}
          </Text>
        </View>

        <View style={styles.meetingsList}>
          {visibleMeetings.map((meeting) => (
            <Pressable
              key={meeting.id}
              style={styles.meetingItem(theme)}
              onPress={() => {
                if (typeof window !== "undefined") {
                  window.open(
                    `${Config.DASHBOARD_URL}/view/${meeting.id}`,
                    "_blank",
                  );
                }
              }}
            >
              <Avatar
                name={meeting.organizerName}
                picture={meeting.organizerPicture || undefined}
                size={32}
                shape="square"
              />
              <View style={styles.meetingInfo}>
                <Text
                  variant="body2Regular"
                  color="textPrimary"
                  numberOfLines={1}
                >
                  {meeting.title}
                </Text>
                <Text variant="body3Regular" color="textHint">
                  {meeting.organizerName} · {formatMeetingDate(meeting.date)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {!showAll && remainingCount > 0 && (
          <Pressable onPress={() => setShowAll(true)}>
            <Text variant="body2Regular" color="textBrand">
              View All
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export const PastSyncsSummaryLoadingSkeleton: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.skeletonTitle(theme)} />
      <View style={styles.skeletonSummary}>
        <View style={styles.skeletonLine(theme)} />
        <View style={styles.skeletonLineShort(theme)} />
      </View>
      <View style={styles.skeletonMeetings}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonMeetingItem}>
            <View style={styles.skeletonAvatar(theme)} />
            <View style={styles.skeletonMeetingInfo}>
              <View style={styles.skeletonLine(theme)} />
              <View style={styles.skeletonLineShort(theme)} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    gap: 16,
  },
  summarySection: {
    gap: 8,
  },
  markdownContainer: {
    marginTop: 4,
  },
  meetingsSection: {
    gap: 12,
    marginTop: 8,
  },
  sourceMeetingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meetingsList: {
    gap: 8,
  },
  meetingItem: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  meetingInfo: {
    flex: 1,
    gap: 2,
  },
  // Loading skeleton styles
  skeletonTitle: (theme) => ({
    height: 20,
    width: "60%",
    borderRadius: 4,
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  skeletonSummary: {
    gap: 8,
  },
  skeletonLine: (theme) => ({
    height: 14,
    width: "100%",
    borderRadius: 4,
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  skeletonLineShort: (theme) => ({
    height: 14,
    width: "70%",
    borderRadius: 4,
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  skeletonMeetings: {
    gap: 8,
    marginTop: 8,
  },
  skeletonMeetingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  skeletonAvatar: (theme) => ({
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
  skeletonMeetingInfo: {
    flex: 1,
    gap: 4,
  },
});
