import {
  extractActionLinks,
  flattenActionMarkdown,
  stripActionMarkdown,
  toActionLink,
  type ActionLink,
} from "./dictationActionLinks";

/**
 * A detached action-mode run. An AskFred action can take far longer than the
 * utterance that launched it, so it leaves the pill and parks in its own window
 * at the corner of the screen. The pill drops straight back to idle and stays
 * free to dictate, or to launch the next action.
 *
 * Pure data and pure rules, kept free of React so they stay unit-testable.
 */

/** One thing the agent did, in its own words. */
export type ActionJobStep = {
  id: string;
  /** The narrative line the agent reports for this step. */
  message: string;
  /** The tool this step reached for, when it used one. */
  tool?: string;
};

/**
 * How a run ended. A run that produced text hands it back for the user to
 * take; a run that acted somewhere else has nothing to hand over and can only
 * confirm that it happened.
 */
export type ActionJobOutcome =
  | { kind: "text"; text: string }
  | { kind: "action"; confirmation: string }
  | { kind: "error"; message: string };

export type ActionJob = {
  id: string;
  /** A short name for the run, headlining its panel. */
  title: string;
  /** The spoken command that started it. */
  command: string;
  /** Oldest first. The last one is what the agent is doing right now. */
  steps: ActionJobStep[];
  /** What the run cost, when Fred's cost slot reported it. */
  credits?: number;
  /**
   * Set when the automatic paste did not reach the focused input. The result
   * is still here to copy — this only stops the orb from implying it landed.
   */
  pasteFailed?: boolean;
  /** Destinations the tools reported — where the run actually put things. */
  toolLinks?: ActionLink[];
  /**
   * Where the pill was, in overlay coordinates, at the moment this run left
   * it — the orb flies from there. Read once at detach rather than looked up
   * when the orb draws: the pill can be dragged in between, and an orb that
   * launches from where the pill used to be is worse than one that just
   * appears.
   */
  origin?: { x: number; y: number };
  /** Absent while the run is still going. */
  outcome?: ActionJobOutcome;
};

/**
 * What the orb draws in its middle once the sparks stop. Finishing is one
 * state, not several: a run that drafted text and a run that acted somewhere
 * else both just say "done", and what to do about either lives in the panel.
 */
export type ActionOrbFace = "running" | "done" | "error";

export function actionOrbFace(job: ActionJob): ActionOrbFace {
  if (!job.outcome) return "running";
  return job.outcome.kind === "error" ? "error" : "done";
}

/**
 * What copy and paste hand over. Not the same as what is shown: this keeps the
 * addresses, since the buttons do not travel with the text.
 */
export function actionJobCopyText(job: ActionJob): string | null {
  const outcome = job.outcome;
  return outcome?.kind === "text" ? flattenActionMarkdown(outcome.text) : null;
}

/**
 * The one line the panel leads with.
 *
 * A drafted result is not it — that goes in its own box to be read and copied,
 * so a run that produced text still reports the last thing it did. A run that
 * acted elsewhere, or failed, has nothing else to show and says so here.
 */
export function actionJobStatusLine(job: ActionJob): string {
  const outcome = job.outcome;
  if (outcome?.kind === "action") {
    return stripActionMarkdown(outcome.confirmation);
  }
  if (outcome?.kind === "error") return outcome.message;
  const last = job.steps[job.steps.length - 1]?.message;
  if (last) return last;
  return outcome ? "Finished" : "Starting up…";
}

/** True when the status line is showing the newest step rather than an outcome. */
function statusLineIsLastStep(job: ActionJob): boolean {
  const kind = job.outcome?.kind;
  if (kind === "action" || kind === "error") return false;
  return job.steps.length > 0;
}

/**
 * The steps behind the status line, newest first. Whatever the line is already
 * showing is left out of it, so nothing appears twice.
 */
export function actionJobHistory(job: ActionJob): ActionJobStep[] {
  const steps = statusLineIsLastStep(job) ? job.steps.slice(0, -1) : job.steps;
  return [...steps].reverse();
}

/**
 * The generated text a finished run is holding, if it produced any — read as
 * prose, with the link syntax collapsed to its words.
 */
export function actionJobResultText(job: ActionJob): string | null {
  const outcome = job.outcome;
  return outcome?.kind === "text" ? stripActionMarkdown(outcome.text) : null;
}

/**
 * Every destination worth a button, best first.
 *
 * What the tools reported leads: those are where the run actually put things —
 * the draft it saved, the message it posted. Fred's prose tends to cite the
 * sources it read instead, and a button to a meeting it consulted is not what
 * the user is reaching for after asking it to draft an email.
 */
export function actionJobLinks(job: ActionJob): ActionLink[] {
  const outcome = job.outcome;
  const fromTools = job.toolLinks ?? [];
  if (!outcome) return fromTools;
  const text =
    outcome.kind === "text"
      ? outcome.text
      : outcome.kind === "action"
        ? outcome.confirmation
        : outcome.message;
  const seen = new Set(fromTools.map((link) => link.url));
  const fromProse = extractActionLinks(text).filter(
    (link) => !seen.has(link.url),
  );
  return [...fromTools, ...fromProse];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseStep(value: unknown): ActionJobStep | null {
  if (!isRecord(value)) return null;
  const { id, message, tool } = value;
  if (typeof id !== "string" || typeof message !== "string") return null;
  return { id, message, ...(typeof tool === "string" ? { tool } : {}) };
}

function parseOutcome(value: unknown): ActionJobOutcome | undefined {
  if (!isRecord(value)) return undefined;
  const { kind } = value;
  if (kind === "text" && typeof value.text === "string") {
    return { kind, text: value.text };
  }
  if (kind === "action" && typeof value.confirmation === "string") {
    return { kind, confirmation: value.confirmation };
  }
  if (kind === "error" && typeof value.message === "string") {
    return { kind, message: value.message };
  }
  return undefined;
}

function parseLinks(value: unknown): ActionLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links = value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.url !== "string") return [];
    const link = toActionLink(entry.url);
    return link ? [link] : [];
  });
  return links.length ? links : undefined;
}

function parsePoint(value: unknown): { x: number; y: number } | undefined {
  if (!isRecord(value)) return undefined;
  const { x, y } = value;
  if (typeof x !== "number" || typeof y !== "number") return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

/**
 * Runs as they arrive from the process that owns them.
 *
 * Checked rather than cast: this drives an always-on-top overlay and feeds
 * privileged actions — pasting, opening links — so a malformed entry should be
 * dropped here rather than surface as a broken orb or an unexpected value
 * further in. Destinations are re-run through the scheme check on the way.
 */
export function parseActionJobs(value: unknown): ActionJob[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const { id, title, command, steps, credits } = entry;
    if (typeof id !== "string" || typeof title !== "string") return [];
    const job: ActionJob = {
      id,
      title,
      command: typeof command === "string" ? command : "",
      steps: Array.isArray(steps)
        ? steps.flatMap((step) => {
            const parsed = parseStep(step);
            return parsed ? [parsed] : [];
          })
        : [],
    };
    const outcome = parseOutcome(entry.outcome);
    if (outcome) job.outcome = outcome;
    const toolLinks = parseLinks(entry.toolLinks);
    if (toolLinks) job.toolLinks = toolLinks;
    const origin = parsePoint(entry.origin);
    if (origin) job.origin = origin;
    if (typeof credits === "number" && Number.isFinite(credits)) {
      job.credits = credits;
    }
    if (entry.pasteFailed === true) job.pasteFailed = true;
    return [job];
  });
}
