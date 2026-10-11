import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import { orbStyles } from "./dictationActionOrbStyles";
import {
  ACTION_GRADIENT_END,
  ACTION_GRADIENT_LOCATIONS,
  ACTION_GRADIENT_START,
  actionGradientColors,
} from "./dictationPillStyles";

/**
 * Action mode's purple-to-pink fill, blurred out behind a surface so it reads
 * as a coloured glow. Always inert — it sits under whatever it backs.
 */
export const DictationActionGlow: FC<{ style: StyleProp<ViewStyle> }> = ({
  style,
}) => (
  <View style={style} pointerEvents="none">
    <LinearGradient
      colors={actionGradientColors}
      locations={[...ACTION_GRADIENT_LOCATIONS]}
      start={ACTION_GRADIENT_START}
      end={ACTION_GRADIENT_END}
      style={orbStyles.glowFill}
    />
  </View>
);
