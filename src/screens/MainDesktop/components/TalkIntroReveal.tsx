import type { FC, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cubicBezier,
  type CSSAnimationProperties,
} from "react-native-reanimated";

const REVEAL_MS = 240;
const RISE_PX = 6;

/** Runs once when the element mounts and leaves the layout alone. */
const LAND: CSSAnimationProperties = {
  animationName: {
    from: { opacity: 0, transform: [{ translateY: RISE_PX }] },
    to: { opacity: 1, transform: [{ translateY: 0 }] },
  },
  animationDuration: REVEAL_MS,
  animationTimingFunction: cubicBezier(0.16, 1, 0.3, 1),
};

interface TalkIntroRevealProps {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/** Lands softly: fades in while rising a few pixels into place. */
export const TalkIntroReveal: FC<TalkIntroRevealProps> = ({
  style,
  children,
}) => <Animated.View style={[style, LAND]}>{children}</Animated.View>;
