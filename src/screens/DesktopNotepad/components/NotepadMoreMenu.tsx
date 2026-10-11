import { IconMoreHorizontal, IconTrash } from "@/assets/svg";
import { MenuItem, MenuPopover } from "@/components/Menu";
import { createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useRef } from "react";
import { Pressable, type View } from "react-native";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { useNotepadMeetingActions } from "../hooks/useNotepadMeetingActions";
import { DeleteMeetingDialog } from "./DeleteMeeting/DeleteMeetingDialog";

export const NotepadMoreMenu = () => {
  const theme = useTheme();
  const { meeting } = useDesktopNotepadContext();
  const triggerRef = useRef<View>(null);

  const [isMenuOpen, openMenu, closeMenu] = useBooleanState(false);
  const [isDeleteOpen, openDelete, closeDelete] = useBooleanState(false);

  const { canDelete } = useNotepadMeetingActions();

  const onPressDelete = () => {
    closeMenu();
    openDelete();
  };

  // Delete is the only entry left now that download lives in the nav bar, so
  // without it the menu would open empty.
  if (!canDelete) return null;

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={styles.iconButton}
        onPress={openMenu}
        aria-label="More"
      >
        <IconMoreHorizontal
          width={20}
          height={20}
          color={theme.colors.commandNeutralDefault}
        />
      </Pressable>

      <MenuPopover
        isOpen={isMenuOpen}
        close={closeMenu}
        triggerRef={triggerRef}
        width={200}
      >
        <MenuItem
          label="Delete meeting"
          icon={
            <IconTrash
              width={16}
              height={16}
              color={theme.colors.commandNeutralDefault}
            />
          }
          onPress={onPressDelete}
        />
      </MenuPopover>

      <DeleteMeetingDialog
        meeting={meeting}
        isOpen={isDeleteOpen}
        close={closeDelete}
      />
    </>
  );
};

const styles = createStyles({
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
});
