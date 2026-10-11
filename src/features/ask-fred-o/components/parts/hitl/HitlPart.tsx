import { Text } from "@/components/Typography";
import type { HitlPartComponentProps } from "@firefliesai/fred-react";
import { useThread } from "@firefliesai/fred-react";
import type { FC } from "react";
import { useAskFredOSubmit } from "../../../hooks/useAskFredOSubmit";
import { AskQuestionPart } from "./AskQuestionPart";
import { HITL_INTERACTION_TYPE, serializeHitlResponse } from "./hitlContract";

export interface HitlRendererProps {
  payload: unknown;
  response?: unknown;
  disabled: boolean;
  dismissed: boolean;
  onRespond: (response: unknown) => void;
  onDismiss: () => void;
}

export const HitlPart: FC<HitlPartComponentProps> = ({
  interactionType,
  toolCallId,
  payload,
  response,
  message,
}) => {
  const { messages, dismissHitl, dismissedHitl } = useThread();
  const { isInteractionBlocked, submitHitlResponse } = useAskFredOSubmit();

  const latestMessageId = messages[messages.length - 1]?.id;
  const isStale =
    latestMessageId !== undefined && message.id !== latestMessageId;

  const onRespond = (value: unknown) => {
    void submitHitlResponse(toolCallId, value, serializeHitlResponse(value));
  };

  const onDismiss = () => dismissHitl(toolCallId);

  if (interactionType !== HITL_INTERACTION_TYPE.ASK_QUESTION) {
    return (
      <Text color="textHint" variant="body2Regular">
        Unsupported request from Fred: {interactionType}
      </Text>
    );
  }

  return (
    <AskQuestionPart
      payload={payload}
      response={response}
      disabled={isInteractionBlocked || isStale}
      dismissed={dismissedHitl.has(toolCallId)}
      onRespond={onRespond}
      onDismiss={onDismiss}
    />
  );
};
