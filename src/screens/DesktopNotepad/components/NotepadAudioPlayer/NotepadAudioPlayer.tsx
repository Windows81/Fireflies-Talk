import { AnimatedPressable } from "@/components/Animated";
import { createStyles, useTheme } from "@/styles";
import { useEffect, useState, type FC } from "react";
import { useWindowDimensions, type LayoutChangeEvent } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AudioPlayerControls } from "./AudioPlayerControls";
import { useAudioPlayback } from "./useAudioPlayback";
import { useStickyHover } from "./useStickyHover";

const BORDER = 1;
const PLAYER_HEIGHT = 48;
const EXPAND_DURATION = 200;
// The design bar is 574px; clamp it so it never overruns a narrow window.
const EXPANDED_MAX_WIDTH = 574;
const EXPANDED_SIDE_MARGIN = 48;

export const NotepadAudioPlayer: FC<{
  onExpandedChange?: (expanded: boolean) => void;
}> = ({ onExpandedChange }) => {
  const theme = useTheme();
  const playback = useAudioPlayback();
  const { isHovered, hoverProps } = useStickyHover();
  const { width: screenWidth } = useWindowDimensions();

  const [collapsedWidth, setCollapsedWidth] = useState<number | null>(null);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  // The expanded bar has a seekbar that flexes to fill, so its width is fixed
  // (clamped to the viewport) rather than measured from intrinsic content.
  const expandedWidth = Math.min(
    EXPANDED_MAX_WIDTH,
    screenWidth - EXPANDED_SIDE_MARGIN,
  );
  const ready = collapsedWidth != null;

  // Expand on hover, after play, or while the speed menu is open.
  const expanded = isHovered || !playback.paused || speedMenuOpen;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: EXPAND_DURATION,
    });
    onExpandedChange?.(expanded);
  }, [expanded, progress, onExpandedChange]);

  const visualStyle = useAnimatedStyle(() => {
    if (collapsedWidth == null) return {};
    return {
      width: interpolate(
        progress.value,
        [0, 1],
        [collapsedWidth, expandedWidth],
      ),
    };
  }, [collapsedWidth, expandedWidth]);

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));
  const expandedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  // Collapsed width is measured (content-sized); border included so the pill
  // content is never clipped.
  const onCollapsedLayout = (event: LayoutChangeEvent) => {
    setCollapsedWidth(event.nativeEvent.layout.width + BORDER * 2);
  };

  // The parent row centers this player, so growing it widens evenly on both
  // sides; the cursor stays inside the bar while it expands.
  return (
    <AnimatedPressable
      {...hoverProps}
      style={[styles.visual(theme), visualStyle]}
    >
      <Animated.View
        style={[styles.layer, ready && styles.absolute, collapsedStyle]}
        onLayout={onCollapsedLayout}
        pointerEvents={expanded ? "none" : "auto"}
      >
        <AudioPlayerControls playback={playback} hoverProps={hoverProps} />
      </Animated.View>
      <Animated.View
        style={[
          styles.layer,
          styles.absolute,
          { width: expandedWidth },
          expandedStyle,
        ]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        <AudioPlayerControls
          playback={playback}
          hoverProps={hoverProps}
          expanded
          onSpeedMenuOpenChange={setSpeedMenuOpen}
        />
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = createStyles({
  visual: (theme) => ({
    height: PLAYER_HEIGHT,
    borderRadius: 10,
    borderWidth: BORDER,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.layerMuted,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  }),
  layer: {
    height: "100%",
    justifyContent: "center",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
