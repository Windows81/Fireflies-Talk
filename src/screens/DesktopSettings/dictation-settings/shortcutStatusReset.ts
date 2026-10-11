type StatusResetListener = () => void;

const listeners = new Set<StatusResetListener>();

export function resetShortcutStatuses(): void {
  for (const listener of listeners) listener();
}

export function subscribeShortcutStatusReset(
  listener: StatusResetListener,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
