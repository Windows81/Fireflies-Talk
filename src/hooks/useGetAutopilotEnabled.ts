import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";
import { AUTOPILOT_HOME_CHANNEL } from "@/features/channel/constants";
import { useGetCurrentUserQuery } from "@/graphql";
import { isPaidUser as checkIsPaidUser } from "@firefliesai/payments-ff.utils";

export const useGetAutopilotEnabled = () => {
  const { data } = useGetCurrentUserQuery();
  const user = data?.user;
  const isPaidUser = user ? checkIsPaidUser(user.paidUser || "") : false;

  // Get hasAccessToAITeammates from user's flags field (user-specific metadata, not from GrowthBook)
  const hasAccessToAITeammate = user?.flags?.hasAccessToAITeammates ?? false;

  // Feature flag for autopilot panel enabled
  const isAutopilotPanelEnabled =
    useFeatureValue<boolean>(FEATURE_FLAGS.AI_AGENTS, false) ?? false;

  // Feature flag for trial enabled
  const isTrialEnabled =
    useFeatureValue<boolean>(
      FEATURE_FLAGS.IS_AUTOPILOT_TRIAL_MODAL_ENABLED,
      false,
    ) ?? false;

  return {
    isAutopilotEnabled:
      isPaidUser &&
      (isTrialEnabled || hasAccessToAITeammate || isAutopilotPanelEnabled),
    autopilotInfo: {
      name: AUTOPILOT_HOME_CHANNEL.label,
      id: AUTOPILOT_HOME_CHANNEL.id,
    },
  };
};
