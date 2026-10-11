import { IconCheckCircle, IconHelpCircle, IconMinus } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";
import type { HitlRendererProps } from "./HitlPart";
import { AskQuestionRow } from "./AskQuestionRow";
import type {
  AskQuestionOtherText,
  AskQuestionSelections,
} from "./answerSummary";
import { buildAnswerSummary, canSubmitAnswers } from "./answerSummary";
import type { AskQuestionPayload } from "./hitlContract";
import { isAskQuestionPayload, serializeHitlResponse } from "./hitlContract";

const CardShell: FC<{ title?: string; children: ReactNode }> = ({
  title,
  children,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.card(theme)}>
      <View style={styles.cardHeader}>
        <IconHelpCircle width={18} height={18} color={theme.colors.textBrand} />
        <Text color="textPrimary" variant="label2Weight">
          {title ?? "Fred needs your input"}
        </Text>
      </View>
      {children}
    </View>
  );
};

export const AskQuestionPart: FC<HitlRendererProps> = ({
  payload,
  response,
  disabled,
  dismissed,
  onRespond,
  onDismiss,
}) => {
  const theme = useTheme();
  const [selections, setSelections] = useState<AskQuestionSelections>({});
  const [otherText, setOtherText] = useState<AskQuestionOtherText>({});

  const questionPayload: AskQuestionPayload | null = isAskQuestionPayload(
    payload,
  )
    ? payload
    : null;

  if (!questionPayload) {
    return (
      <Text color="textHint" variant="body2Regular">
        Could not render the request.
      </Text>
    );
  }

  if (response != null && response !== "") {
    return (
      <CardShell title={questionPayload.title}>
        <View style={styles.outcome(theme)}>
          <IconCheckCircle
            width={18}
            height={18}
            color={theme.colors.informationInteractiveGreenDefault}
          />
          <Text color="textSecondary" variant="body2Regular">
            {serializeHitlResponse(response)}
          </Text>
        </View>
      </CardShell>
    );
  }

  if (dismissed) {
    return (
      <CardShell title={questionPayload.title}>
        <View style={styles.outcome(theme)}>
          <IconMinus width={18} height={18} color={theme.colors.textHint} />
          <Text color="textHint" variant="body2Regular">
            Skipped — ask Fred something else.
          </Text>
        </View>
      </CardShell>
    );
  }

  const toggleOption = (
    questionId: string,
    optionId: string,
    allowMultiple: boolean,
  ) => {
    setSelections((previous) => {
      const current = previous[questionId] ?? [];
      if (!allowMultiple) return { ...previous, [questionId]: [optionId] };

      return {
        ...previous,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const changeOtherText = (questionId: string, value: string) => {
    setOtherText((previous) => ({ ...previous, [questionId]: value }));
  };

  const canSubmit = canSubmitAnswers(
    questionPayload.questions,
    selections,
    otherText,
  );

  const onSubmit = () => {
    if (disabled || !canSubmit) return;
    onRespond(
      buildAnswerSummary(questionPayload.questions, selections, otherText),
    );
  };

  return (
    <CardShell title={questionPayload.title}>
      {questionPayload.questions.map((question) => (
        <AskQuestionRow
          key={question.id}
          question={question}
          selected={selections[question.id] ?? []}
          otherText={otherText[question.id] ?? ""}
          disabled={disabled}
          onToggleOption={toggleOption}
          onOtherTextChange={changeOtherText}
        />
      ))}

      <View style={styles.actions}>
        <Button size="sm" disabled={disabled || !canSubmit} onPress={onSubmit}>
          Submit
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          onPress={onDismiss}
        >
          Skip & ask something else
        </Button>
      </View>
    </CardShell>
  );
};

const styles = createStyles({
  card: (theme) => ({
    flexDirection: "column",
    gap: 12,
    backgroundColor: theme.colors.layerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
  }),
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  outcome: (theme) => ({
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 8,
    padding: 12,
  }),
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
});
