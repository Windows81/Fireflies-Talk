import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/features/storage";

/**
 * User-adjustable size of the compact live floating panel cards. Defaults match
 * the historical fixed dimensions so the window looks identical until the user
 * drags a resize handle. Notes and Ask Fred each keep their own size, persisted
 * across sessions. (Transcript shares the Notes card, so it uses the Notes size.)
 */
export const DEFAULT_PANEL_WIDTH = 480;
export const DEFAULT_PANEL_HEIGHT = 385;

/**
 * The Live Assist paywall is taller than the suggestions feed it replaces — a
 * preview card, a credits badge, the pitch and a CTA. The window height is
 * computed from these constants rather than measured, so the slot has to be
 * widened for it or the window clips the CTA.
 */
export const PAYWALL_PANEL_HEIGHT = 460;

// Resize bounds. Width can't shrink below the default (keeps the side-by-side
// layout intact), but height can shrink to a shorter, compact panel. The
// display work area is the effective hard cap, applied by resizeToStoredContent
// in the Electron main.
export const MIN_PANEL_WIDTH = DEFAULT_PANEL_WIDTH;
export const MAX_PANEL_WIDTH = 760;
export const MIN_PANEL_HEIGHT = 240;
// Ask Fred's empty state (bottom-anchored suggestions) plus its sticky input
// need more room than Notes, otherwise the input overlaps the suggestions.
export const MIN_PANEL_HEIGHT_ASK_FRED = 320;
export const MAX_PANEL_HEIGHT = 760;

/** Independently-resizable panel cards in the compact live window. */
export type ResizablePanelKind = "notes" | "askFred";

/** Minimum resize height per card kind (Ask Fred needs a taller floor). */
export const minPanelHeightFor = (kind: ResizablePanelKind): number =>
  kind === "askFred" ? MIN_PANEL_HEIGHT_ASK_FRED : MIN_PANEL_HEIGHT;

export interface PanelSize {
  width: number;
  height: number;
}

const DEFAULT_SIZE: PanelSize = {
  width: DEFAULT_PANEL_WIDTH,
  height: DEFAULT_PANEL_HEIGHT,
};

interface CompactPanelSizeState {
  sizes: Record<ResizablePanelKind, PanelSize>;
  setSize: (kind: ResizablePanelKind, width: number, height: number) => void;
}

export const useCompactPanelSizeStore = create<CompactPanelSizeState>()(
  persist(
    (set) => ({
      sizes: { notes: { ...DEFAULT_SIZE }, askFred: { ...DEFAULT_SIZE } },
      setSize: (kind, width, height) =>
        set((state) => ({
          sizes: { ...state.sizes, [kind]: { width, height } },
        })),
    }),
    {
      name: "compact-panel-size",
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ sizes: state.sizes }),
    },
  ),
);
