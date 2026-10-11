import { TeamOnboardingSuggestionType } from "@/features/onboarding";
import { EnumTeamOnboardingSuggestionType } from "@/graphql";

export const teamOnboardingSuggestionToTrackingEnumMap = {
  [TeamOnboardingSuggestionType.INVITE]:
    EnumTeamOnboardingSuggestionType.Invite,
  [TeamOnboardingSuggestionType.INVITE_SUGGESTION]:
    EnumTeamOnboardingSuggestionType.InviteSuggestion,
  [TeamOnboardingSuggestionType.REQUEST_TEAMS]:
    EnumTeamOnboardingSuggestionType.RequestTeams,
  [TeamOnboardingSuggestionType.NONE]: EnumTeamOnboardingSuggestionType.None,
  [TeamOnboardingSuggestionType.AUTO_ADD_TEAM]:
    EnumTeamOnboardingSuggestionType.AutoAddTeam,
};
