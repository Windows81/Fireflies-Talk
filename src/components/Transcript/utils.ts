import type { Caption } from "@/features/transcript";
import type {
  CaptionIndexToGroupCaptionIndex,
  GroupedCaption,
  TranscriptSeparator,
} from "./types";

/**
 * Attach pause separators to the grouped captions. A separator renders before
 * the first group that starts at or after the pause time; pauses that occur
 * after the last caption render below the final group. Returns the same array
 * untouched when there are no separators to keep referential equality.
 */
export const decorateGroupsWithSeparators = (
  groups: GroupedCaption[],
  separators: TranscriptSeparator[] | undefined,
): GroupedCaption[] => {
  if (!separators?.length || !groups.length) return groups;

  const ordered = [...separators].sort((a, b) => a.time - b.time);
  const decorated = groups.map((group) => ({ ...group }));

  for (const separator of ordered) {
    const target = decorated.find((group) => group.startTime >= separator.time);
    if (target) {
      target.separatorsBefore = [...(target.separatorsBefore ?? []), separator];
    } else {
      const last = decorated[decorated.length - 1];
      last.separatorsAfter = [...(last.separatorsAfter ?? []), separator];
    }
  }

  return decorated;
};

const getSentenceAndWordCount = (text: string) => {
  const words = text.split(" ");
  const sentences = text.split(/[.?!]/);
  return {
    words: words.length,
    sentences: sentences.length,
  };
};

const canMergeMoreSentences = (
  currentGroupedCaption: GroupedCaption,
  MAX_SENTENCES: number,
  MAX_WORDS: number,
) => {
  const { sentences, words } = currentGroupedCaption.captions.reduce(
    (acc, caption) => {
      const { sentences: sentencesCount, words: wordsCount } =
        getSentenceAndWordCount(caption.text || "");
      return {
        sentences: acc.sentences + sentencesCount,
        words: acc.words + wordsCount,
      };
    },
    { sentences: 0, words: 0 },
  );
  return sentences < MAX_SENTENCES && words < MAX_WORDS;
};

/**
 * TODO: PERFORMANCE: Need to run on different thread
 * Merge captions into the same caption entry on Transcript component
 */
export const mergeCaptions = (
  captions: Caption[],
  includedIndexes: number[] | undefined,
  MAX_SENTENCES: number,
  MAX_WORDS: number,
  callback: (
    merged: GroupedCaption[],
    captionIndexToGroupCaptionIndex: CaptionIndexToGroupCaptionIndex,
  ) => void,
) => {
  const merged: GroupedCaption[] = [];
  let lastGroupedCaption: GroupedCaption | null = null;
  const captionIndexToGroupCaptionIndex: CaptionIndexToGroupCaptionIndex = [];

  for (const caption of captions) {
    if (includedIndexes && !includedIndexes.includes?.(caption.index)) continue;
    if (
      lastGroupedCaption &&
      caption.speakerId === lastGroupedCaption.speakerId &&
      canMergeMoreSentences(lastGroupedCaption, MAX_SENTENCES, MAX_WORDS)
    ) {
      lastGroupedCaption.captions.push(caption);
      lastGroupedCaption.endTime = caption.endTime;
      lastGroupedCaption.text += ` ${caption.text}`;
    } else {
      lastGroupedCaption = {
        index: caption.index,
        speakerId: caption.speakerId,
        speakerName: caption.speakerName,
        startTime: caption.startTime,
        endTime: caption.endTime,
        captions: [caption],
        text: caption.text,
      };
      merged.push(lastGroupedCaption);
      captionIndexToGroupCaptionIndex.push(caption.index);
    }
  }

  callback(merged, captionIndexToGroupCaptionIndex);
};
