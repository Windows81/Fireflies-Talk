/**
 * How many times in a row an idle socket may be reconnected before the watchdog
 * gives up, for sessions where socket silence is expected. Past this many
 * attempts that brought no traffic, reconnecting again cannot help, and
 * socket.io's own reconnection still covers real transport failures.
 */
export const MAX_IDLE_SOCKET_RECONNECTS = 2;

/**
 * Decides whether the idle watchdog should force a socket reconnect.
 *
 * `idleReconnectCount` counts consecutive idle reconnects and resets as soon as
 * any traffic arrives, so a socket that is genuinely being used keeps its full
 * allowance for later stalls.
 *
 * `capIdleReconnects` says whether silence is evidence of a broken socket. A
 * desktop recording streams its transcripts over Electron IPC, so its socket
 * can be idle for a whole healthy meeting and must not be reconnected forever.
 * When the socket is itself the transcript source, silence may be the only
 * symptom of a connection the server has forgotten, and reconnecting is the
 * only way back — so those sessions stay uncapped.
 */
export const shouldReconnectIdleSocket = ({
  isLive,
  isReconnecting,
  msSinceLastActivity,
  idleThresholdMs,
  idleReconnectCount,
  capIdleReconnects,
}: {
  isLive: boolean;
  isReconnecting: boolean;
  msSinceLastActivity: number;
  idleThresholdMs: number;
  idleReconnectCount: number;
  capIdleReconnects: boolean;
}) => {
  if (!isLive || isReconnecting) return false;
  if (capIdleReconnects && idleReconnectCount >= MAX_IDLE_SOCKET_RECONNECTS) {
    return false;
  }

  return msSinceLastActivity >= idleThresholdMs;
};
