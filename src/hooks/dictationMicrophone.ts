import { isPseudoDeviceId } from "@/utils/audio-devices";
import {
  isSystemDefaultMicrophone,
  SYSTEM_DEFAULT_MICROPHONE,
  type DictationMicrophoneSelection,
} from "@/features/settings/dictationMicrophoneSelection";
import {
  describeActiveMicrophone,
  microphoneDisplayName,
  resolveDictationMicrophone,
  type ActiveMicrophone,
  type DictationMicrophoneOption,
} from "./dictationMicrophoneIdentity";

export type { DictationMicrophoneOption } from "./dictationMicrophoneIdentity";
export { isSystemDefaultMicrophone };

/**
 * Chromium only honours an *exact* deviceId for audio inputs — an `ideal` one
 * is dropped and the system default is opened instead, so the chosen mic would
 * be silently ignored. Resilience when the device is gone comes from
 * openDictationMicrophone's fallback rather than from a soft constraint.
 */
export const buildDictationAudioConstraints = (
  deviceId?: string,
): MediaStreamConstraints => {
  const trimmed = deviceId?.trim();
  if (!trimmed) {
    return { audio: true };
  }

  return { audio: { deviceId: { exact: trimmed } } };
};

/** Errors that mean "that device is not here", as opposed to a denial. */
const DEVICE_GONE_ERRORS = new Set([
  "OverconstrainedError",
  "NotFoundError",
  "NotReadableError",
]);

const isDeviceGone = (error: unknown): boolean =>
  error instanceof Error && DEVICE_GONE_ERRORS.has(error.name);

export interface DictationMicrophoneCapture {
  stream: MediaStream;
  /** The mic that was asked for; null when following the system default. */
  requested: DictationMicrophoneOption | null;
  /** The mic Chromium actually opened. */
  active: ActiveMicrophone;
  /** True when the chosen mic could not be opened and the default is in use. */
  usingFallback: boolean;
}

const openStream = async (
  deviceId: string,
): Promise<{ stream: MediaStream; fellBack: boolean }> => {
  const constraints = buildDictationAudioConstraints(deviceId);
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream, fellBack: false };
  } catch (error) {
    // A denial has to surface; an unplugged mic falls back to the default so
    // dictation still works.
    if (constraints.audio === true || !isDeviceGone(error)) throw error;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { stream, fellBack: true };
  }
};

/**
 * Opens the microphone dictation should record through: the saved one when it
 * is available, otherwise the system default. Everything that listens — the
 * onboarding meter included — goes through here, so the mic being metered is
 * always the mic that will be recorded, and both report the same
 * "listening on" name taken from the track that is really open.
 */
export const openDictationMicrophone = async (
  selection: DictationMicrophoneSelection = SYSTEM_DEFAULT_MICROPHONE,
): Promise<DictationMicrophoneCapture> => {
  // Names are only readable once access is granted, and getUserMedia below
  // asks for it anyway, so the lookup itself never prompts.
  const requested = selection.deviceId
    ? (resolveDictationMicrophone(
        selection,
        await listDictationMicrophones({ requestPermission: false }),
      )?.option ?? null)
    : null;
  // A stale id that no longer enumerates is still tried once; the fallback
  // below handles it if Chromium agrees it is gone.
  const { stream, fellBack } = await openStream(
    requested?.deviceId ?? selection.deviceId,
  );

  const track = stream.getAudioTracks()[0];
  const active = describeActiveMicrophone(
    { label: track?.label ?? "", deviceId: track?.getSettings().deviceId },
    requested,
  );
  const usingFallback =
    Boolean(selection.deviceId) && (fellBack || !active.matchesRequest);
  if (usingFallback) {
    console.warn("[dictation] chosen microphone unavailable, using default");
  }

  return { stream, requested, active, usingFallback };
};

/**
 * Calls back once if the open mic stops on its own (unplugged, Bluetooth
 * dropped). Chromium does not fire this for our own `track.stop()`.
 */
export const onDictationMicrophoneEnded = (
  stream: MediaStream,
  onEnded: () => void,
): (() => void) => {
  const track = stream.getAudioTracks()[0];
  if (!track) return () => undefined;
  track.addEventListener("ended", onEnded);
  return () => track.removeEventListener("ended", onEnded);
};

export interface DictationMicrophoneInventory {
  /** Real inputs a person can pin, without Chromium's default pseudo-entries. */
  devices: DictationMicrophoneOption[];
  /** Name of the mic the system default resolves to right now, if known. */
  systemDefaultLabel: string;
  /**
   * Whether `devices` reflects the inputs really attached. Until microphone
   * access is granted Chromium lists inputs without ids, so an empty list
   * then says nothing; once granted, an empty list means no mic is connected.
   */
  observed: boolean;
}

const toInventory = (
  devices: MediaDeviceInfo[],
): DictationMicrophoneInventory => {
  const audioInputs = devices.filter((device) => device.kind === "audioinput");
  const inputs = audioInputs.filter((device) => device.deviceId);
  const systemDefault = inputs.find((device) => device.deviceId === "default");
  return {
    observed: audioInputs.length === inputs.length,
    devices: inputs
      .filter((device) => !isPseudoDeviceId(device.deviceId))
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label.trim() || `Microphone ${index + 1}`,
        groupId: device.groupId ?? "",
      })),
    systemDefaultLabel: microphoneDisplayName(systemDefault?.label ?? ""),
  };
};

const requestMicrophoneLabels = async (
  mediaDevices: MediaDevices,
): Promise<void> => {
  const electronPermissions =
    typeof window !== "undefined" ? window.electron?.permissions : undefined;
  if (electronPermissions?.request) {
    await electronPermissions.request("microphone");
  }

  const stream = await mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
};

export interface ListMicrophonesOptions {
  /**
   * Whether to ask for microphone access when names are hidden. Off for
   * background checks, which must never raise a permission prompt.
   */
  requestPermission?: boolean;
}

export const listDictationMicrophoneInventory = async ({
  requestPermission = true,
}: ListMicrophonesOptions = {}): Promise<DictationMicrophoneInventory> => {
  const mediaDevices =
    typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (!mediaDevices?.enumerateDevices) {
    return { devices: [], systemDefaultLabel: "", observed: false };
  }

  const firstDevices = await mediaDevices.enumerateDevices();
  const hasLabeledInput = firstDevices.some(
    (device) => device.kind === "audioinput" && device.label,
  );
  if (hasLabeledInput || !requestPermission) {
    return toInventory(firstDevices);
  }

  try {
    await requestMicrophoneLabels(mediaDevices);
  } catch {
    return toInventory(firstDevices);
  }

  return toInventory(await mediaDevices.enumerateDevices());
};

export const listDictationMicrophones = async (
  options?: ListMicrophonesOptions,
): Promise<DictationMicrophoneOption[]> =>
  (await listDictationMicrophoneInventory(options)).devices;

export const SYSTEM_DEFAULT_MICROPHONE_ID = SYSTEM_DEFAULT_MICROPHONE.deviceId;
