/**
 * Whether the meeting is being filmed through a camera that shows no recording
 * notice.
 *
 * The notice lives on the video: participants learn the meeting is being
 * recorded because the Fireflies Camera composites a badge onto it. Pick a
 * different camera and that notice is gone. Turning the notice off in Settings
 * opts out of the whole arrangement — the user obtains consent themselves and
 * nothing here applies.
 */

/**
 * Whether a missing notice also drops the recording's audio.
 *
 * Currently false: the product decision is to tell the user their camera
 * choice carries the responsibility, not to mute the meeting for them. The gate
 * that would do the muting is still wired end to end (see
 * `AudioRecorder.gateRecordingOutput`) so this is the only line that has to
 * change to reverse it.
 */
const SILENCE_WHEN_NOTICE_MISSING: boolean = false;

export type CameraNoticeReason =
  /** The user turned the recording notice off and owns consent themselves. */
  | "notice-disabled"
  /** An app is on the Fireflies Camera, so the notice is visible. */
  | "fireflies-camera-in-use"
  /** No camera at all — an audio-only meeting has no video to carry a notice. */
  | "no-camera-in-use"
  /** A camera that carries no notice is live. */
  | "foreign-camera-in-use";

export interface CameraRecordingPolicyInput {
  /** The recording notice is enabled and the camera device is installed. */
  noticeEnabled: boolean;
  /** How many apps are consuming the Fireflies Camera. */
  firefliesCameraConsumers: number;
  /** Labels for cameras in use outside the Fireflies Camera. */
  camerasInUse: string[];
}

export interface CameraRecordingPolicy {
  /** Participants are seeing video with no recording notice on it. */
  noticeMissing: boolean;
  /** Whether the recording's audio must be dropped. */
  silenceAudio: boolean;
  reason: CameraNoticeReason;
  /** The cameras behind the verdict; empty when the notice is in place. */
  camerasInUse: string[];
}

const satisfied = (reason: CameraNoticeReason): CameraRecordingPolicy => ({
  noticeMissing: false,
  silenceAudio: false,
  reason,
  camerasInUse: [],
});

export function evaluateCameraRecordingPolicy(
  input: CameraRecordingPolicyInput,
): CameraRecordingPolicy {
  if (!input.noticeEnabled) return satisfied("notice-disabled");

  // Checked before the camera list, and the reason the list never has to
  // exclude our own relay: the relay holds the webcam only while something is
  // consuming the Fireflies Camera, which is exactly this branch.
  if (input.firefliesCameraConsumers > 0) {
    return satisfied("fireflies-camera-in-use");
  }

  // An audio-only meeting has no video to badge, so there is nothing to warn
  // about. Flagging it would fire on the common case to no one's benefit.
  if (input.camerasInUse.length === 0) return satisfied("no-camera-in-use");

  return {
    noticeMissing: true,
    silenceAudio: SILENCE_WHEN_NOTICE_MISSING,
    reason: "foreign-camera-in-use",
    camerasInUse: input.camerasInUse,
  };
}

/** Short label for the notice and the logs; empty when the notice is in place. */
export function describeCameraNotice(policy: CameraRecordingPolicy): string {
  if (!policy.noticeMissing) return "";

  const [first, ...rest] = policy.camerasInUse;
  return rest.length > 0 ? `${first} +${rest.length} more` : first;
}
