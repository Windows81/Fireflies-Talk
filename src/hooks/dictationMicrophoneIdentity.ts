import type { DictationMicrophoneSelection } from "@/features/settings/dictationMicrophoneSelection";
import { isPseudoDeviceId, stripPseudoPrefix } from "@/utils/audio-devices";

export interface DictationMicrophoneOption {
  deviceId: string;
  label: string;
  groupId: string;
}

/** The name a person recognises: "MacBook Pro Microphone", not "Default - …". */
export const microphoneDisplayName = stripPseudoPrefix;

export type MicrophoneMatch = "id" | "group" | "label";

export interface ResolvedDictationMicrophone {
  option: DictationMicrophoneOption;
  matchedBy: MicrophoneMatch;
}

const onlyOne = <T>(items: T[]): T | undefined =>
  items.length === 1 ? items[0] : undefined;

/**
 * Finds the saved microphone among the inputs present now. The id is tried
 * first; when it no longer resolves (ids are per-app hashes that can change)
 * the hardware group and then the name identify the same device.
 */
export const resolveDictationMicrophone = (
  selection: DictationMicrophoneSelection,
  devices: DictationMicrophoneOption[],
): ResolvedDictationMicrophone | null => {
  if (!selection.deviceId) return null;

  const byId = devices.find((d) => d.deviceId === selection.deviceId);
  if (byId) return { option: byId, matchedBy: "id" };

  if (selection.groupId) {
    const inGroup = devices.filter((d) => d.groupId === selection.groupId);
    const byGroup =
      onlyOne(inGroup) ?? inGroup.find((d) => d.label === selection.label);
    if (byGroup) return { option: byGroup, matchedBy: "group" };
  }

  if (selection.label) {
    const byLabel = onlyOne(devices.filter((d) => d.label === selection.label));
    if (byLabel) return { option: byLabel, matchedBy: "label" };
  }

  return null;
};

export interface ActiveMicrophoneTrack {
  label: string;
  deviceId?: string;
}

export interface ActiveMicrophone {
  /** What the person should be told Talk is listening on. */
  label: string;
  /** False when a specific mic was requested and a different one is open. */
  matchesRequest: boolean;
}

/**
 * Compares the track Chromium actually opened with the mic that was asked
 * for. With no request (system default) whatever opened is the right answer.
 * The track's id is authoritative; the name only decides when Chromium
 * reports no concrete id (the `default` pseudo-device), so two same-named
 * mics never pass for each other.
 */
export const describeActiveMicrophone = (
  track: ActiveMicrophoneTrack,
  requested: DictationMicrophoneOption | null,
): ActiveMicrophone => {
  const label = microphoneDisplayName(track.label);
  if (!requested) return { label, matchesRequest: true };

  const trackId = track.deviceId ?? "";
  const matchesRequest =
    trackId === requested.deviceId ||
    ((!trackId || isPseudoDeviceId(trackId)) &&
      label === microphoneDisplayName(requested.label));
  return { label, matchesRequest };
};

export interface MicrophoneWatchState {
  /** Whether the chosen mic was present at the last check. */
  available: boolean;
}

export type MicrophoneWatchEvent = "lost" | "returned" | null;

export interface MicrophoneReconciliation {
  next: MicrophoneWatchState;
  event: MicrophoneWatchEvent;
  resolved: ResolvedDictationMicrophone | null;
}

/**
 * Runs on every device change and on start-up. Tells the caller when the
 * chosen mic disappears (fall back and say so) or comes back (switch back and
 * say so). The system default is always "available" — following it is the
 * whole point of that choice.
 */
export const reconcileDictationMicrophone = (
  state: MicrophoneWatchState | null,
  selection: DictationMicrophoneSelection,
  devices: DictationMicrophoneOption[],
): MicrophoneReconciliation => {
  if (!selection.deviceId) {
    return { next: { available: true }, event: null, resolved: null };
  }

  const resolved = resolveDictationMicrophone(selection, devices);
  const available = resolved !== null;
  const wasAvailable = state?.available ?? true;

  let event: MicrophoneWatchEvent = null;
  if (wasAvailable && !available) event = "lost";
  if (!wasAvailable && available) event = "returned";

  return { next: { available }, event, resolved };
};
