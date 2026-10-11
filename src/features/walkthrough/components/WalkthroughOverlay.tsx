import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, type View } from "react-native";
import { useWalkthrough } from "../store";
import type { TipPlacement } from "../steps";
import { WALKTHROUGH_STEPS } from "../steps";
import { WalkthroughTip } from "./WalkthroughTip";

const SHOW_DELAY_MS = 10_000;
const FADE_DURATION_MS = 200;

interface TargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WalkthroughOverlayProps {
  name: string;
  targetRefs: Record<number, React.RefObject<View | null>>;
  skipSteps?: Set<number>;
  canStart?: boolean;
  delayMs?: number;
}

export const WalkthroughOverlay: FC<WalkthroughOverlayProps> = ({
  name,
  targetRefs,
  skipSteps,
  canStart = true,
  delayMs = SHOW_DELAY_MS,
}) => {
  const { completed, isVisible, currentStep, start, goToStep, dismiss } =
    useWalkthrough(name, WALKTHROUGH_STEPS.length);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [targetLayout, setTargetLayout] = useState<TargetLayout | null>(null);
  const [showContent, setShowContent] = useState(false);

  const visibleStepIndices = useMemo(
    () =>
      WALKTHROUGH_STEPS.map((_, i) => i).filter(
        (i) => !skipSteps || !skipSteps.has(i),
      ),
    [skipSteps],
  );

  const visualStepNumber =
    visibleStepIndices.indexOf(currentStep) !== -1
      ? visibleStepIndices.indexOf(currentStep) + 1
      : 1;
  const totalVisibleSteps = visibleStepIndices.length;

  const advanceToNextVisible = useCallback(() => {
    const nextVisible = visibleStepIndices.find((i) => i > currentStep);
    if (nextVisible !== undefined) {
      goToStep(nextVisible);
    } else {
      goToStep(WALKTHROUGH_STEPS.length);
    }
  }, [currentStep, visibleStepIndices, goToStep]);

  useEffect(() => {
    if (completed || !canStart) return;
    const timer = setTimeout(start, delayMs);
    return () => clearTimeout(timer);
  }, [completed, canStart, start, delayMs]);

  // Auto-skip: if the current step should be skipped, advance immediately
  useEffect(() => {
    if (!isVisible) return;
    if (skipSteps?.has(currentStep)) {
      advanceToNextVisible();
    }
  }, [isVisible, currentStep, skipSteps, advanceToNextVisible]);

  useEffect(() => {
    if (isVisible) {
      setShowContent(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => setShowContent(false));
    }
  }, [isVisible, fadeAnim]);

  const measureTarget = useCallback(() => {
    const ref = targetRefs[currentStep];
    if (!ref?.current) {
      setTargetLayout(null);
      return;
    }
    ref.current.measureInWindow((x, y, width, height) => {
      setTargetLayout({ x, y, width, height });
    });
  }, [currentStep, targetRefs]);

  useEffect(() => {
    if (!isVisible) return;

    let raf: number = 0;
    const timeout = setTimeout(
      () => {
        raf = requestAnimationFrame(measureTarget);
      },
      currentStep === 0 ? 500 : 0,
    );

    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, [isVisible, currentStep, measureTarget]);

  if (!showContent) return null;
  if (skipSteps?.has(currentStep)) return null;

  const step = WALKTHROUGH_STEPS[currentStep];
  if (!step) return null;

  const tipStyle = getTipPosition({
    placement: step.placement,
    target: targetLayout,
    offsetTop: step.offsetTop || 0,
    offsetLeft: step.offsetLeft || 0,
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fadeAnim }]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <Animated.View style={[styles.tipWrapper, tipStyle]}>
        <WalkthroughTip
          title={step.title}
          description={step.description}
          currentStep={visualStepNumber - 1}
          totalSteps={totalVisibleSteps}
          placement={step.placement}
          arrowOffset={step.arrowOffset}
          onNext={advanceToNextVisible}
          onDismiss={dismiss}
        />
      </Animated.View>
    </Animated.View>
  );
};

const TIP_WIDTH = 330;
const TIP_GAP = 12;

function getTipPosition({
  placement,
  target,
  offsetTop,
  offsetLeft,
}: {
  placement: TipPlacement;
  target: TargetLayout | null;
  offsetTop: number;
  offsetLeft: number;
}): Record<string, number> {
  if (!target) return { top: 200, right: 380 };

  switch (placement) {
    case "left":
      return {
        top: target.y + target.height / 2 - 60 + offsetTop,
        left: target.x - TIP_WIDTH - TIP_GAP + offsetLeft,
      };
    case "right":
      return {
        top: target.y + target.height / 2 - 60 + offsetTop,
        left: target.x + target.width + TIP_GAP + offsetLeft,
      };
    case "top":
      return {
        top: target.y - 160 - TIP_GAP + offsetTop,
        left: target.x + target.width / 2 - TIP_WIDTH / 2 + offsetLeft,
      };
    case "bottom":
      return {
        top: target.y + target.height + TIP_GAP + offsetTop,
        left: target.x + target.width / 2 - TIP_WIDTH / 2 + offsetLeft,
      };
    default:
      return { top: 200, right: 380 };
  }
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
  },
  backdrop: {
    cursor: "default",
  } as never,
  tipWrapper: {
    position: "absolute",
  },
});
