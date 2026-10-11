import { useRef, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { appReviewApi } from "./app-review.store";
import { RouteNames } from "@/constants";

const TRACKING_INTERVAL_SECONDS = 30;

export const useScreenTimeTracker = () => {
  const currentRouteNameRef = useRef<undefined | string>(undefined);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startTracking = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (currentRouteNameRef.current === RouteNames.Notepad) {
          appReviewApi.addSecondsSpentInNotepad(TRACKING_INTERVAL_SECONDS);
        }
      }, TRACKING_INTERVAL_SECONDS * 1000);
    };

    const stopTracking = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        startTracking();
      } else {
        stopTracking();
      }
    });

    if (AppState.currentState === "active") {
      startTracking();
    }

    return () => {
      subscription.remove();
      stopTracking();
    };
  }, []);

  const onNavigationStateChange = useCallback((newRouteName: string) => {
    currentRouteNameRef.current = newRouteName;
  }, []);

  return { onNavigationStateChange };
};
