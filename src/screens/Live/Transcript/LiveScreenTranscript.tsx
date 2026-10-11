import { MessageView } from "@/components/Message";
import { View, StyleSheet } from "react-native";
import { useRef, type FC, useMemo } from "react";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { useTranscriptSearch } from "../Context/TranscriptSearchContext";
import { IconFileText, IconTranscriptOrange } from "@/assets/svg";
import {
  AutoscrollProvider,
  LoadingTranscript,
  TranscriptCaptionListInner,
  type GroupedCaption,
} from "@/components/Transcript";
import { TranscriptContext } from "src/components/Transcript/TranscriptContext";
import type { FlashListRef } from "@shopify/flash-list";

export const LiveScreenTranscript: FC<{
  listHeight?: number;
  /** Hide the empty-state icon/title/description (e.g. when the panel is too short). */
  hideEmptyState?: boolean;
}> = ({ listHeight, hideEmptyState }) => {
  const { liveTranscript } = useLiveScreenContext();
  const { groupedCaptions, loading, hasTranscript } = liveTranscript;
  const { searchText, searchResults, isSearchActive } = useTranscriptSearch();
  const listRef = useRef<FlashListRef<GroupedCaption> | null>(null);

  const filteredGroupedCaptions = useMemo(() => {
    if (!searchText.trim() || !isSearchActive) {
      return groupedCaptions;
    }

    if (searchResults.includedIndexes.length > 0) {
      return groupedCaptions.filter((group) =>
        group.captions.some((caption) =>
          searchResults.includedIndexes.includes(caption.index),
        ),
      );
    }
    return [];
  }, [groupedCaptions, searchText, isSearchActive, searchResults]);

  if (loading && !hasTranscript) {
    return (
      <View
        style={listHeight != null ? { height: listHeight } : styles.container}
      >
        <LoadingTranscript />
      </View>
    );
  }

  if (
    isSearchActive &&
    searchText &&
    filteredGroupedCaptions.length === 0 &&
    hasTranscript
  ) {
    return (
      <MessageView
        Icon={IconFileText}
        title="No results found"
        description={`No matches found for "${searchText}"`}
      />
    );
  }

  return (
    <>
      {hasTranscript ? (
        <TranscriptContext.Provider
          value={{
            marks: searchResults.marks,
            currentIndex: undefined,
          }}
        >
          <View
            style={
              listHeight != null ? { height: listHeight } : styles.container
            }
          >
            <AutoscrollProvider listRef={listRef} type={"bottom"}>
              <TranscriptCaptionListInner
                listRef={listRef}
                groupedCaptions={filteredGroupedCaptions}
                listContentStyle={styles.listContentStyle}
              />
            </AutoscrollProvider>
          </View>
        </TranscriptContext.Provider>
      ) : (
        <View style={styles.emptyContainer}>
          {!hideEmptyState && (
            // Icon goes in the header slot rather than beside the message: as a
            // sibling, the message's `flex: 1` would absorb the leftover height
            // and centre the copy inside it, leaving a gap that grows with the
            // panel.
            <MessageView
              header={<IconTranscriptOrange width={48} height={48} />}
              title="Catching every word…"
              description="As people speak, the live transcript will show up here so you can follow along instantly."
            />
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContentStyle: {
    padding: 4,
  },
});
