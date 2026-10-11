import { IconAiSparkle } from "@/assets/svg";
import { ShimmerText, Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { ThreeDotBouncingAnim } from "src/screens/Live/components/ThreeDotBouncing";

export const LiveAssistFeaturePreview: FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.listeningContainer}>
        <IconAiSparkle width={20} height={20} />
        <View style={styles.listeningStatus}>
          {/* Static mock, so no cycling status text and no reveal delay. */}
          <ThreeDotBouncingAnim
            showMessages={false}
            renderAnimImmediate
            style={styles.dots}
          />
          <ShimmerText variant="body2Regular" color="textSecondary">
            Listening...
          </ShimmerText>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text variant="body2Regular" color="textPrimary">
          Reframe the discount:
        </Text>
        <View style={{ ...styles.placeholder, flex: 1 }} />
        <View style={{ ...styles.placeholder, width: "70%" }} />
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    width: 321,
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  textContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    flexWrap: "wrap",
  },
  listeningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flex: 1,
    width: "100%",
  },
  listeningStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Sits inline beside the label here rather than below feed content.
  dots: {
    marginTop: 0,
  },
  placeholder: {
    borderRadius: 8,
    height: 9,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
});
