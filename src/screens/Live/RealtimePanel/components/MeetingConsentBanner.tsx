import { type FC, useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { IconCheck, IconCopy, IconVolumeOutline } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Text } from "@/components/Typography";
import { playConsentAudio } from "@/features/audio-consent";
import { DEFAULT_CONSENT_MESSAGE } from "@/features/live-record/browser-meeting-chat-state";
import { Logger } from "@/logger";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useConsentFooter } from "../hooks/useConsentFooter";

const log = new Logger("ConsentBanner");

// Auto-dismiss after 60 s; a progress bar fills left-to-right.
const VISIBLE_DURATION_MS = 60_000;
const SLIDE_OFFSET = 24;
const SLIDE_SPRING = { damping: 22, stiffness: 170, mass: 0.9 } as const;
const FADE_IN_MS = 280;
const FADE_OUT_MS = 220;

// Show at most once per meeting — tab switches / remounts don't re-trigger.
const shownMeetingIds = new Set<string>();

interface MeetingConsentBannerProps {
  meetingId: string;
}

/**
 * Timed reminder at the bottom of the full-screen live view when the consent
 * message can't be auto-sent. Surfaces the message with a Copy action and
 * auto-dismisses after ~1 minute, with a progress bar that pauses on hover.
 * Shown at most once per meeting.
 */
export const MeetingConsentBanner: FC<MeetingConsentBannerProps> = ({
  meetingId,
}) => {
  const theme = useTheme();
  const { show, copied, onCopy } = useConsentFooter();
  const { isHovered, webHoverProps } = useWebHover();
  const [active, setActive] = useState(false);
  const [expired, setExpired] = useState(false);
  const [mounted, setMounted] = useState(false);
  const progress = useSharedValue(0);
  const translateY = useSharedValue(SLIDE_OFFSET);
  const opacity = useSharedValue(0);

  const visible = active && !expired;

  // Trigger once per meeting when eligible; hide if auto-send succeeds.
  useEffect(() => {
    if (!show) {
      setActive(false);
      return;
    }
    if (shownMeetingIds.has(meetingId)) return;
    shownMeetingIds.add(meetingId);
    setExpired(false);
    setActive(true);
    progress.value = 0;
  }, [show, meetingId, progress]);

  // Slide up on enter, slide down on leave.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = SLIDE_OFFSET;
      opacity.value = 0;
      translateY.value = withSpring(0, SLIDE_SPRING);
      opacity.value = withTiming(1, {
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    if (!mounted) return;
    translateY.value = withSpring(SLIDE_OFFSET, SLIDE_SPRING);
    opacity.value = withTiming(
      0,
      { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      },
    );
  }, [visible, mounted, translateY, opacity]);

  // Drive and pause the fill on hover.
  useEffect(() => {
    if (!active || expired) return;
    if (isHovered) {
      cancelAnimation(progress);
      return;
    }
    const remaining = (1 - progress.value) * VISIBLE_DURATION_MS;
    progress.value = withTiming(
      1,
      { duration: remaining, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(setExpired)(true);
      },
    );
    return () => cancelAnimation(progress);
  }, [active, expired, isHovered, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const [playing, setPlaying] = useState(false);

  const onPlayAudio = useCallback(() => {
    if (playing) return;
    setPlaying(true);
    playConsentAudio()
      .catch((error) => {
        log.error("Failed to play consent audio from banner", {
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => setPlaying(false));
  }, [playing]);

  if (!mounted) return null;

  return (
    <Animated.View style={containerStyle}>
      <Pressable style={styles.banner(theme)} {...webHoverProps}>
        <View style={styles.row}>
          <Text
            fontFamily="inter"
            fontWeight="400"
            numberOfLines={1}
            style={styles.text}
          >
            <Text fontFamily="inter" fontWeight="500" style={styles.label}>
              Get participants&rsquo; consent
            </Text>
            {"  \u2014  "}
            {`"${DEFAULT_CONSENT_MESSAGE}"`}
          </Text>
          <View style={styles.actions}>
            <HoverTooltip
              label={copied ? "Copied" : "Copy consent message"}
              position="top"
            >
              <Pressable
                onPress={onCopy}
                accessibilityRole="button"
                accessibilityLabel="Copy consent message"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
              >
                {copied ? (
                  <IconCheck
                    width={18}
                    height={18}
                    color={DESKTOP_THEME.purple400}
                  />
                ) : (
                  <IconCopy
                    width={18}
                    height={18}
                    color={DESKTOP_THEME.purple400}
                  />
                )}
              </Pressable>
            </HoverTooltip>
            <HoverTooltip label="Play consent message" position="top">
              <Pressable
                onPress={onPlayAudio}
                accessibilityRole="button"
                accessibilityLabel="Play consent audio message"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
              >
                <IconVolumeOutline
                  width={20}
                  height={20}
                  color={DESKTOP_THEME.purple400}
                />
              </Pressable>
            </HoverTooltip>
          </View>
        </View>
        <Animated.View style={[styles.progress, progressStyle]} />
      </Pressable>
    </Animated.View>
  );
};

const styles = createStyles({
  banner: (theme) => ({
    maxWidth: 640,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 8,
    backgroundColor: DESKTOP_THEME.grey1010,
    overflow: "hidden",
  }),
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  text: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: DESKTOP_THEME.grey500,
  },
  label: {
    color: DESKTOP_THEME.grey300,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
    borderRadius: 4,
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  progress: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 3,
    backgroundColor: DESKTOP_THEME.purple500,
  },
});
