import type { TranscriptMarks } from "@/components/Transcript";
import type { Caption } from "@/features/transcript";
import type { SmartSearchFilterState } from "./SmartSearch";
import { SMART_SEARCH_CATEGORY_COLOR_MAP } from "./constants";

export const computeSmartSearchFilter = (
  captions: Caption[],
  smartSearchFilter: SmartSearchFilterState,
) => {
  if (
    !smartSearchFilter.categories &&
    !smartSearchFilter.sentiment &&
    !smartSearchFilter.speakerIds
  ) {
    return { marks: undefined, includedIndexes: undefined };
  }
  const includedIndexes: number[] = [];
  let marks: TranscriptMarks | undefined;
  for (const caption of captions) {
    if (smartSearchFilter.categories && caption.filters) {
      for (const metric of caption.filters) {
        if (smartSearchFilter.categories.includes(metric.category)) {
          marks = marks || {};
          marks[caption.index] = marks[caption.index] || [];
          marks[caption.index].push({
            word: metric.word,
            color: SMART_SEARCH_CATEGORY_COLOR_MAP[metric.category],
          });
        }
      }
      if (!marks?.[caption.index]) {
        // filter out
        continue;
      }
    }
    if (smartSearchFilter.sentiment) {
      if (
        !caption.sentiment ||
        !smartSearchFilter.sentiment.includes(caption.sentiment)
      ) {
        // filter out
        continue;
      }
    }
    if (smartSearchFilter.speakerIds) {
      if (!smartSearchFilter.speakerIds.includes(caption.speakerId)) {
        // filter out
        continue;
      }
    }
    includedIndexes.push(caption.index);
  }
  return { marks, includedIndexes };
};
