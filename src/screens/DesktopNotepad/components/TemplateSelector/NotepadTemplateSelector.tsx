import { IconChevronDown, IconList } from "@/assets/svg";
import { MenuPopover } from "@/components/Menu";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth/store";
import { createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useRef } from "react";
import type { View } from "react-native";
import { Pressable } from "react-native";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { isMeetingOwner } from "../../helpers/meeting";
import { NotepadTemplateMenu } from "./NotepadTemplateMenu";
import { useNotepadTemplates } from "./useNotepadTemplates";

export const NotepadTemplateSelector = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { meeting } = useDesktopNotepadContext();
  const canEdit = isMeetingOwner(meeting, user);

  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();

  const {
    categories,
    isGeneralSelected,
    selectedTemplateId,
    selectedTitle,
    applyTemplate,
  } = useNotepadTemplates(meeting.id);

  const select = (templateId: string | null) => {
    close();
    applyTemplate(templateId);
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={canEdit ? open : undefined}
        disabled={!canEdit}
        style={styles.trigger}
      >
        <IconList
          width={20}
          height={20}
          color={theme.colors.commandNeutralDefault}
        />
        <Text variant="body1Regular" color="commandNeutralDefault">
          {selectedTitle}
        </Text>
        {canEdit && (
          <IconChevronDown
            width={16}
            height={16}
            color={theme.colors.commandNeutralDefault}
          />
        )}
      </Pressable>

      {canEdit && (
        <MenuPopover
          isOpen={isOpen}
          close={close}
          triggerRef={triggerRef}
          width={240}
        >
          <NotepadTemplateMenu
            categories={categories}
            isGeneralSelected={isGeneralSelected}
            selectedTemplateId={selectedTemplateId}
            onSelect={select}
          />
        </MenuPopover>
      )}
    </>
  );
};

const styles = createStyles({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
});
