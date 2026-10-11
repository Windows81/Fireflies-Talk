import type { CommandRunStep } from "./dictationCommand";

/**
 * Turning a run's stream into the steps a panel shows.
 *
 * Pure so the identity rule can be tested directly — the module that feeds it
 * pulls in the Fred client and cannot be loaded in a unit test.
 */

/** Two lines of a panel is the budget; the rest is reasoning nobody reads. */
export const STEP_MAX_CHARS = 240;

export function truncateStep(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= STEP_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, STEP_MAX_CHARS - 1).trimEnd()}…`;
}

/**
 * Collects steps, skipping ones already reported.
 *
 * Identity is the slot *and what it said*, never the slot alone: a status slot
 * keeps one name for the whole run and rewrites its message as the agent
 * works, so keying on the slot would freeze the panel on the first line and
 * drop every update after it.
 */
export function createStepReporter(emit: (step: CommandRunStep) => void) {
  const seen = new Set<string>();
  let sequence = 0;

  return (key: string, message: string, tool?: string) => {
    const text = truncateStep(message);
    if (!text) return;
    const identity = `${key}::${text}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    sequence += 1;
    emit({ id: `${key}#${sequence}`, message: text, tool });
  };
}
