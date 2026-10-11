/**
 * Plays the start cue once the microphone is actually recording, so speaking
 * on the cue never starts before audio is being captured. A speculative
 * capture usually finishes before the recording is revealed, in which case the
 * cue plays at once.
 */
export function createStartCueGate(deps: {
  play: (handsFree: boolean) => void;
}) {
  let micReady = false;
  let pending: { handsFree: boolean } | null = null;

  return {
    beginCapture: () => {
      micReady = false;
      pending = null;
    },
    reveal: (handsFree: boolean) => {
      if (micReady) {
        deps.play(handsFree);
        return;
      }
      pending = { handsFree };
    },
    markMicReady: () => {
      micReady = true;
      if (!pending) return;
      const { handsFree } = pending;
      pending = null;
      deps.play(handsFree);
    },
    /**
     * The recording went hands-free. A start cue still waiting for the
     * microphone becomes the hands-free cue, so the two never play out of
     * order; true when that cue stands in for the latch's own.
     */
    latch: (): boolean => {
      if (!pending) return false;
      pending = { handsFree: true };
      return true;
    },
    /** The recording ended or was cancelled before the cue was due. */
    cancel: () => {
      pending = null;
    },
  };
}
