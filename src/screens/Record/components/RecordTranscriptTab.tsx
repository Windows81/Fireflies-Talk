import { MessageView } from "@/components/Message";
import type { GroupedCaption } from "@/components/Transcript";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useRef, type FC } from "react";
import {
  Platform,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { RecordTranscriptRow } from "./RecordTranscriptRow";

const NEAR_BOTTOM_THRESHOLD_PX = 80;

const renderItem = ({ item }: { item: GroupedCaption }) => (
  <RecordTranscriptRow caption={item} />
);

const keyExtractor = (item: GroupedCaption) =>
  `${item.index}-${item.startTime}`;

/** Live transcript feed for the meeting in progress. */
export const RecordTranscriptTab: FC<{
  groupedCaptions: GroupedCaption[];
  loading: boolean;
}> = ({ groupedCaptions, loading }) => {
  const listRef = useRef<FlashListRef<GroupedCaption> | null>(null);
  const isAtBottomRef = useRef(true);

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

  if (!groupedCaptions.length) {
    if (loading) {
      return (
        <View style={styles.centered}>
          <Text variant="body2Regular" color="textMuted">
            Loading transcript…
          </Text>
        </View>
      );
    }
    return (
      <MessageView
        title="Catching every word…"
        description="As people speak, the live transcript will show up here so you can follow along instantly."
      />
    );
  }

  return (
    <FlashList
      ref={listRef}
      data={groupedCaptions}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  separator: {
    height: 32,
  },
});
