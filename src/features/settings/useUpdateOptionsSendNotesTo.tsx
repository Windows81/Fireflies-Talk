import { SendNotesTo } from "@/constants";
import type { User } from "@/graphql";
import { useCallback } from "react";
import { useTeam } from "../team";
import { useSaveOptions } from "./useSaveOptions";

export const useUpdateOptionsSendNotesTo = ({ user }: { user: User }) => {
  const sendNotesTo = (user.sendNotesTo || SendNotesTo.Me) as SendNotesTo;

  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    errorMessage: "Could not save auto-join option",
    successMessage: "Meeting recap setting saved successfully",
    user,
  });

  const updateSendNotesTo = useCallback(
    (newSendNotesTo: SendNotesTo) => {
      updateOptions({
        variables: {
          sendNotesTo: newSendNotesTo,
        },
      });
    },
    [updateOptions],
  );

  const { team, isAdmin } = useTeam();

  const sendNotesToSettingsLocked = !!team?.settings?.sendNotesTo && !isAdmin;

  return {
    sendNotesTo,
    updateSendNotesTo,
    loadingUpdateOptions,
    sendNotesToSettingsLocked,
  };
};
