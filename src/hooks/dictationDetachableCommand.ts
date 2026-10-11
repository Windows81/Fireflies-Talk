import type { DictationScreenContext } from "electron/src/types";
import type { AgenticCommandResult } from "./dictationAgenticCommand";
import { runDictationCommand } from "./dictationCommand";
import {
  beginDetachableActionRun,
  DETACH_ACTION_AFTER_MS,
} from "./dictationDetachedRun";

/**
 * Running one action-mode command that is allowed to outlive the pill.
 *
 * Kept apart from the processor because the two have different jobs: the
 * processor decides what to do with an answer, and this decides whether the
 * pill is still the one waiting for it.
 */

export type DetachableCommandOutcome =
  /** The run left the pill; it reports itself to the orb overlay from here. */
  | { kind: "detached" }
  | { kind: "result"; result: AgenticCommandResult }
  | { kind: "failed"; error: unknown };

/**
 * Runs the command, handing it over if it outlasts `DETACH_ACTION_AFTER_MS`.
 *
 * A handed-over run is finished by the orb, so this resolves at the moment of
 * detachment rather than waiting: the pill's own timeout and gate should be
 * released then, not when the work eventually ends.
 */
export async function runDetachableActionCommand(params: {
  command: string;
  screenContext: DictationScreenContext | null;
  gateSignal: AbortSignal;
  reportPhase: (phase: string) => void;
  onActivity?: () => void;
  /** Called once the pill is free — before the run has produced anything. */
  onDetached: () => void;
}): Promise<DetachableCommandOutcome> {
  const { command, screenContext, gateSignal } = params;
  const run = beginDetachableActionRun({ command, gateSignal });

  let detachTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    detachTimer = null;
    if (run.detach()) params.onDetached();
  }, DETACH_ACTION_AFTER_MS);

  const clearDetachTimer = () => {
    if (detachTimer) clearTimeout(detachTimer);
    detachTimer = null;
  };

  try {
    params.reportPhase("Thinking");
    const result = await runDictationCommand(command, screenContext, {
      signal: run.signal,
      // Once detached the pill has moved on, and its phase line belongs to
      // whatever it is doing now.
      onProgress: (phase) => {
        if (!run.detached) params.reportPhase(phase);
      },
      onStep: run.addStep,
      onCredits: run.setCredits,
      onLinks: run.setLinks,
      onActivity: () => {
        run.touch();
        params.onActivity?.();
      },
    });
    clearDetachTimer();
    if (run.detached) {
      // The orb holds the result: pasting from here would fire text into
      // whatever the user moved on to.
      run.complete(result);
      return { kind: "detached" };
    }
    run.discard();
    return { kind: "result", result };
  } catch (error) {
    clearDetachTimer();
    if (run.detached) {
      run.fail(error);
      return { kind: "detached" };
    }
    run.discard();
    return { kind: "failed", error };
  }
}
