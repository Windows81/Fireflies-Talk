/** Thrown by {@link withTimeout} when the wrapped promise outlives its budget. */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} did not settle within ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Reject with {@link TimeoutError} if `promise` has not settled within `ms`.
 *
 * The wrapped promise is NOT cancelled — nothing in the web platform can
 * cancel an in-flight `AudioContext.close()`, `ipcRenderer.invoke()` or
 * `fetch()`. This only bounds how long the caller waits, and swallows a late
 * rejection so it can't surface as an unhandled rejection.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
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
