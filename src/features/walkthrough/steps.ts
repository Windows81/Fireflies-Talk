export type TipPlacement = "left" | "right" | "top" | "bottom";

export interface WalkthroughStepConfig {
  title: string;
  description: string;
  placement: TipPlacement;
  offsetTop?: number;
  offsetLeft?: number;
  arrowOffset?: { top?: number; left?: number };
}

export const WALKTHROUGH_STEPS: WalkthroughStepConfig[] = [
  {
    title: "Upcoming Meetings",
    description: "Find all your scheduled upcoming meetings here.",
    placement: "left",
    offsetTop: -10,
    offsetLeft: 10,
  },
  {
    title: "Take notes without a bot",
    description: "Capture any conversation using your computer audio",
    placement: "bottom",
    offsetLeft: -100,
    arrowOffset: { left: 100 },
  },
  {
    title: "Invite notetaker",
    description:
      "Invite the bot to your calls to record audio, video and speaker names",
    placement: "left",
    offsetTop: 90,
  },
];
