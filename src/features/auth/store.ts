import { Config } from "@/constants";
import {
  CanceledError,
  NetworkError,
  captureException,
  isUnauthenticatedError,
  setSentryUser,
} from "@/errors";
import { storage } from "@/features/storage";
import { Logger } from "@/logger";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { clearAllCookies } from "@/utils/cookies";
import { randomUUID } from "expo-crypto";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createAuthHeaders } from "./headers";
import { oauth2Login, type AuthLoginResult } from "./oauth2";
import { ssoLogin } from "./ssoLogin";
import type { AuthTokens, AuthUser } from "./types";
import {
  TokenExpiredError,
  getUserByAccessToken,
  refreshAccessToken,
} from "./userService";
import { isTokenExpired } from "./utils";

type RefreshResult =
  | { status: "success"; tokens: AuthTokens }
  | { status: "network_error" }
  | { status: "failed" };
type AuthProvider = "google" | "outlook";

interface AuthStore {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  /**
   * A token to validate the login callback belongs to the current login attempt. This is used to protect against the auth server -> user service -> auth server callback flow, where an attacker could try to reuse a valid callback URL with tokens from a different login attempt.
   */
  pendingAppStateToken: string | null;
  authorize: (type: AuthProvider) => Promise<void>;
  authorizeSso: (ssoUrl: string) => Promise<void>;
  doLogin: (tokens: AuthTokens) => Promise<void>;
  login: (tokens: AuthTokens, oauthState?: string | null) => Promise<void>;
  logout: (reason: string) => Promise<void>;
  refresh: () => Promise<RefreshResult>;
  updateUser: (updatedFields: Partial<AuthUser>) => void;
  getOrRefreshTokens: () => AuthTokens | null | Promise<AuthTokens | null>;
  getOrRefreshAuthHeaders: () => Promise<Record<string, string>>;
}

const TAG = "auth-store";

