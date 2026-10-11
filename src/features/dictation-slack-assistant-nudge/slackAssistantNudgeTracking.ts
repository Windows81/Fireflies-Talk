import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { DictationSlackAssistantAction } from "electron/src/types";
import type { UserSlackAssistantNudge } from "./nudgeState";

type SlackAssistantNudgeTrackProps = {
  slackDictations: number;
  timesSeen: number;
};

const ACTION_EVENTS = {
  close: TRACKING_EVENTS.DESKTOP_TALK_SLACK_ASSISTANT_NUDGE_DISMISSED,
  connect: TRACKING_EVENTS.DESKTOP_TALK_SLACK_ASSISTANT_NUDGE_CLICKED,
} satisfies Record<DictationSlackAssistantAction, TRACKING_EVENTS>;

export function slackAssistantNudgeTrackProps(
  nudge: UserSlackAssistantNudge,
): SlackAssistantNudgeTrackProps {
  return {
    slackDictations: nudge.slackDictations,
    timesSeen: nudge.timesSeen,
  };
}

export function slackAssistantNudgeActionEvent(
  action: DictationSlackAssistantAction,
): TRACKING_EVENTS {
  return ACTION_EVENTS[action];
}

export function trackSlackAssistantNudgeShown(
  props: SlackAssistantNudgeTrackProps,
): void {
  tracker.track(
    TRACKING_EVENTS.DESKTOP_TALK_SLACK_ASSISTANT_NUDGE_SHOWN,
    props,
  );
}

export function trackSlackAssistantNudgeAction(
  action: DictationSlackAssistantAction,
  props: SlackAssistantNudgeTrackProps,
): void {
  tracker.track(slackAssistantNudgeActionEvent(action), props);
}
