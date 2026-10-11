/** How long the "Ready to paste" toast stays beside the pill. */
export const PASTE_FALLBACK_TOAST_MS = 2000;

/** One line: "<label> <keys>", the keys on a key cap. */
export type PasteFallbackToastCopy = {
  label: string;
  keys: string;
};

export function pasteFallbackToastCopy(
  isWindows: boolean,
): PasteFallbackToastCopy {
  return {
    label: "Ready to paste",
    keys: isWindows ? "Ctrl+V" : "⌘V",
  };
}

/**
 * Each show bumps the generation so a hide timer armed for an earlier toast
 * cannot take down a newer one that arrived while it was pending.
 */
export type PasteFallbackToastState = {
  visible: boolean;
  generation: number;
};

export const INITIAL_PASTE_FALLBACK_TOAST: PasteFallbackToastState = {
  visible: false,
  generation: 0,
};

export type PasteFallbackToastAction =
  | { type: "show" }
  | { type: "hide"; generation: number };

export function reducePasteFallbackToast(
  state: PasteFallbackToastState,
  action: PasteFallbackToastAction,
): PasteFallbackToastState {
  switch (action.type) {
    case "show":
      return { visible: true, generation: state.generation + 1 };
    case "hide":
      if (action.generation !== state.generation || !state.visible) {
        return state;
      }
      return { ...state, visible: false };
  }
}
