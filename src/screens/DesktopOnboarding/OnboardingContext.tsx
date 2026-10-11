import { AutoJoin, SendNotesTo } from "@/constants";
import { useDesktopPermissions } from "@/features/desktop-permissions";
import { type FreeTrialInterval } from "@/features/free-trial";
import {
  OnboardingStep,
  TeamOnboardingSuggestionType,
} from "@/features/onboarding";
import { useGetCurrentUserQuery } from "@/graphql";
import { useGetTeamOnboardingSuggestion } from "./hooks/useGetTeamOnboardingSuggestion";
import { ROLES_WITHOUT_TITLE, STEPS } from "./steps";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Role, StepConfig, StepName } from "./types";

export type { Role, StepAction, StepConfig, StepName } from "./types";
export { ROLES_WITHOUT_TITLE, STEPS } from "./steps";
export type { FreeTrialInterval } from "@/features/free-trial";

interface OnboardingContextValue {
  currentStepIndex: number;
  currentStep: StepConfig;
  totalSteps: number;
  autoJoin: AutoJoin;
  setAutoJoin: (value: AutoJoin) => void;
  sendNotesTo: SendNotesTo;
  setSendNotesTo: (value: SendNotesTo) => void;
  selectedRole: Role | null;
  setSelectedRole: (role: Role | null) => void;
  customRole: string;
  setCustomRole: (value: string) => void;
  selectedTitle: string | null;
  setSelectedTitle: (title: string | null) => void;
  inviteEmails: string[];
  setInviteEmails: Dispatch<SetStateAction<string[]>>;
  customTitle: string;
  setCustomTitle: (value: string) => void;
  selectedApps: string[];
  setSelectedApps: (apps: string[]) => void;
  customApp: string;
  setCustomApp: (value: string) => void;
  freeTrialInterval: FreeTrialInterval;
  setFreeTrialInterval: (interval: FreeTrialInterval) => void;
  isActionDisabled: boolean;
  goNext: () => void;
  goBack: () => void;
  /** Skip the trial flow entirely and finish onboarding. */
  skipFreeTrial: () => void;
  /** Mark onboarding as complete (used by FreeTrialCardDetails once subscription is created). */
  completeFreeTrial: () => void;
  isCompleting: boolean;
  /** Refresh permission state (used by SystemPermissions step so Continue button stays in sync) */
  refreshPermissions: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const NO_COMPLETED_STEPS: string[] = [];

const TRIAL_STEP_NAMES: Array<StepConfig["stepName"]> = [
  "freeTrialPitch",
  "freeTrialCardDetails",
];

/**
 * Steps whose answers are shared across Fireflies clients: once the matching
 * onboarding step is recorded (e.g. from the web app), the saved answer is kept
 * instead of asking for it again on desktop.
 */
const SERVER_STEP_BY_STEP_NAME: Partial<Record<StepName, string>> = {
  role: OnboardingStep.ROLE_AND_TITLE,
  title: OnboardingStep.ROLE_AND_TITLE,
  integrationPreference: OnboardingStep.TOOLS,
  inviteTeammates: OnboardingStep.TEAM_ONBOARDING,
  joinTeam: OnboardingStep.TEAM_ONBOARDING,
};

const getVisibleSteps = (
  teamOnboardingSuggestion: { suggestion: string } | undefined,
  selectedRole: Role | null,
  showFreeTrialSteps: boolean,
  completedSteps: string[],
): StepConfig[] => {
  const isRequestTeams =
    teamOnboardingSuggestion?.suggestion ===
    TeamOnboardingSuggestionType.REQUEST_TEAMS;
  const skipTitle =
    selectedRole !== null && ROLES_WITHOUT_TITLE.includes(selectedRole);
  return STEPS.filter((step) => {
    const serverStep = SERVER_STEP_BY_STEP_NAME[step.stepName];
    if (serverStep && completedSteps.includes(serverStep)) return false;
    if (step.stepName === "title" && skipTitle) return false;
    if (step.stepName === "inviteTeammates") return !isRequestTeams;
    if (step.stepName === "joinTeam") return isRequestTeams;
    if (TRIAL_STEP_NAMES.includes(step.stepName)) return showFreeTrialSteps;
    return true;
  });
};

export const OnboardingProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [autoJoin, setAutoJoin] = useState<AutoJoin>(AutoJoin.Auto);
  const [sendNotesTo, setSendNotesTo] = useState<SendNotesTo>(SendNotesTo.All);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [customApp, setCustomApp] = useState("");
  const [freeTrialInterval, setFreeTrialInterval] =
    useState<FreeTrialInterval>("year");
  const { teamOnboardingSuggestion } = useGetTeamOnboardingSuggestion();
  const { permissions, refresh } = useDesktopPermissions({ autoCheck: true });
  const { data: dataUser } = useGetCurrentUserQuery();
  // Client-side guard alongside the server-derived `freeTrial` suggestion: even
  // if the server marks the user eligible, never re-prompt anyone whose team
  // already has a trial on record.
  const hasTrialedBefore =
    dataUser?.user?.teamStripeAccount?.some(
      (account) => account?.hasTrialed === true,
    ) ?? false;
  const showFreeTrialSteps =
    teamOnboardingSuggestion?.freeTrial === true && !hasTrialedBefore;
  const { autoJoin: userAutoJoin, sendNotesTo: userSendNotesTo } =
    dataUser?.user ?? {};
  // Snapshot the recorded steps the first time the user loads: completing a step
  // refetches the user, and a step list that shrinks mid-flow would shift the
  // index-based navigation onto the wrong screen.
  const completedStepsRef = useRef<string[] | null>(null);
  if (completedStepsRef.current === null && dataUser?.user) {
    completedStepsRef.current =
      dataUser.user.onboardingStepsCompleted ?? NO_COMPLETED_STEPS;
  }
  const completedSteps = completedStepsRef.current ?? NO_COMPLETED_STEPS;

