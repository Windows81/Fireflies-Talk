export function createDictationRuntimeLock() {
  let holders = 0;
  let stop: (() => void) | null = null;

  const acquire = (start: () => () => void): (() => void) => {
    if (!stop) stop = start();
    holders += 1;
    return () => {
      holders -= 1;
      if (holders !== 0) return;
      stop?.();
      stop = null;
    };
  };

  return { acquire };
}

export function createDictationEnableLock() {
  let holders = 0;
  return {
    acquire(setEnabled: (on: boolean) => void, enabled: boolean): () => void {
      holders += 1;
      setEnabled(enabled);
      return () => {
        holders -= 1;
        if (holders === 0) setEnabled(false);
      };
    },
  };
}

export const dictationRuntimeLock = createDictationRuntimeLock();
export const dictationEnableLock = createDictationEnableLock();
