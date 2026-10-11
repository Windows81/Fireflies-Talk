import { LIVE_BAR_HEIGHT } from "electron/src/dictation/dictation-live-anchor";
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
const COLLAPSED_HEIGHT = LIVE_BAR_HEIGHT;
const COLLAPSED_RADIUS = LIVE_BAR_HEIGHT / 2;

const EXPANDED_HEIGHT = LIVE_BAR_HEIGHT;
const EXPANDED_RADIUS = LIVE_BAR_HEIGHT / 2;

const EXPANDED_WIDTH_FALLBACK = 300;

const LEFT_BOX_WIDTH = LIVE_BAR_HEIGHT; // minimize button
// Two 43px halves + the 1px border on each side (border-box).
const RIGHT_BOX_WIDTH = LIVE_BAR_HEIGHT * 2;
const SIDE_HEIGHT = LIVE_BAR_HEIGHT;
const SIDE_BORDER = 1;
const SIDE_GAP = 8;

export function useLiveBarInOutAnimation(
  expanded: boolean,
  /** Hover-only chrome (the full-screen button) rides this instead. */
  hoverExpanded: boolean = expanded,
) {
  const morph = useSharedValue(expanded ? 1 : 0);
  const sideMorph = useSharedValue(hoverExpanded ? 1 : 0);
  const fade = useSharedValue(expanded ? 1 : 0);
  const expandedWidth = useSharedValue(EXPANDED_WIDTH_FALLBACK);

  useEffect(() => {
    morph.value = withTiming(expanded ? 1 : 0, {
      duration: MORPH_DURATION,
      easing: EASING,
    });
    sideMorph.value = withTiming(hoverExpanded ? 1 : 0, {
      duration: SIDE_MORPH_DURATION,
      easing: EASING,
    });
    fade.value = withTiming(expanded ? 1 : 0, {
      duration: FADE_DURATION,
      easing: EASING,
    });
  }, [expanded, hoverExpanded, morph, sideMorph, fade]);

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

  // The full-screen button reserves its space permanently and only fades:
  // animating its size would shove the bar sideways every time you hover it.
  const leftSideStyle = useAnimatedStyle(() => ({
    width: LEFT_BOX_WIDTH,
    height: SIDE_HEIGHT,
    borderWidth: SIDE_BORDER,
    marginRight: SIDE_GAP,
    opacity: sideMorph.value,
  }));

  // Stop/pause are hover-only chrome like the full-screen button, and reserve
  // their space the same way: animating the size would shove the bar sideways
  // every time the cursor arrives.
  const rightSideStyle = useAnimatedStyle(() => ({
    width: RIGHT_BOX_WIDTH,
    height: SIDE_HEIGHT,
    borderWidth: SIDE_BORDER,
    marginLeft: SIDE_GAP,
    opacity: sideMorph.value,
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
