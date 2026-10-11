import { create } from "zustand";

// Per-meeting ref-count for summary (re)processing jobs. Multiple consumers
// (template change, merge, retranscribe, detect-on-mount) can overlap; one
// settle must not hide another active job.
interface SummaryProcessingState {
  jobCounts: Record<string, number>;
  isProcessing: (meetingId: string) => boolean;
  acquire: (meetingId: string) => void;
  release: (meetingId: string) => void;
  clearMeeting: (meetingId: string) => void;
}

const countFor = (counts: Record<string, number>, meetingId: string) =>
  counts[meetingId] ?? 0;

export const useSummaryProcessingStore = create<SummaryProcessingState>(
  (set, get) => ({
    jobCounts: {},
    isProcessing: (meetingId) => countFor(get().jobCounts, meetingId) > 0,
    acquire: (meetingId) =>
      set((state) => ({
        jobCounts: {
          ...state.jobCounts,
          [meetingId]: countFor(state.jobCounts, meetingId) + 1,
        },
      })),
    release: (meetingId) =>
      set((state) => {
        const next = countFor(state.jobCounts, meetingId) - 1;
        const jobCounts = { ...state.jobCounts };
        if (next <= 0) {
          delete jobCounts[meetingId];
        } else {
          jobCounts[meetingId] = next;
        }
        return { jobCounts };
      }),
    clearMeeting: (meetingId) =>
      set((state) => {
        const jobCounts = { ...state.jobCounts };
        delete jobCounts[meetingId];
        return { jobCounts };
      }),
  }),
);
