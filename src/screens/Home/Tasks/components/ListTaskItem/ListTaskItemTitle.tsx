import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { type FC } from "react";

export const ListTaskItemTitle: FC<{
  title: string;
  completed: boolean;
}> = ({ title, completed }) => {
  return (
    <Text
      variant="body2Regular"
      color={completed ? "textHint" : "textSecondary"}
      numberOfLines={2}
      style={[styles.title, completed && styles.titleCompleted]}
    >
      {title}
    </Text>
  );
};

const styles = createStyles({
  title: {
    width: "100%",
    textAlignVertical: "center",
    verticalAlign: "bottom",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
  },
});
