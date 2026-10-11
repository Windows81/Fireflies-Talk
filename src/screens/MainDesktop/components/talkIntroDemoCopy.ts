/**
 * The banner's two demo scenes: what the person says, and what Talk types for
 * them. A reply only rearranges and punctuates the spoken words; it never adds
 * a thought that was not said.
 */
export const TALK_DEMO_MESSAGES = {
  question1: "Can we meet at 8?",
  spoken1: [
    "“Totally,",
    "yeah,",
    "um,",
    "I'll",
    "be",
    "there",
    "around",
    "like",
    "7,",
    "actually",
    "8”",
  ],
  reply1: "Totally, I'll be there around 8",
  question2: "Also did we finish the report?",
  spoken2: ["“uh,", "yes,", "the", "report", "is,", "um,", "almost", "done”"],
  reply2: "Yes, the report is almost done",
} as const;

export const TALK_DEMO_EMAIL = {
  subject: "Re: Homepage feedback",
  spoken: [
    "“um,",
    "so,",
    "hi",
    "Sam,",
    "I’ve",
    "gone",
    "through",
    "your",
    "comments",
    "and,",
    "uh,",
    "addressed",
    "most",
    "of",
    "them,",
    "thanks”",
  ],
  /** The typed reply, one entry per paragraph, one line per string. */
  reply: [
    ["Hi Sam,", "I’ve gone through your comments and addressed most of them."],
    ["Thanks,", "Janice"],
  ],
} as const;

export const TALK_DEMO_EMAIL_REPLY_TEXT = TALK_DEMO_EMAIL.reply
  .map((paragraph) => paragraph.join(" "))
  .join(" ");

const strip = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Words in `reply` that were never in `spoken`, ignoring the sign-off name. */
export function replyWordsNotSpoken(
  spoken: readonly string[],
  reply: string,
  signOff = "",
): string[] {
  const heard = new Set(strip(spoken.join(" ")));
  const allowed = new Set(strip(signOff));
  return strip(reply).filter((word) => !heard.has(word) && !allowed.has(word));
}
