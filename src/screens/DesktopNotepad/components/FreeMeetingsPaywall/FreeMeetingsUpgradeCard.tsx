import { IconZap } from "@/assets/svg";
import { Button } from "@/components/Button";
import { UpgradeBenefits } from "@/components/Paywall";
import { Text } from "@/components/Typography";
import { startUpgradeFlow } from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_FLOATING_SHADOW } from "@/styles/elevation";
import { useEffect, type FC } from "react";
import { View } from "react-native";
import { PaywallIconChip } from "./PaywallIconChip";

const BENEFITS = [
  "Unlimited meeting notes",
  "Capture meeting video",
  "Custom summaries",
  "AskFred, Ask anything",
  "Download transcript & recording",
];

/** The notepad pane a free-meetings paywall has taken over. */
export type FreeMeetingsSurface = "summary" | "tasks";

/**
 * The upgrade offer that stands in wherever the free-meetings limit leaves a
 * notepad pane empty. `surface` names the pane for both tracking and the
 * upgrade attribution.
 */
export const FreeMeetingsUpgradeCard: FC<{
  title: string;
  surface: FreeMeetingsSurface;
  showUpgrade: boolean;
}> = ({ title, surface, showUpgrade }) => {
  const theme = useTheme();

  useEffect(() => {
    trackPaywallShown({ paywall: surface, from: "desktop-notepad" });
  }, [surface]);

  return (
    <View style={styles.card(theme)}>
      <View style={styles.copy}>
        <PaywallIconChip Icon={IconZap} solid />
        <Text variant="title2Regular">{title}</Text>
        <UpgradeBenefits labels={BENEFITS} gap={12} />
      </View>
      {showUpgrade && (
        <Button
          variant="primary"
          size="md"
          style={styles.cta}
          onPress={() =>
            startUpgradeFlow({ pwl: `desktop_notepad-${surface}` })
          }
        >
          Upgrade
        </Button>
      )}
    </View>
  );
};

const styles = createStyles({
  card: (theme) => ({
    width: 364,
    maxWidth: "100%",
    padding: 28,
    gap: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    boxShadow: DESKTOP_FLOATING_SHADOW,
  }),
  copy: {
    gap: 24,
  },
  cta: {
    borderRadius: 6,
  },
});
