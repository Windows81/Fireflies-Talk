import { Text } from "@/components/Typography";
import { createStyles, useTheme, type Theme } from "@/styles";
import type { FC, ReactNode } from "react";
import { Pressable } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import type { SvgProps } from "react-native-svg";

const ACTION_WIDTH = 140;
const FRICTION = 3;
const RIGHT_THRESHOLD = 40;

export type SwipeableColor = keyof Theme["colors"];

export interface SwipeAction {
  label: string;
  Icon?: FC<SvgProps>;
  backgroundColor?: SwipeableColor;
  color?: SwipeableColor;
  onPress: () => void;
}

export interface SwipeableProps {
  view: ReactNode;
  swipeRight?: SwipeAction;
}

const RightAction: FC<{
  action: SwipeAction;
  translation: SharedValue<number>;
}> = ({ action, translation }) => {
  const theme = useTheme();
  const backgroundColor =
    theme.colors[action.backgroundColor ?? "interactiveDangerSecondaryDefault"];
  const color = theme.colors[action.color ?? "commandDangerDefault"];
  const Icon = action.Icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translation.value + ACTION_WIDTH }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={action.onPress}
        style={[styles.action, { backgroundColor }]}
      >
        {Icon && <Icon width={20} height={20} color={color} />}
        <Text
          variant="body2Regular"
          color={action.color ?? "commandDangerDefault"}
        >
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const Swipeable: FC<SwipeableProps> = ({ view, swipeRight }) => {
  const renderRightActions = swipeRight
    ? (_: SharedValue<number>, translation: SharedValue<number>) => (
        <RightAction action={swipeRight} translation={translation} />
      )
    : undefined;

  return (
    <ReanimatedSwipeable
      friction={FRICTION}
      rightThreshold={RIGHT_THRESHOLD}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      {view}
    </ReanimatedSwipeable>
  );
};

const styles = createStyles({
  action: {
    width: ACTION_WIDTH,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
