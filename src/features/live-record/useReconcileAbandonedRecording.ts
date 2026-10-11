import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { useEffect, useRef } from "react";
import { useAuth } from "../auth";
import { reconcileAbandonedRecording } from "./reconcile-abandoned-recording";

/**
 * Finishes a local recording left live by a crash or force-quit. Gated on
 * tokens because the status query is authenticated by Apollo's auth link per
 * request, so it only works once auth has rehydrated (mirrors desktop-ff
 * #136); a signed-out launch leaves the record for a later launch.
 */
export function useReconcileAbandonedRecording(): void {
  const tokens = useAuth((state) => state.tokens);
  const ran = useRef(false);

  useEffect(() => {
    if (!isDesktop || !isMainDesktopWindow() || !tokens) return;
    // Token refreshes re-run this effect; a second pass would treat the
    // recording currently in progress as abandoned.
    if (ran.current) return;
    ran.current = true;
    void reconcileAbandonedRecording();
  }, [tokens]);
}
