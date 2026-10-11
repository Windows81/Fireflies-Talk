import type { TranscriptMarks } from "@/components/Transcript";
import type { Caption } from "@/features/transcript";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  runTranscriptSearch,
  type TranscriptSearchResult,
} from "../components/NotepadTranscript/transcriptSearch";

const DEBOUNCE_MS = 180;
const EMPTY: TranscriptSearchResult = { marks: {}, matches: [] };

export interface TranscriptSearchState {
  query: string;
  setQuery: (query: string) => void;
  clear: () => void;
  marks: TranscriptMarks;
  matchCount: number;
  /** 1-based position of the active match, or 0 when there are none. */
  activeMatchNumber: number;
  activeCaptionIndex: number | undefined;
  /** 0-based occurrence of the active match within its caption. */
  activeMatchOccurrence: number;
  goNext: () => void;
  goPrev: () => void;
}

export function useTranscriptSearch(
  captions: Caption[],
): TranscriptSearchState {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TranscriptSearchResult>(EMPTY);
  const [activeMatch, setActiveMatch] = useState(0);
  const captionsRef = useRef(captions);
  captionsRef.current = captions;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResult(EMPTY);
      setActiveMatch(0);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(() => {
      runTranscriptSearch(captionsRef.current, trimmed).then((next) => {
        if (cancelled) return;
        setResult(next);
        setActiveMatch(0);
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const matchCount = result.matches.length;
  const safeActive = matchCount ? Math.min(activeMatch, matchCount - 1) : 0;
  const activeCaptionIndex = matchCount
    ? result.matches[safeActive]
    : undefined;

  // Matches are stored in transcript order, so earlier entries sharing the
  // active caption tell us which occurrence inside it is the active one.
  let activeMatchOccurrence = 0;
  for (let i = 0; i < safeActive; i++) {
    if (result.matches[i] === activeCaptionIndex) activeMatchOccurrence++;
  }

  const goNext = useCallback(() => {
    setActiveMatch((prev) => (matchCount ? (prev + 1) % matchCount : 0));
  }, [matchCount]);

  const goPrev = useCallback(() => {
    setActiveMatch((prev) =>
      matchCount ? (prev - 1 + matchCount) % matchCount : 0,
    );
  }, [matchCount]);

  const clear = useCallback(() => setQuery(""), []);

  return {
    query,
    setQuery,
    clear,
    marks: result.marks,
    matchCount,
    activeMatchNumber: matchCount ? safeActive + 1 : 0,
    activeCaptionIndex,
    activeMatchOccurrence,
    goNext,
    goPrev,
  };
}
