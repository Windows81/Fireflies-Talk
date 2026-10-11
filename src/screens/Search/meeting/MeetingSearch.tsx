import { LoadingScreen } from "@/components/Loading";
import { toast } from "@/components/Toast";
import type { Source } from "@/graphql";
import {
  useFetchMore,
  useGetChannelsListQuery,
  useGlobalSearchQuery,
} from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isDefined } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import {
  DEFAULT_SCOPE,
  getScopeDescriptor,
  MIN_QUERY_LENGTH,
} from "./constants";
import { MoreFilterSheet } from "./MoreFilterSheet";
import { NoResults } from "./NoResults";
import { RecentSearches } from "./RecentSearches";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { useDebounce } from "./useDebounce";
import { useRecentSearches } from "./useRecentSearches";

const LIMIT = 20;

export const MeetingSearch: FC<{
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  submittedQuery: string;
  onSubmitQuery: (value: string) => void;
  channelId?: string;
}> = ({
  searchQuery,
  setSearchQuery,
  submittedQuery,
  onSubmitQuery,
  channelId,
}) => {
  const [matchTitleOnly, setMatchTitleOnly] = useState(false);
  const [scope, setScope] = useState(channelId || DEFAULT_SCOPE);
  const [prevChannelId, setPrevChannelId] = useState(channelId);
  if (channelId !== prevChannelId) {
    setPrevChannelId(channelId);
    setScope(channelId || DEFAULT_SCOPE);
  }
  const [isMoreOpen, openMore, closeMore] = useBooleanState();

  const trimmedQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(trimmedQuery);
  // A query below MIN_QUERY_LENGTH still searches once the user explicitly
  // submits it (search key), it just never fires from the live debounce.
  const isExplicitShortQuery =
    trimmedQuery.length > 0 &&
    trimmedQuery.length < MIN_QUERY_LENGTH &&
    submittedQuery.trim() === trimmedQuery;
  const effectiveQuery = isExplicitShortQuery ? trimmedQuery : debouncedQuery;
  const isSearching =
    effectiveQuery.length >= MIN_QUERY_LENGTH || isExplicitShortQuery;
  const needsMoreChars =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;

  const { recent, add: addRecent, remove: removeRecent } = useRecentSearches();

  useEffect(() => {
    const trimmed = submittedQuery.trim();
    if (trimmed) addRecent(trimmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedQuery]);

  const { data: channelsData } = useGetChannelsListQuery();
  const channels = useMemo(
    () => channelsData?.getChannelsList?.filter(isDefined) ?? [],
    [channelsData],
  );

  const filters = useMemo(
    () => ({ match: matchTitleOnly ? ["title"] : undefined }),
    [matchTitleOnly],
  );

  const scopeDescriptor = useMemo(
    () => getScopeDescriptor(scope, channels),
    [scope, channels],
  );

  const { data, previousData, loading, fetchMore } = useGlobalSearchQuery({
    variables: {
      channelId: scope,
      from: 0,
      size: LIMIT,
      keywords: effectiveQuery,
      filters,
    },
    skip: !isSearching,
    onError(err) {
      toast({
        title: "Could not query meeting",
        type: "error",
        message: err.message,
      });
    },
  });

  // Keep the last result set on screen while the next live query is in
  // flight, but not right after resuming from a cleared/skipped search —
  // previousData would still belong to the keyword from before the clear.
  const wasSearchingRef = useRef(false);
  const justStartedSearching = isSearching && !wasSearchingRef.current;
  wasSearchingRef.current = isSearching;

  const results = ((data ?? (justStartedSearching ? undefined : previousData))
    ?.globalSearch?.meetings ?? []) as Source[];

  const [onLoadMore, fetchMoreState, resetFetchMore] = useFetchMore({
    fetchMore,
    data,
    limit: LIMIT,
    path: "globalSearch.meetings",
    skipVariable: "from",
  });

  useEffect(resetFetchMore, [effectiveQuery, scope, filters, resetFetchMore]);

  const onResultPress = useCallback(
    (meeting: Source) => {
      addRecent(effectiveQuery);
      tracker.track(TRACKING_EVENTS.GLOBAL_SEARCH_RESULT_CLICKED, {
        meetingId: meeting.parseId,
        channelId: scope,
        keywords: effectiveQuery,
        filters,
      });
    },
    [addRecent, scope, effectiveQuery, filters],
  );

  const onSelectRecent = useCallback(
    (term: string) => {
      setSearchQuery(term);
      onSubmitQuery(term);
    },
    [setSearchQuery, onSubmitQuery],
  );

  return (
    <View style={styles.root}>
      <SearchFilters
        matchTitleOnly={matchTitleOnly}
        setMatchTitleOnly={setMatchTitleOnly}
        scope={scope}
        scopeLabel={scopeDescriptor.label}
        ScopeIcon={scopeDescriptor.Icon}
        onOpenMore={openMore}
      />

      {!isSearching ? (
        <View style={styles.root}>
          {recent.length > 0 && (
            <RecentSearches
              recent={recent}
              onSelect={onSelectRecent}
              onRemove={removeRecent}
            />
          )}
          <EmptyState
            title={needsMoreChars ? "Keep typing" : "Search your meetings"}
            description={
              needsMoreChars
                ? `Type at least ${MIN_QUERY_LENGTH} characters to search.`
                : "Enter a search term to find meetings by title, channels, or what was said."
            }
          />
        </View>
      ) : !results.length && loading ? (
        <LoadingScreen />
      ) : !results.length ? (
        <NoResults
          query={effectiveQuery}
          matchTitleOnly={matchTitleOnly}
          isScoped={scope !== DEFAULT_SCOPE}
          onSearchTranscripts={() => setMatchTitleOnly(false)}
          onSearchAllMeetings={() => setScope(DEFAULT_SCOPE)}
        />
      ) : (
        <SearchResults
          meetings={results}
          loadingMore={fetchMoreState.loading}
          onEndReached={onLoadMore}
          onResultPress={onResultPress}
        />
      )}

      <MoreFilterSheet
        isOpen={isMoreOpen}
        close={closeMore}
        scope={scope}
        onSelect={setScope}
        channels={channels}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
