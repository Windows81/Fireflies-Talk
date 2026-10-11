import { MenuPopover } from "@/components/Menu";
import {
  useCalendarEventPicker,
  type MeetingCalendarEventLink,
} from "@/features/calendar";
import { type Meeting } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { type FC, useRef } from "react";
import type { View } from "react-native";
import { PillButton } from "../../components/PillButton";
import { CalendarEventMenu } from "@/screens/DesktopNotepad/components/CalendarEvent/CalendarEventMenu";

export const CalendarEventPill: FC<{
  meeting: Meeting;
  calendarLink: MeetingCalendarEventLink;
}> = ({ meeting, calendarLink }) => {
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();
  const { events, isLoading, dateLabel } = useCalendarEventPicker(
    meeting.startTime,
  );
  const { connectedEventTitle, connectEvent, disconnectEvent } = calendarLink;

  return (
    <>
      <PillButton
        ref={triggerRef}
        label={dateLabel}
        onPress={open}
        active={isOpen}
      />
      <MenuPopover
        isOpen={isOpen}
        close={close}
        triggerRef={triggerRef}
        width={300}
        align="start"
      >
        <CalendarEventMenu
          events={events}
          isLoading={isLoading}
          selectedTitle={connectedEventTitle}
          onSelect={connectEvent}
          onDeselect={disconnectEvent}
        />
      </MenuPopover>
    </>
  );
};
