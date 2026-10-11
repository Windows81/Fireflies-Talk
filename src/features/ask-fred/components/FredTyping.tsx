import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const timingOptions = {
  duration: 300,
};

export const FredTyping: FC = () => {
  const theme = useTheme();

  const dot1Style = useAnimatedStyle(
    () => ({
      opacity: withRepeat(
        withSequence(
          withTiming(1, timingOptions),
          withTiming(0, timingOptions),
          withTiming(1, timingOptions),
        ),
        -1,
      ),
    }),
    [],
  );
  const dot2Style = useAnimatedStyle(
    () => ({
      opacity: withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(1, timingOptions),
            withTiming(0, timingOptions),
            withTiming(1, timingOptions),
          ),
          -1,
        ),
      ),
    }),
    [],
  );
  const dot3Style = useAnimatedStyle(
    () => ({
      opacity: withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1, timingOptions),
            withTiming(0, timingOptions),
            withTiming(1, timingOptions),
          ),
          -1,
        ),
      ),
    }),
    [],
  );

  return (
    <View style={styles.typing}>
      <Animated.View style={[styles.dot(theme), dot1Style]} />
      <Animated.View style={[styles.dot(theme), dot2Style]} />
      <Animated.View style={[styles.dot(theme), dot3Style]} />
    </View>
  );
};

const styles = createStyles({
  typing: {
    flexDirection: "row",
    gap: 4,
  },
  dot: (theme) => ({
    width: 4,
    height: 4,
    backgroundColor: theme.colors.layerBrand,
    borderRadius: 9999,
  }),
});
