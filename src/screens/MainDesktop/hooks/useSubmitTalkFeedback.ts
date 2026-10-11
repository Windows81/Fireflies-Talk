import { useAuth } from "@/features/auth";
import { useDictationFeedbackNudge } from "@/features/dictation-feedback-nudge";
import {
  useGiveFeedbackMutation,
  useUpdateUserDynamicMetadataMutation,
} from "@/graphql";
import { toast } from "@/components/Toast";
import { useFeedbackClientInfo } from "@/hooks/useFeedbackClientInfo";
import { Logger } from "@/logger";
import { buildTalkFeedbackInput } from "@/screens/MainDesktop/components/talkFeedback";
import type { DictationFeedbackAction } from "electron/src/types";
import { useCallback, useRef } from "react";

const logger = new Logger("dictation-feedback-nudge");

type SubmitAction = Extract<DictationFeedbackAction, { type: "submit" }>;

export function useSubmitTalkFeedback(): (action: SubmitAction) => void {
  const clientInfo = useFeedbackClientInfo();
  const markNudgeCompleted = useDictationFeedbackNudge(
    (state) => state.markNudgeCompleted,
  );
  const [giveFeedback] = useGiveFeedbackMutation({
    onError() {
      toast({ message: "Could not submit feedback", type: "error" });
    },
  });
  const [updateDynamicMetadata] = useUpdateUserDynamicMetadataMutation({
    onError(error) {
      logger.warn("failed to persist nudge metadata", { error: `${error}` });
    },
    context: { silentErrors: true },
  });

  const actionsRef = useRef({
    clientInfo,
    giveFeedback,
    markNudgeCompleted,
    updateDynamicMetadata,
  });
  actionsRef.current = {
    clientInfo,
    giveFeedback,
    markNudgeCompleted,
    updateDynamicMetadata,
  };

  return useCallback((action: SubmitAction) => {
    const userId = useAuth.getState().user?.id;
    const {
      clientInfo: info,
      giveFeedback: submit,
      markNudgeCompleted: markCompleted,
    } = actionsRef.current;

    submit({
      variables: { input: buildTalkFeedbackInput(action, info) },
      onCompleted: () => {
        if (!userId) return;
        markCompleted(userId);
        if (useAuth.getState().user?.id !== userId) return;
        actionsRef.current.updateDynamicMetadata({
          variables: {
            input: { flags: { completedTalkFeedbackNudge: true } },
          },
        });
      },
    });
  }, []);
}
