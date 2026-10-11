import { BottomBorderGlow } from "@/features/auth/components/desktop/BottomBorderGlow";
import { createStyles, useTheme } from "@/styles";
import type { PropsWithChildren } from "react";
import type { FC } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../OnboardingContext";

export const OnboardingCanvas: FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();
  const { currentStepIndex, totalSteps } = useOnboarding();

  const progress =
    totalSteps > 0 ? Math.min(1, (currentStepIndex + 1) / totalSteps) : 0;

  return (
    <SafeAreaView
      nativeID="drag-region"
      style={[styles.canvas, { backgroundColor: theme.colors.pageBackground }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.progressBarTrack,
          { backgroundColor: theme.colors.borderStaticSubtle },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: "#16879A",
              width: `${progress * 100}%`,
              height: 2,
            },
          ]}
        />
      </View>
      <View style={styles.content}>{children}</View>
      <View style={styles.bottomGlowContainer} pointerEvents="none">
        <BottomBorderGlow />
      </View>
    </SafeAreaView>
  );
};

const styles = createStyles({
  canvas: {
    flex: 1,
    paddingTop: window.electron?.platform === "darwin" ? 48 : 0,
  },
  progressBarTrack: {
    height: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 300ms ease-in-out",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  bottomGlowContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    overflow: "hidden",
    height: 500,
    width: "100%",
  },
});
