import { IconSampleAvatar, IconCalendar, IconLogo } from "@/assets/svg";
import type { Role, StepConfig } from "./types";

export const ROLES_WITHOUT_TITLE: Role[] = [
  "other",
  "freelancer",
  "student",
  "cxo_founder",
];

export const STEPS: StepConfig[] = [
  {
    stepName: "role",
    title: "What's Your Role?",
    subTitle:
      "Fireflies will personalize insights, suggestions, and meeting summaries",
    icons: [IconLogo],
    actions: [
      { label: "Continue", width: 280, marginTop: 20, variant: "primary" },
    ],
  },
  {
    stepName: "title",
    title: "What's Your Title?",
    subTitle:
      "Fireflies will personalize insights, suggestions, and meeting summaries",
    icons: [IconLogo],
    actions: [
      { label: "Continue", width: 280, marginTop: 20, variant: "primary" },
    ],
  },
  {
    stepName: "integrationPreference",
    title: "What Apps Do You Use?",
    subTitle:
      "Automatically send your meeting notes, action items and insights to your apps.",
    icons: [IconLogo],
    actions: [
      { label: "Continue", width: 280, marginTop: 20, variant: "primary" },
    ],
  },
  {
    stepName: "autoJoinRecap",
    title: "Choose Your Note Taking Preferences",
    subTitle:
      "When the bot is not present, the app can take notes from your computer audio.",
    icons: [IconLogo, IconCalendar],
    actions: [
      { label: "Continue", width: 200, marginTop: 64, variant: "primary" },
    ],
  },
  {
    stepName: "systemAudioSettings",
    title: "Capture Ad-Hoc Calls",
    subTitle:
      "When the notetaker is not joining, Fireflies can still detect and capture the conversation using your microphone.",
    icons: [IconLogo],
    footerInfo: "You can change this anytime in settings",
    actions: [
      { label: "Continue", width: 200, marginTop: 64, variant: "primary" },
    ],
  },
  {
    stepName: "systemPermissions",
    title: "Allow Access To Capture Your Meetings",
    subTitle:
      "Fireflies needs access to your mic & system audio to seamlessly capture your meetings",
    icons: [IconLogo],
    actions: [
      { label: "Continue", width: 280, marginTop: 20, variant: "primary" },
    ],
  },
  {
    stepName: "inviteTeammates",
    title: "Invite Co-Workers To Your Workspace",
    subTitle:
      "Collaborate with your teammates and easily share meetings and transcript",
    icons: [IconLogo, IconSampleAvatar],
    actions: [
      { label: "Invite", width: 280, variant: "primary" },
      {
        label: "I'll Do Later",
        width: 280,
        marginTop: 20,
        variant: "transparentPrimary",
        forceEnabled: true,
      },
    ],
  },
  {
    stepName: "joinTeam",
    title: "We Found Your Team on Fireflies",
    subTitle:
      "Join to collaborate with your teammates and easily share meetings and transcript",
    icons: [IconLogo],
    actions: [
      {
        label: "Not Now",
        width: 200,
        marginTop: 20,
        variant: "transparentPrimary",
      },
    ],
  },
  {
    stepName: "freeTrialPitch",
    title: "",
    customLayout: true,
    hideBackButton: true,
  },
  {
    stepName: "freeTrialCardDetails",
    title: "Start your 7 days free trial",
    customLayout: true,
  },
];
