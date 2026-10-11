import { useOptionalLiveScreenContext } from "@/screens/Live/Context/LiveScreenContext";
import { useEffect, useRef, useState } from "react";

// Keep treating transcription as active for a short window after the last
// transcript update
const TRANSCRIBING_IDLE_MS = 2500;

// Stable default so the signature stays constant when no live context exists.
const EMPTY_CAPTIONS: never[] = [];

/**
 * True while transcription is doing work — fetching the transcript or receiving
 * new captions — and false once it goes idle (silence, paused, or ended).
 * Pure renderer-side: derived from the live-transcript state already in context.
 * Returns false outside a LiveScreenProvider (e.g. the compact loading state).
 */
export const useIsTranscribing = (): boolean => {
  const context = useOptionalLiveScreenContext();
  const groupedCaptions =
    context?.liveTranscript.groupedCaptions ?? EMPTY_CAPTIONS;
  const loading = context?.liveTranscript.loading ?? false;
  const isPaused = context?.recordingContext?.state === "paused";

  const lastGroup = groupedCaptions[groupedCaptions.length - 1];
  // Changes whenever transcript data arrives or the latest caption grows.
  const signature = `${groupedCaptions.length}:${lastGroup?.endTime ?? 0}:${
    lastGroup?.text.length ?? 0
  }`;

  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const signatureRef = useRef(signature);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (signatureRef.current === signature) return;
    signatureRef.current = signature;
    setRecentlyUpdated(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => setRecentlyUpdated(false),
      TRANSCRIBING_IDLE_MS,
    );
  }, [signature]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return !isPaused && (loading || recentlyUpdated);
};
