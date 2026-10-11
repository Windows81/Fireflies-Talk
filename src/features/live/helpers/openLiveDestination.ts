import { isDesktopNotepadEnabled } from "@/screens/DesktopNotepad/hooks/useIsDesktopNotepadEnabled";

/**
 * In the one-window model the recording lives full screen in the main window,
 * so it is the default unless the user last chose the floating realtime panel.
 */
async function openInPreferredDesktopView(url: string): Promise<void> {
  const preferredMode = await window.electron?.liveView
    ?.getPreferredMode?.()
    .catch(() => null);

  if (preferredMode === "compact") {
    await window.electron?.window.openLive(url, "compact");
    return;
  }

  window.electron?.navigateMainToRoute?.(url);
}

/**
 * Open a live meeting (`/live/{id}?...`) from any desktop entry point.
 *
 * When the in-app desktop notepad is enabled, recording/live renders inside the
 * main window (Home and Notepad already do), so the whole app stays one window
 * at one size. We reuse the existing `navigate-main-to-route` bridge, which
 * parses the full URL (preserving the `id` and `source` params) and shows+focuses
 * the main window. Otherwise we keep the legacy floating live-window behavior.
 */
export function openLiveDestination(url: string): void {
  if (isDesktopNotepadEnabled()) {
    void openInPreferredDesktopView(url).catch(() => {
      // Non-fatal: fall back to the main window so live still opens somewhere.
      window.electron?.navigateMainToRoute?.(url);
    });
    return;
  }

  window.electron?.window.openLive(url).catch(() => {
    // Non-fatal: the live window failed to open. Callers treat this as
    // fire-and-forget; the meeting itself is unaffected.
  });
}
