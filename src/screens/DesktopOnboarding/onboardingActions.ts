import { toast } from "@/components/Toast";
import { authApi } from "@/features/auth";
import { storage as localStorageOrMemory } from "@/features/storage";
import { useTeam } from "@/features/team";
import {
  GetWelcomeMeetingsDocument,
  useInviteTeammatesMutation,
  EnumLoginPageVersion,
  EnumOnboardingStep,
  useGetCurrentUserQuery,
  useSaveOptionsMutation,
  EnumTeamOnboardingSuggestionType,
} from "@/graphql";
import { useRef } from "react";
import type { StepAction } from "./OnboardingContext";
import { ROLES_WITHOUT_TITLE, useOnboarding } from "./OnboardingContext";
import { useCompleteOnboardingStep } from "./hooks/useCompleteOnboardingStep";

const STEPS_TO_SHOW = [
  EnumOnboardingStep.RoleAndTitle,
  EnumOnboardingStep.EmailAssistant,
  EnumOnboardingStep.Tools,
  EnumOnboardingStep.SelectLanguage,
  EnumOnboardingStep.ReferralSource,
];

export function useOnboardingActions() {
  const { team } = useTeam();
  const {
    currentStep,
    goNext,
    autoJoin,
    sendNotesTo,
    selectedRole,
    customRole,
    inviteEmails,
    selectedTitle,
    customTitle,
    selectedApps,
    customApp,
  } = useOnboarding();
  const { data: dataUser } = useGetCurrentUserQuery();
  const { completeStep, recordStep } = useCompleteOnboardingStep();
  const isSavingAutoJoin = useRef(false);
  const isSavingPermissions = useRef(false);
  const [saveOptions] = useSaveOptionsMutation({
    onError(err) {
      toast({
        title: "Could not save settings",
        message: err.message,
        type: "error",
      });
    },
  });

  const [inviteTeammatesMutation] = useInviteTeammatesMutation({
    onCompleted(data) {
      if (data.inviteTeammates !== "Invitations sent!") {
        toast({ message: data.inviteTeammates });
      } else {
        toast({
          message: "Invitations sent!",
          type: "success",
        });
      }
    },
    onError(err) {
      toast({
        title: "Could not send invite",
        message: err.message,
        type: "error",
      });
    },
  });

  const handleRole = () => {
    if (!selectedRole) return;

    if (ROLES_WITHOUT_TITLE.includes(selectedRole)) {
      completeStep({
        step: EnumOnboardingStep.RoleAndTitle,
        skip: false,
        extraInfo: {
          role: selectedRole,
          customRole: selectedRole === "other" ? customRole : null,
          title: null,
          stepsToShow: STEPS_TO_SHOW,
        },
      });
    } else {
      goNext();
    }
  };

  const handleTitle = () => {
    if (!selectedTitle) return;

    completeStep({
      step: EnumOnboardingStep.RoleAndTitle,
      skip: false,
      extraInfo: {
        role: selectedRole,
        customRole: null,
        title: selectedTitle === "other" ? customTitle : selectedTitle,
        stepsToShow: STEPS_TO_SHOW,
      },
    });
  };

  const handleIntegrationPreference = () => {
    if (selectedApps.length === 0) return;

    const hasCustomApp =
      selectedApps.includes("other") && customApp.trim().length > 0;
    const tools = hasCustomApp
      ? [...selectedApps.filter((app) => app !== "other"), customApp.trim()]
      : selectedApps;

    completeStep({
      step: EnumOnboardingStep.Tools,
      skip: false,
      extraInfo: { tools, stepsToShow: STEPS_TO_SHOW },
    });
  };

  const handleAutoJoinRecap = () => {
    if (isSavingAutoJoin.current) return;
    isSavingAutoJoin.current = true;

    saveOptions({
      variables: { autoJoin, sendNotesTo },
      refetchQueries: [GetWelcomeMeetingsDocument],
    }).finally(() => {
      const loginPageVersion = localStorageOrMemory.getItem("loginPageVariant");
      const validVersions: string[] = Object.values(EnumLoginPageVersion);
      const isValidVersion =
        loginPageVersion && validVersions.includes(loginPageVersion);

      isSavingAutoJoin.current = false;
      completeStep({
        step: EnumOnboardingStep.Setup,
        skip: false,
        extraInfo: {
          autoJoin,
          sendNotesTo,
          ...(isValidVersion
            ? { loginPageVersion: loginPageVersion as EnumLoginPageVersion }
            : {}),
        },
      });
    });
  };

  const handleSystemPermissions = () => {
    if (isSavingPermissions.current) return;
    isSavingPermissions.current = true;

    saveOptions({
      variables: {
        preferredLanguage: dataUser?.user?.preferredLanguage || "multi",
      },
      onCompleted({ saveOptions: result }) {
        if (result?.preferredLanguage) {
          authApi.updateUser({
            preferredLanguage: result.preferredLanguage,
          });
        }
      },
    })
      .finally(() =>
        recordStep({
          step: EnumOnboardingStep.SelectLanguage,
          skip: false,
          extraInfo: { stepsToShow: STEPS_TO_SHOW },
        }),
      )
      .finally(() => {
        isSavingPermissions.current = false;
        goNext();
      });
  };

  const handleInviteTeammates = (actionLabel: string) => {
    if (actionLabel === "I'll Do Later" || actionLabel === "Not Now") {
      completeStep({
        step: EnumOnboardingStep.TeamOnboarding,
        skip: false,
        extraInfo: {
          suggestion: EnumTeamOnboardingSuggestionType.RequestTeams,
        },
      });
      return;
    }

    const teamId = team?._id;
    if (!teamId) {
      toast({
        title: "Could not send invite",
        message: "Team not found",
        type: "error",
      });
      return;
    }

    inviteTeammatesMutation({
      variables: {
        teamId,
        teamEmails: inviteEmails,
        source: "desktop-onboarding",
      },
    }).then(() => {
      completeStep({
        step: EnumOnboardingStep.TeamOnboarding,
        skip: false,
        extraInfo: {
          suggestion: EnumTeamOnboardingSuggestionType.Invite,
        },
      });
    });
  };

  const handleAction = (action: StepAction) => {
    switch (currentStep.stepName) {
      case "role":
        return handleRole();
      case "title":
        return handleTitle();
      case "integrationPreference":
        return handleIntegrationPreference();
      case "autoJoinRecap":
        return handleAutoJoinRecap();
      case "systemAudioSettings":
        return goNext();
      case "inviteTeammates":
        return handleInviteTeammates(action.label);
      case "joinTeam":
        return handleInviteTeammates(action.label);
      case "systemPermissions":
        return handleSystemPermissions();
      default:
        return goNext();
    }
  };

  return { handleAction, currentStep, inviteEmails };
}
