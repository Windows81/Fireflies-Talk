import { create } from "zustand";
import { isDesktop } from "@/utils/device";

interface MeetingEndAnimationStore {
  meetingId: string | null;
  isShowing: boolean;
  shouldEnterFullscreen: boolean;
  onComplete: (() => Promise<void>) | null;
  autoHideTimer: NodeJS.Timeout | null;
  completedMeetings: Set<string>; // Track meetings that have shown animation

  show: (
    meetingId: string,
    onComplete?: () => Promise<void>,
    options?: { skipAnimation?: boolean },
  ) => void;
  hide: () => void;
  clearCompleted: (meetingId: string) => void;
  executeComplete: () => Promise<void>;
  reset: () => void;
}

const ANIMATION_DURATION = 3000; // 3 seconds

export const useMeetingEndAnimationStore = create<MeetingEndAnimationStore>(
  (set, get) => ({
    meetingId: null,
    isShowing: false,
    shouldEnterFullscreen: false,
    onComplete: null,
    autoHideTimer: null,
    completedMeetings: new Set(),

    show: (
      meetingId: string,
      onComplete?: () => Promise<void>,
      options?: { skipAnimation?: boolean },
    ) => {
      const { isShowing, autoHideTimer, completedMeetings } = get();

      // Prevent duplicate animations for the same meeting
      if (completedMeetings.has(meetingId)) {
        console.log(
          `[ANIMATION STORE] Animation already shown for meeting ${meetingId}, skipping`,
        );
        return;
      }

      // Prevent duplicate animations if already showing
      if (isShowing) {
        console.log("[ANIMATION STORE] Already showing, skipping");
        return;
      }

      if (options?.skipAnimation) {
        console.log(
          `[ANIMATION STORE] Skipping animation for meeting ${meetingId}`,
        );
        set({
          meetingId,
          isShowing: false,
          shouldEnterFullscreen: false,
          onComplete: onComplete || null,
          completedMeetings: new Set([...completedMeetings, meetingId]),
          autoHideTimer: null,
        });
        void get().executeComplete();
        return;
      }

      console.log(
        `[ANIMATION STORE] Showing animation for meeting ${meetingId}`,
      );

      // Clear any existing timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }

      // Show floating animation window (desktop only)
      if (isDesktop && window.electron?.meetingEndAnimation) {
        console.log("[ANIMATION STORE] Calling electron API to show window");
        window.electron.meetingEndAnimation.show();
      } else {
        console.warn("[ANIMATION STORE] Electron API not available");
      }

      // Set state and mark meeting as having shown animation
      set({
        meetingId,
        isShowing: true,
        shouldEnterFullscreen: true,
        onComplete: onComplete || null,
        completedMeetings: new Set([...completedMeetings, meetingId]),
        autoHideTimer: setTimeout(() => {
          console.log("[ANIMATION STORE] Auto-hiding after timeout");
          get().executeComplete();
        }, ANIMATION_DURATION),
      });
    },

    hide: () => {
      const { autoHideTimer } = get();

      console.log("[ANIMATION STORE] Hiding animation");

      // Clear timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }

      set({
        meetingId: null,
        isShowing: false,
        shouldEnterFullscreen: false,
        onComplete: null,
        autoHideTimer: null,
        // Keep completedMeetings to prevent re-showing for same meeting
      });

      // Hide floating animation window (desktop only)
      if (isDesktop && window.electron?.meetingEndAnimation) {
        console.log("[ANIMATION STORE] Calling electron API to hide window");
        window.electron.meetingEndAnimation.hide();
      }
    },

    clearCompleted: (meetingId: string) => {
      const { completedMeetings } = get();
      const nextCompletedMeetings = new Set(completedMeetings);
      nextCompletedMeetings.delete(meetingId);
      set({ completedMeetings: nextCompletedMeetings });
    },

    executeComplete: async () => {
      const { onComplete } = get();

      console.log("[ANIMATION STORE] Executing onComplete callback");

      // Execute the callback FIRST (before hiding)
      if (onComplete) {
        await onComplete();
      }

      // TODO: Enter fullscreen on liveFullWindow before PostMeetingPanel renders
      // Commented out until fullscreen transition is polished
      // if (
      //   shouldEnterFullscreen &&
      //   isDesktop &&
      //   window.electron?.liveView?.enterFullscreen
      // ) {
      //   console.log(
      //     "[ANIMATION STORE] Entering fullscreen before showing PostMeetingPanel",
      //   );
      //   await window.electron.liveView.enterFullscreen();
      // }

      // Then hide the animation
      get().hide();
    },

    reset: () => {
      const { autoHideTimer } = get();

      console.log("[ANIMATION STORE] Resetting store");

      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }

      set({
        meetingId: null,
        isShowing: false,
        shouldEnterFullscreen: false,
        onComplete: null,
        autoHideTimer: null,
        completedMeetings: new Set(),
      });
    },
  }),
);

export const meetingEndAnimationApi = useMeetingEndAnimationStore.getState();
