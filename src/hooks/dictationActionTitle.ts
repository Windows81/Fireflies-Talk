/**
 * Naming a spoken action run.
 *
 * Pure so the rules can be tested directly — the module that uses this reaches
 * React Native through its error reporting and cannot be loaded in a unit test.
 */

/** Short enough to head a panel without wrapping. */
const TITLE_MAX_WORDS = 6;

/**
 * Spoken commands restart mid-sentence — "write an email explaining, actually,
 * write an email about X". What follows the last correction is what was meant.
 */
const SELF_CORRECTION =
  /\b(?:actually|i mean|sorry|no wait|scratch that)\b[,\s—-]*/gi;

/** Politeness and preamble that says nothing about the request. */
const OPENERS = [
  "hey",
  "hi",
  "ok",
  "okay",
  "so",
  "please",
  "just",
  "can you",
  "could you",
  "would you",
  "i want you to",
  "i need you to",
  "i'd like you to",
  "let's",
  "lets",
  "go ahead and",
  "go and",
  "for me",
];

const ARTICLES = new Set(["a", "an", "the"]);

/**
 * A short name for the run, not a transcript of it.
 *
 * The panel is headed by this, so it has to read as the name of a request —
 * the raw utterance carries false starts, filler and politeness that make a
 * useless title.
 */
export function actionRunTitle(command: string): string {
  let text = command.trim();

  // Keep only what follows the last self-correction.
  const corrections = [...text.matchAll(SELF_CORRECTION)];
  const lastCorrection = corrections[corrections.length - 1];
  if (lastCorrection?.index !== undefined) {
    const after = text
      .slice(lastCorrection.index + lastCorrection[0].length)
      .trim();
    if (after.split(/\s+/).length >= 3) text = after;
  }

  // An em dash often marks the same restart without a word for it.
  const dashed = text.split(/\s*[—–]\s*/).filter((part) => part.trim());
  if (dashed.length > 1) {
    const tail = dashed[dashed.length - 1].trim();
    if (tail.split(/\s+/).length >= 3) text = tail;
  }

  let lower = text.toLowerCase();
  let trimmed = true;
  while (trimmed) {
    trimmed = false;
    for (const opener of OPENERS) {
      if (!lower.startsWith(`${opener} `)) continue;
      text = text.slice(opener.length).trim();
      lower = text.toLowerCase();
      trimmed = true;
      break;
    }
  }

  const words = text
    .replace(/[.,;:!?]+$/, "")
    .split(/\s+/)
    .filter((word) => word && !ARTICLES.has(word.toLowerCase()));

  if (!words.length) return "Action";
  const kept = words.slice(0, TITLE_MAX_WORDS).join(" ");
  const title = kept.charAt(0).toUpperCase() + kept.slice(1);
  return words.length > TITLE_MAX_WORDS ? `${title}…` : title;
}
