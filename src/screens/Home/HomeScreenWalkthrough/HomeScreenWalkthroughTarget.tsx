import { CoordinatedModal } from "@/components/Dialog";
import { createStyles, useTheme } from "@/styles";
import { GLOBAL } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { Platform, View } from "react-native";
import WalkthroughTooltip, {
  TooltipChildrenContext,
} from "react-native-walkthrough-tooltip";
import { HOME_WALKTHROUGH_STEPS, type HomeWalkthroughStepKey } from "./steps";
import { useHomeScreenWalkthrough } from "./store";
import { WalkthroughStep } from "./WalkthroughStep";

const DISPLAY_INSETS = { top: 24, left: 16, right: 16, bottom: 24 };

interface HomeScreenWalkthroughTargetProps {
  stepKey: HomeWalkthroughStepKey;
  children: ReactNode;
}

export const HomeScreenWalkthroughTarget: FC<
  HomeScreenWalkthroughTargetProps
> = ({ stepKey, children }) => {
  const theme = useTheme();
  const { isActive, currentStepIndex, next, dismiss } =
    useHomeScreenWalkthrough();

  const stepIndex = HOME_WALKTHROUGH_STEPS.findIndex((s) => s.key === stepKey);
  const step = HOME_WALKTHROUGH_STEPS[stepIndex];
  const isCurrent = isActive && currentStepIndex === stepIndex;

  return (
    <WalkthroughTooltip
      modalComponent={CoordinatedModal}
      isVisible={isCurrent}
      content={
        step ? (
          <WalkthroughStep
            title={step.title}
            description={step.description}
            stepNumber={stepIndex + 1}
            totalSteps={HOME_WALKTHROUGH_STEPS.length}
            onNext={next}
            onClose={dismiss}
          />
        ) : undefined
      }
      placement={step?.placement ?? "top"}
      onClose={dismiss}
      backgroundColor={theme.colors.miscellaneousOverlay}
      arrowSize={styles.arrowSize}
      allowChildInteraction={false}
      closeOnChildInteraction={false}
      closeOnContentInteraction={false}
      contentStyle={styles.content}
      tooltipStyle={styles.tooltip}
      childContentSpacing={8}
      displayInsets={DISPLAY_INSETS}
      useInteractionManager
      topAdjustment={0}
    >
      <TooltipChildrenContext.Consumer>
        {({ tooltipDuplicate }) =>
          tooltipDuplicate && step ? (
            <>
              <View
                style={[styles.spotlightBg(theme), step.spotlightOffsets]}
              />
              {children}
            </>
          ) : (
            children
          )
        }
      </TooltipChildrenContext.Consumer>
    </WalkthroughTooltip>
  );
};

const styles = createStyles({
  content: {
    padding: 16,
    width: Platform.OS === "web" ? "90%" : "100%",
    backgroundColor: GLOBAL.purple900,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: "auto",
  },
  tooltip: {
    width: "100%",
  },
  arrowSize: { width: 16, height: 8 },
  spotlightBg: (theme) => ({
    position: "absolute",
    backgroundColor: theme.colors.commandContrastDefault,
    borderRadius: 12,
  }),
});
