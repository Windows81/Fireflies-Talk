import { LIVE_BAR_HEIGHT } from "electron/src/dictation/dictation-live-anchor";
import { createStyles } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import { useState, type FC, type ReactNode } from "react";
import { Pressable, Text } from "react-native";

/**
 * One tab in the live bar. The design gives the bar no dividers and no chrome
 * of its own — the active tab is a filled capsule and everything else is a
 * label, so the tabs read as part of the pill rather than as buttons on it.
 */
export const LiveBarTab: FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  leading?: ReactNode;
  /** Icon-only square for the vertical rail on a side dock. */
  compact?: boolean;
}> = ({ label, active, onPress, leading, compact }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.tab,
        compact && styles.tabCompact,
        active && styles.tabActive,
        !active && hovered && styles.tabHovered,
      ]}
    >
      {leading}
      {!compact && (
        <Text style={[styles.label, active && styles.labelActive]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = createStyles({
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: "100%",
    paddingHorizontal: 12,
    borderRadius: LIVE_BAR_HEIGHT / 2 - 1,
    backgroundColor: "transparent",
  },
  // Fill the rail's content box so the hover/active capsule sits flush inside
  // it — a fixed 36 overflows the 1px border and looks inset.
  tabCompact: {
    width: "100%",
    height: LIVE_BAR_HEIGHT - 2,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: withAlpha(GLOBAL.white, 0.12),
  },
  tabHovered: {
    backgroundColor: withAlpha(GLOBAL.white, 0.06),
  },
  label: {
    fontSize: 13.5,
    letterSpacing: -0.1,
    fontWeight: "400",
    color: withAlpha(GLOBAL.white, 0.66),
    whiteSpace: "nowrap",
  },
  labelActive: {
    color: GLOBAL.white,
    fontWeight: "500",
  },
});
