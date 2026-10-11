// note: TeamOnboardingSuggestionType and OnboardingStep are different
// from EnumTeamOnboardingSuggestionType, EnumOnboardingStep that are used as inputs

export enum TeamOnboardingSuggestionType {
  INVITE = "invite",
  INVITE_SUGGESTION = "invite-suggestions",
  AUTO_ADD_TEAM = "auto-add-teams",
  REQUEST_TEAMS = "request-teams",
  NONE = "none",
}

export enum OnboardingStep {
  SETUP = "setup",
  ROLE_AND_TITLE = "role-and-title",
  TOOLS = "tools",
  TEAM_ONBOARDING = "team-onboarding",
  FREE_TRIAL = "free-trial",
  SELECT_LANGUAGE = "select-language",
  COMPLETED = "completed",
}
