import { TRACKING_EVENTS, tracker } from "@/tracking";
import type {
  DictationEmailAssistantAction,
  DictationEmailAssistantProvider,
} from "electron/src/types";
import type { UserEmailAssistantNudge } from "./nudgeState";

type EmailAssistantNudgeTrackProps = {
  emailApp?: string;
  emailDictations: number;
  timesSeen: number;
  provider: DictationEmailAssistantProvider;
};

const ACTION_EVENTS = {
  close: TRACKING_EVENTS.DESKTOP_TALK_EMAIL_ASSISTANT_NUDGE_DISMISSED,
  connect: TRACKING_EVENTS.DESKTOP_TALK_EMAIL_ASSISTANT_NUDGE_CLICKED,
} satisfies Record<DictationEmailAssistantAction, TRACKING_EVENTS>;

export function emailAssistantNudgeTrackProps(
  nudge: UserEmailAssistantNudge,
  provider: DictationEmailAssistantProvider,
): EmailAssistantNudgeTrackProps {
  return {
    emailApp: nudge.lastEmailApp,
    emailDictations: nudge.emailDictations,
    timesSeen: nudge.timesSeen,
    provider,
  };
}

export function emailAssistantNudgeActionEvent(
  action: DictationEmailAssistantAction,
): TRACKING_EVENTS {
  return ACTION_EVENTS[action];
}

export function trackEmailAssistantNudgeShown(
  props: EmailAssistantNudgeTrackProps,
): void {
  tracker.track(
    TRACKING_EVENTS.DESKTOP_TALK_EMAIL_ASSISTANT_NUDGE_SHOWN,
    props,
  );
}

export function trackEmailAssistantNudgeAction(
  action: DictationEmailAssistantAction,
  props: EmailAssistantNudgeTrackProps,
): void {
  tracker.track(emailAssistantNudgeActionEvent(action), props);
}
