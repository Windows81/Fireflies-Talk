import { CircularLoadingDot } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const WritingNotesIndicator: FC = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(1, 7, 8, 0)", "rgba(38, 130, 52, 0.3)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.button()}>
          <CircularLoadingDot />
          <Text variant="body2Regular" color="textHint">
            Writing your notes...
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = createStyles({
  container: {
    width: "100%",
    alignItems: "center",
  },
  gradientBackground: {
    width: 648,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  button: () => ({
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 386,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    // Note: Box shadow would need platform-specific implementation
    // The white overlay (rgba(255, 255, 255, 0.12)) would be a blend mode effect
    // Using the base black color as the primary background
  }),
});
