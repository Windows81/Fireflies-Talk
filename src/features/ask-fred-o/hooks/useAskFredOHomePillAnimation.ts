import { useTheme } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import { useEffect } from "react";
import { Platform, StyleSheet, type LayoutChangeEvent } from "react-native";
import {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Ease-out quint: covers most of the morph early, then settles slowly.
const EASING = Easing.bezier(0.22, 1, 0.36, 1);
const MORPH_DURATION = 230;

export const PILL_SIDE_MARGIN = 16;
export const PILL_ICON_SIZE = 24;
export const PILL_GRADIENT_COLORS = [
  GLOBAL.fredPurple,
  GLOBAL.fredLavender,
] as const;

// Expanded: matches the Record screen RecordAskFredBar.
const EXPANDED_HEIGHT = 48;
const EXPANDED_RADIUS = 8;
const EXPANDED_PADDING = 12;
const EXPANDED_BORDER_WIDTH = 1;
// Android: expo-blur renders a flat tint, not a blur, so an opaque bar keeps
// the feed text from reading through it.
const EXPANDED_TINT_ALPHA = Platform.OS === "android" ? 1 : 0.8;
const BACKDROP_BLUR_INTENSITY = 100;

// Collapsed: matches the Notepad AskFredButton (52pt, radius 16, 32pt icon).
const COLLAPSED_SIZE = 52;
const COLLAPSED_RADIUS = 16;
const COLLAPSED_ICON_SCALE = 32 / PILL_ICON_SIZE;
const COLLAPSED_PADDING = (COLLAPSED_SIZE - PILL_ICON_SIZE) / 2;

// The label only shows during the last stretch of the expansion.
const LABEL_VISIBLE_FROM = 0.6;

// Morphs the Home Ask Fred bar between the full-width bar (expansion 1) and
// the gradient AskFred square anchored bottom-right (expansion 0).
export const useAskFredOHomePillAnimation = (
  isExpanded: boolean,
  isAnimated: boolean,
) => {
  const theme = useTheme();
  const expansion = useSharedValue(isExpanded ? 1 : 0);
  const expandedWidth = useSharedValue(0);

  useEffect(() => {
    expansion.value = withTiming(isExpanded ? 1 : 0, {
      duration: isAnimated ? MORPH_DURATION : 0,
      easing: EASING,
    });
  }, [isExpanded, isAnimated, expansion]);

  const onWrapperLayout = (e: LayoutChangeEvent) => {
    expandedWidth.value = e.nativeEvent.layout.width - 2 * PILL_SIDE_MARGIN;
  };

  const expandedTint = withAlpha(
    theme.colors.layerDefault,
    EXPANDED_TINT_ALPHA,
  );
  const expandedBorder = theme.colors.borderStaticSubtle;
  // Dark collapsed: matches the dark Notepad AskFredButton instead of the gradient.
  const isDark = theme.name === "dark";
  const collapsedTint = isDark ? theme.colors.layerStrong : GLOBAL.fredPurple;
  const collapsedBorder = isDark
    ? theme.colors.borderInteractiveActive
    : withAlpha(expandedBorder, 0);
  const collapsedBorderWidth = isDark
    ? EXPANDED_BORDER_WIDTH
    : StyleSheet.hairlineWidth;

  const shapeStyle = useAnimatedStyle(() => ({
    // Until the wrapper is measured, fill it like the static bar did.
    width: expandedWidth.value
      ? interpolate(
          expansion.value,
          [0, 1],
          [COLLAPSED_SIZE, expandedWidth.value],
        )
      : "100%",
    height: interpolate(
      expansion.value,
      [0, 1],
      [COLLAPSED_SIZE, EXPANDED_HEIGHT],
    ),
    borderRadius: interpolate(
      expansion.value,
      [0, 1],
      [COLLAPSED_RADIUS, EXPANDED_RADIUS],
    ),
  }));

  const surfaceStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      expansion.value,
      [0, 1],
      [COLLAPSED_RADIUS, EXPANDED_RADIUS],
    ),
    borderWidth: interpolate(
      expansion.value,
      [0, 1],
      [collapsedBorderWidth, EXPANDED_BORDER_WIDTH],
    ),
    borderColor: interpolateColor(
      expansion.value,
      [0, 1],
      [collapsedBorder, expandedBorder],
    ),
  }));

  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      expansion.value,
      [0, 1],
      [collapsedTint, expandedTint],
    ),
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: isDark ? 0 : 1 - expansion.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(
      expansion.value,
      [0, 1],
      [COLLAPSED_PADDING, EXPANDED_PADDING],
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(expansion.value, [0, 1], [COLLAPSED_ICON_SCALE, 1]),
      },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expansion.value,
      [LABEL_VISIBLE_FROM, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  // Fades by intensity, not opacity: iOS renders a blur view with alpha < 1
  // incorrectly.
  const backdropBlurProps = useAnimatedProps(() => ({
    intensity: expansion.value * BACKDROP_BLUR_INTENSITY,
  }));

  return {
    onWrapperLayout,
    backdropBlurProps,
    shapeStyle,
    surfaceStyle,
    tintStyle,
    gradientStyle,
    contentStyle,
    iconStyle,
    labelStyle,
  };
};
