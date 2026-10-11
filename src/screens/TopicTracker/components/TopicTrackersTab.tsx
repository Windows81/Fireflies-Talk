import { MessageView } from "@/components/Message";
import { QueryListView } from "@/components/QueryListView";
import { toast } from "@/components/Toast";
import type { ListRenderItem } from "@shopify/flash-list";
import type { FC } from "react";
import { useCallback } from "react";
import { StyleSheet } from "react-native";

import {
  type Teammate,
  TopicType,
  useFetchMore,
  useGetCategoriesQuery,
  type Categories,
} from "@/graphql";
import { TopicTrackerCard } from "./TopicTrackerCard";
import { LoadingTopicTrackers } from "./LoadingTopicTrackers";

const QUERY_LIMIT = 20;

type TopicTrackersTabProps = {
  topicType: TopicType;
  isAdmin: boolean;
  teammates?: Array<Teammate | null> | null;
  freeUser: boolean;
};

export const TopicTrackersTab: FC<TopicTrackersTabProps> = ({
  topicType,
  isAdmin,
  teammates,
  freeUser,
}) => {
  const { data, loading, fetchMore, refetch, error } = useGetCategoriesQuery({
    variables: {
      limit: QUERY_LIMIT,
      type: topicType,
    },
    fetchPolicy: "cache-and-network",
    onError(err) {
      toast({
        title: "Could not load topics",
        message: err.message,
        type: "error",
      });
    },
    skip: freeUser,
  });

  const [onLoadMore, fetchMoreState] = useFetchMore({
    fetchMore,
    data,
    limit: QUERY_LIMIT,
    path: "categories",
  });

  const renderItem = useCallback<ListRenderItem<Categories>>(
    ({ item }) => (
      <TopicTrackerCard
        category={item}
        teammates={teammates}
        isAdmin={isAdmin}
        myTopics={topicType === TopicType.Mine}
      />
    ),
    [teammates, isAdmin, topicType],
  );

  return (
    <QueryListView
      data={data?.getCategories?.nodes ?? []}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      refetch={refetch}
      onLoadMore={onLoadMore}
      fetchMoreState={fetchMoreState}
      LoadingItemComponent={LoadingTopicTrackers}
      emptyState={
        <MessageView
          title="There isn't any topics yet"
          description="Creating topics helps you search and highlight relevant parts of meetings quickly in the smart search panel"
        />
      }
      errorStateTitle="Could not load topics"
      loading={loading}
      error={error}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 12,
    paddingBottom: 70,
  },
  listHeader: {
    paddingHorizontal: 16,
  },
});
