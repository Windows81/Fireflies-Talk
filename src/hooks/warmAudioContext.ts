/**
 * One warm slot per expensive-to-construct object. `prewarm` fills the slot
 * ahead of time; `take` hands out the warm value. Re-warming is the owner's
 * call — constructing a replacement can block, so it belongs on a cheap path,
 * not inside `take`.
 */
export interface WarmSlot<T> {
  prewarm: () => void;
  take: () => T;
}

export function createWarmSlot<T>(create: () => T): WarmSlot<T> {
  let slot: T | null = null;

  const prewarm = () => {
    if (slot !== null) return;
    try {
      slot = create();
    } catch {
      slot = null;
    }
  };

  const take = (): T => {
    prewarm();
    const entry = slot;
    slot = null;
    if (entry !== null) return entry;
    return create();
  };

  return { prewarm, take };
}
