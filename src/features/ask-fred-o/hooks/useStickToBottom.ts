import { useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { ScrollView } from "react-native";

const STICK_THRESHOLD = 48;

export const useStickToBottom = () => {
  const scrollRef = useRef<ScrollView>(null);
  const isStuckRef = useRef(true);

  const scrollToBottom = useCallback((animated = true) => {
    isStuckRef.current = true;
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      isStuckRef.current = distanceFromBottom <= STICK_THRESHOLD;
    },
    [],
  );

  const onContentSizeChange = useCallback(() => {
    if (isStuckRef.current) scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  return { scrollRef, onScroll, onContentSizeChange, scrollToBottom };
};
