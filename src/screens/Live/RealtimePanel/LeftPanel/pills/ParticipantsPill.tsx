import { MenuPopover } from "@/components/Menu";
import { getParticipantsLabel } from "@/screens/DesktopNotepad/helpers/meeting";
import { useTeam } from "@/features/team";
import { type Meeting } from "@/graphql";
import { useBooleanState } from "@/utils/states";
import { type FC, useMemo, useRef } from "react";
import type { View } from "react-native";
import { PillButton } from "../../components/PillButton";
import { ParticipantsList } from "./ParticipantsList";
import { getMeetingParticipants, type TeamMemberInfo } from "./participants";
import { useInviteParticipant } from "./useInviteParticipant";

export const ParticipantsPill: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const triggerRef = useRef<View>(null);
  const [isOpen, open, close] = useBooleanState();
  const { team } = useTeam();
  const { invite, invitedEmails, pendingEmail } = useInviteParticipant(
    team?._id,
  );

  // Map teammate emails to their account name/picture so attendees who are on
  // the Fireflies team show their profile instead of a bare calendar email.
  const teamByEmail = useMemo(() => {
    const map = new Map<string, TeamMemberInfo>();
    for (const teammate of team?.teammates ?? []) {
      const email = (
        teammate?.profile?.email || teammate?.email
      )?.toLowerCase();
      if (!email) continue;
      map.set(email, {
        name: teammate?.profile?.name || teammate?.name,
        picture: teammate?.profile?.picture,
      });
    }
    return map;
  }, [team]);

  const participants = useMemo(
    () => getMeetingParticipants(meeting, teamByEmail),
    [meeting, teamByEmail],
  );
  const label = getParticipantsLabel(meeting);

  return (
    <>
      <PillButton
        ref={triggerRef}
        label={label}
        onPress={open}
        active={isOpen}
      />
      <MenuPopover
        isOpen={isOpen}
        close={close}
        triggerRef={triggerRef}
        width={224}
      >
        <ParticipantsList
          participants={participants}
          invite={{ invitedEmails, pendingEmail, onInvite: invite }}
        />
      </MenuPopover>
    </>
  );
};
