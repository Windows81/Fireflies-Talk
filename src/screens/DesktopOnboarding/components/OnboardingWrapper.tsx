import { createStyles } from "@/styles";
import type { FC, PropsWithChildren } from "react";
import { Pressable, View } from "react-native";
import { OnboardingFooter } from "./OnboardingFooter";
import { OnboardingHeader } from "./OnboardingHeader";
import { DESKTOP_THEME } from "@/styles/color";
import { IconArrowLeft } from "@/assets/svg";
import { useOnboarding } from "../OnboardingContext";

export const OnboardingWrapper: FC<PropsWithChildren> = ({ children }) => {
  const { goBack, currentStepIndex, currentStep } = useOnboarding();
  const canGoBack = currentStepIndex > 0 && !currentStep?.hideBackButton;

  if (currentStep?.customLayout) {
    return (
      <View nativeID="no-drag" style={styles.customPanel}>
        {canGoBack && (
          <Pressable onPress={goBack} style={styles.backButton}>
            <IconArrowLeft
              width={20}
              height={20}
              color={DESKTOP_THEME.grey500}
            />
          </Pressable>
        )}
        {children}
      </View>
    );
  }

  return (
    <View nativeID="no-drag" style={styles.panel}>
      {canGoBack && (
        <Pressable onPress={goBack} style={styles.backButton}>
          <IconArrowLeft width={20} height={20} color={DESKTOP_THEME.grey500} />
        </Pressable>
      )}
      <OnboardingHeader />
      {children}
      <OnboardingFooter />
    </View>
  );
};

const styles = createStyles({
  panel: {
    maxWidth: 880,
    width: "100%",
    minWidth: 320,
    height: 636,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 48,
    borderColor: "#2F2E33",
    borderWidth: 1,
    backgroundColor: DESKTOP_THEME.grey1100,
    boxShadow:
      "0 4px 4px 0 rgba(0, 0, 0, 0.10), 0 0 32px 2px rgba(255, 255, 255, 0.12) inset;",
    backdropFilter: "blur(50px)",
    alignSelf: "center",
    marginHorizontal: 24,
  },
  customPanel: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  backButton: {
    position: "absolute",
    top: 24,
    left: 24,
    zIndex: 10,
  },
});
