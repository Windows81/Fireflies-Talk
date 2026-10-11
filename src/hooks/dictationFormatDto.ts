import type { FormatDictationDto } from "@firefliesai/dictation-ff.rest-client";
import type { DictationScreenContext } from "electron/src/types";

export type FormatDictationPayload = Omit<
  FormatDictationDto,
  "screenContext"
> & {
  screenContext?: DictationScreenContext;
};

/** Body for `POST /api/dictation/format`. `siteUrl` lives on `screenContext`. Omits 0ms duration (`@IsPositive` on dictation-ff). */
export function buildFormatDictationDto({
  rawText,
  screenContext,
  recordingDurationMs,
  transcriptionTimeMs,
  releasedKeyAt,
  dictationId,
  languages,
}: FormatDictationPayload): FormatDictationPayload {
  return {
    rawText,
    ...(screenContext ? { screenContext } : {}),
    ...(typeof recordingDurationMs === "number" &&
      recordingDurationMs > 0 && { recordingDurationMs }),
    ...(typeof transcriptionTimeMs === "number" &&
      transcriptionTimeMs > 0 && { transcriptionTimeMs }),
    ...(releasedKeyAt && { releasedKeyAt }),
    ...(dictationId && { dictationId }),
    ...(languages?.length ? { languages } : {}),
  };
}
