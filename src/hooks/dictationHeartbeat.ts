/**
 * While recording, a tiny request every 45s keeps the connection to the
 * dictation service warm. Left idle, the desktop proxy drops its connection
 * after 70s and our ingress drops Cloudflare's link after 75s, and the request
 * that formats a long dictation then pays ~300ms to reopen them.
 */
export const DICTATION_HEARTBEAT_INTERVAL_MS = 45_000;

export function createDictationHeartbeat(
  ping: () => Promise<unknown>,
  intervalMs = DICTATION_HEARTBEAT_INTERVAL_MS,
) {
  let timer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };

  return {
    start: () => {
      stop();
      timer = setInterval(() => {
        // A failed ping only leaves the path cold; the recording carries on.
        ping().catch(() => undefined);
      }, intervalMs);
    },
    stop,
  };
}
