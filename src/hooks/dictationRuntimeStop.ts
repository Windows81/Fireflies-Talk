import { isDictationPasteEpoch } from "electron/src/dictation/dictation-paste-guard";
import type { DictationState } from "electron/src/types";

export function acceptDictationStop(args: {
  state: DictationState;
  stopAccepted: boolean;
}): boolean {
  return args.state === "recording" && !args.stopAccepted;
}

export function canCommitDictationStop(state: DictationState): boolean {
  return state === "recording";
}

export function pasteEpochOrZero(epoch: unknown): number {
  return isDictationPasteEpoch(epoch) ? epoch : 0;
}

/**
 * What to do when the open microphone dies mid-recording. The track cannot be
 * swapped under a running session, so the dictation ends here and the next
 * one opens whatever mic is right at that moment. A dictation the person was
 * watching keeps what was heard and is told why it ended; a silent warm-up
 * that nobody saw yet is dropped without a word.
 */
export function decideOnMicrophoneEnded(revealed: boolean): {
  action: "stop" | "cancel";
  announce: boolean;
} {
  return revealed
    ? { action: "stop", announce: true }
    : { action: "cancel", announce: false };
}
