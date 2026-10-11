import { Text } from "@/components/Typography";
import { useBilling, usePaywallConfig } from "@/features/billing";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

export const CreditStorageBanner: FC = () => {
  const theme = useTheme();

  const { teamMinutesConsumed, freeMeetingsLeft } = useBilling();

  const shouldShowCreditColumn = typeof freeMeetingsLeft === "number";
  const shouldShowStorageColumn =
    !!teamMinutesConsumed && !teamMinutesConsumed.isInfinity;

  const { hidePaidFeatures } = usePaywallConfig();

  if (!shouldShowCreditColumn && !shouldShowStorageColumn) return null;
  if (hidePaidFeatures) return null;

  return (
    <View style={styles.creditStorageBanner(theme)}>
      {shouldShowCreditColumn && (
        <View style={styles.creditStorageBannerColumn}>
          <Text variant="label2Weight">Meeting credits</Text>
          <Text
            color={
              freeMeetingsLeft <= 0 ? "commandDangerDefault" : "textSecondary"
            }
            variant="body2Regular"
          >
            {freeMeetingsLeft} left
          </Text>
        </View>
      )}
      {shouldShowCreditColumn && shouldShowStorageColumn && (
        <View style={styles.verticalSeparator(theme)} />
      )}
      {shouldShowStorageColumn && (
        <View style={styles.creditStorageBannerColumn}>
          <Text variant="label2Weight">Storage</Text>
          <Text
            color={
              (teamMinutesConsumed.minutesConsumed || 0) >=
              (teamMinutesConsumed.tierLimit || 0)
                ? "commandDangerDefault"
                : "textSecondary"
            }
            variant="body2Regular"
          >
            {Math.round(teamMinutesConsumed.minutesConsumed || 0)} of{" "}
            {teamMinutesConsumed.tierLimit} minutes used
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  creditStorageBanner: (theme) => ({
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 16,
    borderRadius: 8,
    flex: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderWidth: 1,
  }),
  creditStorageBannerColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  },
  verticalSeparator: (theme) => ({
    height: "100%",
    width: 1,
    backgroundColor: theme.colors.borderStaticSubtle,
  }),
});
