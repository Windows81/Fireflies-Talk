import { type FC } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, vars } from "@/styles";
import { GetMeetingPrepDocument } from "@firefliesai/mobile-ff.graphql-client";
import { format, isSameYear } from "date-fns";
import { useQuery } from "@apollo/client";
import { Markdown, type MarkdownStyle } from "@/components/Markdown";
import { Avatar } from "@/components/Avatar";
import { EnrichDomainsDocument } from "@/graphql";
import { EnrichedDomainsSection } from "./EnrichedDomainsSection";

interface MeetingPrepProps {
  meetingId: string;
  isModal?: boolean;
}

interface BulletGistItemProps {
  bullet: {
    title: string;
    sentence: string;
  };
}

export const BulletGistItem: FC<BulletGistItemProps> = ({ bullet }) => {
  return (
    <View style={styles.bulletItem}>
      <Text variant="body2LongWeight" color="textSecondary">
        {bullet.title}
      </Text>
      <Text variant="body2LongRegular" color="textSecondary">
        {bullet.sentence}
      </Text>
    </View>
  );
};

interface IBulletGist {
  title: string;
  sentence: string;
}

const breakIntoLines = (value: string): string[] => {
  if (!value) return [];
  return value.split("\n").map((line) => line.replaceAll("**", ""));
};

const buildBulletGist = (value: string): IBulletGist[] => {
  const lines = breakIntoLines(value)
    .map((line) => {
      if (!line.length) return;
      const emojiEndIndex = line.indexOf(" ", 0);
      if (emojiEndIndex === -1) return;

      const title = line.slice(emojiEndIndex + 1, line.indexOf(":")).trim();
      const sentence = line.slice(line.indexOf(":") + 2).trim();
      return { title, sentence };
    })
    .filter((x): x is IBulletGist => Boolean(x));

  return lines;
};

const markdownStyle: Partial<MarkdownStyle> = {
  body: {
    ...vars.typography.body2Regular,
  },
  em: {
    ...vars.typography.body2Regular,
  },
  strong: {
    ...vars.typography.body2Weight,
  },
};

export const MeetingPrep: FC<MeetingPrepProps> = ({ meetingId, isModal }) => {
  const theme = useTheme();

  const { data, loading, error } = useQuery(GetMeetingPrepDocument, {
    variables: { meetingId },
  });

  const meetingPrep = data?.getMeetingPrep;
  const lastMeetingId = meetingPrep?.lastMeeting?.id;

  const { data: enrichDomainsData, loading: enrichDomainsLoading } = useQuery(
    EnrichDomainsDocument,
    {
      variables: { meetingId: lastMeetingId || meetingId },
      skip: !lastMeetingId && !meetingId,
    },
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={theme.colors.textHint} />
        <Text
          variant="body2LongRegular"
          color="textHint"
          style={styles.loadingText}
        >
          Loading meeting preparation...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text
          variant="body2LongRegular"
          color="interactiveDangerPrimaryDefault"
        >
          Failed to load meeting prep
        </Text>
      </View>
    );
  }

  const meetingInfo = meetingPrep?.meetingInfo;
  const lastMeeting = meetingPrep?.lastMeeting;

  if (
    (!lastMeeting || !meetingInfo) &&
    !enrichDomainsData?.enrichDomains?.length
  ) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="body2LongRegular" color="textHint">
          No meeting prep available
        </Text>
      </View>
    );
  }

  const { ownerProfile, organizerEmail } = meetingInfo || {};
  const { name, picture } = ownerProfile || {};

  // Format dates
  const formatMeetingDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const isInSameYear = isSameYear(date, new Date());
    const dateFormat = isInSameYear
      ? "E, MMM d · h:mm a"
      : "E, MMM d, yyyy · h:mm a";
    return format(date, dateFormat);
  };

  const lastMeetingDate = lastMeeting?.startTime
    ? formatMeetingDate(lastMeeting.startTime)
    : null;

  const shouldShowPrepMetaData =
    lastMeeting?.brief?.bulletGist || lastMeeting?.brief?.overview;

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
      <View style={styles.container}>
        {shouldShowPrepMetaData && (
          <>
            {/* Meeting Info Section */}
            <View style={styles.section}>
              {/* Owner Info Row */}
              <View style={styles.ownerInfoRow}>
                <View
                  style={isModal ? styles.inlineOwnerInfo : styles.ownerInfo}
                >
                  {/* Avatar and Name */}
                  {picture && (name || organizerEmail) && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Avatar
                        name={name || organizerEmail}
                        picture={picture}
                        size={isModal ? 20 : 24}
                        shape="square"
                      />
                      <Text variant="body2LongRegular" color="textMuted">
                        {name || organizerEmail}
                      </Text>
                    </View>
                  )}

                  {/* Last Meeting Date Header */}
                  {lastMeetingDate && (
                    <View
                      style={
                        isModal
                          ? styles.lastMeetingModalBadge
                          : styles.lastMeetingDateBadge(theme)
                      }
                    >
                      <Text variant="body2LongRegular" color="textHint">
                        {lastMeetingDate}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            {lastMeeting?.title && (
              <View style={styles.lastMeetingHeader(theme)}>
                <Text variant="body2LongRegular" color="textHint">
                  From last meeting {lastMeeting?.title}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Last Meeting Section */}
        {lastMeeting && lastMeeting.id && (
          <View style={styles.section}>
            {/* Overview */}
            {!lastMeeting?.brief?.bulletGist && lastMeeting.brief?.overview && (
              <View style={styles.overviewContainer}>
                <Markdown color="textSecondary" style={markdownStyle}>
                  {lastMeeting.brief.overview}
                </Markdown>
              </View>
            )}
            {lastMeeting?.brief?.bulletGist && (
              <View style={styles.bulletGistContainer}>
                {buildBulletGist(lastMeeting.brief.bulletGist).map((bullet) => (
                  <BulletGistItem key={bullet.title} bullet={bullet} />
                ))}
              </View>
            )}
          </View>
        )}
        <EnrichedDomainsSection
          enrichedDomains={enrichDomainsData?.enrichDomains}
          loading={enrichDomainsLoading}
          shouldShowPrepMetaData={!!shouldShowPrepMetaData}
        />
      </View>
    </ScrollView>
  );
};

const styles = createStyles({
  scrollView: {
    flex: 1,
  },
  container: {
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    maxWidth: 720,
    alignSelf: "center",
    width: "100%",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
  },
  section: {
    gap: 12,
  },
  ownerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineOwnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  lastMeetingDateBadge: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  }),
  lastMeetingHeader: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: theme.colors.layerSubtle,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  }),
  lastMeetingModalBadge: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  overviewContainer: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: "column",
    width: "100%",
  },
  bulletGistContainer: {
    flexDirection: "column",
    width: "100%",
    gap: 12,
    flex: 1,
  },
});
