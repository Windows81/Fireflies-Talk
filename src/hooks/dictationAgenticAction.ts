const CHROME_COMPONENTS = new Set([
  "StatusText",
  "ThinkingProgress",
  "CostTracker",
]);

// Kept in step with the verbs `humanizeToolName` knows: a tool this misses is
// a run whose result is pasted instead of confirmed, and whose destination
// never becomes a button.
const MUTATING_TOKEN =
  /(^|_|-)(send|create|update|delete|edit|post|remove|write|draft|modify|schedule|invite|share|add|assign|reply)(_|-|$)/i;

export type CommandUiSlot = {
  name: string;
  componentName: string;
  componentProps: unknown;
};

function isMutatingToolName(toolName: string): boolean {
  return MUTATING_TOKEN.test(toolName);
}

function stringProp(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function toolNamesFromProps(props: unknown): string[] {
  if (!props || typeof props !== "object") return [];
  const record = props as Record<string, unknown>;
  const names: string[] = [];
  const direct = stringProp(record.toolName);
  if (direct) names.push(direct);
  if (!Array.isArray(record.history)) return names;
  for (const entry of record.history) {
    if (!entry || typeof entry !== "object") continue;
    const toolName = stringProp((entry as { toolName?: unknown }).toolName);
    if (toolName) names.push(toolName);
  }
  return names;
}

const COST_COMPONENT = "CostTracker";
/**
 * Only fields that name credits outright. A generic `cost` could as easily be
 * dollars or tokens, and labelling it "3 credits" would be a confident lie.
 */
const CREDIT_FIELDS = ["credits", "creditsUsed", "totalCredits", "creditCost"];

function numberProp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // Some payloads carry it as a formatted string.
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * What the run cost, as Fred's own cost slot reports it. Null when the run
 * carried no cost slot, which is not the same as free — so the panel says
 * nothing rather than claiming zero.
 */
export function commandCreditsUsed(slots: CommandUiSlot[]): number | null {
  for (const slot of slots) {
    if (slot.componentName !== COST_COMPONENT) continue;
    const props = slot.componentProps;
    if (!props || typeof props !== "object") continue;
    const record = props as Record<string, unknown>;
    for (const field of CREDIT_FIELDS) {
      const value = numberProp(record[field]);
      if (value !== undefined) return value;
    }
  }
  return null;
}

const URL_IN_TEXT = /https?:\/\/[^\s"'<>()[\]]+/g;
/** Deep enough for a tool result nested in a history entry, no deeper. */
const URL_SCAN_MAX_DEPTH = 6;

/**
 * Where the run actually put something.
 *
 * Only the tools that changed the world are consulted — the saved draft, the
 * posted message. A search tool's result is full of addresses too, and offering
 * one of those as *the* button is how a run that drafted an email ends up
 * pointing at a meeting it happened to read.
 *
 * Scanned structurally rather than by field name: each tool shapes its own
 * result and there is no shared contract to read.
 */
export function commandActionLinks(slots: CommandUiSlot[]): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  const collect = (value: unknown, depth: number) => {
    if (depth > URL_SCAN_MAX_DEPTH || found.length >= 8) return;
    if (typeof value === "string") {
      for (const match of value.matchAll(URL_IN_TEXT)) {
        const url = match[0].replace(/[.,;:!?]+$/, "");
        if (seen.has(url)) continue;
        seen.add(url);
        found.push(url);
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const entry of value) collect(entry, depth + 1);
      return;
    }
    if (value && typeof value === "object") {
      for (const entry of Object.values(value)) collect(entry, depth + 1);
    }
  };

  for (const slot of slots) {
    if (CHROME_COMPONENTS.has(slot.componentName)) continue;
    const props = slot.componentProps;
    if (!props || typeof props !== "object") continue;
    const record = props as Record<string, unknown>;

    // A slot naming one mutating tool is itself the record of that action.
    const direct = stringProp(record.toolName);
    if (direct && isMutatingToolName(direct)) {
      collect(record, 0);
      continue;
    }
    // Otherwise only the entries for mutating tools count.
    if (!Array.isArray(record.history)) continue;
    for (const entry of record.history) {
      if (!entry || typeof entry !== "object") continue;
      const toolName = stringProp((entry as { toolName?: unknown }).toolName);
      if (toolName && isMutatingToolName(toolName)) collect(entry, 0);
    }
  }
  return found;
}

/** One line of a run's progress, drawn from a ui slot. */
export type CommandSlotStep = {
  id: string;
  message: string;
  tool?: string;
};

/**
 * Tool names are verb-first or verb-second (`web_search`, `analyzeMeetings`),
 * so the verb is found rather than assumed to lead.
 */
const TOOL_VERBS: Record<string, string> = {
  search: "searching",
  find: "finding",
  discover: "discovering",
  analyze: "analysing",
  analyse: "analysing",
  summarize: "summarising",
  summarise: "summarising",
  list: "listing",
  get: "checking",
  fetch: "fetching",
  read: "reading",
  lookup: "looking up",
  query: "querying",
  check: "checking",
  send: "sending",
  post: "posting",
  create: "creating",
  draft: "drafting",
  write: "writing",
  update: "updating",
  edit: "editing",
  delete: "deleting",
  remove: "removing",
  schedule: "scheduling",
  invite: "inviting",
};

function toolWords(toolName: string): string[] {
  return toolName
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * `web_search` → `AskFred is searching the web`.
 *
 * A bare `Web search` reads like a column heading rather than something
 * happening, and this line is the one place the user is told what is going on
 * while they wait.
 */
export function humanizeToolName(toolName: string): string {
  const words = toolWords(toolName);
  if (!words.length) return "AskFred is working on it";

  const verbAt = words.findIndex((word) => TOOL_VERBS[word]);
  if (verbAt === -1) {
    return `AskFred is checking ${words.join(" ")}`;
  }
  const verb = TOOL_VERBS[words[verbAt]];
  const rest = words.filter((_, index) => index !== verbAt).join(" ");
  return rest ? `AskFred is ${verb} the ${rest}` : `AskFred is ${verb}`;
}

/**
 * `status` is deliberately absent: it holds an enum like "completed", which
 * would put a state machine's vocabulary on screen where a sentence belongs.
 */
const STATUS_FIELDS = ["message", "text", "label", "title"];

/** The words Fred is showing in its own status line, when it has any. */
function statusTextFromProps(props: unknown): string | undefined {
  if (!props || typeof props !== "object") return undefined;
  const record = props as Record<string, unknown>;
  for (const field of STATUS_FIELDS) {
    const value = stringProp(record[field]);
    if (value) return value;
  }
  return undefined;
}

/**
 * Turns a run's ui slots into progress lines.
 *
 * The component name is never the label: `StatusText` and friends are chrome,
 * and naming them is how a step ends up reading "Status text" instead of what
 * the agent is doing. The words come from the status component's own text, and
 * the tools from the `toolName` the other slots carry.
 */
export function commandSlotSteps(slots: CommandUiSlot[]): CommandSlotStep[] {
  const steps: CommandSlotStep[] = [];
  for (const slot of slots) {
    if (CHROME_COMPONENTS.has(slot.componentName)) {
      const status = statusTextFromProps(slot.componentProps);
      if (status) steps.push({ id: `${slot.name}:status`, message: status });
      continue;
    }
    for (const toolName of toolNamesFromProps(slot.componentProps)) {
      steps.push({
        id: `${slot.name}:${toolName}`,
        message: humanizeToolName(toolName),
        tool: toolName,
      });
    }
  }
  return steps;
}

export function didExecuteCommandAction(slots: CommandUiSlot[]): boolean {
  return slots.some((slot) => {
    if (CHROME_COMPONENTS.has(slot.componentName)) return false;
    return toolNamesFromProps(slot.componentProps).some(isMutatingToolName);
  });
}
