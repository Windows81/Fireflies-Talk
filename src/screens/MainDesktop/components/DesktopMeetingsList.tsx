import { Text } from "@/components/Typography";
import { toast } from "@/components/Toast";
import {
  DEFAULT_DESKTOP_HOME_CHANNEL_ID,
  getActualApiChannelId,
  type DesktopHomeChannelId,
} from "@/features/channel";
import { useFetchChannelMeetingsQuery, useFetchMore } from "@/graphql";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { createStyles } from "@/styles";
import { useFocusEffect } from "@react-navigation/native";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { DesktopChannelDropdown } from "./DesktopChannelDropdown";
import { DesktopHomeMeetingCard } from "./DesktopHomeMeetingCard";
import { DesktopMeetingsListSkeleton } from "./DesktopMeetingsListSkeleton";
import { useIntersectionLoadMore } from "../hooks/useIntersectionLoadMore";
import { groupMeetingsByDay } from "../utils/groupMeetingsByDay";
import { useAuth } from "@/features/auth";

const PAGE_SIZE = 20;

export const DesktopMeetingsList: FC = () => {
  const { user } = useAuth();
  const [selectedChannelId, setSelectedChannelId] =
    useState<DesktopHomeChannelId>(DEFAULT_DESKTOP_HOME_CHANNEL_ID);
  const lastRefreshTimeRef = useRef(0);
  const loadedCountRef = useRef(PAGE_SIZE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const apiChannelId = getActualApiChannelId(selectedChannelId);

  const { data, fetchMore, loading, error, refetch } =
    useFetchChannelMeetingsQuery({
      variables: {
        channelId: apiChannelId,
        from: 0,
        size: PAGE_SIZE,
      },
      skip: !user,
      notifyOnNetworkStatusChange: true,
      onError(queryError) {
        toast({
          title: "Could not load meetings",
          message: queryError.message,
          type: "error",
        });
      },
    });

  const meetings = data?.getChannelMeetings?.meetings;

  useEffect(() => {
    if (meetings?.length) {
      loadedCountRef.current = meetings.length;
    }
  }, [meetings?.length]);

  const [onLoadMore, fetchMoreState, resetFetchMore] = useFetchMore({
    fetchMore,
    data,
    limit: PAGE_SIZE,
    path: "getChannelMeetings.meetings",
    skipVariable: "from",
    pageSizeVariable: "size",
  });

  const handleRefetch = useCallback(async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const result = await refetch({
        from: 0,
        size: Math.max(loadedCountRef.current, PAGE_SIZE),
      });
      resetFetchMore();
      return result;
    } catch {
      return undefined;
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, resetFetchMore, user]);

  useEffect(() => {
    loadedCountRef.current = PAGE_SIZE;
    resetFetchMore();
  }, [selectedChannelId, resetFetchMore]);

  useWindowFocus(() => {
    if (!user) return;
    const currentTime = Date.now();
    if (currentTime - lastRefreshTimeRef.current < 10000) return;
    lastRefreshTimeRef.current = currentTime;
    void handleRefetch();
  });

  useEffect(() => {
    if (!user) return;

    const electron = window.electron;
    if (!electron?.onTriggerRefetch) return;

    const unsubscribe = electron.onTriggerRefetch(() => {
      lastRefreshTimeRef.current = Date.now();
      void handleRefetch();
    });

    return unsubscribe;
  }, [handleRefetch, user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      const currentTime = Date.now();
      if (currentTime - lastRefreshTimeRef.current < 10000) return;
      lastRefreshTimeRef.current = currentTime;
      void handleRefetch();
    }, [handleRefetch, user]),
  );

  const groupedMeetings = useMemo(
    () => groupMeetingsByDay(meetings ?? []),
    [meetings],
  );

  const canLoadMore =
    !isRefreshing &&
    !fetchMoreState.ended &&
    !fetchMoreState.loading &&
    !loading;
  const loadMoreSentinelRef = useIntersectionLoadMore(onLoadMore, canLoadMore);

  const isChannelLoading = loading && meetings == null;
  const hasNoMeetings =
    !isChannelLoading && !error && groupedMeetings.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.dropdownWrapper}>
        <DesktopChannelDropdown
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
        />
      </View>

      {isChannelLoading ? (
        <DesktopMeetingsListSkeleton />
      ) : hasNoMeetings ? (
        <View style={styles.emptyContainer}>
          <Text variant="body2Regular" color="textMuted">
            You don&apos;t have any meetings in this channel
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {groupedMeetings.map((group) => (
            <View key={group.key} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text variant="body2Weight" color="textMuted">
                  {group.day}
                </Text>
              </View>
              <View style={styles.dayMeetings}>
                {group.meetings.map((meeting) => (
                  <DesktopHomeMeetingCard
                    key={meeting.parseId ?? meeting.id}
                    meeting={meeting}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {fetchMoreState.loading && (
        <View style={styles.loadMoreIndicator}>
          <ActivityIndicator />
        </View>
      )}

      <View ref={loadMoreSentinelRef} style={styles.loadMoreSentinel} />
    </View>
  );
};

const styles = createStyles({
  section: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: 720,
    paddingHorizontal: 6,
    gap: 16,
  },
  dropdownWrapper: {
    paddingHorizontal: 10,
  },
  list: {
    gap: 20,
    alignSelf: "stretch",
  },
  dayGroup: {
    alignSelf: "stretch",
  },
  dayHeader: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dayMeetings: {
    gap: 4,
    alignSelf: "stretch",
  },
  emptyContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: "center",
    alignSelf: "stretch",
  },
  loadMoreIndicator: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreSentinel: {
    height: 1,
    width: "100%",
  },
});
