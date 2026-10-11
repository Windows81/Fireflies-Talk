/**
 * Dictated text, spoken commands and AI answers are user content, and the
 * desktop log file is written to disk and attached to bug reports. Every line
 * built here carries metadata only — lengths, timings, modes and statuses.
 */

export function formatDictatedLogLine(input: {
  chars: number;
  timingLabel: string;
}): string {
  return `Dictated ${input.chars} chars (${input.timingLabel})`;
}

/** Stop-to-result wall time beside the server's own share of it; the gap is the network. */
export function formatStreamResultLogLine(input: {
  stopMs: number;
  finalizeMs: number;
  formatMs: number;
  totalMs: number;
}): string {
  return `Stream result in ${input.stopMs}ms (server ${input.totalMs}ms: finalize ${input.finalizeMs}ms, format ${input.formatMs}ms)`;
}

export function formatCommandResultLogLine(input: {
  executedAction: boolean;
  chars: number;
  durationMs: number;
}): string {
  const outcome = input.executedAction ? "action" : "text";
  return `Command -> ${outcome} ${input.chars} chars (${input.durationMs}ms)`;
}

export function formatCommandSttLogLine(input: {
  rawChars: number;
  cleanedChars: number;
}): string {
  return `Command STT: raw ${input.rawChars} chars, clean ${input.cleanedChars} chars`;
}

export function formatAgenticCommandLogLine(input: { chars: number }): string {
  return `Agentic command via askfred proxy (${input.chars} chars)`;
}

export function formatAgenticResultLogLine(input: {
  status: string;
  slotComponents: string[];
  executedAction: boolean;
  chars: number;
}): string {
  const slots = input.slotComponents.join(",");
  return `Result (${input.status}, slots=[${slots}], action=${input.executedAction}): ${input.chars} chars`;
}
