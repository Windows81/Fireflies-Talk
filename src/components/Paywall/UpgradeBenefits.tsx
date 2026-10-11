import {
  IconCheck,
  IconGoogleDrive,
  IconHubspot,
  IconSlack,
} from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { BRAND_COLORS } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

// Slack and Drive ship their own brand fills; HubSpot's svg is currentColor, so
// it needs its brand color passed in explicitly.
const INTEGRATION_ICONS: { Icon: FC<SvgProps>; color?: string }[] = [
  { Icon: IconHubspot, color: BRAND_COLORS.hubspot },
  { Icon: IconGoogleDrive },
  { Icon: IconSlack },
];

const Benefit: FC<{ label: string; trailing?: ReactNode }> = ({
  label,
  trailing,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.benefit}>
      {/* 1.5 over the 24 viewBox renders a 1px stroke at 16px, per the design. */}
      <IconCheck
        width={16}
        height={16}
        strokeWidth={1.5}
        color={theme.colors.textSecondary}
      />
      <View style={styles.benefitLabel}>
        <Text variant="body2Regular" color="textSecondary">
          {label}
        </Text>
        {trailing}
      </View>
    </View>
  );
};

/**
 * The checked plan benefits the desktop upgrade prompts sell, always closing on
 * the integrations row.
 */
export const UpgradeBenefits: FC<{
  labels: readonly string[];
  /** Row spacing: the download modal breathes wider than the notepad card. */
  gap: number;
}> = ({ labels, gap }) => (
  <View style={{ gap }}>
    {labels.map((label) => (
      <Benefit key={label} label={label} />
    ))}
    <Benefit
      label="110+ integrations"
      trailing={
        <View style={styles.integrations}>
          {INTEGRATION_ICONS.map(({ Icon, color }, index) => (
            <Icon key={index} width={16} height={16} color={color} />
          ))}
        </View>
      }
    />
  </View>
);

const styles = createStyles({
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  integrations: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
