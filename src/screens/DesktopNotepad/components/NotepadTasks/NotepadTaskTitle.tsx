import { Text } from "@/components/Typography";
import { createStyles, FontStyles, useTheme } from "@/styles";
import { useState, type FC } from "react";
import { Pressable, TextInput } from "react-native";

const TASK_TITLE_LINE_HEIGHT = 28;

export const NotepadTaskTitle: FC<{
  title: string;
  completed: boolean;
  hovered: boolean;
  editable: boolean;
  onSave: (title: string) => void;
}> = ({ title, completed, hovered, editable, onSave }) => {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  // Auto-grow for wrapped titles; never go below the display line height.
  const [height, setHeight] = useState(TASK_TITLE_LINE_HEIGHT);

  const save = () => {
    onSave(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <TextInput
        autoFocus
        multiline
        value={value}
        onChangeText={setValue}
        onBlur={save}
        onContentSizeChange={(e) =>
          setHeight(
            Math.max(e.nativeEvent.contentSize.height, TASK_TITLE_LINE_HEIGHT),
          )
        }
        // Titles are single-line semantically; Enter saves instead of inserting a newline.
        onKeyPress={(e) => {
          if (e.nativeEvent.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        style={[
          FontStyles.body1LongRegular,
          styles.input(theme),
          {
            height: Math.max(height, TASK_TITLE_LINE_HEIGHT),
            minHeight: TASK_TITLE_LINE_HEIGHT,
          },
          { outlineStyle: "none" } as object,
        ]}
      />
    );
  }

  return (
    <Pressable
      style={styles.pressable}
      disabled={!editable}
      onPress={() => {
        setValue(title);
        setHeight(TASK_TITLE_LINE_HEIGHT);
        setEditing(true);
      }}
    >
      <Text
        variant="body1LongRegular"
        color={
          completed
            ? "textDisabled"
            : hovered
              ? "commandNeutralHover"
              : "commandNeutralDefault"
        }
        style={completed ? styles.completed : undefined}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = createStyles({
  pressable: {
    flex: 1,
  },
  input: (theme) => ({
    flex: 1,
    minWidth: 0,
    padding: 0,
    margin: 0,
    color: theme.colors.commandNeutralDefault,
  }),
  completed: {
    textDecorationLine: "line-through",
  },
});
