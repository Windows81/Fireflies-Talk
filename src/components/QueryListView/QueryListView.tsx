import type { FetchMoreState } from "@/graphql";
import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
} from "@shopify/flash-list";
import { type Ref } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "../Button";
import { LoadingSpinner } from "../Loading";
import { MessageView } from "../Message";
import { RefreshControl } from "../RefreshControl";

interface QueryListViewProps<TItem>
  extends Pick<
    FlashListProps<TItem>,
    | "data"
    | "renderItem"
    | "getItemType"
    | "style"
    | "contentContainerStyle"
    | "ListHeaderComponent"
    | "stickyHeaderIndices"
  > {
  refetch: () => Promise<any>;
  onLoadMore?: () => void;
  fetchMoreState?: FetchMoreState;
  LoadingItemComponent?: React.ComponentType;
  loadingItemCount?: number;
  emptyState: React.ReactElement;
  errorStateTitle: string;
  loading: boolean;
  error: Error | undefined | null;
  // TODO: React 19 will allow ref as prop
  // We don't use forwardRef because it does not work nicely with generics
  listRef?: Ref<FlashListRef<TItem>> | undefined;
}

/**
 * A specialized list view that supports:
 * - render items most often from useQuery()
 * - fetch more items when the user scrolls to the end of the list
 * - show loading skeleton items while fetching
 * - show an error message if fetching fails
 * - show an empty state if there are no items
 */
export function QueryListView<TItem>({
  listRef,
  data,
  renderItem,
  getItemType,
  style,
  contentContainerStyle,
  ListHeaderComponent,
  stickyHeaderIndices,
  fetchMoreState,
  refetch,
  onLoadMore,
  LoadingItemComponent,
  loadingItemCount = 10,
  emptyState,
  errorStateTitle,
  loading,
  error,
}: QueryListViewProps<TItem>) {
  const canFetchMore =
    !!data?.length && !!fetchMoreState && !fetchMoreState.ended;

  const shouldShowLoadingState = !!loading && !data?.length;

  if (error && !data?.length) {
    return (
      <View style={styles.listBase}>
        <MessageView
          title={errorStateTitle}
          description={error.message}
          action={<Button onPress={() => refetch()}>Retry</Button>}
          variant="error"
        />
      </View>
    );
  }

  return (
    <FlashList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      getItemType={getItemType}
      style={style}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
      stickyHeaderIndices={stickyHeaderIndices}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        canFetchMore ? (
          LoadingItemComponent ? (
            <LoadingItemComponent />
          ) : (
            <LoadingSpinner />
          )
        ) : null
      }
      refreshControl={<RefreshControl onRefresh={() => refetch()} />}
      scrollEnabled={!shouldShowLoadingState}
      ListEmptyComponent={
        shouldShowLoadingState ? (
          LoadingItemComponent ? (
            <View>
              {Array.from({ length: loadingItemCount }).map((_, index) => (
                <LoadingItemComponent key={index} />
              ))}
            </View>
          ) : (
            <LoadingSpinner />
          )
        ) : (
          emptyState
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  listBase: {
    flex: 1,
  },
});
