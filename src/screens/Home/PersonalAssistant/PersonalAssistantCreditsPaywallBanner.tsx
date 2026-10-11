import { IconSparkleOrange } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { startUpgradeFlow } from "@/features/billing";
import { GLOBAL } from "@/styles/color";
import { createStyles } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";

const PWL = "mobile_home-personal-assistant-credits";

export const PersonalAssistantCreditsPaywallBanner: FC = () => {
  return (
    <View style={styles.root}>
      <IconSparkleOrange width={16} height={24} />
      <Text variant="body2Regular" color="textSecondary" style={styles.text}>
        <Text variant="body2Weight" color="textSecondary" style={styles.text}>
          0 AI Credits
        </Text>{" "}
        – To view skill insights, subscribe to AI credits.{" "}
        <Text
          variant="body2Weight"
          color="textBrand"
          style={[styles.text, styles.link]}
          onPress={() => startUpgradeFlow({ pwl: PWL })}
        >
          Get AI Credits
        </Text>
      </Text>
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: GLOBAL.yellow50,
  },
  text: {
    flex: 1,
    lineHeight: 23,
  },
  link: {
    textDecorationLine: "underline",
  },
});
