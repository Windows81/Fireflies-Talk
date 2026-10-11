import type { FC } from "react";
import { View } from "react-native";
import type { NotepadParticipant, NotepadTaskItem } from "../../helpers/tasks";
import { useRowHover } from "../../hooks/useRowHover";
import { NotepadTaskAssign } from "./NotepadTaskAssign";
import { NotepadTaskCheckbox } from "./NotepadTaskCheckbox";
import { NotepadTaskTitle } from "./NotepadTaskTitle";
import { taskRowStyles } from "./taskRowStyles";

export const NotepadTaskRow: FC<{
  task: NotepadTaskItem;
  completed: boolean;
  participants: NotepadParticipant[];
  canEdit: boolean;
  onToggle: (completed: boolean) => void;
  onAssign: (owner: NotepadParticipant | null) => void;
  onEditTitle: (title: string) => void;
}> = ({
  task,
  completed,
  participants,
  canEdit,
  onToggle,
  onAssign,
  onEditTitle,
}) => {
  const { ref, isHovered } = useRowHover();

  return (
    <View ref={ref} style={taskRowStyles.row}>
      <View style={taskRowStyles.leading}>
        <View style={taskRowStyles.checkboxWrap}>
          <NotepadTaskCheckbox
            checked={completed}
            hovered={isHovered}
            onPress={() => onToggle(!completed)}
          />
        </View>
        <NotepadTaskTitle
          title={task.title}
          completed={completed}
          hovered={isHovered}
          editable={canEdit}
          onSave={onEditTitle}
        />
      </View>
      <View style={taskRowStyles.actions}>
        <NotepadTaskAssign
          task={task}
          participants={participants}
          completed={completed}
          rowHovered={isHovered}
          canAssign={canEdit}
          onAssign={onAssign}
        />
      </View>
    </View>
  );
};
