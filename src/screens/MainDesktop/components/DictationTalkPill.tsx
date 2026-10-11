import { IconLogo } from "@/assets/svg";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { View } from "react-native";

// Bar heights from the design, left to right. Ids keep the keys off the index.
const BARS = [
  { id: "a", height: 6 },
  { id: "b", height: 6 },
  { id: "c", height: 9.8 },
  { id: "d", height: 6 },
  { id: "e", height: 15.7 },
  { id: "f", height: 9.7 },
  { id: "g", height: 6 },
];

const PILL_COLORS = [
  DESKTOP_THEME.talkPillGradientStart,
  DESKTOP_THEME.talkPillGradientMid,
  DESKTOP_THEME.talkPillGradientEnd,
] as const;
const PILL_LOCATIONS = [0.19, 0.5, 0.82] as const;

/**
 * Static stand-in for the Talk pill, shown as artwork on the welcome banner.
 * The live pill has its own animated waveform — see PillWaveform.
 */
export const DictationTalkPill: FC = () => (
  <LinearGradient
    colors={PILL_COLORS}
    locations={PILL_LOCATIONS}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.pill}
  >
    <IconLogo width={28} height={28} />
    <View style={styles.waveform}>
      {BARS.map(({ id, height }) => (
        <View key={id} style={[styles.bar, { height }]} />
      ))}
    </View>
  </LinearGradient>
);

const styles = createStyles({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 31.33,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    height: 15.7,
  },
  bar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: DESKTOP_THEME.grey400,
  },
});
