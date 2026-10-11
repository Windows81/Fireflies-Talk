import { isDesktop } from "@/utils/device";
import { RouteNames } from "@/constants";
import { navigationRef } from "@/screens/RootNavigation";
import { openLiveDestination } from "@/features/live";

/**
 * Opens the live/realtime view for a meeting that is being recorded. On desktop
 * this renders live in the main window (or the legacy floating window when the
 * desktop notepad is disabled); elsewhere it navigates to the Live route.
 */
export const openLiveNotes = (meetingId: string) => {
  if (isDesktop) {
    openLiveDestination(`/live/${meetingId}?source=calendar`);
    return;
  }
  navigationRef.navigate(RouteNames.Live, {
    id: meetingId,
    source: "calendar",
  });
};
