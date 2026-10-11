import { IconSearch } from "@/assets/svg";
import type { GroupedCaption } from "@/components/Transcript";
import { MessageView } from "@/components/Message";
import { Text } from "@/components/Typography";
import type { Meeting } from "@/graphql";
import { useLiveScreenContext } from "@/screens/Live/Context/LiveScreenContext";
import { useTranscriptSearch } from "@/screens/Live/Context/TranscriptSearchContext";
import { createStyles, useTheme } from "@/styles";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { type FC, useEffect, useMemo, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  TextInput,
  View,
} from "react-native";
import { TranscriptCopyMenu } from "../components/TranscriptCopyMenu";
import { TranscriptRow } from "./TranscriptRow";
import { SystemAudioBanner } from "../../components/SystemAudioBanner";

const SEARCH_DEBOUNCE_MS = 300;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

const renderItem = ({ item }: { item: GroupedCaption }) => (
  <TranscriptRow caption={item} />
);

const keyExtractor = (item: GroupedCaption) =>
  `${item.index}-${item.startTime}`;

export const TranscriptTab: FC<{ meeting: Meeting }> = () => {
  const theme = useTheme();
  const { liveTranscript, isSelfRecordingSession } = useLiveScreenContext();
  const { groupedCaptions, loading, hasTranscript } = liveTranscript;
  const {
    searchText,
    searchResults,
    isSearchActive,
    setSearchText,
    setIsSearchActive,
  } = useTranscriptSearch();

  const [inputValue, setInputValue] = useState("");
  const listRef = useRef<FlashListRef<GroupedCaption> | null>(null);
  const isAtBottomRef = useRef(true);

  const allCaptions = useMemo(
    () => groupedCaptions.flatMap((group) => group.captions),
    [groupedCaptions],
  );

  // Debounce search input into the shared transcript-search context
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setIsSearchActive(false);
      setSearchText("", allCaptions);
      return;
    }

    setIsSearchActive(true);
    const timer = setTimeout(() => {
      setSearchText(trimmed, allCaptions);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue, allCaptions, setSearchText, setIsSearchActive]);

  const filteredCaptions = useMemo(() => {
    if (!isSearchActive || !searchText.trim()) return groupedCaptions;
    if (searchResults.includedIndexes.length === 0) return [];
    return groupedCaptions.filter((group) =>
      group.captions.some((caption) =>
        searchResults.includedIndexes.includes(caption.index),
      ),
    );
  }, [groupedCaptions, isSearchActive, searchText, searchResults]);

  // Auto-scroll to bottom as captions arrive, unless the user scrolled away
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    isAtBottomRef.current =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - NEAR_BOTTOM_THRESHOLD_PX;
  };

  const handleContentSizeChange = () => {
    if (isAtBottomRef.current) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  };

  const showNoResults =
    isSearchActive &&
    searchText.trim().length > 0 &&
    filteredCaptions.length === 0 &&
    hasTranscript;

  return (
    <TranscriptCopyMenu>
      <View style={styles.root}>
        <View style={styles.searchBar(theme)}>
          <IconSearch width={16} height={16} color={theme.colors.textHint} />
          <TextInput
            style={styles.searchInput(theme)}
            placeholder="Find in transcript"
            placeholderTextColor={theme.colors.textHint}
            value={inputValue}
            onChangeText={setInputValue}
          />
        </View>

        {renderBody({
          loading,
          hasTranscript,
          showNoResults,
          searchText,
          filteredCaptions,
          listRef,
          handleScroll,
          handleContentSizeChange,
        })}
        {isSelfRecordingSession && <SystemAudioBanner />}
      </View>
    </TranscriptCopyMenu>
  );
};

const renderBody = ({
  loading,
  hasTranscript,
  showNoResults,
  searchText,
  filteredCaptions,
  listRef,
  handleScroll,
  handleContentSizeChange,
}: {
  loading: boolean;
  hasTranscript: boolean;
  showNoResults: boolean;
  searchText: string;
  filteredCaptions: GroupedCaption[];
  listRef: React.RefObject<FlashListRef<GroupedCaption> | null>;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleContentSizeChange: () => void;
}) => {
  if (loading && !hasTranscript) {
    return (
      <View style={styles.centered}>
        <Text variant="body2Regular" color="textMuted">
          Loading transcript…
        </Text>
      </View>
    );
  }

  if (!hasTranscript) {
    return (
      <MessageView
        title="Catching every word…"
        description="As people speak, the live transcript will show up here so you can follow along instantly."
      />
    );
  }

  if (showNoResults) {
    return (
      <MessageView
        title="No results found"
        description={`No matches found for "${searchText}"`}
      />
    );
  }

  return (
    <FlashList
      ref={listRef}
      data={filteredCaptions}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={ItemSeparator}
      onScroll={handleScroll}
      scrollEventThrottle={Platform.OS === "web" ? 16 : undefined}
      onContentSizeChange={handleContentSizeChange}
      role="list"
    />
  );
};

const ItemSeparator: FC = () => <View style={styles.separator} />;

const styles = createStyles({
  root: {
    flex: 1,
    gap: 16,
  },
  searchBar: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  searchInput: (theme) => ({
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    padding: 0,
    margin: 0,
    backgroundColor: "transparent",
    ...(Platform.OS === "web" && { outline: "none" }),
  }),
  listContent: {
    paddingBottom: 16,
  },
  separator: {
    height: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
