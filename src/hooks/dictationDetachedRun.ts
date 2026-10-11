import type {
  ActionJob,
  ActionJobOutcome,
} from "@/screens/DictationPill/dictationActionJob";
import {
  toActionLink,
  type ActionLink,
} from "@/screens/DictationPill/dictationActionLinks";
import { actionRunTitle } from "./dictationActionTitle";
import {
  COMMAND_IDLE_TIMEOUT_MS,
  COMMAND_MAX_TIMEOUT_MS,
} from "./dictationCommandTimeout";
import type { AgenticCommandResult } from "./dictationAgenticCommand";
import type { CommandRunStep } from "./dictationCommand";
import { formatDictationServiceError } from "./dictationErrorMessage";

/**
 * Action runs that have outlived the pill.
 *
 * A command long enough to be worth waiting for is handed over here: the pill
 * drops back to idle, and the run carries on under its own abort controller,
 * publishing itself to the orb overlay until it ends. Several can be in flight
 * at once, which is the whole reason they leave the pill — its work gate holds
 * exactly one run, and starting a second aborts the first.
 */

/**
 * A quick action belongs in the pill — it is answered before an orb would even
 * arrive. Only a run still going after this long is worth handing over.
 */
export const DETACH_ACTION_AFTER_MS = 3000;

/** Finished orbs stay until dismissed; this is only a ceiling on the pile. */
const MAX_RETAINED_ACTION_RUNS = 32;

const runs = new Map<string, ActionJob>();
/** Live controllers, so a sign-out can stop work the pill no longer owns. */
const live = new Map<string, () => void>();
let nextRunId = 0;

function dropOldestFinishedRuns(): void {
  const extra = runs.size - MAX_RETAINED_ACTION_RUNS;
  if (extra <= 0) return;

  const finished = [...runs.entries()].filter(
    ([id, job]) => job.outcome && !live.has(id),
  );

  for (const [id] of finished.slice(0, extra)) {
    runs.delete(id);
  }
}

function publish(): void {
  dropOldestFinishedRuns();
  window.electron?.dictation.publishActionRuns?.([...runs.values()]);
}

export type DetachableActionRun = {
  /** True once the pill has handed this run over. */
  readonly detached: boolean;
  /** The run's own signal — it outlives the pill's work gate. */
  readonly signal: AbortSignal;
  /** Hands the run over. False when it had already been detached. */
  detach: () => boolean;
  addStep: (step: CommandRunStep) => void;
  setCredits: (credits: number) => void;
  setLinks: (urls: string[]) => void;
  complete: (result: AgenticCommandResult) => void;
  fail: (error: unknown) => void;
  /** Drops a run that finished before it ever detached. */
  discard: () => void;
  /** Resets the detached idle clock from AskFred activity. */
  touch: () => void;
};

/**
 * Wraps one command run so it can be handed over mid-flight.
 *
 * The run gets its own controller from the start and merely mirrors the pill's
 * aborts until it detaches — after that the pill can start a new dictation, and
 * invalidating its gate must not kill work that is no longer the pill's.
 */
