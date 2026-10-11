import type { AssistantTab, MainTab } from "./types";

export const NOTES_COLUMN_WIDTH = 680;
export const ASSISTANT_PANE_WIDTH = 400;

export const ASSISTANT_PANE_GAP = 48;
export const NOTES_VIEW_RAIL_WIDTH = 56;

export const DEFAULT_MAIN_TAB: MainTab = "notes";
export const DEFAULT_ASSISTANT_TAB: AssistantTab = "ask-fred";

export const MAIN_TABS: { key: MainTab; label: string; badge?: number }[] = [
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
];

export const ASSISTANT_TABS: { key: AssistantTab; label: string }[] = [
  { key: "ask-fred", label: "AskFred" },
  { key: "transcript", label: "Transcript" },
];

export const SUMMARY_LABEL = "General Summary";

// Vertical gap between the meeting header (title/pills) and the notes body,
// shared by the summary and my-notes views so their top margin matches.
export const NOTEPAD_HEADER_CONTENT_GAP = 48;

// Navigation `ref` set when opening the notepad straight from the post-recording
// instant-summary pane. Only in this case do we show the blank rename title.
export const NOTEPAD_FROM_RECORDING_REF = "instant_summary";

export const NOTEPAD_VIDEO_HEIGHT = 382;
// On load, video meetings scroll so only a sliver of the player stays visible,
// surfacing the summary immediately (Figma 260-28744).
export const NOTEPAD_VIDEO_PEEK = 48;

// Top padding applied to all pane scroll containers.
export const NOTEPAD_CONTENT_TOP_PADDING = 16;
// Scroll offset that leaves only NOTEPAD_VIDEO_PEEK visible. Used by both the
// auto-scroll on load and the floating-controls visibility check.
export const NOTEPAD_VIDEO_PEEK_OFFSET =
  NOTEPAD_CONTENT_TOP_PADDING + NOTEPAD_VIDEO_HEIGHT - NOTEPAD_VIDEO_PEEK;

// How long the notes and tasks panes wait on an unsettled summary status
// before giving up, so their loading states can't run forever.
export const SUMMARY_STALL_MS = 10 * 60 * 1000;

// The storage takeover blocks the whole notepad, so it has to out-stack every
// layer inside it. The notes body is not a stacking context, which lets its
// descendants compete directly with the overlay — the highest is the summary
// editor's bubble-menu container at 1000.
export const STORAGE_PAYWALL_Z_INDEX = 1001;

export const ASSISTANT_SUGGESTIONS = [
  { emoji: "✨", label: "Summaries so far" },
  { emoji: "🧠", label: "Catch up on last 1 min" },
  { emoji: "💬", label: "Suggested questions to ask" },
  { emoji: "🎯", label: "Extract action items" },
];
