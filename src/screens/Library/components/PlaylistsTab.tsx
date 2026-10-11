import { imageMeetingMock } from "@/assets/images";
import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { MessageView } from "@/components/Message";
import {
  LoadingPlaylistListItem,
  PlaylistListItem,
} from "@/components/Playlist";
import { QueryListView } from "@/components/QueryListView";
import { SegmentedControl } from "@/components/SegmentedControl";
import { toast } from "@/components/Toast";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import { openCreatePlaylistModal } from "@/features/global-modals";
import { PlaylistBottomSheetMenu } from "@/features/playlist";
import { useFetchMore, type Playlist } from "@/graphql";
import { RootNavigation } from "@/screens/RootNavigation";
import { useBooleanState } from "@/utils/states";
import { useGetPlaylistsQuery } from "@firefliesai/bites-ff.graphql-client";
import { useScrollToTop } from "@react-navigation/native";
import type { FlashListRef, ListRenderItem } from "@shopify/flash-list";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const LIMIT = 24;

export const PlaylistsTab: FC = () => {
  const { user } = useAuth();

  const [tab, setTab] = useState<"mine" | "team">("mine");

  const { data, fetchMore, loading, error, refetch } = useGetPlaylistsQuery({
    variables: {
      mine: tab === "mine",
      myTeam: tab === "team",
      limit: LIMIT,
    },
    skip: !user,
    onError(err) {
      toast({
        title: "Could not load playlists",
        message: err.message,
        type: "error",
      });
    },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const playlists = data?.playlists;

  const [onLoadMore, fetchMoreState] = useFetchMore({
    fetchMore,
    data,
    limit: LIMIT,
    path: "playlists",
  });

  const playlistForMenuRef = useRef<Playlist | null>(null);
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState(false);

  const renderItem = useCallback<ListRenderItem<Playlist>>(
    ({ item }) => (
      <LinkView
        href={{
          pathname: RouteNames.Playlist,
          params: {
            id: item.id,
          },
        }}
        onLongPress={() => {
          playlistForMenuRef.current = item;
          openMenu();
        }}
        animated="highlight"
      >
        <PlaylistListItem playlist={item} />
      </LinkView>
    ),
    [openMenu],
  );

  const scrollRef = useRef<FlashListRef<Playlist> | null>(null);
  useScrollToTop(
    useRef({
      scrollToTop: () =>
        scrollRef.current?.scrollToOffset({ offset: 0, animated: true }),
    }),
  );

  const openCreatePlaylist = useCallback(() => {
    openCreatePlaylistModal({
      onCreated: (newPlaylist) =>
        RootNavigation.navigate(RouteNames.Playlist, { id: newPlaylist.id }),
      fromRef: "library/empty-state",
    });
  }, []);

  return (
    <>
      <QueryListView
        listRef={scrollRef}
        data={playlists}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SegmentedControl
              data={[
                {
                  label: "My Playlists",
                  value: "mine",
                },
                {
                  label: "All Playlists",
                  value: "team",
                },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>
        }
        LoadingItemComponent={LoadingPlaylistListItem}
        refetch={refetch}
        onLoadMore={onLoadMore}
        fetchMoreState={fetchMoreState}
        emptyState={
          <MessageView
            headerImage={imageMeetingMock}
            title="Organize soundbites with playlists"
            description="Playlists helps you keep your favourite soundbites organized and easily sharable across team."
            action={
              <Button onPress={openCreatePlaylist}>Create playlist</Button>
            }
          />
        }
        errorStateTitle="Could not load playlists"
        loading={loading}
        error={error}
      />
      {playlistForMenuRef.current && (
        <PlaylistBottomSheetMenu
          playlist={playlistForMenuRef.current}
          isOpen={isOpenMenu}
          close={closeMenu}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 12,
  },
  listHeader: {
    paddingHorizontal: 16,
  },
});
