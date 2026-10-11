import { IconPause, IconPlay } from "@/assets/svg";
import { useGetAppOutputsByAppIdLazyQuery } from "@/graphql";
import { VideoView } from "expo-video";
import { useCallback, type FC } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { useBriefAudioPlayer, useGenerateBriefAudio } from "./useBriefAudio";

const ICON_SIZE = 16;

interface BriefCardAudioButtonProps {
  appId: string;
  audioUrl?: string | null;
  iconColor: string;
}

/**
 * Compact play/generate control shown on the home-feed Daily Brief card. The
 * latest brief's event is resolved lazily on first press, mirroring the
 * dashboard's generate-on-demand flow.
 */
export const BriefCardAudioButton: FC<BriefCardAudioButtonProps> = ({
  appId,
  audioUrl,
  iconColor,
}) => {
  const generate = useGenerateBriefAudio();
  const [fetchOutputs] = useGetAppOutputsByAppIdLazyQuery();

  const onGenerate = useCallback(async () => {
    const result = await fetchOutputs({ variables: { appId, limit: 1 } });
    const latest = result.data?.getAppOutputsByAppId?.appOutputs?.[0];
    if (!latest?.eventId) return null;
    if (latest.audioUrl) return latest.audioUrl;
    return generate(latest.eventId);
  }, [appId, fetchOutputs, generate]);

  const { player, isPlaying, isGenerating, handlePress } = useBriefAudioPlayer({
    audioUrl,
    onGenerate,
    source: "card",
  });

  return (
    <Pressable
      style={styles.button}
      onPress={(event) => {
        // Prevent the tap from bubbling to the card and triggering navigation
        // (clicks bubble through nested Pressables on React Native Web/desktop).
        event.stopPropagation();
        handlePress();
      }}
      disabled={isGenerating}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? "Pause brief audio" : "Play brief audio"}
      accessibilityState={{ busy: isGenerating, disabled: isGenerating }}
    >
      {isGenerating ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : isPlaying ? (
        <IconPause width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
      ) : (
        <IconPlay width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
      )}
      <VideoView style={styles.hiddenVideo} player={player} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  hiddenVideo: {
    width: 0,
    height: 0,
    display: "none",
  },
});
