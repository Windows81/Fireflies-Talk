import type { Caption } from "./types";

/**
 * A caption "owns" the playback time from its startTime until the next caption
 * begins. This intentionally ignores endTime so the highlight persists through
 * gaps/silence (and on the final caption to the end), matching dashboard-ff.
 */
const ownsTime = (
  captions: Caption[],
  index: number,
  currentTime: number,
): boolean => {
  const caption = captions[index];
  if (!caption || currentTime < caption.startTime) return false;
  const next = captions[index + 1];
  return !next || currentTime < next.startTime;
};

/**
 * TODO: PERFORMANCE: Need to run on different thread
 * Find the caption active at currentTime. We start from the previous index so
 * sequential playback resolves in O(1)-ish steps.
 */
export const calculateCurrentIndex = (
  {
    currentTime,
    captions,
    previousArrayIndex,
  }: {
    currentTime: number;
    captions: Caption[];
    // previousIndex is the last index, so we can start searching from there
    // to optimize the search
    previousArrayIndex: number | undefined;
  },
  callback: (
    result: { captionIndex: number; arrayIndex: number } | undefined,
  ) => void,
) => {
  if (!captions?.length) {
    callback(undefined);
    return;
  }

  // Before the first caption begins (e.g. at the very start), default to the
  // first caption so there is always a highlight.
  if (currentTime < captions[0].startTime) {
    callback({ captionIndex: captions[0].index, arrayIndex: 0 });
    return;
  }

  let index = 0;
  if (typeof previousArrayIndex === "number" && captions[previousArrayIndex]) {
    index = previousArrayIndex;
  }

  const searchDirection = captions[index].startTime <= currentTime ? 1 : -1;

  for (let i = index; i < captions.length && i >= 0; i += searchDirection) {
    if (ownsTime(captions, i, currentTime)) {
      callback({
        captionIndex: captions[i].index,
        arrayIndex: i,
      });
      return;
    }
  }

  callback(undefined);
};
