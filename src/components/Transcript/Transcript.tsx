import { calculateCurrentIndex } from "@/features/transcript";
import { memo, useEffect, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import {
  LoadingTranscriptCaptionList,
  TranscriptCaptionList,
} from "./TranscriptCaptionList";
import { TranscriptContext } from "./TranscriptContext";
import type { TranscriptProps } from "./types";

export const Transcript = memo<TranscriptProps>(function Transcript({
  captions,
  onCaptionClick,
  onCaptionSpeakerClick,
  marks,
  includedIndexes,
  listContentStyle,
  player,
  separators,
  activeCaptionIndex,
  activeMatchOccurrence,
  scrollToCaption,
}) {
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!player) return;
    let previousArrayIndex: number | undefined = undefined;
    // Recompute on playback ticks AND on seeks, so the highlight tracks the
    // position even while paused (e.g. after scrubbing). Run once on mount to
    // highlight the current position immediately.
    const syncCurrentIndex = () => {
      calculateCurrentIndex(
        {
          currentTime: player.currentTime,
          captions,
          previousArrayIndex,
        },
        (result) => {
          if (!result) {
            setCurrentIndex(undefined);
            return;
          }
          const { arrayIndex, captionIndex } = result;
          setCurrentIndex(captionIndex);
          previousArrayIndex = arrayIndex;
        },
      );
    };
    syncCurrentIndex();
    player.addEventListener("timeupdate", syncCurrentIndex);
    player.addEventListener("seeked", syncCurrentIndex);
    return () => {
      player.removeEventListener("timeupdate", syncCurrentIndex);
      player.removeEventListener("seeked", syncCurrentIndex);
    };
  }, [player, captions]);

  return (
    <TranscriptContext.Provider
      value={{
        onCaptionClick,
        onCaptionSpeakerClick,
        marks,
        includedIndexes,
        currentIndex,
        player,
        activeCaptionIndex,
        activeMatchOccurrence,
        scrollToCaption,
      }}
    >
      <View style={styles.root}>
        <TranscriptCaptionList
          captions={captions}
          listContentStyle={listContentStyle}
          separators={separators}
        />
      </View>
    </TranscriptContext.Provider>
  );
});

export const LoadingTranscript: FC = () => {
  return (
    <View style={styles.root}>
      <LoadingTranscriptCaptionList />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
});
