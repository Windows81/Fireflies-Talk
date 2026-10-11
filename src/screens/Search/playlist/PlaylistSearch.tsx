import { Chip } from "@/components/Chip";
import { LinkView } from "@/components/Link";
import {
  LoadingPlaylistListItem,
  PlaylistListItem,
} from "@/components/Playlist";
import { QueryListView } from "@/components/QueryListView";
import { RouteNames } from "@/constants";
import { useFetchMore } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Playlist } from "@firefliesai/bites-ff.graphql-client";
import { useGetPlaylistsQuery } from "@firefliesai/bites-ff.graphql-client";
import { useNavigation } from "@react-navigation/native";
import type { ListRenderItem } from "@shopify/flash-list";
import { useCallback, useEffect, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "../components/EmptyState";

const LIMIT = 20;

export const PlaylistSearch: FC<{
  searchQuery: string;
  mine?: boolean;
}> = ({ searchQuery, mine }) => {
  const navigation = useNavigation();

  const { data, loading, error, refetch, fetchMore } = useGetPlaylistsQuery({
    variables: {
      query: searchQuery,
      skip: 0,
      limit: LIMIT,
      myTeam: !mine,
      mine: !!mine,
    },
    skip: !searchQuery,
    onCompleted({ playlists }) {
      tracker.track(TRACKING_EVENTS.PLAYLIST_SEARCHED, {
        resultCount: playlists.length,
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
    path: "playlists",
  });

  useEffect(resetFetchMore, [searchQuery, mine, resetFetchMore]);

  const renderItem = useCallback<ListRenderItem<Playlist>>(
    ({ item }) => (
      <LinkView
        href={{
          pathname: RouteNames.Playlist,
          params: { id: item.id },
        }}
        animated
      >
        <PlaylistListItem playlist={item} />
      </LinkView>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <View style={styles.filters}>
        <Chip selected={!!mine} onPress={toggleMine}>
          Mine only
        </Chip>
      </View>
      <QueryListView
        data={data?.playlists}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        LoadingItemComponent={LoadingPlaylistListItem}
        refetch={refetch}
        onLoadMore={onLoadMore}
        fetchMoreState={fetchMoreState}
        emptyState={
          <EmptyState
            title={
              searchQuery
                ? `No playlists found for "${searchQuery}"`
                : "Enter a search term to find your playlists"
            }
          />
        }
        errorStateTitle="Could not search playlists"
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
