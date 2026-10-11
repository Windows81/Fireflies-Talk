import { RouteNames } from "@/constants";
import { useShouldShowOnboarding } from "@/features/onboarding";
import {
  DESKTOP_FIRST_TIME_DEMO_FLAG_KEY,
  DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { useIsTalkFirstHome } from "@/screens/MainDesktop/DictationOnboarding/useIsTalkFirstHome";
import { RootNavigation } from "@/screens/RootNavigation";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";

type Stage = "intro-video" | "onboarding" | "demo";

export const OnboardingRedirectComponent: FC = () => {
  // Tracks the last stage we navigated to so we don't re-issue the same
  // redirect repeatedly, but still allow the chain to advance to the next
  // stage as flags flip (e.g. intro-video → desktop demo).
  const lastStageRef = useRef<Stage | null>(null);

  const { shouldShowOnboardings, completed, loading } =
    useShouldShowOnboarding();
  const { talkFirst, pending } = useIsTalkFirstHome();

  // Subscribe to flag changes so the effect re-evaluates after a stage flips
  // its corresponding flag (e.g. IntroVideoScreen sets intro-video.seen).
  const introVideoSeen = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_INTRO_VIDEO_SEEN_FLAG_KEY],
  );
  const firstTimeDemoSeen = userLocalUserFlagsStore(
    (s) => !!s.flags[DESKTOP_FIRST_TIME_DEMO_FLAG_KEY],
  );

  useEffect(() => {
    // Only run onboarding redirects in the main desktop window (skip live window, etc.)
    if (isDesktop && !isMainDesktopWindow()) return;

    // On desktop, show intro video once before login/onboarding (don't wait for auth)
    if (isDesktop && !introVideoSeen) {
      if (lastStageRef.current === "intro-video") return;
      lastStageRef.current = "intro-video";
      RootNavigation.navigate(RouteNames.IntroVideo);
      return;
    }

    if (loading) return;

    if (pending) return;

    if (shouldShowOnboardings && talkFirst) return;

    if (shouldShowOnboardings) {
      if (lastStageRef.current === "onboarding") return;
      lastStageRef.current = "onboarding";
      if (isDesktop) {
        RootNavigation.navigate(RouteNames.DesktopOnboarding);
      } else {
        RootNavigation.navigate(RouteNames.Onboarding);
      }
      return;
    }

    if (isDesktop && completed && !firstTimeDemoSeen) {
      if (
        lastStageRef.current === "demo" ||
        lastStageRef.current === "onboarding"
      ) {
        return;
      }
      lastStageRef.current = "demo";
      RootNavigation.navigate(RouteNames.DesktopOnboarding, {
        existingUserDemo: true,
      });
    }
  }, [
    shouldShowOnboardings,
    completed,
    loading,
    talkFirst,
    pending,
    introVideoSeen,
    firstTimeDemoSeen,
  ]);

  return null;
};
