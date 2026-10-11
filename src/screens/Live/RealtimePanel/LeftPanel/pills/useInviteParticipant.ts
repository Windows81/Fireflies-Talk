import { toast } from "@/components/Toast";
import { useInviteTeammatesMutation } from "@/graphql";
import { useCallback, useState } from "react";

const INVITE_SOURCE = "desktop-live-participants";
const SUCCESS_MESSAGE = "Invitations sent!";

/**
 * Sends Fireflies team invites for non-teammate participants and tracks which
 * emails have already been invited so the UI can reflect a pending state.
 */
export const useInviteParticipant = (teamId?: string | null) => {
  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const [inviteMutation] = useInviteTeammatesMutation({
    onError(err) {
      toast({
        title: "Could not send invite",
        message: err.message,
        type: "error",
      });
    },
  });

  const invite = useCallback(
    async (email: string) => {
      if (!teamId || pendingEmail) return;
      setPendingEmail(email);
      try {
        const { data } = await inviteMutation({
          variables: { teamId, teamEmails: [email], source: INVITE_SOURCE },
        });
        // The server returns a human-readable string; anything other than the
        // success message is a soft failure we surface verbatim.
        const message = data?.inviteTeammates;
        if (message && message !== SUCCESS_MESSAGE) {
          toast({ message });
          return;
        }
        setInvitedEmails((prev) => new Set(prev).add(email.toLowerCase()));
        toast({ message: "Invitation sent!", type: "success" });
      } catch {
        // Network/GraphQL errors are surfaced by the mutation's onError handler.
      } finally {
        setPendingEmail(null);
      }
    },
    [teamId, pendingEmail, inviteMutation],
  );

  return { invite, invitedEmails, pendingEmail };
};
