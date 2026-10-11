/**
 * Stage timings for one release→paste dictation. `releaseAt` is set on key-up;
 * each later stage records elapsed ms for that stage alone.
 */
export type DictationReleaseTiming = {
  releaseAt: number;
  awaitReadyMs?: number;
  finalizeMs?: number;
  transcribeMs?: number;
  screenContextMs?: number;
  cleanupMs?: number;
  pasteMs?: number;
};

export function createDictationReleaseTiming(): DictationReleaseTiming {
  return { releaseAt: Date.now() };
}

export function getDictationReleaseTotalMs(
  timing: DictationReleaseTiming,
  now = Date.now(),
): number {
  return now - timing.releaseAt;
}

/** Positive elapsed ms, or undefined when the clock never started / duration is 0. */
export function getPositiveDurationMs(
  startedAt: number | null | undefined,
  endedAt = Date.now(),
): number | undefined {
  if (startedAt == null) return undefined;
  const duration = endedAt - startedAt;
  return duration > 0 ? duration : undefined;
}

export function formatDictationReleaseTiming(
  timing: DictationReleaseTiming,
): string {
  const totalMs = getDictationReleaseTotalMs(timing);
  const stages: string[] = [];
  if (timing.awaitReadyMs != null) {
    stages.push(`await-ready ${timing.awaitReadyMs}ms`);
  }
  if (timing.finalizeMs != null) {
    stages.push(`finalize ${timing.finalizeMs}ms`);
  }
  if (timing.transcribeMs != null) {
    stages.push(`transcribe ${timing.transcribeMs}ms`);
  }
  if (timing.screenContextMs != null) {
    stages.push(`screen-context ${timing.screenContextMs}ms`);
  }
  if (timing.cleanupMs != null) {
    stages.push(`cleanup ${timing.cleanupMs}ms`);
  }
  if (timing.pasteMs != null) {
    stages.push(`paste ${timing.pasteMs}ms`);
  }
  stages.push(`total ${totalMs}ms`);
  return stages.join(", ");
}
