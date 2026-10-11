import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View, Platform } from "react-native";

export const LiveAssistPausedPreview: FC = () => {
  return (
    <View style={styles.suggestionCard}>
      <View style={styles.blurOverlay}>
        <View style={styles.suggestionContent}>
          <Text style={styles.emoji}>💡</Text>
          <View style={styles.textContainer}>
            <Text
              color="textSecondary"
              variant="body2Regular"
              style={styles.suggestionText}
            >
              ROI and impact
            </Text>
            <View style={styles.subsectionTextContainer}>
              <Text
                color="textMuted"
                variant="body2Regular"
                style={styles.subsectionText}
              >
                Average customers save 5+ hours weekly
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  suggestionCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    overflow: "hidden",
    display: "flex",
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 16,
    paddingLeft: 16,
    alignItems: "flex-start",
    gap: 8,
  },
  blurOverlay: {
    opacity: 1,
    ...(Platform.OS === "web" && {
      filter: "blur(8px)",
      WebkitFilter: "blur(8px)",
    }),
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  emoji: {
    fontSize: 18,
  },
  suggestionText: {
    flex: 1,
    lineHeight: 18,
  },
  subsectionTextContainer: {
    marginTop: 2,
  },
  subsectionText: {
    lineHeight: 20,
    textAlign: "left",
  },
});
