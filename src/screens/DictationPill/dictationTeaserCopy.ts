import type { DictationTeaserContent } from "electron/src/types";

export interface DictationTeaserCopy {
  /** Stands in for the Talk badge on cards that are not the introduction. */
  emoji?: string;
  title: string;
  body: string;
  action: string;
}

/**
 * What the card beside the pill says. The introduction pitches Talk to someone
 * who has never used it; a nudge speaks to someone who already does, so it
 * names what just happened rather than the product.
 */
export function dictationTeaserCopy(
  content: DictationTeaserContent,
): DictationTeaserCopy {
  if (content.variant === "milestone") {
    return {
      emoji: "🏆",
      title: "You've reached a new milestone!",
      body: content.milestone
        ? `You've now dictated more words than ${content.milestone}.`
        : "See how far your words have taken you.",
      action: "Share it",
    };
  }

  return {
    title: "Stop typing. Start talking.",
    body: "Dictate emails, messages, and anything you write.",
    action: "Try Fireflies Talk",
  };
}
