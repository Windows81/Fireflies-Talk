import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { useRecorder } from "../record.store";

/**
 * Spelled-out paused state: the blinking timer alone is easy to miss, and a
 * paused recording captures nothing.
 */
export const RecordPausedHint: FC = () => {
  const isPaused = useRecorder((s) => s.status.state === "paused");

  if (!isPaused) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      <Text variant="body2Regular" color="textMuted" style={styles.text}>
        Not recording. Tap play to continue.
      </Text>
    </View>
  );
};

const styles = createStyles({
  root: {
    alignItems: "center",
  },
  text: {
    textAlign: "center",
  },
});
