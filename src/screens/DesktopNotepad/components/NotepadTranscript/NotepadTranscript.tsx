import { Transcript } from "@/components/Transcript";
import { usePlayer } from "@/features/player";
import { calculateCurrentIndex, type Caption } from "@/features/transcript";
import { createStyles } from "@/styles";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { hasPlayableMedia } from "../../helpers/meeting";
import { getPauseSeparators } from "../../helpers/pauseSeparators";
import { useDesktopNotepadTranscript } from "../../hooks/useDesktopNotepadTranscript";
import { useTranscriptSearch } from "../../hooks/useTranscriptSearch";
import { TranscribeMeetingPaywall } from "../FreeMeetingsPaywall/TranscribeMeetingPaywall";
import {
  isAwaitingTranscript,
  useFreeMeetingsPaywall,
} from "../FreeMeetingsPaywall/useFreeMeetingsPaywall";
import { NotepadTranscriptSearch } from "./NotepadTranscriptSearch";
import { TranscriptStatusMessage } from "./TranscriptStatusMessage";

export const NotepadTranscript = () => {
  const { meeting, transcriptSeek } = useDesktopNotepadContext();
  const { status, captions } = useDesktopNotepadTranscript(meeting);
  const { player } = usePlayer();
  const { isOutOfFreeMeetings } = useFreeMeetingsPaywall();

  const mediaEnabled = hasPlayableMedia(meeting);
  const search = useTranscriptSearch(captions);
  const separators = useMemo(() => getPauseSeparators(meeting), [meeting]);

  const scrollToCaption = useMemo(() => {
    if (!transcriptSeek || captions.length === 0) return undefined;
    let captionIndex: number | undefined;
    calculateCurrentIndex(
      {
        currentTime: transcriptSeek.seconds,
        captions,
        previousArrayIndex: undefined,
      },
      (result) => {
        captionIndex = result?.captionIndex;
      },
    );
    return captionIndex == null
      ? undefined
      : { captionIndex, nonce: transcriptSeek.nonce };
  }, [transcriptSeek, captions]);

  const onCaptionClick = useCallback(
    (caption: Caption) => {
      player.currentTime = caption.startTime;
      player.play();
    },
    [player],
  );

  // Out of free meetings, nothing will ever be transcribed, so promising a
  // transcript would be a lie.
  if (isOutOfFreeMeetings && isAwaitingTranscript(status)) {
    return <TranscribeMeetingPaywall />;
  }

  if (status !== "ready") {
    return <TranscriptStatusMessage status={status} />;
  }

  return (
    <View style={styles.root}>
      <NotepadTranscriptSearch search={search} />
      <View style={styles.list}>
        <Transcript
          captions={captions}
          marks={search.marks}
          activeCaptionIndex={search.activeCaptionIndex}
          activeMatchOccurrence={search.activeMatchOccurrence}
          separators={separators}
          scrollToCaption={scrollToCaption}
          onCaptionClick={mediaEnabled ? onCaptionClick : undefined}
          player={mediaEnabled ? player : undefined}
        />
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  list: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
});
