import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useState, type FC } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRowHover } from "../../hooks/useRowHover";
import { NotepadTaskCheckbox } from "./NotepadTaskCheckbox";
import { taskRowStyles } from "./taskRowStyles";

const ADD_TASK_LABEL = "Add Task";

export const NotepadAddTaskRow: FC<{ onCreate: (title: string) => void }> = ({
  onCreate,
}) => {
  const theme = useTheme();
  const { ref } = useRowHover();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onCreate(trimmed);
    setValue("");
    setEditing(false);
  };

  return (
    <View ref={ref} style={taskRowStyles.row}>
      <View style={taskRowStyles.checkboxWrap}>
        <NotepadTaskCheckbox disabled />
      </View>
      <View style={styles.field}>
        {editing ? (
          <TextInput
            style={[styles.input(theme), { outlineStyle: "none" } as object]}
            value={value}
            onChangeText={setValue}
            onBlur={submit}
            placeholder={ADD_TASK_LABEL}
            placeholderTextColor={theme.colors.textHint}
            autoFocus
          />
        ) : (
          <Pressable style={styles.pressable} onPress={() => setEditing(true)}>
            <Text variant="body1LongRegular" color="textHint">
              {ADD_TASK_LABEL}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  field: {
    flex: 1,
    minWidth: 0,
  },
  pressable: {
    width: "100%",
  },
  input: (theme) => ({
    width: "100%",
    minWidth: 0,
    fontSize: 16,
    lineHeight: 28,
    color: theme.colors.commandNeutralDefault,
    padding: 0,
    outlineWidth: 0,
  }),
});
