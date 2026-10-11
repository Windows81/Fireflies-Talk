import { useCallback, useRef } from "react";

export function useTrackedTimeouts() {
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
  }, []);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);
  return { schedule, clearTimers };
}
