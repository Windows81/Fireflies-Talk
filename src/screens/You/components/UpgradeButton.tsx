import { Button } from "@/components/Button";
import { Config } from "@/constants";
import { openURL } from "@/features/navigation";
import { createStyles, vars } from "@/styles";
import { DESKTOP_THEME, GLOBAL, withAlpha } from "@/styles/color";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type UpgradeButtonVariant = "critical" | "positive";

interface UpgradeButtonProps {
  /**
   * Visual variant of the button based on urgency
   * - positive: green, the plan still has room
   * - critical: amber, the quota it tracks has run out
   */
  variant?: UpgradeButtonVariant;
  /**
   * Percentage of the tracked quota left. When given it picks the variant:
   * 0% -> critical, anything above -> positive.
   */
  percentage?: number;
  /**
   * Custom onPress handler. If not provided, opens upgrade page
   */
  onPress?: () => void;
  /**
   * Source identifier for analytics tracking
   */
  source?: string;
  /**
   * Additional styles
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Button text. Defaults to "Upgrade"
   */
  label?: string;
  /**
   * Full width button. Defaults to true
   */
  fullWidth?: boolean;
}

// Flat chips rather than theme surfaces: the design keeps the same dark green
// (and its hover) on every background the button appears on.
const ACCENTS: Record<
  UpgradeButtonVariant,
  { surface: ViewStyle; hoverSurface: ViewStyle }
> = {
  positive: {
    surface: { backgroundColor: DESKTOP_THEME.upgradeGreen },
    hoverSurface: { backgroundColor: DESKTOP_THEME.upgradeGreenHover },
  },
  critical: {
    surface: { backgroundColor: DESKTOP_THEME.upgradeAmber },
    hoverSurface: { backgroundColor: DESKTOP_THEME.upgradeAmberHover },
  },
};

const getVariant = (
  variant: UpgradeButtonVariant,
  percentage?: number,
): UpgradeButtonVariant => {
  if (percentage === undefined) return variant;
  return percentage === 0 ? "critical" : "positive";
};

const getUpgradeUrl = (source: string) => {
  return `${Config.DASHBOARD_URL}/upgrade?pwl=${source}`;
};

export const UpgradeButton: FC<UpgradeButtonProps> = ({
  variant = "positive",
  percentage,
  onPress,
  source = "desktop_app",
  style,
  label = "Upgrade",
  fullWidth = true,
}) => {
  const accent = ACCENTS[getVariant(variant, percentage)];

  const handleUpgradeClick = () => {
    openURL(getUpgradeUrl(source));
  };

  return (
    // `primary` for the white label; the chip colors come from the accent.
    <Button
      variant="primary"
      size="xs"
      onPress={onPress || handleUpgradeClick}
      style={[
        styles.root,
        accent.surface,
        fullWidth && styles.fullWidth,
        style,
      ]}
      hoverStyle={accent.hoverSurface}
    >
      {label}
    </Button>
  );
};

const styles = createStyles({
  root: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: withAlpha(GLOBAL.white, 0.06),
    ...vars.elevations[1],
  },
  fullWidth: {
    marginTop: 8,
    width: "100%",
  },
});
