import { IconCheckSquare, IconNotesGreen, IconVideo } from "@/assets/svg";
import { Placeholder } from "@/components/Placeholder";
import { LinkText, Text } from "@/components/Typography";
import { Config } from "@/constants";
import {
  type EnrichDomainsQuery,
  type EnrichedDomainFieldsFragment,
  type FeedMeeting,
  type MeetingPrepOutputFieldsFragment,
  useGetMeetingPrepOutputLazyQuery,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import type {
  CoreFeedMeetingFieldsFragment,
  CoreTaskFieldsFragment,
} from "@firefliesai/tasks-ff.graphql-client";
import { format, isSameYear } from "date-fns";
import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useEnrichDomain } from "src/hooks/useEnrichDomain";
import { EnrichedDomainsSection } from "src/screens/Live/components/EnrichedDomainsSection";
import { ListTaskItem } from "../../Home/Tasks/components/ListTaskItem/ListTaskItem";
import {
  PastSyncsSummaryLoadingSkeleton,
  PastSyncsSummarySection,
} from "./PastSyncsSummarySection";

interface MeetingPrepBodyProps {
  /** Meeting id whose prep output is fetched. */
  meetingId?: string | null;
  /** Calendar iCalUID, used only for the company-insights enrich fallback. */
  iCalUID?: string | null;
  /** Past meeting to fall back to before the prep query resolves. */
  lastMeetingFallback?: FeedMeeting | null;
  /** Whether external participant domains exist (gates the enrich fallback). */
  hasExternalDomains?: boolean;
  // When false, only the key-takeaways summary is shown — no tasks, company
  // insights, or past-syncs. The realtime panel uses this lean view.
  showDetails?: boolean;
}

/**
 * Adapts companyInsights from the getMeetingPrepOutput query to the
 * EnrichedOrganization shape expected by EnrichedDomainsSection.
 */
const adaptCompanyInsights = (
  companyInsights: EnrichedDomainFieldsFragment[] | null | undefined,
): EnrichDomainsQuery["enrichDomains"] => {
  if (!companyInsights) return undefined;
  return companyInsights.map((insight) => ({
    __typename: "EnrichedOrganization" as const,
    _id: insight.domain,
    domain: insight.domain,
    name: insight.name,
    description: insight.description,
    recentHeadlines: insight.recentHeadlines.map((h) => ({
      __typename: "RecentHeadline" as const,
      emoji: h.emoji,
      title: h.title,
      content: h.content,
      occurredAt: h.occurredAt,
    })),
  }));
};

const formatMeetingDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const dateFormat = isSameYear(date, new Date())
    ? "MMM d, h:mm a"
    : "MMM d, yyyy · h:mm a";
  return format(date, dateFormat);
};

/**
 * The shared meeting prep content: "From last <meeting>" header, key takeaways,
 * tasks, company insights, and past syncs summary. Driven entirely by a
 * meetingId so it can be embedded behind the desktop home meeting-info card or
 * inside the realtime panel notes view.
 */