const logger = new Logger(TAG);
let unauthorizedRecoveryPromise: Promise<AuthTokens | null> | null = null;

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => {
      logger.info("intializing auth store");

      let refreshPromise: Promise<RefreshResult> | null = null;
      let consumedAppStateToken: string | null = null;
      const clearPendingAppStateToken = () => {
        set({
          pendingAppStateToken: null,
        });
      };
      const setPendingAppStateToken = (pendingAppStateToken: string) => {
        set({
          pendingAppStateToken,
        });
      };
      const getPendingAppStateToken = () => {
        return get().pendingAppStateToken;
      };
      const authorizeWithAppState = async (
        startLogin: (state: string) => Promise<AuthLoginResult>,
      ) => {
        const appStateToken = randomUUID();
        setPendingAppStateToken(appStateToken);

        let result: AuthLoginResult;
        try {
          result = await startLogin(appStateToken);
        } catch (error) {
          clearPendingAppStateToken();
          throw error;
        }
        if (result.status === "pending") {
          // External-browser callbacks arrive through LoginScreen, which
          // completes login with the stored OAuth state.
          throw new CanceledError();
        }
        return get().login(result.tokens, result.state);
      };

      return {
        tokens: null,
        user: null,
        pendingAppStateToken: null,
        async authorize(type) {
          return authorizeWithAppState((state) =>
            oauth2Login(type, {
              state,
            }),
          );
        },
        async authorizeSso(ssoUrl) {
          return authorizeWithAppState((state) =>
            ssoLogin(ssoUrl, {
              state,
            }),
          );
        },
        /**
         * Perform the logic to login the user given a set of tokens.
         * This is only used directly for manual login cases.
         */
        async doLogin(tokens) {
          const authedUser = await getUserByAccessToken(tokens.accessToken);
          if (!authedUser) {
            throw new Error("Failed to get user by access token");
          }

          set({
            user: authedUser,
            tokens,
          });

          // wait a bit before tracking the login event
          // to make sure the user is set via useAuth.subscribe
          setTimeout(() => {
            tracker.track(TRACKING_EVENTS.APP_LOGGED_IN);
          }, 5000);
        },
        async login(tokens, oauthState) {
          logger.info("login called");
          // Callback logins must match the state created by authorize.
          const pendingAppStateToken = getPendingAppStateToken();

          if (
            !pendingAppStateToken &&
            oauthState &&
            oauthState === consumedAppStateToken
          ) {
            logger.info("ignoring duplicate login callback for consumed state");
            return;
          }

          if (!pendingAppStateToken || oauthState !== pendingAppStateToken) {
            // No pending token → this login did not originate from an authorize
            // call. Value mismatch → the state is invalid. Either way, reject.
            throw new Error("OAuth state mismatch");
          }

          consumedAppStateToken = pendingAppStateToken;
          clearPendingAppStateToken();
          return this.doLogin(tokens);
        },
        async refresh() {
          if (refreshPromise) return refreshPromise;
          refreshPromise = (async () => {
            logger.info(
              `refresh called. auth expires: expiresAt = ${get().tokens?.expiresAt}, refreshExpiresAt = ${get().tokens?.refreshExpiresAt}.`,
            );
            const tokens = get().tokens;
            const { accessToken, refreshToken } = tokens || {};
            if (Platform.OS !== "web" && !accessToken) {
              logger.warn("refresh called without access token");
              return { status: "failed" } as const;
            }
            try {
              const refreshedTokens = await refreshAccessToken(
                accessToken || null,
                refreshToken || null,
              );

              if (!refreshedTokens) {
                this.logout("Refresh auth failed because missing tokens");
                return { status: "failed" } as const;
              }

              set({
                user: await getUserByAccessToken(
                  refreshedTokens?.accessToken || null,
                ),
                ...(refreshedTokens && { tokens: refreshedTokens }),
              });

              return {
                status: "success",
                tokens: refreshedTokens,
              } as const;
            } catch (err) {
              if (err instanceof NetworkError) {
                // we don't want to log out the user if the refresh failed because of a network error
                logger.error("refresh failed because of network error");
                return { status: "network_error" } as const;
              }
              logger.error(`refresh failed: ${err.message}`);
              get().logout("Refresh auth failed because of an error");
              if (!(err instanceof TokenExpiredError)) {
                captureException(err as Error, {
                  tags: {
                    section: TAG,
                  },
                });
              }
              return { status: "failed" } as const;
            }
          })().then((result) => {
            refreshPromise = null;
            return result;
          });
          return refreshPromise;
        },
        async logout(reason) {
          logger.info(`logout called: ${reason}`);

          // remove cookie
          await fetch(`${Config.USER_SERVICE_URL}/auth/mobile/logout`, {
            method: "POST",
            credentials: "include",
            headers: createAuthHeaders(get().tokens),
          }).catch(() => {});

          clearAllCookies();
          consumedAppStateToken = null;

          set({
            user: null,
            tokens: null,
            pendingAppStateToken: null,
          });

          await tracker.track(TRACKING_EVENTS.APP_LOGGED_OUT, {
            reason,
          });
        },
        updateUser(updateFields: Partial<AuthUser>) {
          const currUser = get().user;
          if (!currUser) return;
          set({
            user: {
              ...currUser,
              ...updateFields,
            },
          });
        },
        async getOrRefreshTokens(): Promise<AuthTokens | null> {
          const authState = get();
          if (!authState.tokens) return null;
          if (isTokenExpired(authState.tokens)) {
            logger.info("access token expired, attempting to refresh");
            return this.refresh().then((result) => {
              return result.status === "success" ? result.tokens : null;
            });
          }
          return authState.tokens;
        },
        async getOrRefreshAuthHeaders() {
          const tokens = await this.getOrRefreshTokens();
          if (!tokens) return {};
          return createAuthHeaders(tokens);
        },
      };
    },
    {
      name: "auth",
      storage: createJSONStorage(() => storage),
      // pendingAppStateToken is an ephemeral CSRF nonce — never persist it.
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        logger.info("loaded auth from storage", { user: state?.user });
        queueMicrotask(() => {
          initAuth(state?.tokens).catch((error: unknown) => {
            logger.error(
              `initAuth rejected while rehydrating auth: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          });
        });
      },
    },
  ),
);

export const authApi = useAuth.getState() as Pick<
  AuthStore,
  | "authorize"
  | "authorizeSso"
  | "login"
  | "logout"
  | "refresh"
  | "getOrRefreshTokens"
  | "updateUser"
  | "getOrRefreshAuthHeaders"
  | "doLogin"
>;

export async function recoverFromUnauthorized(
  reason: string,
): Promise<AuthTokens | null> {
  if (unauthorizedRecoveryPromise) {
    logger.info(`joining in-flight unauthorized recovery: ${reason}`);
    return unauthorizedRecoveryPromise;
  }

  const { tokens, user } = useAuth.getState();
  if (!tokens && !user) {
    logger.info(
      `skipping auth recovery because user is already logged out: ${reason}`,
    );
    return null;
  }

  unauthorizedRecoveryPromise = (async () => {
    logger.warn(
      `attempting auth recovery after unauthorized response: ${reason}`,
    );
    const refreshResult = await authApi.refresh();
    if (refreshResult.status === "success") {
      logger.info(`auth recovery succeeded: ${reason}`);
      return refreshResult.tokens;
    }

    if (refreshResult.status === "network_error") {
      logger.warn(
        `auth recovery skipped logout because refresh failed due to network error: ${reason}`,
      );
      return null;
    }

    if (useAuth.getState().tokens || useAuth.getState().user) {
      await authApi.logout(`Unauthorized recovery failed: ${reason}`);
    }

    return null;
  })().finally(() => {
    unauthorizedRecoveryPromise = null;
  });

  return unauthorizedRecoveryPromise;
}

function syncAuthUserSideEffects(user: AuthUser | null) {
  setSentryUser(user);
  tracker.setUser(user);
}

useAuth.subscribe((state, prevState) => {
  if (prevState.user !== state.user) {
    syncAuthUserSideEffects(state.user);
  }
});

// Persist hydrates during create(), before the subscriber above exists.
syncAuthUserSideEffects(useAuth.getState().user);

async function initAuth(prevTokens: AuthStore["tokens"] | undefined) {
  if (prevTokens && isTokenExpired(prevTokens)) {
    await recoverFromUnauthorized("initAuth: stored access token is expired");
    return;
  }

  try {
    const user = await getUserByAccessToken(prevTokens?.accessToken || null);

    if (!user) {
      authApi.logout("initAuth: getUserByAccessToken returns no user");
      return;
    }

    useAuth.setState({
      user,
    });
  } catch (err) {
    if (err instanceof TokenExpiredError || isUnauthenticatedError(err)) {
      await recoverFromUnauthorized(
        "initAuth failed to validate the stored access token",
      );
      return;
    }

    if (err instanceof NetworkError) {
      // Don't logout on network errors - user might be offline temporarily
      logger.warn(
        "initAuth failed due to network error, keeping user logged in",
      );
      return;
    }

    // Only logout for actual auth errors (invalid token, 401, 403, etc.)
    logger.error(`initAuth failed: ${err.message}`);
    authApi.logout("Failed to get initial user by access token");
  }
}
