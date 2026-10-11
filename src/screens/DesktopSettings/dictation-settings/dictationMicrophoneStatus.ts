import {
  lastCaptureFellBackFrom,
  type DictationLastCapture,
} from "@/hooks/dictationLastCapture";

export interface DictationMicrophoneStatusArgs {
  /** Name of the saved mic as listed right now; undefined when not listed. */
  selectedLabel: string | undefined;
  /** Id the saved mic is listed under right now. */
  selectedDeviceId: string;
  savedMicrophoneMissing: boolean;
  savedMicrophoneName: string;
  systemDefaultLabel: string;
  lastCapture: DictationLastCapture | null;
}

/**
 * The line under the microphone picker. It describes the saved choice and,
 * when the last recording could not honour it, says which mic was heard
 * instead — Settings never claims a mic is in use on the strength of the
 * saved choice alone.
 */
export const dictationMicrophoneStatus = (
  args: DictationMicrophoneStatusArgs,
): string => {
  if (args.savedMicrophoneMissing) {
    return `${args.savedMicrophoneName} isn't connected. Talk will use your system default microphone until it's back.`;
  }
  if (lastCaptureFellBackFrom(args.lastCapture, args.selectedDeviceId)) {
    const chosen = args.selectedLabel ?? args.savedMicrophoneName;
    const heard =
      args.lastCapture.activeLabel || "your system default microphone";
    return `Couldn't use ${chosen} last time — it may be busy in another app. Talk listened on ${heard} instead and will try ${chosen} again.`;
  }
  if (args.selectedLabel) return `Talk listens on ${args.selectedLabel}`;
  return args.systemDefaultLabel
    ? `Talk listens on ${args.systemDefaultLabel} (your computer's current default)`
    : "";
};
