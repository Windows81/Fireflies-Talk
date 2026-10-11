import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { LinearGradient } from "expo-linear-gradient";
import type { FC, PropsWithChildren } from "react";
import { Platform, StyleSheet, View } from "react-native";

/**
 * Blurred stand-in for the pane content a paywall card is covering, so the pane
 * reads as work the user is locked out of rather than an empty page. Purely
 * decorative: unreachable by pointer and hidden from screen readers.
 */
export const PaywallTeaser: FC<PropsWithChildren<{ gap: number }>> = ({
  gap,
  children,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.root} pointerEvents="none" aria-hidden>
      <View style={[styles.content, { gap }]}>{children}</View>
      {/* Sits outside the blur so the page colour it fades into stays solid,
          and the content dissolves rather than just stopping. Both stops are
          the page colour so the fade never blends through a grey midpoint. */}
      <LinearGradient
        colors={[
          withAlpha(theme.colors.pageBackground, 0),
          theme.colors.pageBackground,
        ]}
        locations={[0.15, 0.6]}
        style={styles.fader}
      />
    </View>
  );
};

const styles = createStyles({
  root: StyleSheet.absoluteFillObject,
  content: {
    ...(Platform.OS === "web" && {
      filter: "blur(6px)",
      WebkitFilter: "blur(6px)",
    }),
  },
  fader: StyleSheet.absoluteFillObject,
});
