import { IconChevronRight } from "@/assets/svg";
import { useTheme } from "@/styles";
import { useEffect, type FC } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const EXPANDED_ROTATION = 90;
const DURATION = 250;

export const AnimatedChevron: FC<{
  expanded: boolean;
  size?: number;
  color?: string;
}> = ({ expanded, size = 16, color }) => {
  const theme = useTheme();
  const rotation = useSharedValue(expanded ? EXPANDED_ROTATION : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? EXPANDED_ROTATION : 0, {
      duration: DURATION,
    });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={chevronStyle}>
      <IconChevronRight
        width={size}
        height={size}
        color={color ?? theme.colors.textSecondary}
      />
    </Animated.View>
  );
};
