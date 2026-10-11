import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { View } from "react-native";
import type { Theme } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import type { DictationPillBackdrop } from "electron/src/types";
import { styles } from "./dictationPillStyles";

const SHELL_GLOSS_COLORS = [
  withAlpha(GLOBAL.white, 0.09),
  withAlpha(GLOBAL.white, 0),
] as const;

/** How much the idle shell darkens further over a dark backdrop. */
const IDLE_DARK_OVERLAY_OPACITY = 0.25;

/**
 * The shell's own flat fill (design 16b): a graduated panel top to bottom,
 * plus the soft sheen a light from directly above would cast on its upper
 * half. The one thing every mode paints the same way, underneath everything
 * else stacked in the shell — except idle, at rest with nothing to show,
 * which sits a step darker over a dark backdrop so it reads as settled rather
 * than lit. (Over a light backdrop the idle softening is a whole-shell
 * opacity instead — see DictationPillScreen — since that lets what is behind
 * the pill show through.)
 */
export const PillShellSurface: FC<{
  theme: Theme;
  idle: boolean;
  backdrop: DictationPillBackdrop;
}> = ({ theme, idle, backdrop }) => (
  <View pointerEvents="none" style={styles.gradientFill}>
    <LinearGradient
      colors={[
        theme.colors.dictationPillShellGradientTop,
        theme.colors.dictationPillShellGradientMid,
        theme.colors.dictationPillShellGradientBottom,
      ]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientFill}
    />
    <View style={styles.shellGloss}>
      <LinearGradient
        colors={SHELL_GLOSS_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientFill}
      />
    </View>
    {idle && backdrop === "dark" && (
      <View
        style={[
          styles.gradientFill,
          {
            backgroundColor: withAlpha(GLOBAL.black, IDLE_DARK_OVERLAY_OPACITY),
          },
        ]}
      />
    )}
  </View>
);
