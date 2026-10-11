import { Config } from "@/constants";
import { isAuthExpiredError, isUnauthenticatedError } from "@/errors";
import { authApi, useAuth } from "@/features/auth/store";
import { Logger } from "@/logger";
import { addNetworkStateListener, DEV_FORCE_OFFLINE } from "@/utils/network";
import { getRequestMetadataHeaders } from "@/utils/request";
import type { InMemoryCacheConfig } from "@apollo/client";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import { setContext } from "@apollo/client/link/context";
import { RetryLink } from "@apollo/client/link/retry";
import { useApolloClientDevTools } from "@dev-plugins/apollo-client";
import { cacheConfig as bitesCacheConfig } from "@firefliesai/bites-ff.graphql-client";
import { apolloCacheConfig as mobileCacheConfig } from "@firefliesai/mobile-ff.graphql-client";
import deepmerge from "deepmerge";
import * as Application from "expo-application";
import type { FC, PropsWithChildren } from "react";
import { authRetryErrorLink } from "./auth-retry-link";
import {
  mergeCursorMeetingResults,
  mergeDashboardMeetingResults,
} from "./pagination.utils";

if (__DEV__) {
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

const transactionIdLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      ...getRequestMetadataHeaders(),
    },
  };
});

const authLink = setContext(async (_, { headers }) => {
  // return the headers to the context so httpLink can read them
  const authHeaders = await authApi.getOrRefreshAuthHeaders();
  return {
    headers: {
      ...headers,
      ...authHeaders,
    },
  };
});

const logger = new Logger("apollo");

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    name?: unknown;
    networkError?: { name?: unknown };
  };
  return (
    candidate.name === "AbortError" ||
    candidate.networkError?.name === "AbortError"
  );
}

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error) =>
      !isAbortError(error) &&
      !isUnauthenticatedError(error) &&
      !isAuthExpiredError(error),
  },
});

const httpLink = new HttpLink({
  // a dead host makes every query fail with a networkError, like real offline
  uri: DEV_FORCE_OFFLINE ? "http://localhost:9" : Config.GRAPHQL_URL,
  credentials: "include",
});

const cacheConfig: InMemoryCacheConfig = {
  typePolicies: {
    Profile: {
      // Profile has no stable identity and is embedded display data (organizer,
      // participants, owners, live-meeting user) selected with different field
      // sets across queries. Normalizing it by `email` made one shared entity
      // that sibling queries (e.g. live meetings' `userProfile { picture, email }`,
      // which refetches on focus) would clobber or dangle — surfacing as
      // `organizerProfile` going null on navigation. Embed it per-parent instead.
      keyFields: false,
    },
    MeetingCaption: {
      keyFields: false,
    },
    MeetingStatusData: {
      keyFields: ["objectId"],
    },
    FeedMeeting: {
      fields: {
        startTime: {
          read(date) {
            return date ? new Date(date) : null;
          },
        },
        endTime: {
          read(date) {
            return date ? new Date(date) : null;
          },
        },
      },
    },
    Query: {
      fields: {
        getChannelMeetings: {
          keyArgs: ["channelId", "search", "isPrivate"],
          merge: mergeDashboardMeetingResults("from"),
        },
        globalSearch: {
          keyArgs: ["channelId", "search", "keywords", "filters"],
          merge: mergeDashboardMeetingResults("from"),
        },
        getChannel: {
          read(_, { args, toReference }) {
            return toReference({
              __typename: "Channel",
              _id: args?.id,
            });
          },
        },
        getUserMeetingsForStatus: {
          // check start/end for MeetingStatusScreen, computedStatus for live meetings
          keyArgs: ["start", "end", "computedStatus"],
          merge(existing, incoming, options) {
            // For MeetingStatusScreen (with start/end), use cursor pagination merge
            if (options.args?.start && options.args?.end) {
              return mergeCursorMeetingResults()(existing, incoming, options);
            }
            // For live meetings (no start/end), always replace to ensure freshness
            return incoming;
          },
        },
        soundbite: {
          read(_, { args, toReference }) {
            return toReference({
              __typename: "Soundbite",
              id: args?.id,
            });
          },
        },
        playlist: {
          read(_, { args, toReference }) {
            return toReference({
              __typename: "Playlist",
              id: args?.id,
            });
          },
        },
        meetingNoteAnalytics: {
          keyArgs: ["parseId"],
        },
        getFeedMeetings: {
          keyArgs: false,
          merge: mergeDashboardMeetingResults("skip"),
        },
        getLiveMeetingInsights: {
          keyArgs: ["meetingId"],
        },
        meetingNoteComments: {
          keyArgs: ["meetingId"],
        },
        getLiveMeetingMarks: {
          keyArgs: ["meetingId"],
        },
      },
    },
  },
};

const allCacheConfig: InMemoryCacheConfig[] = [
  cacheConfig,
  bitesCacheConfig,
  mobileCacheConfig,
];

export const client = new ApolloClient({
  cache: new InMemoryCache(
    allCacheConfig.reduce(
      (acc, config) => deepmerge(acc, config),
      {} as InMemoryCacheConfig,
    ),
  ),
  connectToDevTools: __DEV__,
  link: ApolloLink.from([
    transactionIdLink,
    authLink,
    authRetryErrorLink,
    retryLink,
    httpLink,
  ]),
  name: Application.applicationId || Config.NAME,
  version: Config.VERSION,
  defaultOptions: {
    query: {
      // without this, an error might cause loading state to stay true forever
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

// Queries that fail while offline stay in error state forever — Apollo never
// retries them on its own. When connectivity returns, refetch every observable
// query so data-driven UI (e.g. the Personal Assistant section) recovers.
let wasOffline = false;
addNetworkStateListener((state) => {
  const isOnline = state.isInternetReachable === true;
  if (wasOffline && isOnline && useAuth.getState().user) {
    logger.info("connectivity restored. refetch observable queries");
    client.reFetchObservableQueries().catch((error) => {
      logger.warn("refetch on reconnect failed", { error });
    });
  }
  wasOffline = state.isInternetReachable === false;
});

useAuth.subscribe((state, prevState) => {
  if (prevState.user?.id !== state.user?.id) {
    if (!state.user) {
      // User logged out – clear the cache without refetching.
      // reFetchObservableQueries would fire network requests with no auth token
      // and cause 500 / "must be logged in" errors + error toasts.
      logger.info("user logged out. clearing apollo store");
      client.clearStore();
    } else {
      logger.info("auth user id changed. refetch observable queries");
      client.reFetchObservableQueries(true);
    }
  }
});

export const GraphQLProvider: FC<PropsWithChildren> = ({ children }) => {
  useApolloClientDevTools(client);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
