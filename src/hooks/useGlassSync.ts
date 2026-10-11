import { useEffect, useRef } from "react";
import type { PanelId } from "../../electron/src/types";
import type { View } from "react-native";

/**
 * Hook to synchronize a React Native Web panel with a native glass underlay.
 * Tracks the panel's position and syncs it to the Electron main process.
 *
 * @param panelId - Unique identifier for this panel
 * @param isVisible - Whether the panel is currently visible
 * @param radius - Corner radius for the glass underlay (default: 8)
 * @returns A ref to attach to the View that should have the glass effect
 */
export function useGlassSync(
  panelId: PanelId,
  isVisible: boolean,
  radius: number = 8,
) {
  const rafRef = useRef<number>(0);
  const lastRectRef = useRef<string>("");
  const containerRef = useRef<View & HTMLDivElement>(null);
  const scaleFactorRef = useRef<number>(1);
  const lastDprRef = useRef<number>(0);
  const resizeDebounceRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electron?.glass) {
      return;
    }

    // Hide glass immediately when not visible (keeps native view alive for cheap restore)
    if (!isVisible) {
      window.electron.glass.hide(panelId);
      lastRectRef.current = "";
      return;
    }

    let isMounted = true;
    let cleanupDisplayChanged: (() => void) | undefined;

    const syncGlass = () => {
      if (!isMounted || !window.electron?.glass) return;

      // The node can be missing for a frame while the tree swaps layouts (the
      // live bar going horizontal <-> vertical rail). Returning here without
      // rescheduling used to kill the loop for good, stranding the native view
      // at its last rect — an empty capsule left floating in the window. Hide
      // it and keep polling so it comes back when the node reappears.
      if (!containerRef.current) {
        if (lastRectRef.current !== "") {
          window.electron.glass.hide(panelId);
          lastRectRef.current = "";
        }
        rafRef.current = requestAnimationFrame(syncGlass);
        return;
      }

      try {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.round(rect.left);
        const y = Math.round(rect.top);
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        // Skip if dimensions are zero (happens during animations)
        if (width === 0 || height === 0) {
          rafRef.current = requestAnimationFrame(syncGlass);
          return;
        }

        // Detect devicePixelRatio changes (fires on both zoom and display transitions).
        // A full remove+recreate is needed because native update() can't change corner radius.
        // We also re-fetch the display scale factor to keep scaleFactorRef in sync —
        // this prevents the DPR formula (devicePixelRatio / scaleFactor) from producing
        // wrong values during display transitions where the two can temporarily disagree.
        const currentDpr = window.devicePixelRatio || 1;
        if (currentDpr !== lastDprRef.current) {
          lastDprRef.current = currentDpr;
          window.electron.glass.remove(panelId);
          lastRectRef.current = "";

          // Re-fetch scale factor (may have changed on display transition),
          // then recreate glass after layout settles
          window.electron.window
            .getScaleFactor?.()
            .then((factor) => {
              if (!isMounted) return;
              if (factor) scaleFactorRef.current = factor;
            })
            .catch(() => {})
            .finally(() => {
              clearTimeout(resizeDebounceRef.current);
              resizeDebounceRef.current = window.setTimeout(() => {
                if (isMounted) {
                  rafRef.current = requestAnimationFrame(syncGlass);
                }
              }, 50);
            });
          return;
        }

        // Convert CSS pixels to native coordinates.
        // macOS native glass expects points (logical pixels), Windows expects physical pixels.
        // On macOS: devicePixelRatio = displayScale × zoomFactor,
        //   so devicePixelRatio / displayScale = zoomFactor = CSS→points conversion.
        // On Windows: devicePixelRatio = the full CSS→physical conversion.
        const isMac = window.electron?.platform === "darwin";
        const scaleFactor = scaleFactorRef.current || 1;
        const dpr = isMac ? currentDpr / scaleFactor : currentDpr;

        const scaledX = Math.round(x * dpr);
        const scaledY = Math.round(y * dpr);
        const scaledWidth = Math.round(width * dpr);
        const scaledHeight = Math.round(height * dpr);
        const scaledRadius = Math.round(radius * dpr);

        // Only update if position/size changed.
        // Include window dimensions because the native Cocoa Y conversion depends on
        // parentView.bounds.size.height — if the window resizes but the panel's viewport
        // rect stays the same, we still need to re-send so the native side recalculates.
        const rectKey = `${scaledX},${scaledY},${scaledWidth},${scaledHeight},${window.innerWidth},${window.innerHeight}`;
        if (rectKey !== lastRectRef.current) {
          window.electron.glass.upsert(panelId, {
            x: scaledX,
            y: scaledY,
            width: scaledWidth,
            height: scaledHeight,
            radius: scaledRadius,
            appearance: "vibrantDark",
          });
          lastRectRef.current = rectKey;
        }
      } catch (error) {
        console.error("[useGlassSync] Failed to sync glass:", error);
      }

      // Continue syncing for smooth following during window drags
      if (isMounted) {
        rafRef.current = requestAnimationFrame(syncGlass);
      }
    };

    // Initialize scale factor before starting the RAF loop to prevent
    // incorrect scaling calculations on the first few frames
    const startSync = async () => {
      // Get the initial scale factor
      if (window.electron) {
        try {
          const factor = await window.electron.window.getScaleFactor?.();
          if (factor) {
            scaleFactorRef.current = factor;
          }
        } catch (error) {
          console.error(
            "[useGlassSync] Failed to initialize scale factor:",
            error,
          );
          // Continue with default scale factor (1) on error
        }
      }

      // Bail out if unmounted during async initialization
      if (!isMounted) return;

      // Force initial sync by clearing last position, then start RAF loop
      lastDprRef.current = window.devicePixelRatio || 1;
      lastRectRef.current = "";
      rafRef.current = requestAnimationFrame(syncGlass);

      // Listen for display changes from Electron (fires when window actually moves to new display).
      // Covers same-DPR display transitions where devicePixelRatio doesn't change.
      cleanupDisplayChanged = window.electron?.onDisplayChanged?.(
        (scaleFactor) => {
          if (!isMounted) return;

          // Use scale factor directly from Electron (already correct for new display)
          scaleFactorRef.current = scaleFactor;
          lastRectRef.current = "";

          // Remove and recreate glass with correct scale (radius changes with display scale)
          window.electron?.glass.remove(panelId);
          clearTimeout(resizeDebounceRef.current);
          resizeDebounceRef.current = window.setTimeout(() => {
            if (isMounted) {
              rafRef.current = requestAnimationFrame(syncGlass);
            }
          }, 50);
        },
      );
    };

    startSync();

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeDebounceRef.current);
      cleanupDisplayChanged?.();

      // Hide (don't remove) on effect re-run so the native view stays alive.
      // Full removal happens in the separate unmount-only cleanup below.
      if (window.electron?.glass) {
        window.electron.glass.hide(panelId);
        lastRectRef.current = "";
      }
    };
  }, [panelId, isVisible, radius]);

  // Separate unmount-only cleanup: fully destroy the native glass view
  // when the component is removed from the tree (not on dep changes).
  useEffect(() => {
    return () => {
      if (window.electron?.glass) {
        window.electron.glass.remove(panelId);
      }
    };
  }, [panelId]);

  return containerRef;
}
