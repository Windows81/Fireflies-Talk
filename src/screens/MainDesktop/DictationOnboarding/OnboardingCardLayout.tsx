import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import {
  ONBOARDING_BACKDROP_COLOR,
  OnboardingBackdrop,
  OnboardingBackButton,
  OnboardingCloseButton,
} from "./components/OnboardingChrome";
import type { FC, ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface OnboardingCardLayoutProps {
  children: ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  cardStyle?: StyleProp<ViewStyle>;
  /** Presses on the backdrop around the card, for dismissing open popovers. */
  onOutsidePress?: () => void;
}

export const OnboardingCardLayout: FC<OnboardingCardLayoutProps> = ({
  children,
  onClose,
  onBack,
  cardStyle,
  onOutsidePress,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <OnboardingBackdrop />

      {onOutsidePress && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onOutsidePress}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}

      {onBack && <OnboardingBackButton onPress={onBack} />}

      {onClose && <OnboardingCloseButton onPress={onClose} />}

      <View style={[styles.card(theme), cardStyle]}>
        <View style={styles.cardContent}>{children}</View>
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: ONBOARDING_BACKDROP_COLOR,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  card: (theme) => ({
    width: "100%",
    maxWidth: 560,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.06),
    paddingVertical: 40,
    paddingHorizontal: 48,
  }),
  cardContent: {
    alignItems: "center",
  },
});
