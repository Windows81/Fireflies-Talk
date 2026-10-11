import { useCallback } from "react";
import { useLocalSettings } from "@/features/settings";

// Show upsell at these click counts (if autoStartNotes is still off)
const UPSELL_AT_COUNTS = [1, 5, 10];
// Never show again after the 10th click dismissal
const UPSELL_MAX_COUNT = 10;

function showUpsellNotification(): void {
  setTimeout(() => {
    window.electron?.notification.show(
      "Never miss a meeting",
      "Automatically start taking notes when meeting is detected on all future meetings",
      "/enable-auto-start-notes",
      "Enable",
      { showProgress: false, showCloseAlways: true },
    );
  }, 5000);
}

/**
 * Tracks "Take Notes" clicks from meeting-detection notifications and shows
 * a prompt to enable auto-start at the 1st, 5th and 10th click.
 * Must be called inside RecordActionsContextProvider.
 */
export function useAutoStartNotesUpsell() {
  const { autoStartNotes, takeNotesClickCount, setTakeNotesClickCount } =
    useLocalSettings();

  const handleTakeNotesFromNotification = useCallback(() => {
    // Already enabled — nothing to upsell
    if (autoStartNotes) return;
    // Past the max threshold — never show again
    if (takeNotesClickCount >= UPSELL_MAX_COUNT) return;

    const newCount = takeNotesClickCount + 1;
    setTakeNotesClickCount(newCount);

    if (UPSELL_AT_COUNTS.includes(newCount)) {
      showUpsellNotification();
    }
  }, [autoStartNotes, takeNotesClickCount, setTakeNotesClickCount]);

  return { handleTakeNotesFromNotification };
}
