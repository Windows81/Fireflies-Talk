import {
  GetCurrentUserDocument,
  useGetCurrentUserQuery,
  useUpdateUserDynamicMetadataMutation,
  type GetCurrentUserQuery,
} from "@/graphql";
import { useAuth } from "@/features/auth";
import { useCallback, useState } from "react";
import { shouldShowTosUpdate } from "./tosUpdate";

export function useTosUpdate() {
  const user = useAuth((s) => s.user);
  const [accepted, setAccepted] = useState(false);

  const { data, loading } = useGetCurrentUserQuery({
    skip: !user,
    errorPolicy: "ignore",
    context: { silentErrors: true },
  });

  const querySucceeded = !!data?.user;

  const [updateDynamicMetadata] = useUpdateUserDynamicMetadataMutation({
    onError() {
      // Silently ignore – modal will re-appear on next session
    },
    context: { silentErrors: true },
  });

  const acceptTos = useCallback(() => {
    const acceptedAt = new Date().toISOString();
    setAccepted(true);
    updateDynamicMetadata({
      variables: {
        input: {
          flags: { hasAcceptedTosUpdate2: true },
          timestamps: { acceptedTosUpdate2At: acceptedAt },
        },
      },
      update(cache) {
        cache.updateQuery<GetCurrentUserQuery>(
          { query: GetCurrentUserDocument },
          (currentUserData) => {
            if (!currentUserData?.user) return currentUserData;

            return {
              ...currentUserData,
              user: {
                ...currentUserData.user,
                flags: currentUserData.user.flags
                  ? {
                      ...currentUserData.user.flags,
                      hasAcceptedTosUpdate2: true,
                    }
                  : {
                      __typename: "UserFlags",
                      hasAcceptedTosUpdate2: true,
                    },
              },
            };
          },
        );
      },
    });
  }, [updateDynamicMetadata]);

  return {
    acceptTos,
    shouldShow:
      !!user &&
      !loading &&
      querySucceeded &&
      !accepted &&
      shouldShowTosUpdate({
        hasAcceptedTosUpdate2: data?.user?.flags?.hasAcceptedTosUpdate2,
        createdAt: data?.user?.createdAt,
      }),
  };
}
