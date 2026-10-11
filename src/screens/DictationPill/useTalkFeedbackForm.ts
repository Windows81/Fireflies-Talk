import { useState } from "react";
import type { DictationFeedbackAction } from "electron/src/types";
import {
  buildFeedbackAction,
  feedbackCloseActions,
  isPositiveRating,
  quoteAllowed,
  type FeedbackStep,
} from "./dictationFeedback";

export type TalkFeedbackForm = {
  step: FeedbackStep;
  rating: number;
  comment: string;
  categories: Set<string>;
  canQuote: boolean;
  setComment: (comment: string) => void;
  toggleCategory: (category: string) => void;
  setCanQuote: (canQuote: boolean) => void;
  rate: (value: number) => void;
  share: () => DictationFeedbackAction;
  closeActions: () => DictationFeedbackAction[];
  reset: () => void;
};

export function useTalkFeedbackForm(): TalkFeedbackForm {
  const [step, setStep] = useState<FeedbackStep>("rating");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [canQuote, setCanQuote] = useState(false);

  const submitAction = () =>
    buildFeedbackAction(
      rating,
      comment,
      Array.from(categories),
      quoteAllowed(rating, canQuote),
    );

  return {
    step,
    rating,
    comment,
    categories,
    canQuote,
    setComment,
    toggleCategory: (category) => {
      setCategories((previous) => {
        const next = new Set(previous);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }
        return next;
      });
    },
    setCanQuote,
    rate: (value) => {
      // Low- and high-rating steps use different category sets.
      if (isPositiveRating(value) !== isPositiveRating(rating)) {
        setCategories(new Set());
      }
      setRating(value);
      setStep("details");
    },
    share: () => {
      const action = submitAction();
      setStep("thanks");
      return action;
    },
    closeActions: () => feedbackCloseActions(step, submitAction()),
    reset: () => {
      setStep("rating");
      setRating(0);
      setComment("");
      setCategories(new Set());
      setCanQuote(false);
    },
  };
}
