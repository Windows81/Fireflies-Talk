import { IconChevronRight } from "@/assets/svg";
import { Text } from "@/components/Typography";
import type { Theme } from "@/styles";
import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ExpandableRowProps {
  icon: ReactNode;
  label: string;
  labelNode?: ReactNode;
  labelColor?: keyof Theme["colors"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultExpanded?: boolean;
  children?: ReactNode;
}

export const ExpandableRow: FC<ExpandableRowProps> = ({
  icon,
  label,
  labelNode,
  labelColor = "textHint",
  open,
  onOpenChange,
  defaultExpanded = false,
  children,
}) => {
  const theme = useTheme();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultExpanded);
  const isOpen = open ?? uncontrolledOpen;
  const [isContentMounted, setIsContentMounted] = useState(isOpen);
  const progress = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    cancelAnimation(progress);
    if (isOpen) setIsContentMounted(true);
    progress.value = withTiming(
      isOpen ? 1 : 0,
      { duration: 200 },
      (finished) => {
        if (!isOpen && finished) runOnJS(setIsContentMounted)(false);
      },
    );
  }, [isOpen, progress]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 90}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleY: progress.value }],
  }));

  const renderedLabel = labelNode ?? (
    <Text color={labelColor} variant="body2Regular">
      {label}
    </Text>
  );

  if (!children) {
    return (
      <View style={styles.row}>
        {icon}
        {renderedLabel}
      </View>
    );
  }

  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.row}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={label}
      >
        {icon}
        {renderedLabel}
        <Animated.View style={chevronStyle}>
          <IconChevronRight
            width={14}
            height={14}
            color={theme.colors.textHint}
          />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.content, contentStyle]}>
        {isContentMounted && (
          <View style={styles.contentInner}>{children}</View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = createStyles({
  container: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  content: {
    transformOrigin: "top",
  },
  contentInner: {
    paddingLeft: 24,
    paddingBottom: 8,
  },
});
