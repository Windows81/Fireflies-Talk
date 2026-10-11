const SELF_START_WINDOW_MS = 8000;

let suppressUntil = 0;

// Ignore live-meeting signals briefly while the recorder creates its meeting
// and has not yet received the meeting id needed for exact matching.
export const liveMeetingNotifier = {
  beginSelfStart: () => {
    suppressUntil = Date.now() + SELF_START_WINDOW_MS;
  },
  cancelSelfStart: () => {
    suppressUntil = 0;
  },
};

export function isLiveMeetingNotificationSuppressed(): boolean {
  return Date.now() < suppressUntil;
}
