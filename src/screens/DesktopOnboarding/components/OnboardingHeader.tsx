import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { useOnboarding } from "../OnboardingContext";

const IconWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();
  return <View style={styles.iconWrapper(theme)}>{children}</View>;
};

export const OnboardingHeader: FC = () => {
  const { currentStep } = useOnboarding();

  const displayIcons = currentStep.icons ?? [];

  return (
    <View style={styles.container}>
      {displayIcons.length > 0 && (
        <View style={styles.headerIcons}>
          {displayIcons.map((Icon, index) => (
            <IconWrapper key={index}>
              <Icon width={24} height={24} color="#FFFFFF" />
            </IconWrapper>
          ))}
        </View>
      )}

      <Text variant="heading4Weight" color="textSecondary" style={styles.title}>
        {currentStep.title}
      </Text>

      {currentStep.subTitle ? (
        <Text variant="body2Regular" color="textMuted" style={styles.subTitle}>
          {currentStep.subTitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = createStyles({
  iconWrapper: (theme) => ({
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.borderStaticTransparent,
    background:
      "linear-gradient(180deg, #363637 0%, #1E1E1F 38.16%, #151617 100%)",
    boxShadow:
      "2px 2px 2px 0 rgba(255, 255, 255, 0.16) inset, 0 0 8px 0 rgba(255, 255, 255, 0.10) inset",
    alignItems: "center",
    justifyContent: "center",
  }),
  headerIcons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  subTitle: {
    textAlign: "center",
  },
  container: {
    marginBottom: 36,
    marginTop: 18,
  },
});
