import { IconSparkle } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import type { ReasoningPartComponentProps } from "@firefliesai/fred-react";
import type { FC } from "react";
import { useAutoExpand } from "../../hooks/useAutoExpand";
import { ExpandableRow } from "../primitives/ExpandableRow";

export const ReasoningPart: FC<ReasoningPartComponentProps> = ({
  text,
  message,
}) => {
  const theme = useTheme();
  const isProcessing = message.status === "processing";
  const [isOpen, setIsOpen] = useAutoExpand(isProcessing);

  if (!text) return null;

  return (
    <ExpandableRow
      icon={
        <IconSparkle width={16} height={16} color={theme.colors.textHint} />
      }
      label={isProcessing ? "Reasoning…" : "Reasoning"}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Text color="textHint" variant="body2Regular">
        {text}
      </Text>
    </ExpandableRow>
  );
};
