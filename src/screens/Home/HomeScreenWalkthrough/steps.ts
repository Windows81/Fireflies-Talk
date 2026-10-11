export type HomeWalkthroughStepKey = "calendar" | "record" | "capture";

export interface SpotlightOffsets {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface HomeWalkthroughStep {
  key: HomeWalkthroughStepKey;
  title: string;
  description: string;
  placement: "top" | "bottom";
  spotlightOffsets: SpotlightOffsets;
}

export const HOME_WALKTHROUGH_STEPS: HomeWalkthroughStep[] = [
  {
    key: "calendar",
    title: "Your Upcoming Meetings",
    description: "Tap here to see what's on your calendar.",
    placement: "top",
    spotlightOffsets: { top: -4, left: -8, right: -8, bottom: -4 },
  },
  {
    key: "record",
    title: "One Tap record",
    description: "Instantly capture the conversation around you.",
    placement: "top",
    spotlightOffsets: { top: -6, left: -8, right: -8, bottom: -14 },
  },
  {
    key: "capture",
    title: "Capture a Conversation",
    description:
      "Join a live meeting, record in-person, schedule ahead, or upload a file.",
    placement: "bottom",
    spotlightOffsets: { top: 0, left: 0, right: 0, bottom: 0 },
  },
];
