import { IconZap } from "@/assets/svg";
import { startUpgradeFlow, usePaywallConfig } from "@/features/billing";
import { PaywallVisibility } from "@firefliesai/mobile-ff.graphql-client";
import { StyleSheet, View } from "react-native";
import { Button } from "../Button";
import { Text } from "../Typography";

export function UpgradeButton({
  pwl,
  forAskFred,
  minPrice,
  onPress,
}: {
  pwl?: string;
  forAskFred?: boolean;
  minPrice?: number | null;
  onPress?: () => void;
}) {
  const { visibility } = usePaywallConfig();

  function onUpgradePress() {
    startUpgradeFlow({
      forAskFred,
      pwl,
    });
    onPress?.();
  }

  if (visibility !== PaywallVisibility.Show) {
    return null;
  }

  return (
    <View style={styles.buttonContainer}>
      <Button
        size="lg"
        Icon={(props) => <IconZap {...props} fill={props.color} />}
        onPress={onUpgradePress}
      >
        Upgrade
      </Button>
      {!!minPrice && (
        <Text variant="body1Regular" textAlign="center" color="textHint">
          Plan starts at ${minPrice} / month
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 20,
    gap: 16,
  },
});