export function beginDetachableActionRun(params: {
  command: string;
  gateSignal: AbortSignal;
  idleTimeoutMs?: number;
}): DetachableActionRun {
  const id = `run-${(nextRunId += 1)}`;
  const startedAt = Date.now();
  const controller = new AbortController();
  let detached = false;
  let settled = false;
  let cancelled = false;

  interface RunTimers {
    max: ReturnType<typeof setTimeout> | null;
    idle: ReturnType<typeof setTimeout> | null;
  }

  const timers: RunTimers = { max: null, idle: null };
  const idleMs = params.idleTimeoutMs ?? COMMAND_IDLE_TIMEOUT_MS;

  const job: ActionJob = {
    id,
    title: actionRunTitle(params.command),
    command: params.command,
    steps: [],
  };

  const mirrorAbort = () => {
    if (!detached) controller.abort(params.gateSignal.reason);
  };
  params.gateSignal.addEventListener("abort", mirrorAbort, { once: true });

  const stopMirroring = () => {
    params.gateSignal.removeEventListener("abort", mirrorAbort);
  };

  const clearTimers = () => {
    if (timers.max) clearTimeout(timers.max);
    if (timers.idle) clearTimeout(timers.idle);
    timers.max = null;
    timers.idle = null;
  };

  const touchIdle = () => {
    if (!detached || settled || cancelled) return;
    if (timers.idle) clearTimeout(timers.idle);

    timers.idle = setTimeout(
      () =>
        controller.abort(new DOMException("client-idle-timeout", "AbortError")),
      idleMs,
    );
  };

  const settle = (outcome: ActionJobOutcome) => {
    if (settled) return;
    settled = true;
    clearTimers();
    stopMirroring();
    live.delete(id);
    // A cancelled run has already been cleared; publishing its outcome now
    // would put it back on screen after the user signed out.
    if (!detached || cancelled) return;
    job.outcome = outcome;
    runs.set(id, { ...job });
    publish();
  };

  return {
    get detached() {
      return detached;
    },
    signal: controller.signal,
    detach: () => {
      if (detached || settled) return false;
      detached = true;
      stopMirroring();
      live.set(id, () => {
        cancelled = true;
        clearTimers();
        controller.abort(new DOMException("user-cancel", "AbortError"));
      });
      touchIdle();
      // The pill's timeout went with the pill, so the run carries its own —
      // measuring the whole run, not just the part after it detached, so
      // detaching cannot quietly extend the ceiling.
      timers.max = setTimeout(
        () =>
          controller.abort(
            new DOMException("client-max-duration", "AbortError"),
          ),
        Math.max(0, COMMAND_MAX_TIMEOUT_MS - (Date.now() - startedAt)),
      );
      // Published only once the pill's position is known: the orb captures its
      // flight path on its first render, so a position that lands afterwards
      // is a position that lands too late.
      void window.electron?.dictation
        .getActionOrbSpawnPoint?.()
        .then((point) => {
          if (point) job.origin = point;
        })
        .catch(() => undefined)
        .finally(() => {
          // Dismissal and sign-out can both land while this is in flight, and
          // re-inserting here would resurrect a run the user has cleared.
          if (cancelled || !live.has(id)) return;
          runs.set(id, { ...job });
          publish();
        });
      return true;
    },
    touch: touchIdle,
    addStep: (step) => {
      job.steps = [
        ...job.steps,
        { id: step.id, message: step.message, tool: step.tool },
      ];
      if (!detached || !live.has(id)) return;
      touchIdle();
      runs.set(id, { ...job });
      publish();
    },
    setLinks: (urls) => {
      const links = urls
        .map(toActionLink)
        .filter((link): link is ActionLink => link !== null);
      if (!links.length) return;
      job.toolLinks = links;
      if (!detached || !live.has(id)) return;
      touchIdle();
      runs.set(id, { ...job });
      publish();
    },
    setCredits: (credits) => {
      job.credits = credits;
      if (!detached || !live.has(id)) return;
      touchIdle();
      runs.set(id, { ...job });
      publish();
    },
    complete: (result) => {
      settle(
        result.executedAction
          ? { kind: "action", confirmation: result.text }
          : { kind: "text", text: result.text },
      );
      // Land the text where the user is working, exactly as an undetached run
      // would have. Focus may well have moved on by now, so a miss is recorded
      // rather than swallowed — the orb keeps the result either way, but it
      // must not imply the text arrived somewhere it did not.
      if (!detached || cancelled || result.executedAction || !result.text)
        return;
      void window.electron?.dictation
        .pasteActionResult?.(result.text)
        .then((outcome) => {
          if (outcome?.success && !outcome.copiedToClipboard) return;
          markPasteFailed(id);
        })
        .catch(() => markPasteFailed(id));
    },
    fail: (error) =>
      settle({ kind: "error", message: formatDictationServiceError(error) }),
    discard: () => {
      settled = true;
      clearTimers();
      stopMirroring();
      live.delete(id);
    },
  };
}

function markPasteFailed(id: string): void {
  const job = runs.get(id);
  if (!job) return;
  runs.set(id, { ...job, pasteFailed: true });
  publish();
}

/** Re-sends everything, for an overlay that has just loaded. */
export function republishDetachedActionRuns(): void {
  publish();
}

/** Clears a run the user has dealt with in the overlay. */
export function dismissDetachedActionRun(id: string): void {
  const abort = live.get(id);
  live.delete(id);
  abort?.();
  if (!runs.delete(id)) return;
  publish();
}

/**
 * Stops every detached run and clears the board.
 *
 * Signing out or switching dictation off ends these runs' claim on the app:
 * they no longer mirror the pill's gate, so without this they would carry on
 * acting and could paste a result into a signed-out session.
 */
export function abortDetachedActionRuns(): void {
  for (const abort of live.values()) abort();
  live.clear();
  runs.clear();
  publish();
}