export const MeetingPrepBody: FC<MeetingPrepBodyProps> = ({
  meetingId,
  iCalUID,
  lastMeetingFallback,
  hasExternalDomains = false,
  showDetails = true,
}) => {
  const theme = useTheme();

  const [getMeetingPrepOutput] = useGetMeetingPrepOutputLazyQuery();
  const [meetingPrepData, setMeetingPrepData] =
    useState<MeetingPrepOutputFieldsFragment | null>(null);
  const [meetingPrepLoading, setIsMeetingPrepLoading] = useState(
    Boolean(meetingId),
  );
  const prepRequestRef = useRef(0);

  useEffect(() => {
    prepRequestRef.current += 1;
    const requestId = prepRequestRef.current;

    if (!meetingId) {
      setMeetingPrepData(null);
      setIsMeetingPrepLoading(false);
      return;
    }

    setMeetingPrepData(null);
    setIsMeetingPrepLoading(true);

    const fetchMeetingPrep = async () => {
      try {
        const { data } = await getMeetingPrepOutput({
          variables: { input: { meetingId } },
        });

        if (prepRequestRef.current !== requestId) return;
        setMeetingPrepData(data?.getMeetingPrepOutput ?? null);
      } catch {
        // Query failed — fall back to the provided lastMeeting (if any).
      } finally {
        if (prepRequestRef.current === requestId) {
          setIsMeetingPrepLoading(false);
        }
      }
    };

    void fetchMeetingPrep();
  }, [meetingId, getMeetingPrepOutput]);

  // Build the lastMeeting object: prefer prep data, fall back to the provided one.
  const lastMeeting = useMemo((): FeedMeeting | null | undefined => {
    if (meetingPrepData?.pastNotes) {
      const pastNotes = meetingPrepData.pastNotes;
      return {
        ...(lastMeetingFallback || {}),
        _id: pastNotes.meetingId || lastMeetingFallback?._id || "",
        title: pastNotes.title || lastMeetingFallback?.title || "",
        startTime: pastNotes.startTime || lastMeetingFallback?.startTime,
        summary: pastNotes.bulletGist
          ? pastNotes.bulletGist.map((item) => ({
              __typename: "FeedSummary" as const,
              emoji: item.emoji,
              sentence: item.sentence,
              title: item.title,
            }))
          : (lastMeetingFallback?.summary ?? []),
        tasks: (pastNotes.tasks ||
          lastMeetingFallback?.tasks ||
          []) as FeedMeeting["tasks"],
        organizerEmail: lastMeetingFallback?.organizerEmail || "",
        participantsProfiles: lastMeetingFallback?.participantsProfiles || [],
        promptSuggestions: lastMeetingFallback?.promptSuggestions || [],
      } as FeedMeeting;
    }
    return lastMeetingFallback;
  }, [meetingPrepData, lastMeetingFallback]);

  // Company insights: prefer prep data, fall back to the enrichDomains query.
  const useMutationCompanyInsights = !!meetingPrepData?.companyInsights?.length;

  const { data: enrichDomainsData, loading: enrichDomainsLoading } =
    useEnrichDomain({
      iCalUID: iCalUID || undefined,
      meetingId: lastMeeting?._id || undefined,
      skip:
        useMutationCompanyInsights ||
        !hasExternalDomains ||
        (!iCalUID && !lastMeeting?._id),
      fetchPolicy: "cache-and-network",
      errorPolicy: "none",
    });

  const companyInsightsData = useMutationCompanyInsights
    ? adaptCompanyInsights(meetingPrepData?.companyInsights)
    : enrichDomainsData;
  const companyInsightsLoading = useMutationCompanyInsights
    ? false
    : enrichDomainsLoading;

  const pastSyncsSummary = meetingPrepData?.pastSyncsSummary;

  if (
    !meetingPrepLoading &&
    !lastMeeting &&
    !companyInsightsData?.length &&
    !pastSyncsSummary?.meetings?.length
  ) {
    return (
      <Placeholder
        style={styles.emptyState}
        icon={<IconNotesGreen width={48} height={48} />}
        title="Meeting prep is not available"
        description="You can still get key talking points, follow-ups and more in seconds with AskFred."
      />
    );
  }

  const {
    title: lastMeetingTitle,
    startTime,
    tasks,
    summary,
  } = lastMeeting || {};
  const lastMeetingDate = startTime ? formatMeetingDate(startTime) : null;

  return (
    <View style={styles.body}>
      {/* Last Meeting Section */}
      {!meetingPrepLoading && lastMeeting?._id && (
        <View style={styles.section}>
          <View style={styles.lastMeetingHeader(theme)}>
            <IconVideo
              width={20}
              height={20}
              color={theme.colors.rainbowStaticPinkSolid}
            />
            <Text variant="body2Regular" color="textMuted">
              From last{" "}
              <LinkText
                variant="body2Regular"
                color="textPrimary"
                style={styles.link}
                href={`${Config.DASHBOARD_URL}/view/${lastMeeting._id}`}
              >
                {lastMeetingTitle}
              </LinkText>
            </Text>
            {lastMeetingDate && (
              <Text
                variant="body2Regular"
                color="textHint"
                style={styles.lastMeetingDate}
              >
                {lastMeetingDate}
              </Text>
            )}
          </View>

          {summary && summary.length > 0 && (
            <View style={styles.summaryContainer}>
              {summary.map((item, index) => (
                <View key={index} style={styles.summaryItem}>
                  {item.title && (
                    <Text variant="body2Weight" color="textSecondary">
                      {item.title}
                    </Text>
                  )}
                  {item.sentence && (
                    <Text variant="body2Regular" color="textSecondary">
                      {item.sentence}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {showDetails && tasks && tasks.length > 0 && (
            <View style={styles.tasksSection}>
              <View style={styles.tasksSectionHeader}>
                <View style={styles.tasksHeaderContent}>
                  <IconCheckSquare
                    width={16}
                    height={16}
                    color={theme.colors.textPrimary}
                  />
                  <Text variant="body2Regular" color="textPrimary">
                    {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
                  </Text>
                </View>
              </View>
              <View style={styles.tasksContainer(theme)}>
                {tasks.map((task) => (
                  <ListTaskItem
                    key={task.id}
                    meeting={lastMeeting as CoreFeedMeetingFieldsFragment}
                    task={task as CoreTaskFieldsFragment}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Company Insights / Enriched Domains Section */}
      {showDetails && (
        <View style={styles.enrichedDomainsSection}>
          <EnrichedDomainsSection
            enrichedDomains={companyInsightsData}
            loading={companyInsightsLoading}
          />
        </View>
      )}

      {/* Past Syncs Summary Section */}
      {showDetails &&
        meetingPrepLoading &&
        !pastSyncsSummary?.meetings?.length && (
          <PastSyncsSummaryLoadingSkeleton />
        )}
      {showDetails &&
      !meetingPrepLoading &&
      pastSyncsSummary?.meetings?.length ? (
        <PastSyncsSummarySection pastSyncsSummary={pastSyncsSummary} />
      ) : null}
    </View>
  );
};

const styles = createStyles({
  body: {
    gap: 32,
    width: "100%",
  },
  emptyState: {
    flex: 1,
    paddingVertical: 40,
    minHeight: 200,
  },
  section: {
    gap: 20,
  },
  lastMeetingHeader: (theme) => ({
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: theme.colors.interactiveSecondaryHover,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  }),
  link: {
    textDecorationLine: "underline",
  },
  lastMeetingDate: { flex: 1, textAlign: "right" },
  summaryContainer: {
    marginLeft: 20,
    marginTop: 20,
    gap: 16,
  },
  summaryItem: {
    gap: 8,
  },
  enrichedDomainsSection: {
    marginLeft: 20,
  },
  tasksSection: {
    gap: 16,
    marginTop: 16,
  },
  tasksSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tasksHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tasksContainer: (theme) => ({
    gap: 0,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticPage,
  }),
});
