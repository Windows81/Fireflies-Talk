import type { DictationScreenContext } from "electron/src/types";

/**
 * How long a finished dictation waits for a screen capture that is still
 * running. The capture starts with the recording and is bounded on its own,
 * so it is nearly always done by then; when it is not, the text goes ahead
 * without it rather than waiting.
 */
export const SCREEN_CONTEXT_WAIT_MS = 5;

export type ScreenContextOutcome = {
  context: DictationScreenContext | null;
  /** The capture was still running when the wait ran out. */
  missed: boolean;
};

export function awaitScreenContextOutcome(
  capture: Promise<DictationScreenContext | null> | null,
  waitMs = SCREEN_CONTEXT_WAIT_MS,
): Promise<ScreenContextOutcome> {
  if (!capture) return Promise.resolve({ context: null, missed: false });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const giveUp = new Promise<ScreenContextOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ context: null, missed: true }), waitMs);
  });
  return Promise.race([
    capture.then(
      (context) => ({ context: context ?? null, missed: false }),
      () => ({ context: null, missed: false }),
    ),
    giveUp,
  ]).finally(() => clearTimeout(timer));
}

export async function awaitScreenContextBriefly(
  capture: Promise<DictationScreenContext | null> | null,
  waitMs = SCREEN_CONTEXT_WAIT_MS,
): Promise<DictationScreenContext | null> {
  return (await awaitScreenContextOutcome(capture, waitMs)).context;
}
