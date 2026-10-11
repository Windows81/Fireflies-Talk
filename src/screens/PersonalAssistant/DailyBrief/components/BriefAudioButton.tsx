import { IconPause, IconPlay } from "@/assets/svg";
import { GLOBAL } from "@/styles/color";
import { VideoView } from "expo-video";
import { useCallback, type FC } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useBriefAudioPlayer, useGenerateBriefAudio } from "./useBriefAudio";

const ICON_SIZE = 16;
const ICON_COLOR = GLOBAL.grey400;

interface BriefAudioButtonProps {
  eventId: string;
  audioUrl?: string | null;
}

/**
 * Compact play/generate control rendered inline in the brief day header,
 * alongside the copy-link icon.
 */
export const BriefAudioButton: FC<BriefAudioButtonProps> = ({
  eventId,
  audioUrl,
}) => {
  const generate = useGenerateBriefAudio();

  const onGenerate = useCallback(() => generate(eventId), [generate, eventId]);

  const { player, isPlaying, isGenerating, handlePress } = useBriefAudioPlayer({
    audioUrl,
    onGenerate,
    source: "detail",
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={isGenerating}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? "Pause brief audio" : "Play brief audio"}
      accessibilityState={{ busy: isGenerating, disabled: isGenerating }}
      style={styles.button}
    >
      {isGenerating ? (
        <ActivityIndicator size="small" color={ICON_COLOR} />
      ) : isPlaying ? (
        <IconPause width={ICON_SIZE} height={ICON_SIZE} color={ICON_COLOR} />
      ) : (
        <IconPlay width={ICON_SIZE} height={ICON_SIZE} color={ICON_COLOR} />
      )}
      <VideoView style={styles.hiddenVideo} player={player} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 4,
    borderRadius: 6,
  },
  hiddenVideo: {
    width: 0,
    height: 0,
    display: "none",
  },
});
