import { AutoJoin } from "@/constants";
import { GetWelcomeMeetingsDocument, type User } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useCallback } from "react";
import { useTeam } from "../team";
import { useSaveOptions } from "./useSaveOptions";

export const useUpdateOptionsAutoJoin = ({
  user,
  fromRef,
}: {
  user: User;
  fromRef?: string;
}) => {
  const autoJoin = user.autoJoin || AutoJoin.Manual;
  const isAutoJoinEnabled = autoJoin !== AutoJoin.Manual;

  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    errorMessage: "Could not save auto-join option",
    successMessage: "Auto-join setting saved successfully",
    onComplete(data) {
      if (!data.saveOptions?.autoJoin) return;
      tracker.track(TRACKING_EVENTS.AUTOJOIN_TOGGLE, {
        isActive:
          data.saveOptions.autoJoin === AutoJoin.Manual
            ? "disabled"
            : "enabled",
        settings: data.saveOptions.autoJoin,
        from: fromRef,
      });
    },
    user,
  });

  const updateAutojoin = useCallback(
    (newAutoJoin: string) => {
      updateOptions({
        variables: {
          autoJoin: newAutoJoin,
        },
        refetchQueries: [GetWelcomeMeetingsDocument],
      });
    },
    [updateOptions],
  );

  const toggleAutoJoin = useCallback(() => {
    if (isAutoJoinEnabled) {
      updateAutojoin(AutoJoin.Manual);
    } else {
      updateAutojoin(AutoJoin.Auto);
    }
  }, [isAutoJoinEnabled, updateAutojoin]);

  const { autoJoinSettingsLocked } = useTeam();

  return {
    isAutoJoinEnabled,
    toggleAutoJoin,
    autoJoin,
    updateAutojoin,
    loadingUpdateOptions,
    autoJoinSettingsLocked,
  };
};
