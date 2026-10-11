import { create } from "zustand";

interface DismissedPrepBannerState {
  dismissed: Record<string, boolean>;
  dismiss: (meetingId: string) => void;
}

// Tracks which meetings' "In the last meeting" banners the user dismissed.
// Kept in a store (not local state) so the dismissal survives switching notes
// views/tabs within the same live session.
const useStore = create<DismissedPrepBannerState>((set) => ({
  dismissed: {},
  dismiss: (meetingId) =>
    set((state) => ({
      dismissed: { ...state.dismissed, [meetingId]: true },
    })),
}));

export const useDismissedPrepBanner = (meetingId: string) => {
  const isDismissed = useStore((state) => !!state.dismissed[meetingId]);
  const dismissAction = useStore((state) => state.dismiss);
  return { isDismissed, dismiss: () => dismissAction(meetingId) };
};
