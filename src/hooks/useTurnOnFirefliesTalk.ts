import { toast } from "@/components/Toast";
import { useUpdateDisableFirefliesTalkMutation } from "@/graphql";

/** Turns Fireflies Talk back on for the account and refreshes the policy data. */
export const useTurnOnFirefliesTalk = (): {
  turnOn: () => void;
  loading: boolean;
} => {
  const [updateDisableFirefliesTalk, { loading }] =
    useUpdateDisableFirefliesTalkMutation({
      refetchQueries: ["getCurrentUser"],
      awaitRefetchQueries: true,
      onError(error) {
        toast({
          title: "Couldn't turn on Fireflies Talk",
          message: error.message,
        });
      },
    });

  const turnOn = () => {
    updateDisableFirefliesTalk({
      variables: { metadata: { disableFirefliesTalk: false } },
    });
  };

  return { turnOn, loading };
};
