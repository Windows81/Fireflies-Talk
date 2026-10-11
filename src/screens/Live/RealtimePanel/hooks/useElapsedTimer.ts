import { useCallback, useEffect, useRef, useState } from "react";

// Recordings at or under this length prompt to save/discard on stop; longer
// recordings are saved directly without the confirmation.
export const SAVE_CONFIRM_MAX_SECONDS = 5 * 60;

export const isLongRecordingSeconds = (elapsedSeconds: number): boolean =>
  elapsedSeconds > SAVE_CONFIRM_MAX_SECONDS;

// `elapsed` is the "mm:ss" string returned by useElapsedTimer.
export const isLongRecording = (elapsed: string): boolean => {
  const [minutes, seconds] = elapsed.split(":");
  return isLongRecordingSeconds(Number(minutes) * 60 + Number(seconds));
};

const formatElapsed = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const toTimestamp = (startedAt: string | number | null | undefined) => {
  if (!startedAt) return null;
  const timestamp = new Date(startedAt).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export function useElapsedTimer(
  startedAt: string | number | null | undefined,
  isPaused = false,
): string {
  const [now, setNow] = useState(() => Date.now());
  const pausedOffsetRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {
      const pausedAt = Date.now();
      pauseStartRef.current = pausedAt;
      setNow(pausedAt);
      return;
    }

    if (pauseStartRef.current != null) {
      pausedOffsetRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setNow(Date.now());
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [isPaused]);

  const start = toTimestamp(startedAt);
  if (start == null) return formatElapsed(0);

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - start - pausedOffsetRef.current) / 1000),
  );
  return formatElapsed(elapsedSeconds);
}

// Ref-based variant for callers that only need elapsed time on demand (e.g. in
// an event handler) and must not re-render every second the way useElapsedTimer
// does. Tracks the pause offset via a ref instead of an interval-driven state.
export function useElapsedSecondsGetter(
  startedAt: string | number | null | undefined,
  isPaused = false,
): () => number {
  const pausedOffsetRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {
      pauseStartRef.current = Date.now();
      return;
    }

    if (pauseStartRef.current != null) {
      pausedOffsetRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [isPaused]);

  return useCallback(() => {
    const start = toTimestamp(startedAt);
    if (start == null) return 0;

    // While paused, freeze at the pause start instead of advancing with Date.now().
    const now = pauseStartRef.current ?? Date.now();
    return Math.max(
      0,
      Math.floor((now - start - pausedOffsetRef.current) / 1000),
    );
  }, [startedAt]);
}
