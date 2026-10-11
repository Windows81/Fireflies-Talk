import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { useAuth } from "@/features/auth";
import { toHrMin } from "@/utils/time";
import {
  useGetComparedMeetingAnalyticsQuery,
  useGetComparedMeetingNotesAnalyticsQuery,
} from "@firefliesai/analytics-ff.graphql-client";
import { useScrollToTop } from "@react-navigation/native";
import { useRef, type FC } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useCanAccessAnalytics } from "../utils";
import { ConversationsTable } from "./ConversationsTable";
import { MultiStatsCard, StatsCard } from "./StatsCard";
import { TimeInConversationsTable } from "./TimeInConversationsTable";

const MeetingAnalytics: FC<{
  dateRange: [Date, Date];
}> = ({ dateRange }) => {
  const { user } = useAuth();

  const canAccessAnalytics = useCanAccessAnalytics();

  const canSeeTeammates = false;
  const { data, error, loading, refetch } = useGetComparedMeetingAnalyticsQuery(
    {
      variables: {
        startTime: dateRange[0].toJSON(),
        endTime: dateRange[1].toJSON(),
      },
      skip: !canAccessAnalytics || !user,
      notifyOnNetworkStatusChange: true,
    },
  );

  const comparedAnalytics = data?.comparedMeetingAnalytics;

  if (!comparedAnalytics && !loading && !!error) {
    return (
      <MessageView
        title="Could not load analytics"
        description={error.message}
        action={<Button onPress={() => refetch()}>Retry</Button>}
        variant="error"
      />
    );
  }

  return (
    <>
      <StatsCard
        title="Total number of conversations"
        value={comparedAnalytics?.teamStats.count}
        diffPct={comparedAnalytics?.teamStats.countDiffPct}
      />
      {canSeeTeammates && (
        <StatsCard
          title="Average conversations per teammate"
          value={comparedAnalytics?.teamStats.averageCount}
          diffPct={comparedAnalytics?.teamStats.averageCountDiffPct}
        />
      )}
      <StatsCard
        title="Total time spent in conversations"
        // duration is in minutes
        value={
          comparedAnalytics?.teamStats.duration &&
          comparedAnalytics.teamStats.duration * 60
        }
        formatter={toHrMin}
        diffPct={comparedAnalytics?.teamStats.durationDiffPct}
      />
      {canSeeTeammates && (
        <>
          <StatsCard
            title="Average time spent in conversations per teammate"
            // duration is in minutes
            value={
              comparedAnalytics?.teamStats.averageDuration &&
              comparedAnalytics.teamStats.averageDuration * 60
            }
            diffPct={comparedAnalytics?.teamStats.averageDurationDiffPct}
            formatter={toHrMin}
          />
          <ConversationsTable />
          <TimeInConversationsTable />
        </>
      )}
    </>
  );
};

