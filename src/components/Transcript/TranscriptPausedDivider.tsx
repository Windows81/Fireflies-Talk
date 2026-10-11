import { IconPause } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { toCompactDuration, toHHMMSS } from "@/utils/time";
import type { FC } from "react";
import { View } from "react-native";
import type { TranscriptSeparator } from "./types";

export const TranscriptPausedDivider: FC<{
  separator: TranscriptSeparator;
}> = ({ separator }) => {
  const theme = useTheme();
  const durationLabel =
    separator.durationSec > 0
      ? ` [${toCompactDuration(separator.durationSec)}]`
      : "";

  return (
    <View style={styles.root}>
      <View style={styles.line(theme)} />
      <View style={styles.label}>
        <IconPause width={16} height={16} color={theme.colors.textHint} />
        <Text variant="body3Regular" color="textHint">
          {`RECORDING PAUSED AT ${toHHMMSS(separator.time)}${durationLabel}`}
        </Text>
      </View>
      <View style={styles.line(theme)} />
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
    paddingVertical: 8,
  },
  line: (theme) => ({
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderStaticSubtle,
  }),
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
