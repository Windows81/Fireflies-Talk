import type { Caption } from "@/features/transcript";
import type { TranscriptMarks } from "./types";

export const computeTextSearchFilter = (
  captions: Caption[],
  search: string,
) => {
  const includedIndexes: number[] = [];
  const marks: TranscriptMarks = {};
  const normalizedSearch = search.toLowerCase().trim();
  for (const caption of captions) {
    const index = caption.text.toLowerCase().indexOf(normalizedSearch);
    if (index !== -1) {
      marks[caption.index] = marks[caption.index] || [];
      marks[caption.index].push({
        word: caption.text.slice(index, index + normalizedSearch.length),
      });
      includedIndexes.push(caption.index);
    }
  }
  return { marks, includedIndexes };
};
