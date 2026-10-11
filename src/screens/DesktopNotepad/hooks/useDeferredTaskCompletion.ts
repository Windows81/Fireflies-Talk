import { useCallback, useEffect, useRef, useState } from "react";
import type { NotepadTaskItem } from "../helpers/tasks";

const STRIKE_HOLD_MS = 2000;

/**
 * Wraps the task toggle so completing a pending task first strikes it through in
 * place, holds briefly, then commits the status change (which moves it to the
 * bottom). Un-checking during the hold cancels the move; completed tasks toggle
 * back to pending immediately.
 */
export const useDeferredTaskCompletion = (
  toggleTask: (task: NotepadTaskItem, completed: boolean) => void,
) => {
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const cancelTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (!timer) return;
    clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const removeCompleting = useCallback((id: string) => {
    setCompletingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const handleToggle = useCallback(
    (task: NotepadTaskItem, inCompletedSection: boolean, next: boolean) => {
      if (inCompletedSection) {
        toggleTask(task, next);
        return;
      }

      if (!next) {
        cancelTimer(task.id);
        removeCompleting(task.id);
        return;
      }

      cancelTimer(task.id);
      setCompletingIds((prev) => new Set(prev).add(task.id));
      const timer = setTimeout(() => {
        timers.current.delete(task.id);
        removeCompleting(task.id);
        toggleTask(task, true);
      }, STRIKE_HOLD_MS);
      timers.current.set(task.id, timer);
    },
    [toggleTask, cancelTimer, removeCompleting],
  );

  const isCompleting = useCallback(
    (id: string) => completingIds.has(id),
    [completingIds],
  );

  return { handleToggle, isCompleting };
};
