import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { View } from "react-native";
import { OnboardingCardLayout } from "../OnboardingCardLayout";

const SHADOW =
  "0px 3px 8px rgba(0, 0, 0, 0.13), 0px 2px 5px rgba(0, 0, 0, 0.13), 0px 1px 1px rgba(0, 0, 0, 0.13)";

const CARD = {
  maxWidth: 574,
  minHeight: 371,
  borderRadius: 32,
  paddingVertical: 40,
  paddingHorizontal: 40,
  backgroundColor: DESKTOP_THEME.grey1050,
  borderColor: DESKTOP_THEME.grey950,
  boxShadow: SHADOW,
};

interface DemoScreenProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export const DemoScreen: FC<DemoScreenProps> = ({
  title,
  subtitle,
  onClose,
  onBack,
  children,
  footer,
}) => (
  <OnboardingCardLayout onClose={onClose} onBack={onBack} cardStyle={CARD}>
    <View style={styles.content}>
      <View style={styles.header}>
        <Text
          variant="heading4"
          color="textPrimary"
          style={styles.centered}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Text variant="body2Regular" color="textMuted" style={styles.centered}>
          {subtitle}
        </Text>
      </View>
      {children}
    </View>
    {footer}
  </OnboardingCardLayout>
);

const styles = createStyles({
  content: {
    alignSelf: "stretch" as const,
    alignItems: "center" as const,
    gap: 40,
  },
  header: {
    alignSelf: "stretch" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  centered: {
    textAlign: "center" as const,
  },
});
