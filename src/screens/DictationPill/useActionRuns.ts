import { useCallback, useEffect, useState } from "react";
import { parseActionJobs, type ActionJob } from "./dictationActionJob";

/**
 * The detached action runs, as published by the app renderer that owns them.
 *
 * The overlay is a view and nothing more: it never advances a run, it draws the
 * latest snapshot it was handed. Dismissing goes back the other way, so the run
 * is dropped at the source rather than only hidden here — otherwise the next
 * snapshot would bring it straight back.
 */
export function useActionRuns(): {
  jobs: ActionJob[];
  dismiss: (job: ActionJob) => void;
} {
  const [jobs, setJobs] = useState<ActionJob[]>([]);

  useEffect(() => {
    const cleanup = window.electron?.dictation.onActionRuns?.((runs) => {
      setJobs(parseActionJobs(runs));
    });
    // Only future snapshots arrive on this channel, so a reloaded overlay asks
    // for what is already running rather than waiting for the next change.
    window.electron?.dictation.requestActionRuns?.();
    return cleanup;
  }, []);

  const dismiss = useCallback((job: ActionJob) => {
    // Dropped locally too, so the orb goes at once rather than on the round
    // trip back through the owner.
    setJobs((current) => current.filter((entry) => entry.id !== job.id));
    window.electron?.dictation.dismissActionRun?.(job.id);
  }, []);

  return { jobs, dismiss };
}
