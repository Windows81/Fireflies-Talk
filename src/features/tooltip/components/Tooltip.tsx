import { useState, useEffect, type FC, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import WalkthroughTooltip from "react-native-walkthrough-tooltip";
import { CoordinatedModal } from "@/components/Dialog";
import { useTooltip } from "../store";
import { createStyles, useTheme } from "@/styles";
import { Text } from "@/components/Typography";
import { IconX } from "@/assets/svg";

interface TooltipProps {
  children: ReactNode;
  tooltipKey: string;
  title?: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  backgroundColor?: string;
  delay?: number;
  disabled?: boolean;
  maxWidth?: number;
  displayInsets?: { top: number; left: number; right: number; bottom: number };
}

export const Tooltip: FC<TooltipProps> = ({
  children,
  tooltipKey,
  title,
  description,
  placement = "top",
  backgroundColor,
  delay = 500,
  disabled = false,
  maxWidth,
  displayInsets,
}) => {
  const theme = useTheme();
  const { isTooltipShown, markTooltipAsShown } = useTooltip();
  const [isVisible, setIsVisible] = useState(false);

  const shouldShow = !disabled && !isTooltipShown(tooltipKey);
  const finalBackgroundColor = backgroundColor || theme.colors.layerBrand;

  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow, delay]);

  // Permanently dismiss — called only by the X button.
  const handleDismiss = () => {
    markTooltipAsShown(tooltipKey);
  };

  const TooltipContent = () => (
    <View
      style={[
        styles.content,
        { backgroundColor: finalBackgroundColor },
        maxWidth != null ? { maxWidth } : undefined,
      ]}
    >
      {title && (
        <View style={styles.titleRow}>
          <Text
            variant="title3Weight"
            color="commandContrastDefault"
            style={styles.titleText}
          >
            {title}
          </Text>
          <Pressable
            onPress={handleDismiss}
            hitSlop={8}
            style={styles.closeButton}
          >
            <IconX width={14} height={14} color="rgba(255, 255, 255, 0.7)" />
          </Pressable>
        </View>
      )}
      <Text variant="body2Regular" color="commandContrastDefault">
        {description}
      </Text>
    </View>
  );

  return (
    <WalkthroughTooltip
      modalComponent={CoordinatedModal}
      isVisible={isVisible}
      content={<TooltipContent />}
      placement={placement}
      onClose={() => {}}
      backgroundColor={"transparent"}
      arrowSize={styles.arrowSize}
      arrowStyle={{ borderTopColor: finalBackgroundColor }}
      closeOnChildInteraction={true}
      allowChildInteraction={true}
      contentStyle={styles.tooltipWrapper}
      disableShadow={true}
      showChildInTooltip={true}
      tooltipStyle={styles.tooltip}
      childContentSpacing={0}
      displayInsets={
        displayInsets ?? { top: 24, left: 12, right: 12, bottom: 24 }
      }
    >
      {children}
    </WalkthroughTooltip>
  );
};

const styles = createStyles({
  // Visual box — owns all background, padding, shadow, and sizing.
  content: {
    gap: 4,
    padding: 16,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  titleText: {
    flex: 1,
  },
  closeButton: {
    padding: 2,
    borderRadius: 4,
  },
  // Transparent pass-through wrapper — library applies this to its own container div.
  tooltipWrapper: {
    padding: 0,
    backgroundColor: "transparent",
    height: "auto",
  },
  tooltip: {},
  arrowSize: {
    width: 16,
    height: 8,
  },
});
