/**
 * The welcome screen's before/after: what the person says, and the email Talk
 * turns it into. The polished text only rearranges and punctuates the spoken
 * words — it never adds a thought that was not said.
 */
export const WELCOME_SPOKEN_WORDS = [
  "umm,",
  "hi",
  "David,",
  "thanks",
  "for",
  "the",
  "demo",
  "earlier...",
  "let's",
  "set",
  "up",
  "a",
  "call",
  "next",
  "week",
  "to",
  "discuss",
  "the",
  "rollout,",
  "let",
  "me",
  "know",
  "what",
  "time",
  "works",
  "for",
  "you",
] as const;

export const WELCOME_SPOKEN = WELCOME_SPOKEN_WORDS.join(" ");

/** The finished email, one entry per line; empty entries are blank lines. */
export const WELCOME_POLISHED_LINES = [
  "Hi David,",
  "",
  "Thanks for the demo earlier. Let's set up a call next week to discuss the rollout. Let me know what time works for you.",
  "",
  "Regards,",
  "Matt Blanc",
] as const;

export const WELCOME_POLISHED_BODY = WELCOME_POLISHED_LINES.join("\n");

export const WELCOME_SIGN_OFF = "Regards,\nMatt Blanc";

/** Every word of the polished email in reading order, for the reveal. */
export const WELCOME_POLISHED_WORD_COUNT = WELCOME_POLISHED_LINES.reduce(
  (count, line) => count + (line ? line.split(" ").length : 0),
  0,
);

const strip = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Words in the polished email that were never spoken. Filler ("umm") dropping
 * out is fine; the polish inventing content is not, so this stays empty apart
 * from the sign-off the demo adds as formatting.
 */
export function polishedWordsNotSpoken(): string[] {
  const spoken = new Set(strip(WELCOME_SPOKEN));
  const signOff = new Set(strip(WELCOME_SIGN_OFF));
  return strip(WELCOME_POLISHED_BODY).filter(
    (word) => !spoken.has(word) && !signOff.has(word),
  );
}
