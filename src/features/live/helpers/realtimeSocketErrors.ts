/**
 * Handshake rejections realtime-ff reports through the socket `connect_error`
 * message. The strings are a cross-repo contract shared with dashboard-ff.
 */
export const REALTIME_SOCKET_ERRORS = {
  MEETING_ENDED: "Meeting has ended.",
  INVALID_TOKEN: "Could not validate user token",
} as const;

export const TOKEN_REFRESH_COOLDOWN_MS = 60_000;

export type ConnectErrorAction = "end-session" | "refresh-token" | "ignore";

/**
 * Decides how the live socket reacts to a rejected handshake. A meeting the
 * server reports as ended only ends a session this client still believes is
 * live; a rejected token is re-minted at most once per cooldown so a token the
 * server keeps rejecting cannot turn into a refresh storm.
 */
export const resolveConnectErrorAction = ({
  message,
  isLive,
  msSinceLastTokenRefresh,
}: {
  message: string;
  isLive: boolean;
  msSinceLastTokenRefresh: number;
}): ConnectErrorAction => {
  if (message === REALTIME_SOCKET_ERRORS.MEETING_ENDED) {
    return isLive ? "end-session" : "ignore";
  }

  if (message === REALTIME_SOCKET_ERRORS.INVALID_TOKEN) {
    return msSinceLastTokenRefresh >= TOKEN_REFRESH_COOLDOWN_MS
      ? "refresh-token"
      : "ignore";
  }

  return "ignore";
};

export const MAX_TOKEN_FETCH_RETRIES = 5;
const TOKEN_FETCH_RETRY_BASE_MS = 5_000;

/**
 * Delay before re-requesting a realtime token after `failedAttempts`
 * consecutive failures (5s, 10s, 20s, ...), or null once the retry budget is
 * spent so a dead API cannot be polled forever.
 */
export const resolveTokenRetryDelayMs = (
  failedAttempts: number,
): number | null => {
  if (failedAttempts > MAX_TOKEN_FETCH_RETRIES) return null;

  return TOKEN_FETCH_RETRY_BASE_MS * 2 ** (failedAttempts - 1);
};
