import { MenuPopover } from "@/components/Menu";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useRef, useState, type FC } from "react";
import { Pressable, TextInput, View } from "react-native";
import {
  getTaskAssigneeLabel,
  type NotepadParticipant,
  type NotepadTaskItem,
} from "../../helpers/tasks";
import { NotepadAssigneeList } from "./NotepadAssigneeList";
import { NotepadTaskAssignee } from "./NotepadTaskAssignee";

export const NotepadTaskAssign: FC<{
  task: NotepadTaskItem;
  participants: NotepadParticipant[];
  completed: boolean;
  rowHovered: boolean;
  canAssign: boolean;
  onAssign: (owner: NotepadParticipant | null) => void;
}> = ({ task, participants, completed, rowHovered, canAssign, onAssign }) => {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const assignee = getTaskAssigneeLabel(task);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (owner: NotepadParticipant | null) => {
    onAssign(owner);
    close();
  };

  const openEditor = () => {
    setQuery("");
    setOpen(true);
  };

  // Non-owners see a read-only pill (or nothing when unassigned).
  if (!canAssign) {
    return assignee ? (
      <NotepadTaskAssignee label={assignee} dimmed={completed} />
    ) : null;
  }

  // The @assign trigger stays mounted and reserves its space; only its
  // visibility toggles on hover. Mounting/unmounting it caused the pointer to
  // land on a shifting target and flicker the reveal.
  const assignVisible = rowHovered || open;

  return (
    <>
      <View ref={triggerRef}>
        {open ? (
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            onBlur={() => setTimeout(close, 150)}
            placeholder="@assign"
            placeholderTextColor={theme.colors.commandHintHover}
            style={[styles.input(theme), { outlineStyle: "none" } as object]}
          />
        ) : assignee ? (
          <NotepadTaskAssignee
            label={assignee}
            dimmed={completed}
            onPress={openEditor}
            onRemove={() => onAssign(null)}
          />
        ) : (
          <Pressable
            style={[styles.assignPill(theme), !assignVisible && styles.hidden]}
            onPress={openEditor}
          >
            <Text variant="body2Regular" color="commandHintHover">
              @assign
            </Text>
          </Pressable>
        )}
      </View>
      <MenuPopover
        isOpen={open}
        close={close}
        triggerRef={triggerRef}
        width={176}
        placement="bottom"
        disableBackdrop
      >
        <NotepadAssigneeList
          participants={participants}
          query={query}
          showUnassign={!!assignee}
          onSelect={select}
        />
      </MenuPopover>
    </>
  );
};

const styles = createStyles({
  assignPill: (theme) => ({
    maxWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  hidden: {
    opacity: 0,
  },
  input: (theme) => ({
    width: 120,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    color: theme.colors.commandNeutralDefault,
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
});
