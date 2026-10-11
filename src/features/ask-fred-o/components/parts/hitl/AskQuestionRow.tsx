import { TextInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { AskQuestionOptionRow } from "./AskQuestionOptionRow";
import type { AskQuestion } from "./hitlContract";
import { OTHER_OPTION_ID } from "./hitlContract";

interface AskQuestionRowProps {
  question: AskQuestion;
  selected: string[];
  otherText: string;
  disabled: boolean;
  onToggleOption: (
    questionId: string,
    optionId: string,
    allowMultiple: boolean,
  ) => void;
  onOtherTextChange: (questionId: string, value: string) => void;
}

export const AskQuestionRow: FC<AskQuestionRowProps> = ({
  question,
  selected,
  otherText,
  disabled,
  onToggleOption,
  onOtherTextChange,
}) => {
  const theme = useTheme();
  const allowMultiple = question.allow_multiple ?? false;

  const toggle = (optionId: string) =>
    onToggleOption(question.id, optionId, allowMultiple);
  const changeOther = (value: string) => onOtherTextChange(question.id, value);

  return (
    <View style={styles.question}>
      <Text color="textPrimary" variant="body2Weight">
        {question.prompt}
      </Text>

      <View
        accessibilityRole={allowMultiple ? undefined : "radiogroup"}
        accessibilityLabel={allowMultiple ? undefined : question.prompt}
      >
        {question.options.map((option) => (
          <AskQuestionOptionRow
            key={option.id}
            optionId={option.id}
            label={option.label}
            checked={selected.includes(option.id)}
            allowMultiple={allowMultiple}
            disabled={disabled}
            onToggle={toggle}
          />
        ))}

        <AskQuestionOptionRow
          optionId={OTHER_OPTION_ID}
          label="Other"
          checked={selected.includes(OTHER_OPTION_ID)}
          allowMultiple={allowMultiple}
          disabled={disabled}
          onToggle={toggle}
        />
      </View>

      <TextInput
        style={styles.otherInput(theme)}
        placeholder="Type your own answer"
        value={otherText}
        disabled={disabled || !selected.includes(OTHER_OPTION_ID)}
        onValueChange={changeOther}
      />
    </View>
  );
};

const styles = createStyles({
  question: {
    flexDirection: "column",
    gap: 4,
  },
  otherInput: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 8,
    marginTop: 4,
  }),
});
