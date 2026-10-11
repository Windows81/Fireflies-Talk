type BusyListener = (busy: boolean) => void;

let owner: symbol | null = null;
const listeners = new Set<BusyListener>();

function notify(busy: boolean): void {
  for (const listener of listeners) listener(busy);
}

export function tryAcquireShortcutRecording(id: symbol): boolean {
  if (owner) return false;
  owner = id;
  notify(true);
  return true;
}

export function releaseShortcutRecording(id: symbol): boolean {
  if (owner !== id) return false;
  owner = null;
  notify(false);
  return true;
}

export function isShortcutRecordingBusy(): boolean {
  return owner !== null;
}

export function subscribeShortcutRecordingBusy(
  listener: BusyListener,
): () => void {
  listeners.add(listener);
  listener(owner !== null);
  return () => {
    listeners.delete(listener);
  };
}
