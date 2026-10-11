import { toast } from "@/components/Toast";
import {
  captureException,
  isAuthExpiredError,
  isUnauthenticatedError,
} from "@/errors";
import { createAuthHeaders } from "@/features/auth/headers";
import { recoverFromUnauthorized, useAuth } from "@/features/auth/store";
import { Logger } from "@/logger";
import { isDictationPillWindow } from "@/utils/device";
import { getNetworkStateAsync } from "@/utils/network";
import type { Context } from "@apollo/client";
import type {
  FetchResult,
  NextLink,
  Operation,
} from "@apollo/client/link/core";
import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client/utilities";
import { print } from "graphql";

const logger = new Logger("apollo");

type AuthHeaderTokens = Parameters<typeof createAuthHeaders>[0];

const hasAuthError = ({
  graphQLErrors,
  networkError,
}: {
  graphQLErrors?: ReadonlyArray<Error>;
  networkError?: Error | null;
}) => {
  if (
    networkError &&
    (isAuthExpiredError(networkError) || isUnauthenticatedError(networkError))
  ) {
    return true;
  }

  return Boolean(
    graphQLErrors?.some(
      (error) => isAuthExpiredError(error) || isUnauthenticatedError(error),
    ),
  );
};

const replaceAuthHeaders = (
  headers: Record<string, unknown> | undefined,
  tokens: AuthHeaderTokens,
) => {
  const nextHeaders = { ...(headers || {}) };
  delete nextHeaders.authorization;
  delete nextHeaders.Authorization;
  delete nextHeaders["x-refresh-token"];
  delete nextHeaders["X-Refresh-Token"];

  return {
    ...nextHeaders,
    ...createAuthHeaders(tokens),
  };
};

const retryWithFreshAuth = ({
  forward,
  operation,
  response,
  reason,
  networkError,
}: {
  forward: NextLink;
  operation: Operation;
  response?: FetchResult;
  reason: string;
  networkError?: Error | null;
}) =>
  new Observable<FetchResult>((observer) => {
    let subscription: { unsubscribe: () => void } | null = null;
    let isUnsubscribed = false;

    void recoverFromUnauthorized(reason)
      .then((refreshedTokens) => {
        if (isUnsubscribed) return;

        if (!refreshedTokens) {
          if (response) {
            observer.next(response);
            observer.complete();
            return;
          }

          observer.error(
            networkError || new Error("Failed to recover auth session"),
          );
          return;
        }

        operation.setContext({
          ...operation.getContext(),
          authRetryAttempted: true,
          headers: replaceAuthHeaders(
            operation.getContext().headers as
              | Record<string, unknown>
              | undefined,
            refreshedTokens,
          ),
        });

        subscription = forward(operation).subscribe({
          next: (result) => observer.next(result),
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });
      })
      .catch((error) => observer.error(error));

    return () => {
      isUnsubscribed = true;
      subscription?.unsubscribe();
    };
  });

export const authRetryErrorLink = onError(
  ({ graphQLErrors, networkError, operation, response, forward }) => {
    // Suppress all error handling when user is logged out.
    // In-flight requests may still resolve after logout and will naturally fail.
    const { user, tokens } = useAuth.getState();
    if (!user && !tokens) return;

    if (
      hasAuthError({
        graphQLErrors: graphQLErrors as ReadonlyArray<Error> | undefined,
        networkError: networkError as Error | null,
      })
    ) {
      if (!operation.getContext().authRetryAttempted) {
        logger.info(
          "graphql auth error detected. attempting to recover from auth error",
          {
            operationName: operation.operationName,
          },
        );
        return retryWithFreshAuth({
          forward,
          operation,
          response: response as FetchResult | undefined,
          reason: `GraphQL ${operation.operationName || "anonymous operation"} returned unauthorized`,
          networkError: networkError as Error | null,
        });
      }
      return;
    }

    logger.error("GraphQL error", {
      graphQLErrors,
      networkError,
      operation,
      response,
    });
    if (networkError) {
      if (operation.getContext().silentErrors) {
        return;
      }
      // The pill is a tiny always-on-top overlay — GraphQL bootstrap errors
      // belong in the main window, not stacked over the grabber.
      if (isDictationPillWindow()) {
        return;
      }
      // Device offline: skip the toast — offline surfaces handle it themselves
      void getNetworkStateAsync()
        .catch(() => null)
        .then((state) => {
          if (state?.isInternetReachable === false) return;
          toast({
            title: "Could not connect to server",
            message: networkError.message,
            type: "error",
          });
        });
    }
    if (graphQLErrors) {
      const headers = operation.getContext().headers as
        | Record<string, unknown>
        | undefined;
      const transactionId = headers?.["x-request-id"];

      for (const err of graphQLErrors) {
        captureException(
          new Error(
            `GraphQL error for ${operation.operationName}: ${err.message}`,
            {
              cause: err,
            },
          ),
          {
            contexts: {
              operation: {
                query: print(operation.query),
                variables: operation.variables,
                extensions: operation.extensions,
              },
              graphQLError: err as Context,
              graphQLResponse: response as Context,
            },
            tags: {
              graphql: true,
              operationName: operation.operationName,
              ...(typeof transactionId === "string"
                ? { transaction_id: transactionId }
                : {}),
            },
            fingerprint: ["{{ default }}", operation.operationName],
          },
        );
      }
    }
  },
);
