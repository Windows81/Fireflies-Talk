export function analyzeChunkIndices(
  indices: number[],
  totalChunks: number,
): { missingChunks: number[]; outOfOrderChunks: number[] } {
  const presentIndices = new Set(indices);
  const missingChunks: number[] = [];
  for (let index = 0; index < totalChunks; index += 1) {
    if (!presentIndices.has(index)) {
      missingChunks.push(index);
    }
  }

  const outOfOrderChunks: number[] = [];
  let previousIndex = -1;
  for (const currentIndex of indices) {
    if (currentIndex <= previousIndex) {
      outOfOrderChunks.push(currentIndex);
    } else if (currentIndex > previousIndex + 1) {
      for (let index = previousIndex + 1; index < currentIndex; index += 1) {
        outOfOrderChunks.push(index);
      }
    }
    previousIndex = currentIndex;
  }

  return { missingChunks, outOfOrderChunks };
}
