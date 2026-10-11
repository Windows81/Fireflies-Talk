import { createStyles } from "@/styles";
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { NotepadTranscript } from "./NotepadTranscript";

/**
 * FlashList needs a stable, content-independent height. On web/desktop a pure
 * flex chain lets the list's content feed back into its own measured height and
 * loop forever. We measure the available space once and hand the list an
 * explicit pixel height so its measurement can settle.
 */
export const NotepadTranscriptPane = () => {
  const [height, setHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  }, []);

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {height > 0 && (
        <View style={{ height }}>
          <NotepadTranscript />
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  fill: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
});
