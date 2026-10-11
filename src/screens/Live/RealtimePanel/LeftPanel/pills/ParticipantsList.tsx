import { Avatar } from "@/components/Avatar";
import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { Pressable, ScrollView } from "react-native";
import { type ParticipantInfo } from "./participants";

export interface InviteControls {
  invitedEmails: Set<string>;
  pendingEmail: string | null;
  onInvite: (email: string) => void;
}

const InviteAction: FC<{ email: string; invite: InviteControls }> = ({
  email,
  invite,
}) => {
  const { isHovered, webHoverProps } = useWebHover();

  if (invite.invitedEmails.has(email.toLowerCase())) {
    return (
      <Text variant="body2Regular" color="textMuted">
        Invited
      </Text>
    );
  }

  const isPending = invite.pendingEmail?.toLowerCase() === email.toLowerCase();

  return (
    <Pressable
      disabled={isPending}
      onPress={() => invite.onInvite(email)}
      {...webHoverProps}
    >
      <Text
        variant="body2Weight"
        color="textBrand"
        style={isHovered ? styles.inviteHover : undefined}
      >
        {isPending ? "Inviting…" : "Invite"}
      </Text>
    </Pressable>
  );
};

const ParticipantRow: FC<{
  participant: ParticipantInfo;
  invite: InviteControls;
}> = ({ participant, invite }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      style={[styles.row, isHovered && styles.rowHover(theme)]}
      {...webHoverProps}
    >
      <Avatar
        size={24}
        shape="square"
        name={participant.name}
        picture={participant.picture}
      />
      <Text
        variant="body2Regular"
        color="textPrimary"
        numberOfLines={1}
        style={styles.label}
      >
        {participant.name}
      </Text>
      {participant.inviteEmail ? (
        <InviteAction email={participant.inviteEmail} invite={invite} />
      ) : null}
    </Pressable>
  );
};

export const ParticipantsList: FC<{
  participants: ParticipantInfo[];
  invite: InviteControls;
}> = ({ participants, invite }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {participants.map((participant) => (
        <ParticipantRow
          key={participant.key}
          participant={participant}
          invite={invite}
        />
      ))}
    </ScrollView>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rowHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  label: {
    flex: 1,
  },
  inviteHover: {
    textDecorationLine: "underline",
  },
});
