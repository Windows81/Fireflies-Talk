import { Select } from "@/components/Input";
import { Text } from "@/components/Typography";
import { AI_MODELS } from "@/constants";
import { createStyles } from "@/styles";
import type { FC } from "react";

export const AskFredAiModelSelect: FC<{
  aiModel: string;
  setAiModel: (model: string) => void;
}> = ({ aiModel, setAiModel }) => {
  return (
    <Select
      options={AI_MODELS.map((model) => ({
        label: (
          <>
            <Text>{model.name}</Text>{" "}
            <Text color="textMuted">({model.credits})</Text>
          </>
        ),
        value: model.value,
      }))}
      value={aiModel}
      onValueChange={setAiModel}
      renderCurrentOption={(option) =>
        AI_MODELS.find((m) => m.value === option.value)?.short
      }
      style={styles.select}
      size="sm"
    />
  );
};

const styles = createStyles({
  select: {
    width: 156,
  },
});
