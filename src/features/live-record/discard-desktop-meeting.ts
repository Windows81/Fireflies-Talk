import { isDesktopRecording } from "./stop-live-meeting";

interface DiscardDesktopMeetingOptions {
  meetingId: string;
  addedBy?: string | null;
  discardRecording: () => Promise<boolean>;
  stopMeeting: (options: {
    meetingId: string;
    completed: false;
  }) => Promise<void>;
  endPuppetCall: () => Promise<unknown>;
  deleteMeeting: () => Promise<unknown>;
}

interface DiscardState {
  current: boolean;
}

/** Claim a discard attempt so rapid repeated controls cannot delete twice. */
export function beginDesktopMeetingDiscard(state: DiscardState): boolean {
  if (state.current) return false;
  state.current = true;
  return true;
}

/** Serialize local teardown, the lifecycle stop or puppet end call, and deletion. */
export async function discardDesktopMeeting({
  meetingId,
  addedBy,
  discardRecording,
  stopMeeting,
  endPuppetCall,
  deleteMeeting,
}: DiscardDesktopMeetingOptions): Promise<void> {
  const recorderDiscarded = await discardRecording();
  if (!recorderDiscarded) {
    throw new Error("Recorder teardown did not complete");
  }

  // A bot-recorded meeting has no puppet-facing realtime stop: the bot only
  // leaves the call through endPuppetCall, otherwise it keeps recording into a
  // meeting that is about to be deleted.
  if (isDesktopRecording(addedBy)) {
    await stopMeeting({ meetingId, completed: false });
  } else {
    await endPuppetCall();
  }
  await deleteMeeting();
}
