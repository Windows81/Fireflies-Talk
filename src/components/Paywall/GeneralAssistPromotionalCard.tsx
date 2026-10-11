import { IconZap } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { startUpgradeFlow } from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import { createStyles, useTheme } from "@/styles";
import { useCallback, useEffect, type FC } from "react";
import { View } from "react-native";

export const GeneralAssistPromotionalCard: FC = () => {
  const theme = useTheme();

  useEffect(() => {
    trackPaywallShown({
      paywall: "desktop_general-assist-promo",
      from: "live-screen",
    });
  }, []);

  const handleUpgrade = useCallback(() => {
    startUpgradeFlow({
      pwl: "desktop_general-assist-promo",
      forAskFred: false,
    });
  }, []);

  return (
    <View style={styles.container(theme)}>
      <View style={styles.contentRow}>
        <View style={styles.iconContainer(theme)}>
          <IconZap width={20} height={20} stroke="#7a5af8" fill="#7a5af8" />
        </View>
        <View style={styles.textContainer}>
          <Text variant="body2Weight" color="textSecondary">
            Live Assist
          </Text>
          <Text variant="body2Regular" color="textHint">
            Get real-time guidance from AI during live meetings
          </Text>
        </View>
      </View>
      <Button size="sm" onPress={handleUpgrade}>
        Start Free Trial
      </Button>
    </View>
  );
};

const styles = createStyles({
  container: (theme) => ({
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.layerDefault,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  }),
  contentRow: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    alignItems: "center",
  },
  iconContainer: (theme) => ({
    borderRadius: 4,
    backgroundColor: theme.colors.layerBrandLight2,
    color: theme.colors.layerBrandLight2,
    padding: 10,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  }),
  textContainer: {
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
});
