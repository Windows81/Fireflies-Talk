import { tracker, TRACKING_EVENTS } from "@/tracking";
import * as StoreReview from "expo-store-review";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../storage";
import type { ReviewPromptConfig } from "./types";
import { checkMetThresholds, isReadyToShow, millisecondsToDays } from "./utils";

interface AppReviewStore {
  recordCount: number;
  sharedMeetingCount: number;
  completedTaskCount: number;
  secondsSpentInNotepad: number;
  previousReviewTimestamp: number | undefined;

  // Separate tier indices for each metric
  recordTierIndex: number;
  sharedMeetingTierIndex: number;
  completedTaskTierIndex: number;
  notepadTierIndex: number;

  promptIfReady: (config: ReviewPromptConfig) => void;
  increaseRecordCount: () => void;
  increaseSharedMeetingCount: () => void;
  increaseCompletedTaskCount: () => void;
  addSecondsSpentInNotepad: (seconds: number) => void;
}

export const useAppReviewStore = create(
  persist<AppReviewStore>(
    (set, get) => ({
      previousReviewTimestamp: undefined,
      recordCount: 0,
      sharedMeetingCount: 0,
      completedTaskCount: 0,
      secondsSpentInNotepad: 0,

      recordTierIndex: 0,
      sharedMeetingTierIndex: 0,
      completedTaskTierIndex: 0,
      notepadTierIndex: 0,

      promptIfReady: (config) => {
        const state = get();
        const metThresholds = checkMetThresholds(
          {
            recordCount: state.recordCount,
            sharedMeetingCount: state.sharedMeetingCount,
            completedTaskCount: state.completedTaskCount,
            secondsSpentInNotepad: state.secondsSpentInNotepad,
          },
          {
            recordTierIndex: state.recordTierIndex,
            sharedMeetingTierIndex: state.sharedMeetingTierIndex,
            completedTaskTierIndex: state.completedTaskTierIndex,
            notepadTierIndex: state.notepadTierIndex,
          },
          config,
        );

        const hasMetAny = Object.values(metThresholds).some(Boolean);

        if (
          hasMetAny &&
          isReadyToShow({
            previousReviewTimestamp: state.previousReviewTimestamp,
            minimumDaysBetweenPrompts: config.minimumDaysBetweenPrompts,
          })
        ) {
          void StoreReview.requestReview();

          const passedDays = state.previousReviewTimestamp
            ? millisecondsToDays(Date.now() - state.previousReviewTimestamp)
            : 0;

          tracker.track(TRACKING_EVENTS.REQUEST_APP_REVIEW_PROMPT, {
            ...metThresholds,
            day: passedDays,
            tiers: {
              recordTierIndex: state.recordTierIndex,
              sharedMeetingTierIndex: state.sharedMeetingTierIndex,
              completedTaskTierIndex: state.completedTaskTierIndex,
              notepadTierIndex: state.notepadTierIndex,
            },
            metrics: {
              recordCount: state.recordCount,
              sharedMeetingCount: state.sharedMeetingCount,
              completedTaskCount: state.completedTaskCount,
              secondsSpentInNotepad: state.secondsSpentInNotepad,
            },
          });

          set((state) => ({
            previousReviewTimestamp: Date.now(),
            recordCount: metThresholds.recordMet ? 0 : state.recordCount,
            sharedMeetingCount: metThresholds.sharedMeetingMet
              ? 0
              : state.sharedMeetingCount,
            completedTaskCount: metThresholds.completedTaskMet
              ? 0
              : state.completedTaskCount,
            secondsSpentInNotepad: metThresholds.notepadMet
              ? 0
              : state.secondsSpentInNotepad,
            recordTierIndex: metThresholds.recordMet
              ? state.recordTierIndex + 1
              : state.recordTierIndex,
            sharedMeetingTierIndex: metThresholds.sharedMeetingMet
              ? state.sharedMeetingTierIndex + 1
              : state.sharedMeetingTierIndex,
            completedTaskTierIndex: metThresholds.completedTaskMet
              ? state.completedTaskTierIndex + 1
              : state.completedTaskTierIndex,
            notepadTierIndex: metThresholds.notepadMet
              ? state.notepadTierIndex + 1
              : state.notepadTierIndex,
          }));
        }
      },

      increaseRecordCount: () => {
        set((state) => ({
          recordCount: state.recordCount + 1,
        }));
      },

      increaseSharedMeetingCount: () => {
        set((state) => ({
          sharedMeetingCount: state.sharedMeetingCount + 1,
        }));
      },

      increaseCompletedTaskCount: () => {
        set((state) => ({
          completedTaskCount: state.completedTaskCount + 1,
        }));
      },

      addSecondsSpentInNotepad: (seconds: number) => {
        set((state) => ({
          secondsSpentInNotepad: state.secondsSpentInNotepad + seconds,
        }));
      },
    }),
    {
      name: "app-review",
      storage: createJSONStorage(() => storage),
    },
  ),
);

export const appReviewApi = useAppReviewStore.getState() as Pick<
  AppReviewStore,
  | "promptIfReady"
  | "increaseRecordCount"
  | "increaseSharedMeetingCount"
  | "increaseCompletedTaskCount"
  | "addSecondsSpentInNotepad"
>;
