export interface DictationWorkHandle {
  generation: number;
  signal: AbortSignal;
}

export const DICTATION_ABORT_REASONS = [
  "client-idle-timeout",
  "client-max-duration",
  "user-cancel",
  "client-abort",
] as const;

export type DictationAbortReason = (typeof DICTATION_ABORT_REASONS)[number];

function abortError(reason: DictationAbortReason): DOMException {
  return new DOMException(reason, "AbortError");
}

/**
 * Generation + AbortController for one dictation processing run (command,
 * polish, or dictate). `start()` begins a run. `abort()` cancels the current
 * run only if that generation still owns the gate. `invalidate()` makes an in-flight
 * `finally` skip cleanup so a newer session can take over.
 */
export function createDictationWorkGate() {
  let generation = 0;
  let controller: AbortController | null = null;

  const start = (): DictationWorkHandle => {
    generation += 1;
    controller = new AbortController();
    return { generation, signal: controller.signal };
  };

  const abort = (
    startedGeneration: number,
    reason: DictationAbortReason = "client-abort",
  ): void => {
    if (startedGeneration !== generation) return;
    controller?.abort(abortError(reason));
  };

  const invalidate = (reason: DictationAbortReason = "client-abort"): void => {
    generation += 1;
    controller?.abort(abortError(reason));
    controller = null;
  };

  /**
   * Gives up ownership without aborting anything.
   *
   * A command that detaches carries on under its own controller, but its
   * generation must stop owning the gate the moment it leaves: recording does
   * not take the gate, so a run settling minutes later would otherwise still
   * look like the owner and reset a recording started in the meantime.
   */
  const release = (startedGeneration: number): void => {
    if (startedGeneration !== generation) return;
    generation += 1;
    controller = null;
  };

  /**
   * Runs `cleanup` only while this generation still owns the gate.
   *
   * Teardown arrives late — a run settles long after it started — and by then
   * the gate may belong to a newer session, whose state must not be reset by
   * its predecessor. Returns whether it ran, which is what makes the rule
   * observable to a test.
   */
  const runIfOwner = (
    startedGeneration: number,
    cleanup: () => void,
  ): boolean => {
    if (startedGeneration !== generation) return false;
    cleanup();
    return true;
  };

  const isActive = (startedGeneration: number): boolean =>
    startedGeneration === generation && !controller?.signal.aborted;

  const isOwner = (startedGeneration: number): boolean =>
    startedGeneration === generation;

  return { start, abort, invalidate, release, runIfOwner, isActive, isOwner };
}
