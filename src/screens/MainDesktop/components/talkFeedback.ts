import { TALK_FEEDBACK_NUDGE_MILESTONES } from "@/features/dictation-feedback-nudge/constants";
import type { GetCurrentUserQuery } from "@/graphql/gql.gen";
import { EnumFeedbackType } from "@/graphql/gql.gen";
import type { FeedbackClientInfo } from "@/hooks/useFeedbackClientInfo";
import type { DictationFeedbackAction } from "electron/src/types";

/**
 * Feedback on Talk as a whole, shared from dictation home or offered beside
 * the pill after the tenth dictation.
 *
 * It goes through the general feedback pipeline — a star rating and a comment,
 * the same as the recording screen — rather than the dictation feedback
 * endpoint, so no dictation text or id is attached to it.
 */
export const TALK_FEEDBACK_PROPS = {
  category: "Talk (Desktop)",
  title: "How's Fireflies Talk?",
  description: "Your feedback matters! Help us improve dictation for you.",
  feedbackCategories: [
    "Incorrect formatting",
    "Incorrect transcription",
    "Wrong names",
    "Hard to use",
    "Other",
  ],
  positiveCategories: [
    "Saves me time",
    "Cleaner than I'd type it",
    "Gets what I mean",
    "Slack tagging",
  ],
} as const;

/**
 * Whether the server's copy of the user says the nudge is finished, either
 * by a completed flag or by spending every milestone show.
 */
export function isTalkFeedbackNudgeCompletedOnServer(
  user:
    | Pick<NonNullable<GetCurrentUserQuery["user"]>, "flags" | "userMetaData">
    | null
    | undefined,
): boolean {
  const timesSeen =
    user?.userMetaData?.counters?.timesSeenTalkFeedbackNudge ?? 0;
  return (
    user?.flags?.completedTalkFeedbackNudge === true ||
    timesSeen >= TALK_FEEDBACK_NUDGE_MILESTONES.length
  );
}

/**
 * The giveFeedback mutation input for a modal submit. Same shape the
 * dictation-home modal submits, with empty comment/categories dropped.
 */
export function buildTalkFeedbackInput(
  action: Extract<DictationFeedbackAction, { type: "submit" }>,
  clientInfo: FeedbackClientInfo,
) {
  return {
    type: EnumFeedbackType.Feedback,
    category: TALK_FEEDBACK_PROPS.category,
    subcategory: action.categories.join(",") || undefined,
    isMarketingAllowed: action.canQuote,
    rating: action.rating,
    content: action.comment || undefined,
    appVersion: clientInfo.appVersion,
    os: clientInfo.os,
  };
}
