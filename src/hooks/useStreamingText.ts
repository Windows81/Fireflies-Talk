import { useEffect, useRef, useState } from "react";

const CHARS_PER_TICK = 5;
const TICK_INTERVAL_MS = 25;

/**
 * Gradually reveals `content` character-by-character while streaming, then shows
 * the full string once `isCompleted` is true (or immediately when already
 * complete on mount).
 */
export function useStreamingText(
  content: string,
  isCompleted: boolean,
  onStreamingComplete?: () => void,
): string {
  const wasCompletedOnMount = useRef(isCompleted);
  const [displayedLength, setDisplayedLength] = useState(
    wasCompletedOnMount.current ? content.length : 0,
  );
  const contentRef = useRef(content);
  contentRef.current = content;
  const onCompleteRef = useRef(onStreamingComplete);
  onCompleteRef.current = onStreamingComplete;
  const hasNotifiedComplete = useRef(false);

  useEffect(() => {
    if (!isCompleted || hasNotifiedComplete.current) return;
    hasNotifiedComplete.current = true;
    onCompleteRef.current?.();
  }, [isCompleted]);

  useEffect(() => {
    if (wasCompletedOnMount.current || isCompleted) return;

    let timer: ReturnType<typeof setInterval> | null = setInterval(() => {
      setDisplayedLength((prev) => {
        const target = contentRef.current.length;
        if (prev >= target) {
          if (timer !== null) {
            clearInterval(timer);
            timer = null;
          }
          return prev;
        }
        const next = Math.min(prev + CHARS_PER_TICK, target);
        if (next >= target && timer !== null) {
          clearInterval(timer);
          timer = null;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (timer !== null) clearInterval(timer);
    };
  }, [isCompleted, content.length]);

  if (wasCompletedOnMount.current || isCompleted) {
    return content;
  }

  return content.slice(0, displayedLength);
}
