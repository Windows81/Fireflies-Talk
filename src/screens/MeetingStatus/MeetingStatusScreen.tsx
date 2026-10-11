import { imageMeetingMock } from "@/assets/images";
import { LoadingSpinner } from "@/components/Loading";
import { MessageView } from "@/components/Message";
import { RefreshControl } from "@/components/RefreshControl";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { COMPUTED_MEETING_STATUS_FILTER_ALL } from "@/constants";
import { useAuth } from "@/features/auth";
import { useUpload } from "@/features/upload";
import type { MeetingStatusData } from "@/graphql";
import { useGetUserMeetingsForStatusQuery } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { endOfDay, startOfDay, sub } from "date-fns";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import type { ListRenderItem } from "react-native";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DatePickerButton } from "../Analytics/components/DatePicker";
import { UploadingFileList } from "../Upload/components/UploadingFileList";
import type { ParamList } from "../types";
import { MeetingStatusListItem } from "./components/MeetingStatusListItem";

const renderItem: ListRenderItem<MeetingStatusData> = ({ item }) => (
  <MeetingStatusListItem key={item.objectId} meeting={item} />
);

const LIMIT = 20;

export const MeetingStatusScreen: FC<
  NativeStackScreenProps<ParamList, "MeetingStatus">
> = () => {
  const { user } = useAuth();

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return [startOfDay(sub(now, { days: 30 })), endOfDay(now)] as [Date, Date];
  });

  const { data, loading, refetch, fetchMore } =
    useGetUserMeetingsForStatusQuery({
      variables: {
        limit: LIMIT,
        computedStatus: COMPUTED_MEETING_STATUS_FILTER_ALL,
        start: dateRange[0].toISOString(),
        end: dateRange[1].toISOString(),
      },
      fetchPolicy: "cache-and-network",
      onError(err) {
        toast({
          title: "Could not load meeting statuses",
          message: err.message,
          type: "error",
        });
      },
      pollInterval: 15 * 1000,
      skip: !user,
    });

  const [loadingMore, setLoadingMore] = useState(false);

  const statusList = data?.getUserMeetingsForStatus;
  const meetings = statusList?.meetings;
  const next = statusList?.next;
  const hasNext = !!statusList?.hasNext;

  const onLoadMore = useCallback(async () => {
    if (!next || !hasNext || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({ variables: { next } });
    } catch (err) {
      toast({
        title: "Could not load more meetings",
        message: err instanceof Error ? err.message : "Please try again.",
        type: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [fetchMore, hasNext, loadingMore, next]);

  const theme = useTheme();

  const { uploads } = useUpload();

  const uploadCountRef = useRef(uploads.length);

  useEffect(() => {
    // every time an upload is completed, we should reload — but not on mount, where
    // refetching would discard the pages the cache already holds
    if (uploadCountRef.current === uploads.length) return;
    uploadCountRef.current = uploads.length;
    refetch();
  }, [uploads.length, refetch]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text color="textMuted">
          If a meeting takes too long or fails to process, please contact
          support.
        </Text>
      </View>
      {uploads.length > 0 && (
        <View style={styles.uploadContent(theme)}>
          <Text
            variant="label2Weight"
            color="textMuted"
            style={styles.uploadContentTitle}
          >
            Uploading meetings
          </Text>
          <UploadingFileList uploadTasks={uploads} />
        </View>
      )}
      <FlatList
        contentContainerStyle={styles.content}
        renderItem={renderItem}
        data={meetings as MeetingStatusData[]}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          hasNext || (loading && !meetings) ? <LoadingSpinner /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <MessageView
              headerImage={imageMeetingMock}
              title="You have no meetings to be processed"
              description="Upload a recording or invite Fireflies to your meeting to get started"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={!!meetings && loading}
            onRefresh={refetch}
          />
        }
      />
      <SafeAreaView style={styles.footer(theme)} edges={["bottom"]}>
        <Text variant="label1Weight" color="textSecondary">
          Filters
        </Text>
        <DatePickerButton dateRange={dateRange} setDateRange={setDateRange} />
      </SafeAreaView>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    gap: 4,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  footer: (theme) => ({
    borderTopWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  }),
  uploadContent: (theme) => ({
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: theme.colors.layerSubtle,
    marginTop: 16,
  }),
  uploadContentTitle: {
    textAlign: "center",
  },
});
