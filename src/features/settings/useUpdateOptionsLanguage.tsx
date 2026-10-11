import type { User } from "@/graphql";
import { useCallback } from "react";
import { useSaveOptions } from "./useSaveOptions";
import { setLocalUserFlag } from "../user-flags";

export const useUpdateOptionsLanguage = ({ user }: { user: User }) => {
  const language = user.preferredLanguage || "en";

  const { updateOptions, loadingUpdateOptions } = useSaveOptions({
    errorMessage: "Could not save language option",
    successMessage: "Meeting language saved successfully",
    user,
  });

  const updateLanguage = useCallback(
    (newLanguage: string) => {
      setLocalUserFlag("record.language-select-prompt.shown", false);
      updateOptions({
        variables: {
          preferredLanguage: newLanguage,
        },
      });
    },
    [updateOptions],
  );

  return {
    language,
    updateLanguage,
    loadingUpdateOptions,
  };
};
