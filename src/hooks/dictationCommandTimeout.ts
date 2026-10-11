export const COMMAND_IDLE_TIMEOUT_MS = 120_000;
export const COMMAND_MAX_TIMEOUT_MS = 900_000;

export type CommandTimeoutReason =
  | "client-idle-timeout"
  | "client-max-duration";

export function withCommandTimeout<T>(
  run: (touch: () => void) => Promise<T>,
  onTimeout: (reason: CommandTimeoutReason) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timers: {
      idle?: ReturnType<typeof setTimeout>;
      max?: ReturnType<typeof setTimeout>;
    } = {};

    const clearTimers = () => {
      clearTimeout(timers.idle);
      clearTimeout(timers.max);
    };

    const expire = (reason: CommandTimeoutReason, message: string) => {
      if (settled) return;
      settled = true;
      clearTimers();
      onTimeout(reason);
      reject(new Error(message));
    };

    const touch = () => {
      if (settled) return;
      clearTimeout(timers.idle);
      timers.idle = setTimeout(
        () => expire("client-idle-timeout", "Command stalled"),
        COMMAND_IDLE_TIMEOUT_MS,
      );
    };

    touch();
    timers.max = setTimeout(
      () => expire("client-max-duration", "Command timed out"),
      COMMAND_MAX_TIMEOUT_MS,
    );

    Promise.resolve()
      .then(() => run(touch))
      .then(
        (value) => {
          if (settled) return;
          settled = true;
          clearTimers();
          resolve(value);
        },
        (error) => {
          if (settled) return;
          settled = true;
          clearTimers();
          reject(error);
        },
      );
  });
}
/** The dictate path's ceiling — the command path has its own, above. */
export const DICTATION_PROCESSING_TIMEOUT_MS = 120_000;

/** Rejects if `promise` has not settled in time, and says so. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.();
      reject(new Error(message));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
