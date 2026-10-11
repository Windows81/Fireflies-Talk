import {
  DICTATION_FEEDBACK_CARD_HEIGHT,
  DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type { DictationFeedbackAction } from "electron/src/types";
import { TALK_FEEDBACK_PROPS } from "@/screens/MainDesktop/components/talkFeedback";

export type FeedbackStep = "rating" | "details" | "thanks";

const CLOSING_PUNCTUATION = /^[.,;:!?)\]}]+(\s|$)/;
const OPENING_PUNCTUATION = /[([{“‘]$/;

/** Four stars and up get the "what's working" treatment. */
export function isPositiveRating(rating: number): boolean {
  return rating >= 4;
}

/** The quote opt-in only makes sense alongside the praise chips. */
export function quoteAllowed(rating: number, canQuote: boolean): boolean {
  return isPositiveRating(rating) && canQuote;
}

/** The details step's chip list for the rating the user picked. */
export function categoriesFor(rating: number): readonly string[] {
  return isPositiveRating(rating)
    ? TALK_FEEDBACK_PROPS.positiveCategories
    : TALK_FEEDBACK_PROPS.feedbackCategories;
}

export function buildFeedbackAction(
  rating: number,
  comment: string,
  categories: string[],
  canQuote: boolean,
): Extract<DictationFeedbackAction, { type: "submit" }> {
  return {
    type: "submit",
    rating,
    comment: comment.trim(),
    categories,
    canQuote,
  };
}

export function feedbackCloseActions(
  step: FeedbackStep,
  submitAction: Extract<DictationFeedbackAction, { type: "submit" }>,
): DictationFeedbackAction[] {
  if (step === "details" && submitAction.comment.length > 0) {
    return [submitAction, { type: "dismiss" }];
  }
  return [{ type: "dismiss" }];
}

/** Spaces word boundaries while keeping adjacent punctuation attached. */
export function dictatedInsertion(
  before: string,
  after: string,
  text: string,
): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return "";
  const leadingSpace =
    before.length > 0 &&
    !/\s$/.test(before) &&
    !OPENING_PUNCTUATION.test(before) &&
    !CLOSING_PUNCTUATION.test(trimmed)
      ? " "
      : "";
  const trailingSpace =
    after.length > 0 && !/^\s/.test(after) && !CLOSING_PUNCTUATION.test(after)
      ? " "
      : "";
  return leadingSpace + trimmed + trailingSpace;
}

/**
 * The card's height for the current step. The low-rating details step is the
 * tallest (more chips, more wrapped rows); the high-rating one carries the
 * same rows minus the extra chips. The thanks beat keeps the rating card's
 * size so it does not jump.
 */
export function feedbackCardHeight(step: FeedbackStep, rating: number): number {
  if (step !== "details") return 108;
  return isPositiveRating(rating)
    ? DICTATION_FEEDBACK_POSITIVE_CARD_HEIGHT
    : DICTATION_FEEDBACK_CARD_HEIGHT;
}
