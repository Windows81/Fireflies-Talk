import { IconFileText } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import type { ContextSummarizedPartComponentProps } from "@firefliesai/fred-react";
import type { FC } from "react";
import { ExpandableRow } from "../primitives/ExpandableRow";

export const ContextSummarizedPart: FC<ContextSummarizedPartComponentProps> = ({
  inProgress,
  summary,
  isError,
}) => {
  const theme = useTheme();
  const icon = (
    <IconFileText width={16} height={16} color={theme.colors.textHint} />
  );

  if (isError) {
    return <ExpandableRow icon={icon} label="Could not summarise the chat" />;
  }

  const label = inProgress ? "Summarising chat…" : "Chat has been summarised";

  if (inProgress || !summary) {
    return <ExpandableRow icon={icon} label={label} />;
  }

  return (
    <ExpandableRow icon={icon} label={label}>
      <Text color="textHint" variant="body2Regular">
        {summary}
      </Text>
    </ExpandableRow>
  );
};
