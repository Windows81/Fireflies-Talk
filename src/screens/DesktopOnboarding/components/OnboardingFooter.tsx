import { IconArrowRight } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View, type DimensionValue } from "react-native";
import { useOnboardingActions } from "../onboardingActions";
import { useOnboarding } from "../OnboardingContext";
import { DESKTOP_THEME } from "@/styles/color";

export const OnboardingFooter: FC = () => {
  const theme = useTheme();
  const { isActionDisabled } = useOnboarding();
  const { handleAction, currentStep } = useOnboardingActions();

  return (
    <View>
      {currentStep.actions?.map((action, index) => {
        const disabled = action.forceEnabled ? false : isActionDisabled;
        return (
          <Button
            key={index}
            variant={action.variant}
            disabled={disabled}
            size="md"
            style={[
              styles.continueButton,
              {
                width: action.width,
                marginTop: action.marginTop,
              },
              disabled && {
                backgroundColor: DESKTOP_THEME.purple1200,
              },
            ]}
            onPress={() => handleAction(action)}
          >
            <Text
              variant="label2Weight"
              color={
                action.variant === "primary" ? "layerContrast" : "textHint"
              }
              style={disabled && { color: DESKTOP_THEME.grey700 }}
            >
              {action.label}
            </Text>
            {action.variant === "primary" ? (
              <IconArrowRight
                width={20}
                height={20}
                color={
                  disabled ? DESKTOP_THEME.grey700 : theme.colors.layerContrast
                }
              />
            ) : null}
          </Button>
        );
      })}

      {currentStep.footerInfo ? (
        <Text
          variant="body3Regular"
          color="commandNeutralDisabled"
          style={styles.footer}
        >
          {currentStep.footerInfo}
        </Text>
      ) : null}
    </View>
  );
};

const styles = createStyles({
  continueButton: {
    width: "fit-content" as unknown as DimensionValue,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
  },
});
