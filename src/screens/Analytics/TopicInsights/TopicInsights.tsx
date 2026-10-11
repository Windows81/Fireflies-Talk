import { Button } from "@/components/Button";
import { LoadingScreen } from "@/components/Loading";
import { MessageView } from "@/components/Message";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import type { Topics } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useGetTopicInsightsQuery } from "@firefliesai/analytics-ff.graphql-client";
import { useScrollToTop } from "@react-navigation/native";
import type { FC } from "react";
import { useMemo, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useCanAccessAnalytics } from "../utils";

const TopicInsightCard: FC<{
  topic: Topics;
}> = ({ topic }) => {
  const keywords = useMemo(
    () => [...topic.keywords].sort((a, b) => b.conversations - a.conversations),
    [topic.keywords],
  );

  const heighest = topic.keywords.reduce(
    (prev, curr) => (curr.conversations > prev ? curr.conversations : prev),
    0,
  );

  const theme = useTheme();

  return (
    <View style={styles.card(theme)}>
      <Text fontSize={16} fontWeight="500" style={styles.topicTitle}>
        # {topic.topic}
      </Text>
      <View style={styles.cardHeader}>
        <Text style={styles.columnKeyword} color="textMuted">
          Keywords
        </Text>
        <Text style={styles.columnCoversation} color="textMuted">
          Conversations
        </Text>
        <Text style={styles.columnMention} color="textMuted">
          Mentions
        </Text>
      </View>
      <View style={styles.keywords}>
        {keywords.map((keyword) => (
          <View style={styles.cardRow} key={keyword.subtopic}>
            <View
              style={[
                styles.comparedBackground(theme),
                { width: `${(keyword.conversations / heighest) * 100}%` },
              ]}
            />
            <Text style={styles.columnKeyword} numberOfLines={1}>
              {keyword.subtopic}
            </Text>
            <Text
              style={[styles.columnCoversation, styles.columnValue]}
              numberOfLines={1}
            >
              {keyword.conversations}
            </Text>
            <Text
              style={[styles.columnMention, styles.columnValue]}
              numberOfLines={1}
            >
              {keyword.mentions}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const TopicInsightsTab: FC<{
  dateRange: [Date, Date];
}> = ({ dateRange }) => {
  const { user } = useAuth();

  const canAccessAnalytics = useCanAccessAnalytics();

  const { data, loading, error, refetch } = useGetTopicInsightsQuery({
    variables: {
      startTime: dateRange[0].toJSON(),
      endTime: dateRange[1].toJSON(),
    },
    skip: !canAccessAnalytics || !user,
    notifyOnNetworkStatusChange: true,
  });

  const ref = useRef<ScrollView>(null);

  useScrollToTop(ref);

  if (loading) return <LoadingScreen />;

  if (!data && !!error) {
    return (
      <MessageView
        title="Could not load topic insights"
        description={error.message}
        action={<Button onPress={() => refetch()}>Retry</Button>}
        variant="error"
      />
    );
  }

  return (
    <ScrollView
      ref={ref}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    >
      {data?.getTopicInsights?.topics.map((topic, index) => (
        <Animated.View
          key={topic.topic}
          entering={FadeInDown.duration(300).delay(index * 100)}
        >
          <TopicInsightCard topic={topic} />
        </Animated.View>
      ))}
    </ScrollView>
  );
};

const styles = createStyles({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  cardRow: {
    flexDirection: "row",
    gap: 8,
    height: 27,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  topicTitle: {
    marginBottom: 12,
  },
  columnKeyword: {
    flex: 1,
  },
  columnCoversation: {
    width: 96,
  },
  columnMention: {
    width: 62,
  },
  columnValue: {
    textAlign: "center",
  },
  keywords: {
    flexDirection: "column",
    gap: 12,
  },
  card: (theme) => ({
    backgroundColor: theme.colors.layerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  }),
  comparedBackground: (theme) => ({
    backgroundColor: theme.colors.layerBrandLight2,
    position: "absolute",
    width: "50%",
    height: "100%",
  }),
});
