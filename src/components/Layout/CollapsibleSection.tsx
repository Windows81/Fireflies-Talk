import { AnimatedChevron } from "@/components/Animated";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  cancelAnimation,
} from "react-native-reanimated";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  initiallyExpanded?: boolean;
  tinted?: boolean;
}

export const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  children,
  initiallyExpanded = false,
  tinted = false,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isContentVisible, setIsContentVisible] = useState(initiallyExpanded);
  const expansionProgress = useSharedValue(initiallyExpanded ? 1 : 0);

  const toggleSection = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Cancel any in-flight animations to prevent stale callbacks
    cancelAnimation(expansionProgress);

    // When expanding, show content immediately before animation
    if (newExpanded) {
      setIsContentVisible(true);
    }

    expansionProgress.value = withTiming(
      newExpanded ? 1 : 0,
      {
        duration: 250,
      },
      (finished) => {
        // When collapsing, hide content only after animation completes
        // Guard against stale callbacks by checking if animation finished successfully
        if (!newExpanded && finished) {
          runOnJS(setIsContentVisible)(false);
        }
      },
    );
  }, [isExpanded, expansionProgress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expansionProgress.value,
    transform: [
      {
        scaleY: expansionProgress.value,
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.header, tinted && styles.headerTinted(theme)]}
        onPress={toggleSection}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint={
          isExpanded ? "Collapses this section" : "Expands this section"
        }
      >
        <Text color="textPrimary" variant="body1Weight">
          {title}
        </Text>
        <AnimatedChevron expanded={isExpanded} />
      </Pressable>

      <Animated.View style={[styles.content, contentStyle]}>
        {isContentVisible && (
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTinted: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
  }),
  content: {
    transformOrigin: "top",
    paddingTop: 16,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
});
