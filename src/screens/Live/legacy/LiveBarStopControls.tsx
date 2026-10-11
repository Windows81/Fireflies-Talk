import { IconStopSolid, IconPause, IconPlay } from "@/assets/svg";
import { Button } from "@/components/Button";
import { usePulseAnimatedStyle } from "@/components/Animated";
import { HoverTooltip } from "@/components/HoverTooltip";
import { createStyles, useTheme } from "@/styles";
import { type FC, type RefObject } from "react";
import {
  View,
  Animated as RNAnimated,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";

type LiveBarStopControlsProps = {
  recordingState?: "inactive" | "recording" | "paused";
  onPauseClick?: () => void;
  onStopClick?: () => void;
  glassRef?: RefObject<View | null>;
  // Glass box geometry (animated) and the inner content fade.
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

// Only the meeting host can pause/stop a recording, so the caller mounts this
// component solely for hosts — the controls here are always enabled.
export const LiveBarStopControls: FC<LiveBarStopControlsProps> = ({
  recordingState,
  onPauseClick,
  onStopClick,
  glassRef,
  style,
  contentStyle,
}) => {
  const theme = useTheme();
  const isPaused = recordingState === "paused";
  const pausePulseStyle = usePulseAnimatedStyle(1400, 0.2, isPaused);

  return (
    <Animated.View ref={glassRef} style={[styles.sideButtons(theme), style]}>
      <Animated.View style={[styles.inner, contentStyle]}>
        <HoverTooltip
          label={isPaused ? "Resume recording" : "Pause recording"}
          position="bottom"
        >
          <View style={styles.pauseControlWrap}>
            {isPaused && (
              <RNAnimated.View
                pointerEvents="none"
                style={[styles.pausedPulse(theme), pausePulseStyle]}
              />
            )}
            <Button
              variant="transparentNeutral"
              size="xs"
              style={styles.iconClose}
              onPress={onPauseClick}
            >
              {isPaused ? (
                <IconPlay
                  width={14}
                  height={14}
                  color={theme.colors.layerContrast}
                />
              ) : (
                <IconPause
                  width={14}
                  height={14}
                  color={theme.colors.commandNeutralDefault}
                  opacity={0.6}
                />
              )}
            </Button>
          </View>
        </HoverTooltip>
        <View testID="drag" style={styles.separator(theme)} />
        <HoverTooltip label="Stop recording" position="bottom">
          <Button
            variant="transparentNeutral"
            size="xs"
            style={styles.iconClose}
            onPress={onStopClick}
          >
            <IconStopSolid
              width={20}
              height={20}
              color={theme.colors.informationStaticRedText}
            />
          </Button>
        </HoverTooltip>
      </Animated.View>
    </Animated.View>
  );
};

const styles = createStyles({
  sideButtons: (theme) => ({
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.pageBackground,
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
  }),
  // Row of buttons inside the box; fades on its own beat and keeps a fixed
  // height so it's clipped (not squashed) as the box shrinks.
  inner: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  iconClose: {
    height: 36,
    width: 36,
    paddingBottom: 2,
  },
  pauseControlWrap: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  pausedPulse: (theme) => ({
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    bottom: 1,
    borderRadius: 6,
    backgroundColor: theme.colors.layerContrast,
  }),
  separator: (theme) => ({
    width: 1,
    height: 8,
    backgroundColor: theme.colors.interactiveSecondaryHover,
    alignSelf: "center",
  }),
});
