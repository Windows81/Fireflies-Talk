import { FeedbackModal } from "@/screens/Feedback/FeedbackModal";
import type { FC } from "react";
import { useCallback } from "react";
import { NUDGE_FEEDBACK_CATEGORIES } from "./constants";
import { feedbackNudgeApi } from "./feedback-nudge.store";

interface FeedbackNudgeModalProps {
  isOpen: boolean;
  close: () => void;
}

export const FeedbackNudgeModal: FC<FeedbackNudgeModalProps> = ({
  isOpen,
  close,
}) => {
  const handleDismiss = useCallback(() => {
    feedbackNudgeApi.markDismissed();
    close();
  }, [close]);

  const handleShare = useCallback(() => {
    feedbackNudgeApi.markSubmitted();
    close();
  }, [close]);

  return (
    <FeedbackModal
      isOpen={isOpen}
      close={handleDismiss}
      onShare={handleShare}
      category="Desktop App (Nudge)"
      title="How's your experience with Fireflies?"
      description="Your feedback helps us make Fireflies better for everyone."
      feedbackCategories={NUDGE_FEEDBACK_CATEGORIES}
    />
  );
};
