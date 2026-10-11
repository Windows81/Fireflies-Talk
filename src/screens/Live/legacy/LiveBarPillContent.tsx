import { IconLogo } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";
import { PillWaveform } from "./PillWaveform";

/**
 * Resting state of the live bar: the Fireflies mark next to an audio-reactive
 * waveform. Shown while the bar is collapsed; cross-fades with the expanded
 * toolbar (see useLiveBarInOutAnimation).
 */
export const LiveBarPillContent: FC = () => {
  const theme = useTheme();

  return (
    <View testID="drag" style={styles.root}>
      <IconLogo width={16} height={16} />
      <PillWaveform color={theme.colors.textSecondary} />
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
    height: 36,
  },
});
