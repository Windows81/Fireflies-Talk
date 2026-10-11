import { createStyles, vars } from "@/styles";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";
import { DESKTOP_CARD_STYLE } from "./desktopCardStyle";

/** Card chrome shared by the dictation stat cards (Figma: 236px wide). */
export const DictationStatCard: FC<
  PropsWithChildren<{ action?: ReactNode }>
> = ({ children, action }) => (
  <View style={styles.card}>
    {children}
    {action && <View style={styles.action}>{action}</View>}
  </View>
);

const styles = createStyles({
  card: {
    ...vars.elevations[1],
    ...DESKTOP_CARD_STYLE,
    width: 236,
    flexShrink: 0,
    padding: 16,
    gap: 16,
  },
  // Corner control, out of the content flow so it cannot shift the figures.
  action: {
    position: "absolute",
    top: 12,
    right: 12,
  },
});