  useEffect(() => {
    if (userAutoJoin) {
      setAutoJoin(userAutoJoin as AutoJoin);
    }
    if (userSendNotesTo) {
      setSendNotesTo(userSendNotesTo as SendNotesTo);
    }
  }, [userAutoJoin, userSendNotesTo]);

  const visibleSteps = useMemo(
    () =>
      getVisibleSteps(
        teamOnboardingSuggestion,
        selectedRole,
        showFreeTrialSteps,
        completedSteps,
      ),
    [
      teamOnboardingSuggestion,
      selectedRole,
      showFreeTrialSteps,
      completedSteps,
    ],
  );

  useEffect(() => {
    const maxIndex = Math.max(0, visibleSteps.length - 1);
    setCurrentStepIndex((prev) => (prev > maxIndex ? maxIndex : prev));
  }, [visibleSteps.length]);

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1;
      if (next >= visibleSteps.length) {
        setIsCompleting(true);
        return prev;
      }
      return next;
    });
  }, [visibleSteps]);

  const goBack = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  /**
   * Skip the trial entirely. We jump straight to completion regardless of how many
   * trial-related steps remain after the current one.
   */
  const skipFreeTrial = useCallback(() => {
    setIsCompleting(true);
  }, []);

  /** Called once `createSubscription` resolves successfully. Mirrors `skipFreeTrial`. */
  const completeFreeTrial = useCallback(() => {
    setIsCompleting(true);
  }, []);

  const clampedIndex = Math.min(
    currentStepIndex,
    Math.max(0, visibleSteps.length - 1),
  );
  const currentStep = visibleSteps[clampedIndex];

  const isActionDisabled = useMemo((): boolean => {
    const step = currentStep?.stepName;

    switch (step) {
      case "role":
        return !selectedRole;
      case "title":
        return !selectedTitle;
      case "integrationPreference":
        return selectedApps.length === 0 && !customApp.trim();
      case "inviteTeammates":
        return inviteEmails.length === 0;
      case "systemPermissions": {
        const micGranted = permissions?.microphone === "granted";
        // Only macOS gates system audio/screen capture behind a separate
        // permission; on Windows the microphone grant is enough.
        const isMac = window?.electron?.platform === "darwin";
        if (!isMac) return !micGranted;
        // "unknown" means the native probe could not determine the status
        // (helper binary missing, errored or timed out) - treat it as
        // non-blocking so onboarding can never dead-end.
        const audioOk = [permissions?.systemAudio, permissions?.screen].some(
          (status) => status === "granted" || status === "unknown",
        );
        return !(micGranted && audioOk);
      }
      default:
        return false;
    }
  }, [
    currentStep?.stepName,
    selectedRole,
    selectedTitle,
    selectedApps,
    customApp,
    inviteEmails,
    permissions?.microphone,
    permissions?.systemAudio,
    permissions?.screen,
  ]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      currentStepIndex,
      currentStep,
      totalSteps: visibleSteps.length,
      autoJoin,
      setAutoJoin,
      sendNotesTo,
      setSendNotesTo,
      inviteEmails,
      setInviteEmails,
      selectedRole,
      setSelectedRole,
      customRole,
      setCustomRole,
      selectedTitle,
      setSelectedTitle,
      customTitle,
      setCustomTitle,
      selectedApps,
      setSelectedApps,
      customApp,
      setCustomApp,
      freeTrialInterval,
      setFreeTrialInterval,
      isActionDisabled,
      goNext,
      goBack,
      skipFreeTrial,
      completeFreeTrial,
      isCompleting,
      refreshPermissions: refresh,
    }),
    [
      currentStepIndex,
      currentStep,
      visibleSteps,
      autoJoin,
      sendNotesTo,
      inviteEmails,
      selectedRole,
      customRole,
      selectedTitle,
      customTitle,
      selectedApps,
      customApp,
      freeTrialInterval,
      isActionDisabled,
      goNext,
      goBack,
      skipFreeTrial,
      completeFreeTrial,
      isCompleting,
      refresh,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
