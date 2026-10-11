import { imageMeetingMock } from "@/assets/images";
import { MessageView } from "@/components/Message";
import { QueryListView } from "@/components/QueryListView";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { DownloadStatus, useDownloads } from "@/features/downloads";
import {
  MeetingBottomSheetMenu,
  meetingSourceToMeeting,
} from "@/features/meeting";
import type { Source } from "@/graphql";
import { useFetchChannelMeetingsQuery, useFetchMore } from "@/graphql";
import type { WeekGrouped } from "@/utils/date";
import { groupByWeeks } from "@/utils/date";
import { useBooleanState } from "@/utils/states";
import { useScrollToTop } from "@react-navigation/native";
import type { FlashListRef, ListRenderItem } from "@shopify/flash-list";
import { useNetworkState } from "@/utils/network";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { InteractionManager, StyleSheet } from "react-native";
import {
  ChannelMeetingListSectionHeader,
  ChannelMeetingListSectionItem,
  LoadingMeetingNode,
} from "./ChannelMeetingListItem";

const LIMIT = 20;

type ListItem = WeekGrouped<Source> | Source;

const isWeakGrouped = (item: ListItem): item is WeekGrouped<Source> =>
  "items" in item;

const getItemType = (item: ListItem) => {
  if (isWeakGrouped(item)) return "section";
  return "meeting";
};

const snapshotDateMs = (source: Source) =>
  new Date(source.date ?? source.startTime ?? 0).getTime() || 0;

export const ChannelMeetingList = memo<{ channelId: string }>(
  function ChannelMeetingList({ channelId }) {
    const listRef = useRef<FlashListRef<ListItem> | null>(null);

    const networkState = useNetworkState();
    const downloadIndex = useDownloads((s) => s.index);
    const userId = useAuth((s) => s.user?.id);

    // Complete downloads that belong in the Notebook (feed-only cache stays
    // out), owned by the current user (another account's copy is unreadable)
    const snapshots: Source[] = useMemo(() => {
      if (channelId !== "mine") return [];
      return downloadIndex
        .filter(
          (e) =>
            e.userId === userId &&
            e.status.state === DownloadStatus.COMPLETE &&
            (e.target === "notebook" || e.isManual),
        )
        .map((e) => e.snapshot)
        .sort((a, b) => snapshotDateMs(b) - snapshotDateMs(a));
    }, [downloadIndex, channelId, userId]);

    const { data, previousData, fetchMore, loading, error, refetch } =
      useFetchChannelMeetingsQuery({
        variables: {
          channelId,
          from: 0,
          size: LIMIT,
        },
        onError(error) {
          // offline with downloaded copies: the list falls back to snapshots
          if (snapshots.length && networkState.isInternetReachable === false) {
            return;
          }
          toast({
            title: "Could not load meetings",
            message: error.message,
            type: "error",
          });
        },
      });

    // Use previousData as fallback so the list stays populated during refetch
    const serverMeetings =
      data?.getChannelMeetings?.meetings ??
      previousData?.getChannelMeetings?.meetings;
    const showOfflineFallback =
      !serverMeetings && !!error && snapshots.length > 0;
    const meetings =
      serverMeetings ?? (showOfflineFallback ? snapshots : undefined);

    const [onLoadMore, fetchMoreState, resetFetchMore] = useFetchMore({
      fetchMore,
      data,
      limit: LIMIT,
      path: "getChannelMeetings.meetings",
      skipVariable: "from",
    });

    const handleRefetch = useCallback(async () => {
      const result = await refetch();
      resetFetchMore();
      return result;
    }, [refetch, resetFetchMore]);

    useEffect(() => {
      const im = InteractionManager.runAfterInteractions(() => {
        resetFetchMore();
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
      return () => im.cancel();
    }, [channelId, resetFetchMore]);

    const sourceForMenuRef = useRef<Source | null>(null);
    const [isOpenMenu, openMenu, closeMenu] = useBooleanState(false);

    const setSourceForMenu = useCallback(
      (source: Source) => {
        sourceForMenuRef.current = source;
        openMenu();
      },
      [openMenu],
    );

    const renderItem = useCallback<ListRenderItem<ListItem>>(
      ({ item }) => {
        if (isWeakGrouped(item)) {
          return <ChannelMeetingListSectionHeader group={item} />;
        }
        return (
          <ChannelMeetingListSectionItem
            item={item}
            setSourceForMenu={setSourceForMenu}
          />
        );
      },
      [setSourceForMenu],
    );

    const { data: listData, stickyHeaderIndices } = useMemo(() => {
      if (!meetings) {
        return {
          data: [],
          stickyHeaderIndices: [],
        };
      }
      const groupedMeetings = groupByWeeks(meetings);
      const data: ListItem[] = [];
      const stickyHeaderIndices: number[] = [];
      for (let i = 0; i < groupedMeetings.length; i++) {
        const group = groupedMeetings[i];
        data.push(group);
        stickyHeaderIndices.push(data.length - 1);
        data.push(...group.items);
      }

      return {
        data,
        stickyHeaderIndices,
      };
    }, [meetings]);

    useScrollToTop(
      useRef({
        scrollToTop: () =>
          listRef.current?.scrollToOffset({ offset: 0, animated: true }),
      }),
    );

    return (
      <>
        <QueryListView
          listRef={listRef}
          data={listData}
          renderItem={renderItem}
          getItemType={getItemType}
          contentContainerStyle={styles.listContent}
          stickyHeaderIndices={stickyHeaderIndices}
          refetch={handleRefetch}
          onLoadMore={onLoadMore}
          fetchMoreState={fetchMoreState}
          LoadingItemComponent={LoadingMeetingNode}
          loadingItemCount={2}
          emptyState={
            <MessageView
              headerImage={imageMeetingMock}
              title="You have no meetings in the channel"
              description="Channels helps you keep your relevant meetings organized and easily sharable across team."
            />
          }
          errorStateTitle="Could not load meetings"
          loading={loading}
          error={error}
        />
        {sourceForMenuRef.current && (
          <MeetingBottomSheetMenu
            meeting={meetingSourceToMeeting(sourceForMenuRef.current)}
            isOpen={isOpenMenu}
            close={closeMenu}
            fromRef="notebook"
          />
        )}
      </>
    );
  },
);

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  offlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
