import { useApolloClient } from "@apollo/client";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  type CoreUserFieldsFragment,
  GetCurrentUserDocument,
  GetTeamDocument,
  type GetCurrentUserQuery,
} from "@/graphql";
import { useLatestRef } from "@/hooks/useLatestRef";
import { open3dsRedirect } from "./open3dsRedirect";

/** How often we re-check the user query while waiting for 3DS to complete. */
const POLL_INTERVAL_MS = 3_000;
/** Give up waiting after ~5 minutes; Stripe redirects usually resolve in < 60s. */
const POLL_TIMEOUT_MS = 5 * 60 * 1_000;

const hasActiveSubscription = (
  user: CoreUserFieldsFragment | null | undefined,
): boolean => Boolean(user?.stripeSubscriptionId);

interface UseThreeDsCompletionArgs {
  onCompleted: (planNickname?: string) => void;
  onTimeout?: (message: string) => void;
}

interface UseThreeDsCompletionReturn {
  pending: boolean;
  start: (redirectUrl: string) => void;
  retry: () => void;
  cancel: () => void;
}

/**
 * Orchestrates Stripe's 3DS authentication flow for any mutation that can
 * return `{ is3ds: true, redirectUrl }`:
 *
 *   1. Open the bank's `redirectUrl` in a popup/new window via `open3dsRedirect`.
 *   2. Poll the current-user query until `stripeSubscriptionId` is set (the
 *      Stripe webhook fires server-side once authentication succeeds).
 *   3. Refetch the team and notify the caller via `onCompleted`.
 */
export function useThreeDsCompletion({
  onCompleted,
  onTimeout,
}: UseThreeDsCompletionArgs): UseThreeDsCompletionReturn {
  const apollo = useApolloClient();

  const [pending, setPending] = useState(false);
  const redirectUrlRef = useRef<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const onCompletedRef = useLatestRef(onCompleted);
  const onTimeoutRef = useLatestRef(onTimeout);

  // Cancel any in-flight poll when the consuming component unmounts so we
  // stop firing GraphQL queries and never invoke a stale callback.
  useEffect(() => () => stopRef.current?.(), []);

  const start = useCallback(
    (redirectUrl: string) => {
      stopRef.current?.();
      redirectUrlRef.current = redirectUrl;
      open3dsRedirect(redirectUrl);
      setPending(true);

      let stopped = false;
      const startedAt = Date.now();

      const stop = () => {
        stopped = true;
        stopRef.current = null;
      };

      const tick = async () => {
        if (stopped) return;

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stop();
          setPending(false);
          onTimeoutRef.current?.(
            "We didn't detect a successful authentication. Please try again.",
          );
          return;
        }

        try {
          const { data } = await apollo.query<GetCurrentUserQuery>({
            query: GetCurrentUserDocument,
            fetchPolicy: "network-only",
          });
          if (hasActiveSubscription(data?.user)) {
            stop();
            await apollo.query({
              query: GetTeamDocument,
              fetchPolicy: "network-only",
            });
            await apollo.reFetchObservableQueries();
            setPending(false);
            onCompletedRef.current(data?.user?.paidUser ?? undefined);
            return;
          }
        } catch (error) {
          console.error("Error fetching current user", error);
          stop();
          setPending(false);
          onTimeoutRef.current?.(
            "We didn't detect a successful authentication. Please try again.",
          );
          return;
        }

        if (!stopped) setTimeout(tick, POLL_INTERVAL_MS);
      };

      stopRef.current = stop;
      // Wait one interval before the first poll so the webhook has a chance to land.
      setTimeout(tick, POLL_INTERVAL_MS);
    },
    [apollo, onCompletedRef, onTimeoutRef],
  );

  const retry = useCallback(() => {
    if (redirectUrlRef.current) open3dsRedirect(redirectUrlRef.current);
  }, []);

  const cancel = useCallback(() => {
    stopRef.current?.();
    setPending(false);
    redirectUrlRef.current = null;
  }, []);

  return { pending, start, retry, cancel };
}
