import type { DictationScreenContext } from "electron/src/types";

type ScreenContextFrame = Pick<
  DictationScreenContext,
  "appName" | "windowTitle"
> | null;

/** Same whitespace split as dictation-ff `countWords`. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Same frame check as dictation-ff: app name or window title present. */
export function hasDictationScreenContext(
  screenContext: ScreenContextFrame,
): boolean {
  return Boolean(screenContext?.appName || screenContext?.windowTitle);
}

export type DictationPasteTarget = "editable" | "unknown" | "none";

/** The main process reports a paste that landed nowhere as kept on the clipboard, and one it could not judge as unconfirmed. */
export function pasteTargetFromResult(result: {
  copiedToClipboard?: boolean;
  targetUnconfirmed?: boolean;
}): DictationPasteTarget {
  if (result.copiedToClipboard) return "none";
  if (result.targetUnconfirmed) return "unknown";
  return "editable";
}

export type DictationPastedTrackingProperties = {
  hasScreenContext: boolean;
  hasPostProcessing: boolean;
  originalWordCount: number;
  formattedWordsCount: number;
  postProcessingTimeMs: number;
  transcriptionTimeMs?: number;
  dictationId?: string;
  screenContextMs?: number;
  /** The capture was still running when the dictation went ahead without it. */
  screenContextMissed?: boolean;
  /** The format service's own time; post-processing minus this is the network. */
  formatServerMs?: number;
  /** Cleanup failed or came back empty, so the raw transcript was pasted. */
  cleanupFallback?: boolean;
};

export function buildDictationPastedProperties(args: {
  originalText: string;
  formattedText: string;
  screenContext: ScreenContextFrame;
  hasPostProcessing: boolean;
  postProcessingTimeMs?: number;
  transcriptionTimeMs?: number;
  dictationId?: string;
  screenContextMs?: number;
  screenContextMissed?: boolean;
  formatServerMs?: number;
  cleanupFallback?: boolean;
}): DictationPastedTrackingProperties {
  return {
    hasScreenContext: hasDictationScreenContext(args.screenContext),
    hasPostProcessing: args.hasPostProcessing,
    originalWordCount: countWords(args.originalText),
    formattedWordsCount: countWords(args.formattedText),
    postProcessingTimeMs: args.postProcessingTimeMs ?? 0,
    ...(typeof args.transcriptionTimeMs === "number" && {
      transcriptionTimeMs: args.transcriptionTimeMs,
    }),
    ...(args.dictationId && { dictationId: args.dictationId }),
    ...(typeof args.screenContextMs === "number" && {
      screenContextMs: args.screenContextMs,
    }),
    ...(args.screenContextMissed !== undefined && {
      screenContextMissed: args.screenContextMissed,
    }),
    ...(typeof args.formatServerMs === "number" && {
      formatServerMs: args.formatServerMs,
    }),
    ...(args.cleanupFallback !== undefined && {
      cleanupFallback: args.cleanupFallback,
    }),
  };
}
