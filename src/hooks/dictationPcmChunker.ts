/**
 * Aggregates Int16 PCM frames into fixed-size chunks and flushes whatever is
 * left, so the tail of a recording is not dropped at close.
 */
export function createPcmChunker(
  chunkSamples: number,
  onChunk: (pcm: Int16Array) => void,
): { push: (samples: Int16Array) => void; flush: () => void } {
  let pending = new Int16Array(0);

  const push = (samples: Int16Array) => {
    const merged = new Int16Array(pending.length + samples.length);
    merged.set(pending);
    merged.set(samples, pending.length);
    pending = merged;
    while (pending.length >= chunkSamples) {
      onChunk(pending.slice(0, chunkSamples));
      pending = pending.slice(chunkSamples);
    }
  };

  const flush = () => {
    if (pending.length === 0) return;
    onChunk(pending);
    pending = new Int16Array(0);
  };

  return { push, flush };
}
