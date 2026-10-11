import type { MutableRefObject } from "react";
import type { DictationScreenContext } from "electron/src/types";
import type { DictationSession } from "./dictationSession";

interface PolishSelectionArgs {
  text: string;
  generationAtPolish: number;
  getCaptureGeneration: () => number;
  cancelledRef: MutableRefObject<boolean>;
  silentCaptureRef: MutableRefObject<boolean>;
  revealedRef: MutableRefObject<boolean>;
  sessionRef: MutableRefObject<DictationSession | null>;
  startReadyRef: MutableRefObject<Promise<void> | null>;
  screenContextPromiseRef: MutableRefObject<Promise<DictationScreenContext | null> | null>;
  /** Starts the screen read this polish is allowed, or null when it is off. */
  readScreenContext: () => Promise<DictationScreenContext | null> | null;
  stopStream: () => void;
  resetRecordingClock: () => void;
  runPolishSelection: (text: string) => void;
  setPasteEpoch: (epoch: number) => void;
}

function beginPolishSelection(args: PolishSelectionArgs): void {
  args.cancelledRef.current = true;
  args.silentCaptureRef.current = false;
  args.revealedRef.current = false;
  args.sessionRef.current?.cancel();
  args.sessionRef.current = null;
  args.stopStream();
  args.resetRecordingClock();

  const startReady = args.startReadyRef.current;
  if (startReady) {
    void startReady
      .catch(() => {})
      .then(() => {
        if (args.generationAtPolish !== args.getCaptureGeneration()) return;
        args.sessionRef.current?.cancel();
        args.sessionRef.current = null;
      });
  }

  args.screenContextPromiseRef.current = args.readScreenContext();
  args.runPolishSelection(args.text);
}

export function subscribeDictationPolish(
  args: Omit<PolishSelectionArgs, "text" | "generationAtPolish"> & {
    isProcessing: () => boolean;
    bumpCaptureGeneration: () => number;
  },
): () => void {
  const dictation = window.electron?.dictation;
  if (!dictation) return () => {};
  return dictation.onPolishSelection((text, pasteEpoch) => {
    if (args.isProcessing()) return;
    args.setPasteEpoch(pasteEpoch);
    beginPolishSelection({
      ...args,
      text,
      generationAtPolish: args.bumpCaptureGeneration(),
    });
  });
}
