import { createContext } from "react";
import type { TranscriptProps } from "./types";

interface ContextValue {
  onCaptionClick?: TranscriptProps["onCaptionClick"];
  onCaptionSpeakerClick?: TranscriptProps["onCaptionSpeakerClick"];
  marks?: TranscriptProps["marks"];
  /** caption indexes to filtered in **/
  includedIndexes?: TranscriptProps["includedIndexes"];
  player?: TranscriptProps["player"];
  currentIndex: number | undefined;
  /** caption index of the active search match, emphasized in the list */
  activeCaptionIndex?: number;
  /** occurrence within the active caption that is the current match */
  activeMatchOccurrence?: number;
  /** on-demand scroll target (e.g. a summary timestamp click) */
  scrollToCaption?: TranscriptProps["scrollToCaption"];
}

export const TranscriptContext = createContext({} as ContextValue);