const MeetingNoteAnalytics: FC<{
  dateRange: [Date, Date];
}> = ({ dateRange }) => {
  const { user } = useAuth();

  const canSeeTeammates = false;

  const canAccessAnalytics = useCanAccessAnalytics();

  const { data, error, loading, refetch } =
    useGetComparedMeetingNotesAnalyticsQuery({
      variables: {
        startTime: dateRange[0].toJSON(),
        endTime: dateRange[1].toJSON(),
      },
      skip: !canAccessAnalytics || !user,
      notifyOnNetworkStatusChange: true,
    });

  const comparedAnalytics = data?.comparedMeetingNotesAnalytics;

  if (!comparedAnalytics && !loading && !!error) {
    return (
      <MessageView
        title="Could not load analytics"
        description={error.message}
        action={<Button onPress={() => refetch()}>Retry</Button>}
        variant="error"
      />
    );
  }

  return (
    <>
      <StatsCard
        title="Total number of questions asked"
        value={comparedAnalytics?.teamStats.totalQuestions}
        diffPct={comparedAnalytics?.teamStats.totalQuestionsDiffPct}
      />
      <StatsCard
        title="Total number of filler words"
        value={comparedAnalytics?.teamStats.totalFillerWords}
        diffPct={comparedAnalytics?.teamStats.totalFillerWordsDiffPct}
      />
      <StatsCard
        title="Total number of monologues"
        value={comparedAnalytics?.teamStats.totalMonologuesCount}
        diffPct={comparedAnalytics?.teamStats.totalMonologuesDiffPct}
      />
      {canSeeTeammates ? (
        <>
          <StatsCard
            title="Longest monologue"
            value={comparedAnalytics?.teamStats.longestMonologueDurationSec}
            diffPct={
              comparedAnalytics?.teamStats.longestMonologueDurationDiffPct
            }
            formatter={toHrMin}
          />
          {/* <QuestionsAskedTable data={meetingNotes} />
					<FillerWordsTable data={meetingNotes} />
					<NumberOfMonologuesTable data={meetingNotes} />
					<LongestMonologuesTable data={meetingNotes} />
					<TalkToListenRatioSummary value={meetingNotes?.teamStats.averageTalkListenRatio} className="largeCard" />
					<SentimentsInConversationsSummary data={meetingNotes?.teamStats.averageSentiments} className="largeCard" />
					<TalkToListenRatioTable data={meetingNotes} />
					<SilenceDurationTable data={meetingNotes} />
					<WordPerMinuteTable data={meetingNotes} />
					<SentimentsInConversationsTable data={meetingNotes} /> */}
        </>
      ) : (
        <>
          <StatsCard
            title="Longest monologue"
            value={comparedAnalytics?.teamStats.longestMonologueDurationSec}
            diffPct={
              comparedAnalytics?.teamStats.longestMonologueDurationDiffPct
            }
            formatter={toHrMin}
          />
          <MultiStatsCard
            title="Average talk to listen ratio"
            values={[
              {
                color: "rgb(125, 131, 255)",
                label: "Talks",
                value:
                  comparedAnalytics?.teamStats.averageTalkListenRatio &&
                  Math.round(
                    comparedAnalytics.teamStats.averageTalkListenRatio * 100,
                  ),
                suffix: "%",
              },
              {
                color: "rgb(237, 92, 140)",
                label: "Listen",
                value:
                  comparedAnalytics?.teamStats.averageTalkListenRatio &&
                  100 -
                    Math.round(
                      comparedAnalytics.teamStats.averageTalkListenRatio * 100,
                    ),
                suffix: "%",
              },
            ]}
          />
          <StatsCard
            title="Average words spoken per minute (WPM)"
            value={
              comparedAnalytics?.teammates[0]?.analytics.userWordsPerMinute
            }
            diffPct={
              comparedAnalytics?.teammates[0]?.analytics
                .userWordsPerMinuteDiffPct
            }
          />
          <StatsCard
            title="Total silence duration"
            value={
              comparedAnalytics?.teamStats.averageSilenceDuration &&
              comparedAnalytics.teamStats.averageSilenceDuration * 60
            }
            diffPct={comparedAnalytics?.teamStats.averageSilenceDurationDiffPct}
            formatter={toHrMin}
          />
          <MultiStatsCard
            title="Sentiments in conversations"
            values={[
              {
                color: "rgb(56, 142, 59)",
                label: "Positive",
                value:
                  comparedAnalytics?.teamStats.averageSentiments.positivePct ||
                  0,
                suffix: "%",
              },
              {
                color: "rgb(60, 65, 73)",
                label: "Negative",
                value:
                  comparedAnalytics?.teamStats.averageSentiments.negativePct ||
                  0,
                suffix: "%",
              },
              {
                color: "rgb(110, 117, 255)",
                label: "Neutral",
                value:
                  comparedAnalytics?.teamStats.averageSentiments.neutralPct ||
                  0,
                suffix: "%",
              },
            ]}
          />
        </>
      )}
    </>
  );
};

export const AnalyticsTab: FC<{
  dateRange: [Date, Date];
}> = ({ dateRange }) => {
  const ref = useRef<ScrollView | null>(null);

  useScrollToTop(ref);

  return (
    <ScrollView
      ref={ref}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    >
      <MeetingAnalytics dateRange={dateRange} />
      <MeetingNoteAnalytics dateRange={dateRange} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
});
