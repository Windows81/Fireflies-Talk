import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { MessageView } from "@/components/Message";
import { RefreshControl } from "@/components/RefreshControl";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import { useOfflineFeedSnapshot } from "@/features/downloads";
import { useRemoteConstants } from "@/features/remote-constants";
import type { CoreFeedMeetingFieldsFragment } from "@/graphql";
import { useFetchMore, useGetFeedMeetingsQuery } from "@/graphql";
import { createStyles } from "@/styles";
import { pluralize } from "@/utils/pluralize";
import { useScrollToTop } from "@react-navigation/native";
import { useNetworkState } from "@/utils/network";
import { useMemo, useRef, type FC } from "react";
import type { FlatListProps, ListRenderItem } from "react-native";
import { FlatList, View } from "react-native";
import { FeedEmptyState } from "./components/FeedEmptyState";
import {
  FeedMeetingCard,
  LoadingFeedMeetingCard,
} from "./components/FeedMeetingCard";
import { FeedSectionHeader } from "./components/FeedSectionHeader";
import { useAppReviewPrompt } from "@/features/app-review";

const LIMIT = 20;

const renderItems: ListRenderItem<CoreFeedMeetingFieldsFragment> = ({
  item,
}) => (
  <LinkView
    href={{
      pathname: RouteNames.Notepad,
      params: { id: item._id, ref: "feed" },
    }}
    animated
  >
    <FeedMeetingCard meeting={item} />
  </LinkView>
);

const loadingFeedMeetingCards = (
  <View>
    {Array.from({ length: 3 }).map((_, index) => (
      <LoadingFeedMeetingCard key={index} />
    ))}
  </View>
);

export const Feed: FC<{
  ListHeaderComponent?: React.ReactElement;
  onScroll?: FlatListProps<CoreFeedMeetingFieldsFragment>["onScroll"];
}> = ({ ListHeaderComponent, onScroll }) => {
  const { user } = useAuth();
  const { DEMO_MEETING_ID } = useRemoteConstants();

  const { data, fetchMore, loading, refetch, error } = useGetFeedMeetingsQuery({
    skip: !user,
    notifyOnNetworkStatusChange: true,
  });

  const [onLoadMore, fetchMoreState] = useFetchMore({
    data,
    fetchMore,
    limit: LIMIT,
    path: "getFeedMeetings.meetings",
  });

  const serverMeetings = data?.getFeedMeetings.meetings;

  // Offline mode: render the persisted first feed page when the query
  // can't reach the server
  const networkState = useNetworkState();
  const offlineFallbackWanted =
    !serverMeetings &&
    (!!error?.networkError || networkState.isInternetReachable === false);
  const feedSnapshot = useOfflineFeedSnapshot(offlineFallbackWanted);
  const meetings =
    serverMeetings ??
    (offlineFallbackWanted ? (feedSnapshot ?? undefined) : undefined);

  const visibleMeetings = useMemo(
    () => (meetings || []).filter((meeting) => meeting.summary.length > 0),
    [meetings],
  );

  useAppReviewPrompt(!loading && !error && !!meetings?.length);

  const listRef = useRef<FlatList>(null);

  useScrollToTop(listRef);

  const isDemoMeeting = meetings?.[0]?._id === DEMO_MEETING_ID;

  const shouldShowLoadingState = Boolean(loading && !meetings?.length);
  const shouldShowErrorState = Boolean(!loading && error && !meetings);

  const shouldShowEmptyState =
    !loading && (isDemoMeeting || !visibleMeetings.length);

  const feedHeader =
    !shouldShowEmptyState && visibleMeetings.length > 0 ? (
      <View style={styles.feedHeader}>
        <FeedSectionHeader
          label="Recent"
          subLabel={`${visibleMeetings.length} ${pluralize(
            "meeting",
            visibleMeetings.length,
          )}`}
          isRecent
        />
      </View>
    ) : null;

  return (
    <FlatList
      ref={listRef}
      scrollEnabled={!shouldShowLoadingState}
      contentContainerStyle={styles.container}
      data={visibleMeetings}
      keyExtractor={(meeting) => meeting._id}
      renderItem={renderItems}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          {feedHeader}
        </>
      }
      ListEmptyComponent={
        shouldShowLoadingState ? loadingFeedMeetingCards : null
      }
      ListFooterComponent={
        shouldShowErrorState ? (
          <MessageView
            variant="error"
            title="Could not load your feed"
            description={error?.message}
            action={<Button onPress={() => refetch()}>Retry</Button>}
          />
        ) : shouldShowEmptyState ? (
          <FeedEmptyState />
        ) : fetchMoreState.loading ? (
          loadingFeedMeetingCards
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={!!data?.getFeedMeetings && loading}
          onRefresh={refetch}
        />
      }
    />
  );
};

const styles = createStyles({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 64,
    paddingTop: 16,
    width: "100%",
    maxWidth: 724,
    alignSelf: "center",
  },
  feedHeader: {
    marginTop: 18,
  },
});
