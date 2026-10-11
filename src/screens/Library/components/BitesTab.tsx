import { imageSoundbiteMock, imageSoundbiteMockDark } from "@/assets/images";
import { BiteListItem, LoadingBiteListItem } from "@/components/Bite";
import { LinkView } from "@/components/Link";
import { MessageView } from "@/components/Message";
import { QueryListView } from "@/components/QueryListView";
import { SegmentedControl } from "@/components/SegmentedControl";
import { toast } from "@/components/Toast";
import { RouteNames } from "@/constants";
import { useAuth } from "@/features/auth";
import { BiteBottomSheetMenu } from "@/features/bite";
import { useFetchMore, type Soundbite } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { useGetSoundbitesQuery } from "@firefliesai/bites-ff.graphql-client";
import { useScrollToTop } from "@react-navigation/native";
import type { FlashListRef, ListRenderItem } from "@shopify/flash-list";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const LIMIT = 24;

export const BitesTab: FC = () => {
  const { user } = useAuth();

  const [tab, setTab] = useState<"mine" | "team">("mine");

  const { data, fetchMore, loading, error, refetch } = useGetSoundbitesQuery({
    variables: {
      myTeam: tab === "team",
      mine: tab === "mine",
      limit: LIMIT,
    },
    skip: !user,
    onError(err) {
      toast({
        title: "Could not load soundbites",
        message: err.message,
        type: "error",
      });
    },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const [onLoadMore, fetchMoreState] = useFetchMore({
    fetchMore,
    data,
    limit: LIMIT,
    path: "soundbites",
  });

  const soundbites = data?.soundbites;

  const biteForMenuRef = useRef<Soundbite | null>(null);
  const [isOpenMenu, openMenu, closeMenu] = useBooleanState(false);

  const renderItem = useCallback<ListRenderItem<Soundbite>>(
    ({ item }) => (
      <LinkView
        href={{
          pathname: RouteNames.Bite,
          params: {
            id: item.id,
          },
        }}
        onLongPress={() => {
          biteForMenuRef.current = item;
          openMenu();
        }}
        animated="highlight"
      >
        <BiteListItem bite={item} />
      </LinkView>
    ),
    [openMenu],
  );

  const scrollRef = useRef<FlashListRef<Soundbite> | null>(null);
  useScrollToTop(
    useRef({
      scrollToTop: () =>
        scrollRef.current?.scrollToOffset({ offset: 0, animated: true }),
    }),
  );

  return (
    <>
      <QueryListView
        listRef={scrollRef}
        data={soundbites}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SegmentedControl
              data={[
                {
                  label: "My Soundbites",
                  value: "mine",
                },
                {
                  label: "All Soundbites",
                  value: "team",
                },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>
        }
        refetch={refetch}
        onLoadMore={onLoadMore}
        fetchMoreState={fetchMoreState}
        LoadingItemComponent={LoadingBiteListItem}
        emptyState={
          <MessageView
            headerImage={imageSoundbiteMock}
            headerImageDark={imageSoundbiteMockDark}
            title="Clip out important moments"
            description="Highlight specific moments in your call and share them using Soundbites"
          />
        }
        errorStateTitle="Could not load soundbites"
        loading={loading}
        error={error}
      />
      {biteForMenuRef.current && (
        <BiteBottomSheetMenu
          bite={biteForMenuRef.current}
          isOpen={isOpenMenu}
          close={closeMenu}
          fromRef="library/bites-tab"
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
