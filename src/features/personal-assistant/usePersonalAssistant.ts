import {
  useGetPersonalAssistantQuery,
  EnumAiCreditsFreeAccessCampaigns,
  type AppSettingsFieldsFragment,
} from "@/graphql";
import { useBilling } from "@/features/billing/useBilling";
import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";
import { useTeam } from "@/features/team";
import {
  PERSONAL_ASSISTANT_TRIAL_BANNER_DISMISSED_FLAG_KEY,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { useQuery } from "@apollo/client";
import { GetFeedTasksDocument } from "@firefliesai/tasks-ff.graphql-client";
import { differenceInDays } from "date-fns";
import { useMemo, useState } from "react";

import { useToggleAppSettings } from "./useToggleAppSettings";
import {
  useMeetingPrepApp,
  type UseMeetingPrepAppResult,
} from "./useMeetingPrepApp";

export type PersonalAssistantTrialStage =
  | "access-start"
  | "7-day"
  | "2-day"
  | "access-end";

export interface PersonalAssistantTrial {
  stage: PersonalAssistantTrialStage;
  daysLeft: number;

  // Some campaigns (like AutoEnabledAiAppsNoAutoSubscribe) require manual opt-in
  // admins must opt in to keep PA running.
  requiresManualOptIn: boolean;
}

export interface UsePersonalAssistantResult {
  /**
   * Full access — user can use Personal Assistant features without restriction.
   * Mirrors dashboard's `isAllowedToUsePrompts`: AskFred flag, AI credits left,
   * or an active AI Extensions subscription/trial.
   */
  isAllowedToUsePrompts: boolean;
  /**
   * Whether the "0 AI credits — Get AI Credits" paywall banner should render
   * above the cards. True whenever the user lacks full access. Matches web
   * (`PersonalAssistant.tsx:45`) and is independent of the trial banner —
   * both can show at once.
   */
  showCreditsPaywall: boolean;
  /**
   * Whether Personal Assistant auto-enable is active for this user. True if
   * the `AI_APPS_SERVICE_AUTO_ENABLE_APPS` GrowthBook flag targets any app
   * OR an existing app (dailyBrief / popularTopics) has `autoEnabled` set
   * server-side. Mirrors dashboard `usePersonalAssistant.isEnabled`.
   */
  isEnabled: boolean;
  /**
   * Whether the Personal Assistant section should be visible. True when
   * `isEnabled` and at least one app has settings, or while data is still
   * loading. Mirrors dashboard's `shouldShowPersonalAssistantSection`.
   */
  shouldShowSection: boolean;

  dailyBriefAppSettings: AppSettingsFieldsFragment | undefined;
  /** Cached audio narration URL for the latest daily brief, if generated. */
  dailyBriefAudioUrl: string | undefined;
  meetingPrepApp: UseMeetingPrepAppResult["meetingPrepApp"];
  dailyBriefMeetingCount: number;
  taskCount: number;

  isDailyBriefActive: boolean;
  isMeetingPrepActive: boolean;
  /** Master state — true when Daily Brief or Meeting Prep is active. */
  isPersonalAssistantOn: boolean;

  trial: PersonalAssistantTrial | null;
  isTrialBannerDismissed: boolean;
  dismissTrialBanner: () => void;

  loading: boolean;
  isTogglingDailyBrief: boolean;
  isTogglingMeetingPrep: boolean;
  isTogglingPersonalAssistant: boolean;

  setDailyBriefEnabled: (active: boolean) => Promise<void>;
  setMeetingPrepEnabled: (active: boolean) => Promise<void>;
  togglePersonalAssistant: (active: boolean) => Promise<void>;
}

const TRIAL_CAMPAIGNS = [
  EnumAiCreditsFreeAccessCampaigns.AutoEnabledAiApps,
  EnumAiCreditsFreeAccessCampaigns.AutoEnabledAiAppsFree,
  EnumAiCreditsFreeAccessCampaigns.AutoEnabledAiAppsNoAutoSubscribe,
];

// Showing tasks from `COUNT_TASKS_FROM_DAYS` previous days.
const COUNT_TASKS_FROM_DAYS = 7;

export const usePersonalAssistant = (): UsePersonalAssistantResult => {
  // Personal Assistant access mirrors dashboard's three-way model:
  //   1. Full access  — `isAllowedToUsePrompts` (AskFred / credits / sub)
  //   2. Trial        — `team.aiCreditsFreeAccess` campaign active
  //   3. No access    — `!isAllowedToUsePrompts` AND no trial → paywall banner
  const {
    isAllowedToUsePrompts,
    hasLoaded: hasBillingLoaded,
    loading: billingLoading,
  } = useBilling();

  const { data, loading: paLoading } = useGetPersonalAssistantQuery();

  const {
    meetingPrepApp,
    loading: meetingPrepLoading,
    toggling: isTogglingMeetingPrep,
    setMeetingPrepEnabled,
  } = useMeetingPrepApp();
  const { setAppEnabled, loading: isTogglingDailyBrief } =
    useToggleAppSettings();

  const { team } = useTeam();

  const { data: feedTasksData, loading: feedTasksLoading } = useQuery(
    GetFeedTasksDocument,
    {
      variables: { onlyMine: true, limit: 20 },
    },
  );

  const taskCount = useMemo(() => {
    const cutoff = Date.now() - COUNT_TASKS_FROM_DAYS * 24 * 60 * 60 * 1000;
    const meetings = feedTasksData?.getFeedTasks?.meetings ?? [];
    return meetings.reduce((acc, meeting) => {
      if (!meeting.startTime) return acc;
      const startMs = new Date(meeting.startTime).getTime();
      if (Number.isNaN(startMs) || startMs < cutoff) return acc;
      return acc + meeting.tasks.length;
    }, 0);
  }, [feedTasksData]);

  // `dailyDigest` is the server schema field name for the Daily Brief app
  const dailyBrief = data?.getPersonalAssistant?.dailyDigest;
  const popularTopics = data?.getPersonalAssistant?.popularTopics;

  const autoEnabledAppsFlag = useFeatureValue<string[]>(
    FEATURE_FLAGS.AI_APPS_SERVICE_AUTO_ENABLE_APPS,
    [],
  );
  const hasAutoEnabledApp =
    !!dailyBrief?.appSettings?.autoEnabled ||
    !!popularTopics?.appSettings?.autoEnabled;
  const isEnabled = autoEnabledAppsFlag.length > 0 || hasAutoEnabledApp;
  const shouldShowSection =
    paLoading ||
    meetingPrepLoading ||
    (isEnabled &&
      !!(
        dailyBrief?.appSettings ||
        popularTopics?.appSettings ||
        meetingPrepApp
      ));

  const setDailyBriefEnabled = async (active: boolean) => {
    const id = dailyBrief?.appSettings?.id;
    if (!id) return;
    await setAppEnabled(id, active);
  };

  const isDailyBriefActive = !!dailyBrief?.appSettings?.active;
  const isMeetingPrepActive = !!meetingPrepApp?.active;
  const isPersonalAssistantOn = isDailyBriefActive || isMeetingPrepActive;

  const [isTogglingPersonalAssistant, setIsTogglingPersonalAssistant] =
    useState(false);

  const togglePersonalAssistant = async (active: boolean) => {
    const promises: Promise<void>[] = [];
    if (active !== isDailyBriefActive) {
      promises.push(setDailyBriefEnabled(active));
    }
    if (active !== isMeetingPrepActive) {
      promises.push(setMeetingPrepEnabled(active));
    }
    if (!promises.length) return;
    setIsTogglingPersonalAssistant(true);
    try {
      await Promise.all(promises);
    } finally {
      setIsTogglingPersonalAssistant(false);
    }
  };

  const isTrialBannerDismissed = userLocalUserFlagsStore(
    (s) => s.flags[PERSONAL_ASSISTANT_TRIAL_BANNER_DISMISSED_FLAG_KEY] === true,
  );
  const dismissTrialBanner = () => {
    setLocalUserFlag(PERSONAL_ASSISTANT_TRIAL_BANNER_DISMISSED_FLAG_KEY, true);
  };

  const trial = useMemo<PersonalAssistantTrial | null>(() => {
    const access = team?.aiCreditsFreeAccess;
    if (!access?.campaign || !access.startedAt || !access.endsAt) return null;
    if (access.canceledAt) return null;
    if (!TRIAL_CAMPAIGNS.includes(access.campaign)) return null;

    const requiresManualOptIn =
      access.campaign ===
      EnumAiCreditsFreeAccessCampaigns.AutoEnabledAiAppsNoAutoSubscribe;

    const now = new Date();
    const startedAt = new Date(access.startedAt);
    const endsAt = new Date(access.endsAt);
    const daysLeft = Math.max(0, differenceInDays(endsAt, now));

    if (now > endsAt) {
      // Auto-subscribe campaigns silently roll over — no end-of-trial banner.
      if (!requiresManualOptIn) return null;
      return { stage: "access-end", daysLeft: 0, requiresManualOptIn };
    }
    if (daysLeft <= 2) return { stage: "2-day", daysLeft, requiresManualOptIn };
    if (daysLeft <= 7) return { stage: "7-day", daysLeft, requiresManualOptIn };
    if (now > startedAt)
      return { stage: "access-start", daysLeft, requiresManualOptIn };
    return null;
  }, [team?.aiCreditsFreeAccess]);

  return {
    isAllowedToUsePrompts,
    showCreditsPaywall: hasBillingLoaded && !isAllowedToUsePrompts,
    isEnabled,
    shouldShowSection,
    dailyBriefAppSettings: dailyBrief?.appSettings ?? undefined,
    dailyBriefAudioUrl: dailyBrief?.audioUrl ?? undefined,
    meetingPrepApp,
    dailyBriefMeetingCount: dailyBrief?.meetingCount ?? 0,
    taskCount,
    isDailyBriefActive,
    isMeetingPrepActive,
    isPersonalAssistantOn,
    trial,
    isTrialBannerDismissed,
    dismissTrialBanner,
    loading:
      paLoading || meetingPrepLoading || feedTasksLoading || billingLoading,
    isTogglingDailyBrief,
    isTogglingMeetingPrep,
    isTogglingPersonalAssistant,
    setDailyBriefEnabled,
    setMeetingPrepEnabled,
    togglePersonalAssistant,
  };
};
