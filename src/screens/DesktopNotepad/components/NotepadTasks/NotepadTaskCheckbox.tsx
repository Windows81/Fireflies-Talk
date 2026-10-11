import type { FC } from "react";
import { Pressable } from "react-native";
import { TaskCheckboxBox } from "./TaskCheckboxBox";

export const NotepadTaskCheckbox: FC<{
  checked?: boolean;
  hovered?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}> = ({ checked = false, hovered = false, disabled = false, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    hitSlop={8}
    aria-label="Task status"
  >
    <TaskCheckboxBox checked={checked} hovered={hovered} disabled={disabled} />
  </Pressable>
);
