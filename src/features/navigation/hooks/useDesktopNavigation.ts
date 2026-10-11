import { RouteNames } from "@/constants";
import { feedbackNudgeApi } from "@/features/feedback-nudge/feedback-nudge.store";
import { Logger } from "@/logger";
import { navigationRef } from "@/screens/RootNavigation";
import type { ParamList } from "@/screens/types";
import { useEffect } from "react";

const logger = new Logger("navigator");

/**
 * Map a deeplink route path (e.g. "/MainDesktop", "/login?access_token=...") to
 * a React Navigation screen name + params.  Falls back to MainDesktop for
 * unknown routes so the app never ends up in a broken state.
 */
const resolveRouteFromPath = (
  route: string,
): { name: keyof ParamList; params?: Record<string, string> } => {
  const stripped = route.replace(/^\//, "");
  const qIndex = stripped.indexOf("?");
  const pathPart = qIndex >= 0 ? stripped.slice(0, qIndex) : stripped;
  const queryPart = qIndex >= 0 ? stripped.slice(qIndex + 1) : undefined;
  const segment = pathPart.split("/")[0];

  const match = Object.values(RouteNames).find(
    (r) => r.toLowerCase() === segment.toLowerCase(),
  );

  const name = (match ?? RouteNames.MainDesktop) as keyof ParamList;

  // Parse query string into params (e.g. login tokens)
  const params: Record<string, string> = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  // Include path segments after the route name (e.g. "/view/abc123" → { id: "abc123" })
  const subPath = pathPart.slice(segment.length + 1);
  if (subPath) {
    params.id = subPath;
  }

  return Object.keys(params).length > 0 ? { name, params } : { name };
};

export const useDesktopNavigation = () => {
  useEffect(() => {
    const electron = window.electron;
    if (!electron) return;

    const cleanups: Array<() => void> = [];

    // Navigate to home when triggered from live window close
    if (electron.onNavigateToHome) {
      const unsubscribe = electron.onNavigateToHome(() => {
        logger.info("navigating to home from electron event");
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(RouteNames.MainDesktop);
        }
        feedbackNudgeApi.showPendingNudge();
      });
      cleanups.push(unsubscribe);
    }

    // Navigate to live meeting when requested from another window (no focus change)
    if (electron.onNavigateToLive) {
      const unsubscribe = electron.onNavigateToLive((meetingId) => {
        logger.info("navigating to live from electron event", { meetingId });
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(RouteNames.Live, { id: meetingId });
        }
      });
      cleanups.push(unsubscribe);
    }

    // Handle deeplink-driven navigation without a full page reload
    if (electron.onNavigateToRoute) {
      const unsubscribe = electron.onNavigateToRoute((route) => {
        logger.info("navigating from deeplink", { route });
        if (!navigationRef.current?.isReady()) return;

        const { name, params } = resolveRouteFromPath(route);
        navigationRef.current.navigate(name as any, params as any);
      });
      cleanups.push(unsubscribe);
    }

    if (cleanups.length === 0) return;

    return () => {
      cleanups.forEach((cleanup) => {
        cleanup();
      });
    };
  }, []);
};
