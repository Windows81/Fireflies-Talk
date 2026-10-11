import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

interface CreditsProgressBarProps {
  percentage?: number;
  planType?: string;
  subText?: string;
  isFreeUser?: boolean;
}

export const CreditsProgressBar: FC<CreditsProgressBarProps> = ({
  percentage,
  planType = "Pro",
  subText = "",
  isFreeUser,
}) => {
  const theme = useTheme();

  // Determine colors based on percentage
  const getProgressColors = (pct: number) => {
    if (pct >= 80) {
      return {
        track: theme.colors.rainbowStaticTealSolid,
        fill: theme.colors.rainbowStaticTealSubtle,
      };
    }
    if (pct >= 0) {
      return {
        track: theme.colors.rainbowStaticOrangeSubtle,
        fill: theme.colors.rainbowStaticOrangeText,
      };
    }
    return {
      track: theme.colors.informationStaticRedSolid,
      fill: theme.colors.informationStaticRedSolid,
    };
  };

  const colors = getProgressColors(percentage || 0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isFreeUser && styles.headerSpaceBetween]}>
        <Text variant="body1Weight" color="textPrimary">
          {planType}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        {typeof percentage === "number" && (
          <View
            style={[styles.progressTrack, { backgroundColor: colors.track }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: colors.fill,
                },
              ]}
            />
          </View>
        )}
        <View style={styles.subtextContainer}>
          <Text variant="body3Regular" color="textMuted">
            {subText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    flex: 1,
    gap: 8,
    alignSelf: "stretch",
  },
  header: {
    justifyContent: "flex-start",
  },
  headerSpaceBetween: {
    justifyContent: "space-between",
    flexDirection: "row",
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  subtextContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
});
