import {
  IconMaximize,
  IconMinimize,
  IconPause,
  IconPlay,
  IconSeekBackward,
  IconSeekForward,
  IconSpeedometer1,
  IconSpeedometer2,
  IconSpeedometer3,
  IconSpeedometer4,
  IconSpeedometer5,
  IconVideo,
  IconVideoOff,
} from "@/assets/svg";
import { LoadingSpinner } from "@/components/Loading";
import { Text } from "@/components/Typography";
import { toHHMMSS } from "@/utils/time";
import Slider from "@react-native-community/slider";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";
import type { SvgProps } from "react-native-svg";
import { usePlayer, usePlayerState } from "./PlayerContext";
import { StartFromBeginningButton } from "./StartFromBeginningButton";
import { HIDE_CONTROLS_DELAY, playbackRates } from "./constants";
import { AnimatedPressable } from "@/components/Animated";

const PlaybackRateIconMap: Record<number, FC<SvgProps>> = {
  1: IconSpeedometer1,
  1.25: IconSpeedometer2,
  1.5: IconSpeedometer3,
  1.75: IconSpeedometer4,
  2: IconSpeedometer5,
};

const PlayerComponentBottom: FC<{
  videoHidden?: boolean;
  isAudioSource?: boolean;
}> = ({ videoHidden, isAudioSource }) => {
  const { duration, isFullscreen } = usePlayerState();
  const { player } = usePlayer();

  const [current, setCurrent] = useState(0);
  const isChangingRef = useRef(false);
  const wasSeekingRef = useRef(false);

  useEffect(() => {
    // if user is not changing the slider, update the slider
    // to the current time
    const onTimeUpdate = () => {
      if (isChangingRef.current || wasSeekingRef.current) return;
      setCurrent(player.currentTime);
    };
    player.addEventListener("timeupdate", onTimeUpdate);
    player.addEventListener("seeking", () => {
      wasSeekingRef.current = true;
    });
    player.addEventListener("seeked", () => {
      wasSeekingRef.current = false;
    });
    return () => {
      player.removeEventListener("timeupdate", onTimeUpdate);
      player.removeEventListener("seeking", () => {
        wasSeekingRef.current = true;
      });
      player.removeEventListener("seeked", () => {
        wasSeekingRef.current = false;
      });
    };
  }, [player]);

  const onValueChange = useCallback((value: number) => {
    setCurrent(value);
  }, []);
  const onSlidingStart = useCallback(() => {
    isChangingRef.current = true;
  }, []);
  const onValueCommit = useCallback(
    (value: number) => {
      if (player) {
        player.currentTime = value;
      }
      isChangingRef.current = false;
    },
    [player],
  );

  const isOneHourOrMore = duration >= 60 * 60;

  return (
    <>
      <View style={styles.bottomContainer}>
        <View style={styles.sliderTime}>
          <Text style={styles.controlText} variant="body2Weight">
            {toHHMMSS(current, isOneHourOrMore)}
          </Text>
          <Text
            style={[styles.controlText, styles.opaqueText]}
            variant="body2Weight"
          >
            {" / "}
            {toHHMMSS(duration, isOneHourOrMore)}
          </Text>
        </View>
        {!videoHidden && !isAudioSource && (
          <TouchableOpacity
            onPress={() => {
              if (isFullscreen) {
                player?.exitFullscreen();
              } else {
                player?.requestFullscreen();
              }
            }}
            aria-label={isFullscreen ? "Minimize" : "Maximize"}
            hitSlop={8}
            role="button"
          >
            {isFullscreen ? (
              <IconMinimize color="#ffffff" width={16} height={16} />
            ) : (
              <IconMaximize color="#ffffff" width={16} height={16} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          step={1}
          value={current}
          onSlidingStart={onSlidingStart}
          onValueChange={onValueChange}
          onSlidingComplete={onValueCommit}
          minimumTrackTintColor="#7A5AF8"
          maximumTrackTintColor="rgba(255, 255, 255, 0.75)"
          thumbTintColor="#ffffff"
          tapToSeek
          aria-label="Seek slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={current}
          aria-valuetext={`${toHHMMSS(current, isOneHourOrMore)} of ${toHHMMSS(
            duration,
            isOneHourOrMore,
          )}`}
        />
      </View>
    </>
  );
};

export const PlayerComponentElements: FC<{
  videoHidden?: boolean;
  setVideoHidden?: (hidden: boolean) => void;
  isAudioSource?: boolean;
  playButtonOnly?: boolean;
}> = ({ videoHidden, setVideoHidden, isAudioSource, playButtonOnly }) => {
  const { paused, playbackRate, buffering } = usePlayerState();
  const { player } = usePlayer();

  const [isHovered, setIsHovered] = useState(false);

  /**
   * Active state drives the controls visibility. Controls are shown by default
   * and auto-hide a few seconds after playback starts, while staying visible
   * when paused or while the pointer hovers the player.
   */
  const [isActive, setIsActive] = useState(true);
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef(false);

  const clearHideTimeout = useCallback(() => {
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
  }, []);

  // Show and keep the controls visible (used when paused or hovered).
  const showControls = useCallback(() => {
    clearHideTimeout();
    setIsActive(true);
  }, [clearHideTimeout]);

  // Show the controls, then auto-hide after 3s unless the pointer is hovering.
  const flashControls = useCallback(() => {
    clearHideTimeout();
    setIsActive(true);
    activeTimeoutRef.current = setTimeout(() => {
      if (isHoveredRef.current) return;
      setIsActive(false);
    }, HIDE_CONTROLS_DELAY);
  }, [clearHideTimeout]);

  useEffect(() => {
    player.addEventListener("play", flashControls);
    player.addEventListener("pause", showControls);
    player.addEventListener("seeking", flashControls);
    return () => {
      player.removeEventListener("play", flashControls);
      player.removeEventListener("pause", showControls);
      player.removeEventListener("seeking", flashControls);
      clearHideTimeout();
    };
  }, [player, flashControls, showControls, clearHideTimeout]);

  const onHoverIn = useCallback(() => {
    isHoveredRef.current = true;
    setIsHovered(true);
    showControls();
  }, [showControls]);

  const onHoverOut = useCallback(() => {
    isHoveredRef.current = false;
    setIsHovered(false);
    // Keep controls visible while paused; only auto-hide during playback.
    if (!player.paused) flashControls();
  }, [player, flashControls]);

  const showFullControls = !playButtonOnly || !paused || isHovered;

  const hoverProps = Platform.OS === "web" ? { onHoverIn, onHoverOut } : {};

  const shouldShow = !!isActive || videoHidden;

  const animStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(shouldShow ? 1 : 0),
    }),
    [shouldShow],
  );

  const togglePlaybackRate = useCallback(() => {
    const index = playbackRates.indexOf(player.playbackRate);
    if (index === -1) {
      player.playbackRate = 1;
    } else if (index === playbackRates.length - 1) {
      player.playbackRate = playbackRates[0];
    } else {
      player.playbackRate = playbackRates[index + 1];
    }
  }, [player]);

  // FIXME: seems like playback rate can go out of range
  const PlaybackRateIcon =
    PlaybackRateIconMap[playbackRate] || IconSpeedometer1;

  return (
    <View style={styles.root}>
      {/* With the new arch, if the opacity is zero, iOS is not rendering the component at all.
      So now, we need this extra pressable for the iOS side :( */}
      <Pressable
        style={styles.touchOverlay}
        onTouchStart={flashControls}
        onTouchMove={flashControls}
        onPress={flashControls}
        {...hoverProps}
      />

      <AnimatedPressable
        onTouchStart={flashControls}
        onTouchMove={flashControls}
        onPress={flashControls}
        {...hoverProps}
        style={[styles.controlsContainer, animStyle]}
      >
        <View style={[styles.center, !shouldShow && styles.noPointerEvents]}>
          {buffering ? (
            <LoadingSpinner color="#ffffff" />
          ) : (
            <>
              {showFullControls && (
                <TouchableOpacity
                  onPress={() => {
                    player.currentTime = player.currentTime - 5;
                  }}
                  aria-label="Seek Backward"
                  hitSlop={8}
                  role="button"
                >
                  <IconSeekBackward color="#ffffff" width={24} height={24} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.play}
                onPress={() => {
                  if (player.ended) {
                    player.currentTime = 0;
                    player.play();
                  } else if (player.paused) player.play();
                  else player.pause();
                }}
                aria-label={paused ? "Play" : "Pause"}
                hitSlop={8}
                role="button"
              >
                {paused ? (
                  <IconPlay color="#ffffff" width={32} height={24} />
                ) : (
                  <IconPause color="#ffffff" width={32} height={32} />
                )}
              </TouchableOpacity>
              {showFullControls && (
                <TouchableOpacity
                  onPress={() => {
                    player.currentTime = player.currentTime + 15;
                  }}
                  aria-label="Seek Forward"
                  hitSlop={8}
                  role="button"
                >
                  <IconSeekForward color="#ffffff" width={24} height={24} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        {showFullControls && (
          <View
            style={[
              styles.topLeft,
              styles.controlPill,
              !shouldShow && styles.noPointerEvents,
            ]}
            aria-label={`Playback Rate: ${playbackRate}X`}
          >
            <TouchableOpacity
              onPress={togglePlaybackRate}
              style={styles.buttonWithText}
              hitSlop={8}
              role="button"
              aria-label={`Playback Rate: ${playbackRate}X`}
            >
              <PlaybackRateIcon
                color="rgba(255, 255, 255, .5)"
                width={21}
                height={21}
              />
              <Text fontSize={14} fontWeight="500" style={styles.controlText}>
                {playbackRate}x
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View
          style={[styles.topRight, !shouldShow && styles.noPointerEvents]}
          aria-label={videoHidden ? "Show Video" : "Hide Video"}
        >
          {setVideoHidden && (
            <TouchableOpacity
              onPress={() => setVideoHidden(!videoHidden)}
              aria-label={videoHidden ? "Show Video" : "Hide Video"}
              style={styles.buttonWithText}
              hitSlop={8}
              role="button"
            >
              {videoHidden ? (
                <>
                  <IconVideo color="#ffffff" width={16} height={16} />
                  <Text style={styles.controlText}>Show video</Text>
                </>
              ) : (
                <IconVideoOff color="#ffffff" width={16} height={16} />
              )}
            </TouchableOpacity>
          )}
        </View>
        {showFullControls && (
          <View style={[styles.bottom, !shouldShow && styles.noPointerEvents]}>
            <View style={styles.bottomLeft}>
              <StartFromBeginningButton />
            </View>
            <PlayerComponentBottom
              videoHidden={videoHidden}
              isAudioSource={isAudioSource}
            />
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, .5)",
  },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 2,
  },
  topLeft: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 1,
  },
  topRight: {
    position: "absolute",
    top: 10,
    right: 16,
    zIndex: 1,
  },
  bottomLeft: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    zIndex: 1,
  },
  controlPill: {
    backgroundColor: "rgba(0, 0, 0, .5)",
    borderRadius: 9999,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 24,
  },
  play: {
    padding: 8,
    borderRadius: 9999,
    marginHorizontal: 4,
  },
  buttonWithText: {
    alignItems: "center",
    gap: 4,
    flexDirection: "row",
  },
  controlText: {
    color: "#ffffff",
  },
  opaqueText: {
    opacity: 0.7,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  sliderTime: {
    flexDirection: "row",
  },
  slider: {
    width: "100%",
    height: 16,
  },
  sliderWrapper: {
    width: "100%",
    paddingBottom: 6,
    ...(Platform.OS !== "android" && {
      paddingHorizontal: 14,
    }),
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  touchOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  controlsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, .5)",
  },
});
