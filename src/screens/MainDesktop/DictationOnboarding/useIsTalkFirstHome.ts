import { useAuth } from "@/features/auth";
import { useFeatureFlagsResolved } from "@/features/feature-flags";
import { useShouldShowOnboarding } from "@/features/onboarding";
import { useDesktopLifecycleStore } from "@/features/user-flags";
import { useDictationTalkPolicy } from "@/hooks/useDictationTalkPolicy";
import { useIsDictationAvailable } from "@/hooks/useIsDictationAvailable";
import { isDesktop } from "@/utils/device";
import { isTalkFirstHome } from "./progress";

export function useIsTalkFirstHome(): { talkFirst: boolean; pending: boolean } {
  const installRef = useDesktopLifecycleStore((state) => state.installRef);
  const dictationAvailable = useIsDictationAvailable();
  const { loading: policyLoading } = useDictationTalkPolicy();
  const { completed, loading: onboardingLoading } = useShouldShowOnboarding();
  const userId = useAuth((state) => state.user?.id ?? null);
  const featureFlagsResolvedUserId = useFeatureFlagsResolved(
    (state) => state.resolvedUserId,
  );

  if (!isDesktop || installRef !== "talk") {
    return { talkFirst: false, pending: false };
  }

  const pending =
    policyLoading || onboardingLoading || featureFlagsResolvedUserId !== userId;

  return {
    talkFirst:
      !pending &&
      isTalkFirstHome({
        installRef,
        dictationAvailable,
        notetakerOnboardingCompleted: completed,
      }),
    pending,
  };
}
