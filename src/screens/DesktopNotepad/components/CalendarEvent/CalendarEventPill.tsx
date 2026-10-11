import { MenuPopover } from "@/components/Menu";
import { useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useRef } from "react";
import type { View } from "react-native";
import { NotepadHeaderPill } from "../NotepadHeaderPill";
import { CalendarEventMenu } from "./CalendarEventMenu";
import { useCalendarEventConnection } from "./useCalendarEventConnection";

export const CalendarEventPill = () => {
  const theme = useTheme();
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();

  const {
    events,
    isLoading,
    connectedEventTitle,
    connectEvent,
    disconnectEvent,
    dateLabel,
  } = useCalendarEventConnection();

  const handleSelect = (event: Parameters<typeof connectEvent>[0]) => {
    connectEvent(event);
  };

  const handleDeselect = () => {
    disconnectEvent();
  };

  return (
    <>
      <NotepadHeaderPill
        label={dateLabel}
        onPress={open}
        active={isOpen}
        triggerRef={triggerRef}
      />

      <MenuPopover
        isOpen={isOpen}
        close={close}
        triggerRef={triggerRef}
        width={300}
        align="start"
        style={{ backgroundColor: theme.colors.layerMuted }}
      >
        <CalendarEventMenu
          events={events}
          isLoading={isLoading}
          selectedTitle={connectedEventTitle}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
        />
      </MenuPopover>
    </>
  );
};
