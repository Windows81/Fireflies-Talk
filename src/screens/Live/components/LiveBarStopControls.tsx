import { IconPause, IconPlay } from "@/assets/svg";
import { usePulseAnimatedStyle } from "@/components/Animated";
import {
  HoverTooltip,
  type TooltipAlign,
  type TooltipPosition,
} from "@/components/HoverTooltip";
import { LIVE_BAR_HEIGHT } from "electron/src/dictation/dictation-live-anchor";
import { createStyles, useTheme } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import {
  capsuleBackdrop,
  SHELL_BORDER_REST,
} from "@/screens/DictationPill/dictationPillStyles";
import { useState, type FC, type RefObject } from "react";
import {
  Pressable,
  View,
  Animated as RNAnimated,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";

type LiveBarStopControlsProps = {
  /** Stacked column for the vertical rail on a side dock. */
  vertical?: boolean;
  recordingState?: "inactive" | "recording" | "paused";
  onPauseClick?: () => void;
  onStopClick?: () => void;
  glassRef?: RefObject<View | null>;
  // The window is sized to its content, so a tooltip pointing at an edge with
  // nothing behind it is clipped by the window itself. The caller aims them
  // back into the window.
  tooltipPosition?: TooltipPosition;
  tooltipAlign?: TooltipAlign;
  /** Hidden chrome must not swallow clicks meant for what is behind it. */
  pointerEvents?: "auto" | "none";
  // Glass box geometry (animated) and the inner content fade.
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

// Only the meeting host can pause/stop a recording, so the caller mounts this
// component solely for hosts — the controls here are always enabled.
export const LiveBarStopControls: FC<LiveBarStopControlsProps> = ({
  vertical,
  recordingState,
  onPauseClick,
  onStopClick,
  glassRef,
  tooltipPosition = "bottom",
  tooltipAlign = "center",
  pointerEvents,
  style,
  contentStyle,
}) => {
  const theme = useTheme();
  const isPaused = recordingState === "paused";
  const pausePulseStyle = usePulseAnimatedStyle(1400, 0.2, isPaused);
  const [pauseHovered, setPauseHovered] = useState(false);
  const [stopHovered, setStopHovered] = useState(false);

  return (
    <Animated.View
      ref={glassRef}
      pointerEvents={pointerEvents}
      style={[
        styles.sideButtons(theme),
        vertical && styles.sideVertical,
        style,
      ]}
    >
      <Animated.View
        style={[styles.inner, vertical && styles.innerVertical, contentStyle]}
      >
        <HoverTooltip
          label={isPaused ? "Resume recording" : "Pause recording"}
          position={tooltipPosition}
          align={tooltipAlign}
          tone="pill"
          style={[styles.tooltipWrap, vertical && styles.tooltipWrapVertical]}
        >
          <View
            style={[
              styles.pauseControlWrap,
              vertical && styles.pauseControlWrapVertical,
            ]}
          >
            {isPaused && (
              <RNAnimated.View
                pointerEvents="none"
                style={[styles.pausedPulse(theme), pausePulseStyle]}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isPaused ? "Resume recording" : "Pause recording"
              }
              onPress={onPauseClick}
              onHoverIn={() => setPauseHovered(true)}
              onHoverOut={() => setPauseHovered(false)}
              style={[
                styles.half,
                vertical && styles.halfVertical,
                pauseHovered && styles.pauseHovered,
              ]}
            >
              {isPaused ? (
                <IconPlay width={15} height={15} color={GLOBAL.white} />
              ) : (
                <IconPause width={15} height={15} color={pauseIconColor} />
              )}
            </Pressable>
          </View>
        </HoverTooltip>
        <HoverTooltip
          label="Stop recording"
          position={tooltipPosition}
          align={tooltipAlign}
          tone="pill"
          style={[styles.tooltipWrap, vertical && styles.tooltipWrapVertical]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            onPress={onStopClick}
            onHoverIn={() => setStopHovered(true)}
            onHoverOut={() => setStopHovered(false)}
            style={[
              styles.half,
              vertical && styles.halfVertical,
              styles.stopHalf,
              stopHovered && styles.stopHovered,
            ]}
          >
            <View style={styles.stopMark} />
          </Pressable>
        </HoverTooltip>
      </Animated.View>
    </Animated.View>
  );
};

const pauseIconColor = withAlpha(GLOBAL.white, 0.82);

const styles = createStyles({
  sideButtons: (theme) => ({
    borderWidth: 1,
    borderColor: SHELL_BORDER_REST,
    backgroundColor: theme.colors.dictationPillSurface,
    ...capsuleBackdrop,
    boxShadow: `0 10px 28px ${withAlpha(GLOBAL.grey900, 0.3)}`,
    height: LIVE_BAR_HEIGHT,
    borderRadius: LIVE_BAR_HEIGHT / 2,
    overflow: "hidden",
  }),
  // Row of buttons inside the box; fades on its own beat and keeps a fixed
  // height so it's clipped (not squashed) as the box shrinks.
  inner: {
    height: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
  },
  sideVertical: {
    height: LIVE_BAR_HEIGHT * 2,
    width: LIVE_BAR_HEIGHT,
  },
  innerVertical: {
    flexDirection: "column",
    width: "100%",
  },
  halfVertical: {
    width: "100%",
    height: LIVE_BAR_HEIGHT - 1,
  },
  // Each control fills one half of the capsule's content box (the 1px border
  // eats into the border-box width, hence the -1 per half).
  half: {
    height: "100%",
    width: LIVE_BAR_HEIGHT - 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseHovered: {
    backgroundColor: withAlpha(GLOBAL.white, 0.12),
  },
  stopHalf: {
    backgroundColor: GLOBAL.red500,
  },
  stopHovered: {
    backgroundColor: GLOBAL.red600,
  },
  // The design's stop mark: a white rounded square, not an icon glyph.
  stopMark: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: GLOBAL.white,
  },
  tooltipWrap: {
    height: "100%",
  },
  tooltipWrapVertical: {
    height: LIVE_BAR_HEIGHT - 1,
    width: "100%",
  },
  pauseControlWrapVertical: {
    height: LIVE_BAR_HEIGHT - 1,
    width: "100%",
  },
  pauseControlWrap: {
    position: "relative",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  pausedPulse: (theme) => ({
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    bottom: 1,
    borderRadius: LIVE_BAR_HEIGHT / 2,
    backgroundColor: theme.colors.layerContrast,
  }),
});
