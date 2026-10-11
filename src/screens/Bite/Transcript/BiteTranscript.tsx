import { Transcript } from "@/components/Transcript";
import { usePlayer } from "@/features/player";
import type { Caption } from "@/features/transcript";
import type { Soundbite } from "@/graphql";
import type { FC } from "react";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

export const BiteTranscript: FC<{ bite: Soundbite }> = ({ bite }) => {
  const { player } = usePlayer();

  const onCaptionClick = useCallback(
    (caption: Caption) => {
      player.currentTime = caption.startTime;
      player.play();
    },
    [player],
  );

  const captions = useMemo(() => {
    // need to clone bite.captions because of manipulation
    // on the UI thread
    return (bite.captions || []).map((caption) => ({ ...caption }));
  }, [bite.captions]);

  return (
    <View style={styles.root}>
      <Transcript
        captions={captions}
        onCaptionClick={onCaptionClick}
        listContentStyle={styles.list}
        player={player || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    paddingBottom: 76,
  },
});
