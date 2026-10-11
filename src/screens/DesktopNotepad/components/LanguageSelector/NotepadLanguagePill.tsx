import { MenuPopover } from "@/components/Menu";
import { useAuth } from "@/features/auth/store";
import { useGetLanguageNameByCode } from "@/features/language";
import { useBooleanState } from "@/utils/states";
import { useRef } from "react";
import type { View } from "react-native";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { getMeetingLanguageCode, isMeetingOwner } from "../../helpers/meeting";
import { NotepadHeaderPill } from "../NotepadHeaderPill";
import { NotepadLanguageMenu } from "./NotepadLanguageMenu";

export const NotepadLanguagePill = () => {
  const { user } = useAuth();
  const { meeting } = useDesktopNotepadContext();
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();

  const getLanguageNameByCode = useGetLanguageNameByCode();
  const languageCode = getMeetingLanguageCode(meeting);

  if (!languageCode) return null;

  const label = getLanguageNameByCode(languageCode);
  const canChange = isMeetingOwner(meeting, user);

  return (
    <>
      <NotepadHeaderPill
        label={label}
        onPress={canChange ? open : undefined}
        disabled={!canChange}
        active={isOpen}
        triggerRef={triggerRef}
      />

      {canChange && (
        <MenuPopover
          isOpen={isOpen}
          close={close}
          triggerRef={triggerRef}
          width={332}
          align="start"
        >
          <NotepadLanguageMenu meeting={meeting} close={close} />
        </MenuPopover>
      )}
    </>
  );
};
