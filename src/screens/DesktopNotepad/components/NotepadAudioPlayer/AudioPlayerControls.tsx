import { Text } from "@/components/Typography";
import { StartFromBeginningButton } from "@/features/player";
import { createStyles, useTheme } from "@/styles";
import { toHHMMSS } from "@/utils/time";
import type { FC } from "react";
import { View } from "react-native";
import { AudioPlayButton } from "./AudioPlayButton";
import { AudioSeekBar } from "./AudioSeekBar";
import { AudioSpeedControl } from "./AudioSpeedControl";
import { type AudioPlayback } from "./useAudioPlayback";
import type { HoverProps } from "./useStickyHover";

export const AudioPlayerControls: FC<{
  playback: AudioPlayback;
  hoverProps: HoverProps;
  expanded?: boolean;
  onSpeedMenuOpenChange?: (open: boolean) => void;
}> = ({ playback, hoverProps, expanded, onSpeedMenuOpenChange }) => {
  const theme = useTheme();
  const {
    paused,
    duration,
    current,
    playbackRate,
    togglePlay,
    setPlaybackRate,
    onScrubStart,
    onScrub,
    onScrubCommit,
  } = playback;

  const isOneHourOrMore = duration >= 60 * 60;

  if (!expanded) {
    const remaining = Math.max(duration - current, 0);
    return (
      <View style={styles.collapsed}>
        <AudioPlayButton
          paused={paused}
          onPress={togglePlay}
          hoverProps={hoverProps}
        />
        <Text variant="body2Regular" color="textHint">
          {toHHMMSS(remaining, isOneHourOrMore)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.expanded}>
      <AudioPlayButton
        paused={paused}
        onPress={togglePlay}
        hoverProps={hoverProps}
      />
      <View style={styles.progress}>
        <Text variant="body3Regular" color="textSecondary">
          {toHHMMSS(current, isOneHourOrMore)}
        </Text>
        <AudioSeekBar
          current={current}
          duration={duration}
          onScrubStart={onScrubStart}
          onScrub={onScrub}
          onScrubCommit={onScrubCommit}
        />
        <Text variant="body3Regular" color="textHint">
          {toHHMMSS(duration, isOneHourOrMore)}
        </Text>
      </View>
      <StartFromBeginningButton variant="inline" />
      <View style={styles.divider(theme)} />
      <AudioSpeedControl
        playbackRate={playbackRate}
        setPlaybackRate={setPlaybackRate}
        hoverProps={hoverProps}
        onOpenChange={onSpeedMenuOpenChange}
      />
    </View>
  );
};

const styles = createStyles({
  collapsed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  expanded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
    paddingLeft: 10,
    paddingRight: 16,
  },
  progress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: (theme) => ({
    width: 1,
    height: 14,
    backgroundColor: theme.colors.borderStaticDefault,
  }),
});
