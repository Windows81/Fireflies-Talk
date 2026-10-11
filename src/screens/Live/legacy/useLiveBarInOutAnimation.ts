import { useEffect } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const EASING = Easing.bezier(0.45, 0.2, 0.15, 1);

const MORPH_DURATION = 230;
const SIDE_MORPH_DURATION = 220;
const FADE_DURATION = 100;

const COLLAPSED_WIDTH = 76;
const COLLAPSED_HEIGHT = 36;
const COLLAPSED_RADIUS = 8;

const EXPANDED_HEIGHT = 36;
const EXPANDED_RADIUS = 8;

const EXPANDED_WIDTH_FALLBACK = 300;

const LEFT_BOX_WIDTH = 36; // minimize button
const RIGHT_BOX_WIDTH = 81; // pause + stop cluster
const SIDE_HEIGHT = 36;
const SIDE_BORDER = 1;
const SIDE_GAP = 8;

export function useLiveBarInOutAnimation(expanded: boolean) {
  const morph = useSharedValue(expanded ? 1 : 0);
  const sideMorph = useSharedValue(expanded ? 1 : 0);
  const fade = useSharedValue(expanded ? 1 : 0);
  const expandedWidth = useSharedValue(EXPANDED_WIDTH_FALLBACK);

  useEffect(() => {
    morph.value = withTiming(expanded ? 1 : 0, {
      duration: MORPH_DURATION,
      easing: EASING,
    });
    sideMorph.value = withTiming(expanded ? 1 : 0, {
      duration: SIDE_MORPH_DURATION,
      easing: EASING,
    });
    fade.value = withTiming(expanded ? 1 : 0, {
      duration: FADE_DURATION,
      easing: EASING,
    });
  }, [expanded, morph, sideMorph, fade]);

  const onBarContentLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) expandedWidth.value = width;
  };

  const barStyle = useAnimatedStyle(() => ({
    width: interpolate(
      morph.value,
      [0, 1],
      [COLLAPSED_WIDTH, expandedWidth.value],
    ),
    height: interpolate(
      morph.value,
      [0, 1],
      [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
    ),
    borderRadius: interpolate(
      morph.value,
      [0, 1],
      [COLLAPSED_RADIUS, EXPANDED_RADIUS],
    ),
  }));

  // Opacity for the inner content of the center bar AND the side clusters.
  const contentStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  // Pill (collapsed) content cross-fades against the expanded toolbar.
  const pillStyle = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));

  const leftSideStyle = useAnimatedStyle(() => ({
    width: interpolate(sideMorph.value, [0, 1], [0, LEFT_BOX_WIDTH]),
    height: interpolate(sideMorph.value, [0, 1], [0, SIDE_HEIGHT]),
    borderWidth: interpolate(sideMorph.value, [0, 1], [0, SIDE_BORDER]),
    marginRight: interpolate(sideMorph.value, [0, 1], [0, SIDE_GAP]),
  }));

  const rightSideStyle = useAnimatedStyle(() => ({
    width: interpolate(sideMorph.value, [0, 1], [0, RIGHT_BOX_WIDTH]),
    height: interpolate(sideMorph.value, [0, 1], [0, SIDE_HEIGHT]),
    borderWidth: interpolate(sideMorph.value, [0, 1], [0, SIDE_BORDER]),
    marginLeft: interpolate(sideMorph.value, [0, 1], [0, SIDE_GAP]),
  }));

  return {
    barStyle,
    contentStyle,
    pillStyle,
    leftSideStyle,
    rightSideStyle,
    onBarContentLayout,
  };
}
