import { toast } from "@/components/Toast";
import type { SaveOptionsMutation, User } from "@/graphql";
import { useSaveOptionsMutation } from "@/graphql";

export const useSaveOptions = ({
  successMessage,
  errorMessage,
  onComplete,
  user,
}: {
  successMessage: string;
  errorMessage: string;
  onComplete?: (data: SaveOptionsMutation) => void;
  user: User;
}) => {
  const [updateOptions, { loading: loadingUpdateOptions }] =
    useSaveOptionsMutation({
      onCompleted(data) {
        toast({
          message: data.saveOptions?.message || successMessage,
          type: "success",
        });
        onComplete?.(data);
      },
      onError(err) {
        toast({
          title: errorMessage,
          message: err.message,
        });
      },
      optimisticResponse({
        autoJoin,
        sendNotesTo,
        preferredLanguage,
        privacy,
        dispatch,
        recordingNoti,
        industry,
      }) {
        return {
          saveOptions: {
            ...user,
            message: "",
            ...(autoJoin && {
              autoJoin,
            }),
            ...(sendNotesTo && {
              sendNotesTo,
            }),
            ...(preferredLanguage && {
              preferredLanguage,
            }),
            ...(privacy && {
              privacy,
            }),
            ...(dispatch && {
              dispatch,
            }),
            ...(recordingNoti && {
              recordingNoti,
            }),
            ...(industry && {
              industry,
            }),
          },
        };
      },
    });

  return {
    updateOptions,
    loadingUpdateOptions,
  };
};
