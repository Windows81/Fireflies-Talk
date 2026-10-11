import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import {
  BackArrowIcon,
  ONBOARDING_BACKDROP_COLOR,
  OnboardingBackdrop,
  OnboardingCloseButton,
} from "./components/OnboardingChrome";
import type { FC, ReactNode } from "react";
import { Pressable, View } from "react-native";

interface OnboardingLayoutProps {
  children: ReactNode;
  rightContent?: ReactNode;
  onClose?: () => void;
  onBack?: () => void;
}

const STAR_DOTS = [
  { top: "12%", left: "18%", size: 3, opacity: 0.6 },
  { top: "8%", left: "55%", size: 2, opacity: 0.4 },
  { top: "22%", left: "72%", size: 2.5, opacity: 0.5 },
  { top: "35%", left: "30%", size: 2, opacity: 0.3 },
  { top: "45%", left: "85%", size: 3, opacity: 0.5 },
  { top: "58%", left: "15%", size: 2, opacity: 0.35 },
  { top: "65%", left: "60%", size: 2.5, opacity: 0.45 },
  { top: "78%", left: "40%", size: 2, opacity: 0.3 },
  { top: "85%", left: "75%", size: 3, opacity: 0.4 },
  { top: "92%", left: "25%", size: 2, opacity: 0.25 },
];

export const OnboardingLayout: FC<OnboardingLayoutProps> = ({
  children,
  rightContent,
  onClose,
  onBack,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {onClose && <OnboardingCloseButton onPress={onClose} />}

      <View style={styles.leftPanel}>
        <View style={styles.topBar}>
          {onBack && (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.navButtonPressed(theme),
              ]}
            >
              <BackArrowIcon color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>
        <View style={styles.leftContent}>{children}</View>
      </View>

      <View style={styles.rightPanel}>
        <OnboardingBackdrop />
        {STAR_DOTS.map((dot, i) => (
          <View
            key={i}
            style={
              {
                position: "absolute",
                top: dot.top,
                left: dot.left,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                backgroundColor: withAlpha(
                  theme.colors.textPrimary,
                  dot.opacity,
                ),
              } as never
            }
          />
        ))}
        {rightContent}
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    flex: 1,
    flexDirection: "row",
    alignSelf: "stretch",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
  },
  leftPanel: {
    width: "38.5%",
    paddingTop: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    height: 32,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as never,
  },
  navButtonPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  leftContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 56,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: ONBOARDING_BACKDROP_COLOR,
    overflow: "hidden",
  },
});
