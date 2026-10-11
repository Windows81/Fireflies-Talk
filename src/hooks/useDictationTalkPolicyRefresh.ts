import { useAuth } from "@/features/auth";
import { GetCurrentUserDocument, GetTeamDocument } from "@/graphql";
import { isMainDesktopWindow } from "@/utils/device";
import { useApolloClient } from "@apollo/client";
import { useWindowFocus } from "./useWindowFocus";

/**
 * Re-reads who has Talk turned off whenever the main desktop window regains
 * focus, so an admin's team-setting change doesn't wait for a restart. The
 * policy fails closed on errors, so refetch failures are swallowed.
 */
export function useDictationTalkPolicyRefresh(): void {
  const isSignedIn = Boolean(useAuth((s) => s.user));
  const client = useApolloClient();

  useWindowFocus(
    () => {
      if (!isSignedIn || !isMainDesktopWindow()) return;
      void client
        .refetchQueries({
          include: [GetCurrentUserDocument, GetTeamDocument],
        })
        .catch(() => {});
    },
    { throttleMs: 30_000 },
  );
}
