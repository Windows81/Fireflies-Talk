import { BiteListItem, LoadingBiteListItem } from "@/components/Bite";
import { Chip } from "@/components/Chip";
import { LinkView } from "@/components/Link";
import { QueryListView } from "@/components/QueryListView";
import { RouteNames } from "@/constants";
import { useFetchMore } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import { useGetSoundbitesQuery } from "@firefliesai/bites-ff.graphql-client";
import { useNavigation } from "@react-navigation/native";
import type { ListRenderItem } from "@shopify/flash-list";
import { useCallback, useEffect, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "../components/EmptyState";

const LIMIT = 20;

const renderItem: ListRenderItem<Soundbite> = ({ item }) => (
  <LinkView
    href={{
      pathname: RouteNames.Bite,
      params: { id: item.id },
    }}
  >
    <BiteListItem bite={item} />
  </LinkView>
);

export const BiteSearch: FC<{
  searchQuery: string;
  mine?: boolean;
}> = ({ searchQuery, mine }) => {
  const navigation = useNavigation();

  const { data, loading, fetchMore, refetch, error } = useGetSoundbitesQuery({
    variables: {
      query: searchQuery,
      skip: 0,
      limit: LIMIT,
      myTeam: !mine,
      mine: !!mine,
    },
    skip: !searchQuery,
    onCompleted({ soundbites }) {
      tracker.track(TRACKING_EVENTS.BITE_SEARCHED, {
        resultCount: soundbites.length,
      });
    },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const toggleMine = useCallback(() => {
    navigation.setParams({
      mine: !mine,
    });
  }, [mine, navigation]);

  const [onLoadMore, fetchMoreState, resetFetchMore] = useFetchMore({
    data,
    fetchMore,
    limit: LIMIT,
    path: "soundbites",
  });

  useEffect(resetFetchMore, [searchQuery, mine, resetFetchMore]);

  return (
    <View style={styles.root}>
      <View style={styles.filters}>
        <Chip selected={!!mine} onPress={toggleMine}>
          Mine only
        </Chip>
      </View>
      <QueryListView
        data={data?.soundbites}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refetch={refetch}
        onLoadMore={onLoadMore}
        fetchMoreState={fetchMoreState}
        LoadingItemComponent={LoadingBiteListItem}
        emptyState={
          <EmptyState
            title={
              searchQuery
                ? `No soundbites found for "${searchQuery}"`
                : "Enter a search term to find your soundbites"
            }
          />
        }
        errorStateTitle="Could not search soundbites"
        loading={loading}
        error={error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 8,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    flexWrap: "wrap",
  },
  listContent: {
    paddingBottom: 12,
  },
});
