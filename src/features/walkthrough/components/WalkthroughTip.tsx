import { IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { GLOBAL } from "@/styles/color";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import type { TipPlacement } from "../steps";

interface ArrowOffset {
  top?: number;
  left?: number;
}

interface WalkthroughTipProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  placement: TipPlacement;
  arrowOffset?: ArrowOffset;
  onNext: () => void;
  onDismiss: () => void;
}

export const WalkthroughTip: FC<WalkthroughTipProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  placement,
  arrowOffset,
  onNext,
  onDismiss,
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={styles.container}>
      <Arrow placement={placement} offset={arrowOffset} />

      <View style={styles.header}>
        <View style={styles.textContent}>
          <Text variant="title3Weight" color="layerContrast">
            {title}
          </Text>
          <Text
            variant="body2Regular"
            color="layerContrast"
            style={styles.description}
          >
            {description}
          </Text>
        </View>
        <Pressable onPress={onDismiss} style={styles.closeButton} hitSlop={8}>
          <IconX width={20} height={20} color="rgba(255, 255, 255, 0.3)" />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text
          variant="body3Regular"
          color="layerContrast"
          style={styles.pagination}
        >
          {`${currentStep + 1} of ${totalSteps}`}
        </Text>
        <Pressable style={styles.nextButton} onPress={onNext}>
          <Text
            variant="label2Weight"
            color="textBrand"
            style={{
              color: GLOBAL.purple700,
            }}
          >
            {isLastStep ? "Done" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const Arrow: FC<{ placement: TipPlacement; offset?: ArrowOffset }> = ({
  placement,
  offset,
}) => {
  const positionStyle =
    placement === "left"
      ? styles.arrowRight
      : placement === "right"
        ? styles.arrowLeft
        : placement === "top"
          ? styles.arrowBottom
          : styles.arrowTop;

  const offsetStyle = offset
    ? { marginTop: offset.top ?? 0, marginLeft: offset.left ?? 0 }
    : undefined;

  return <View style={[styles.arrow, positionStyle, offsetStyle]} />;
};

const ARROW_SIZE = 10;

const styles = createStyles({
  container: {
    width: 330,
    backgroundColor: GLOBAL.purple900,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    paddingHorizontal: 16,
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  description: {
    opacity: 0.8,
  },
  closeButton: {
    padding: 2,
    borderRadius: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  pagination: {
    opacity: 0.8,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: GLOBAL.purple50,
    borderRadius: 4,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 12,
    height: 32,
  },
  arrow: {
    position: "absolute",
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
  },
  arrowRight: {
    right: -ARROW_SIZE,
    top: "50%",
    marginTop: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: GLOBAL.purple900,
  },
  arrowLeft: {
    left: -ARROW_SIZE,
    top: "50%",
    marginTop: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: GLOBAL.purple900,
  },
  arrowBottom: {
    bottom: -ARROW_SIZE,
    left: "50%",
    marginLeft: -ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: GLOBAL.purple900,
  },
  arrowTop: {
    top: -ARROW_SIZE,
    left: "50%",
    marginLeft: -ARROW_SIZE,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: GLOBAL.purple900,
  },
});
