import type { ShareDialogEmailProps } from "@/components/Share";
import { ShareDialog } from "@/components/Share";
import { toast } from "@/components/Toast";
import { Config } from "@/constants";
import { useAuth } from "@/features/auth";
import { useTeam } from "@/features/team";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import {
  useUpdateSoundbiteMutation,
  type Soundbite,
} from "@firefliesai/bites-ff.graphql-client";
import { useShareSoundbiteViaEmailMutation } from "@firefliesai/notifications-ff.graphql-client";
import { useCallback, useMemo, type FC } from "react";
import {
  BITE_PRIVACY_OPTIONS,
  fromSinglePrivacy,
  getSinglePrivacy,
} from "../constants/privacy";

export const BiteShareDialog: FC<{
  bite: Soundbite;
  isOpen: boolean;
  close: () => void;
}> = ({ bite, isOpen, close }) => {
  const { user } = useAuth();
  const { team } = useTeam();

  const [updateSoundbite, { loading: loadingUpdate }] =
    useUpdateSoundbiteMutation();

  const onPrivacyChange = useCallback(
    (privacy: string) => {
      const privacies = fromSinglePrivacy(privacy);

      updateSoundbite({
        variables: {
          id: bite.id,
          privacies,
        },
      });
      tracker.track(TRACKING_EVENTS.BITE_PRIVACY_UPDATED, {
        id: bite.id,
        previousPrivacy: bite.privacies.join(" "),
        privacy: privacies.join(" "),
        from: "bite-share-dialog",
      });
    },
    [bite, updateSoundbite],
  );
  const isBiteOwner = bite.userId === user?.id;

  const emails = useMemo(() => {
    return (team?.teammates?.map((t) => t?.email) || []).filter(
      Boolean,
    ) as string[];
  }, [team]);

  const profileMap = useMemo(() => {
    const o: NonNullable<ShareDialogEmailProps["profileMap"]> = {};
    team?.teammates?.forEach((t) => {
      o[t?.email as string] = {
        name: t?.name as string,
      };
    });
    return o;
  }, [team]);

  const [shareSoundbiteViaEmail, { loading: loadingShare }] =
    useShareSoundbiteViaEmailMutation({
      onError(err) {
        toast({
          title: "Could not share soundbite",
          message: err.message,
          type: "error",
        });
      },
      onCompleted() {
        toast({
          message: "Soundbite shared successfully",
          type: "success",
        });
        close();
      },
    });

  const onEmailsSubmit = useCallback(
    (selectedEmails: string[]) => {
      shareSoundbiteViaEmail({
        variables: {
          soundbiteId: bite.id,
          emails: selectedEmails,
        },
      });
    },
    [shareSoundbiteViaEmail, bite],
  );

  return (
    <ShareDialog
      isOpen={isOpen}
      close={close}
      title={bite.name}
      url={`${Config.DASHBOARD_URL}/soundbites/${bite.id}?utm_source=mobile_app`}
      privacyProps={{
        value: getSinglePrivacy(bite.privacies),
        onChange: onPrivacyChange,
        canChange: isBiteOwner,
        loading: loadingUpdate,
        options: BITE_PRIVACY_OPTIONS,
      }}
      emailProps={{
        suggestedEmails: emails,
        profileMap,
        onSubmit: onEmailsSubmit,
        loading: loadingShare,
      }}
    />
  );
};
