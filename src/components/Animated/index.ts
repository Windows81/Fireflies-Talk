import { Pressable, TouchableHighlight, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

export const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const AnimatedTouchableHighlight =
  Animated.createAnimatedComponent(TouchableHighlight);
export { AnimatedChevron } from "./AnimatedChevron";
export { RecordIndicator } from "./RecordIndicator";
export { usePulseAnimatedStyle } from "./hooks";
