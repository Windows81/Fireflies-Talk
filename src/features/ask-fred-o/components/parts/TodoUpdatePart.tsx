import { IconListCheck } from "@/assets/svg";
import { useTheme } from "@/styles";
import type { TodoUpdatePartComponentProps } from "@firefliesai/fred-react";
import type { FC } from "react";
import { ExpandableRow } from "../primitives/ExpandableRow";

export const TodoUpdatePart: FC<TodoUpdatePartComponentProps> = () => {
  const theme = useTheme();

  return (
    <ExpandableRow
      icon={
        <IconListCheck width={16} height={16} color={theme.colors.textHint} />
      }
      label="Checked to-do list"
    />
  );
};
