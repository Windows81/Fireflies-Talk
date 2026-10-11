/**
 * Watches audio device topology (`devicechange`) while a recording runs.
 *
 * Why: on Windows, the legacy/fallback `loopback` capture can die silently
 * when its selected endpoint goes away — a vanished default output keeps
 * delivering zeros with its track still "live". Supported non-muted Windows
 * uses all-device process loopback instead, but Bluetooth profile and device
 * changes still arrive through `devicechange`; this watcher turns them into a
 * structured diff the recorder can act on.
 */

import { isPseudoDeviceId, stripPseudoPrefix } from "@/utils/audio-devices";

export interface AudioDeviceInfo {
  id: string;
  label: string;
  groupId: string;
}

export interface DeviceSnapshot {
  /** Physical devices (Chromium's "default"/"communications" pseudo-entries excluded). */
  inputs: AudioDeviceInfo[];
  outputs: AudioDeviceInfo[];
  /** Label of the OS default device, from the "default" pseudo-entry with its prefix stripped. */
  defaultInputLabel: string;
  defaultOutputLabel: string;
  /**
   * Windows only: the device the OS routes calls to, from the
   * "communications" pseudo-entry. Teams and Zoom play there, loopback
   * captures the default output; when the two differ the call is inaudible
   * to the recorder. Empty on other platforms.
   */
  communicationsInputLabel: string;
  communicationsOutputLabel: string;
}

export interface DeviceTopologyChange {
  previous: DeviceSnapshot;
  current: DeviceSnapshot;
  inputsAdded: AudioDeviceInfo[];
  inputsRemoved: AudioDeviceInfo[];
  outputsAdded: AudioDeviceInfo[];
  outputsRemoved: AudioDeviceInfo[];
  defaultInputChanged: boolean;
  defaultOutputChanged: boolean;
}

export { stripPseudoPrefix };

export function snapshotFromDevices(
  devices: MediaDeviceInfo[],
): DeviceSnapshot {
  const snapshot: DeviceSnapshot = {
    inputs: [],
    outputs: [],
    defaultInputLabel: "",
    defaultOutputLabel: "",
    communicationsInputLabel: "",
    communicationsOutputLabel: "",
  };

  for (const device of devices) {
    if (device.kind !== "audioinput" && device.kind !== "audiooutput") {
      continue;
    }
    const isInput = device.kind === "audioinput";
    if (device.deviceId === "default") {
      const label = stripPseudoPrefix(device.label);
      if (isInput) snapshot.defaultInputLabel = label;
      else snapshot.defaultOutputLabel = label;
      continue;
    }
    if (device.deviceId === "communications") {
      const label = stripPseudoPrefix(device.label);
      if (isInput) snapshot.communicationsInputLabel = label;
      else snapshot.communicationsOutputLabel = label;
      continue;
    }
    if (isPseudoDeviceId(device.deviceId)) continue;

    const info: AudioDeviceInfo = {
      id: device.deviceId,
      label: device.label,
      groupId: device.groupId,
    };
    if (isInput) snapshot.inputs.push(info);
    else snapshot.outputs.push(info);
  }

  return snapshot;
}

// deviceIds are empty before the mic permission is granted; fall back to
// labels so diffs still work in that window.
const deviceKey = (device: AudioDeviceInfo): string =>
  device.id || device.label;

const missingFrom = (
  candidates: AudioDeviceInfo[],
  reference: AudioDeviceInfo[],
): AudioDeviceInfo[] => {
  const keys = new Set(reference.map(deviceKey));
  return candidates.filter((device) => !keys.has(deviceKey(device)));
};

/** Returns null when the snapshots describe the same topology. */
export function diffDeviceSnapshots(
  previous: DeviceSnapshot,
  current: DeviceSnapshot,
): DeviceTopologyChange | null {
  const change: DeviceTopologyChange = {
    previous,
    current,
    inputsAdded: missingFrom(current.inputs, previous.inputs),
    inputsRemoved: missingFrom(previous.inputs, current.inputs),
    outputsAdded: missingFrom(current.outputs, previous.outputs),
    outputsRemoved: missingFrom(previous.outputs, current.outputs),
    defaultInputChanged:
      previous.defaultInputLabel !== current.defaultInputLabel,
    defaultOutputChanged:
      previous.defaultOutputLabel !== current.defaultOutputLabel,
  };

  const changed =
    change.inputsAdded.length > 0 ||
    change.inputsRemoved.length > 0 ||
    change.outputsAdded.length > 0 ||
    change.outputsRemoved.length > 0 ||
    change.defaultInputChanged ||
    change.defaultOutputChanged;

  return changed ? change : null;
}

export function describeTopologyChange(change: DeviceTopologyChange): string {
  const names = (devices: AudioDeviceInfo[]): string =>
    devices.map((device) => device.label || device.id).join(", ");

  const parts: string[] = [];
  if (change.inputsAdded.length > 0)
    parts.push(`inputs added: ${names(change.inputsAdded)}`);
  if (change.inputsRemoved.length > 0)
    parts.push(`inputs removed: ${names(change.inputsRemoved)}`);
  if (change.outputsAdded.length > 0)
    parts.push(`outputs added: ${names(change.outputsAdded)}`);
  if (change.outputsRemoved.length > 0)
    parts.push(`outputs removed: ${names(change.outputsRemoved)}`);
  if (change.defaultInputChanged)
    parts.push(
      `default input: "${change.previous.defaultInputLabel}" → "${change.current.defaultInputLabel}"`,
    );
  if (change.defaultOutputChanged)
    parts.push(
      `default output: "${change.previous.defaultOutputLabel}" → "${change.current.defaultOutputLabel}"`,
    );
  return parts.join("; ");
}

export interface MicrophoneTopologyContext {
  /** deviceId from track.getSettings() — may be a pseudo-id. */
  currentDeviceId?: string;
  /** Live track label with any pseudo prefix stripped. */
  trackLabel: string;
  /** User-pinned input device, if any. */
  preferredDeviceId?: string;
}

/**
 * Decide whether the microphone needs re-acquiring after a topology change:
 * its device vanished, the user's preferred device came back, or the OS
 * default moved while we record from the default. Chromium does not re-route
 * live input tracks, so the recorder swaps the stream itself whenever this
 * returns a reason.
 */
export function microphoneReacquireReason(
  change: DeviceTopologyChange,
  mic: MicrophoneTopologyContext,
): string | null {
  // Streams opened without a device pin report the pseudo-id "default",
  // which never appears in the physical-device list — match those by label.
  const idResolvable =
    !!mic.currentDeviceId && !isPseudoDeviceId(mic.currentDeviceId);
  const deviceLost = idResolvable
    ? !change.current.inputs.some((d) => d.id === mic.currentDeviceId)
    : !!mic.trackLabel &&
      !change.current.inputs.some((d) => d.label === mic.trackLabel);
  if (deviceLost) return "microphone device removed";

  const preferredReturned =
    !!mic.preferredDeviceId &&
    mic.preferredDeviceId !== mic.currentDeviceId &&
    change.inputsAdded.some((d) => d.id === mic.preferredDeviceId);
  if (preferredReturned) return "selected microphone reconnected";

  if (!mic.preferredDeviceId && change.defaultInputChanged) {
    return "default microphone changed";
  }
  return null;
}

/**
 * Decide whether system-audio loopback needs re-acquiring. Windows' legacy/
 * fallback `loopback` path binds to the default render endpoint chosen when
 * getDisplayMedia resolved and can keep delivering zeros if it disappears.
 * Supported non-muted Windows uses all-device process loopback instead. macOS
 * taps are nominally system-wide, but a re-grab is equally invisible there,
 * so output moves re-bind on every desktop platform.
 */
export function systemAudioReacquireReason(
  change: DeviceTopologyChange,
): string | null {
  if (change.defaultOutputChanged) return "default audio output changed";
  if (change.outputsRemoved.length > 0) return "audio output device removed";
  return null;
}

export class DeviceWatcher {
  private readonly debounceMs: number;
  private readonly mediaDevices: MediaDevices | null;
  private baseline: DeviceSnapshot | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listening = false;
  private stopped = false;
  private evalGeneration = 0;

  constructor(
    private readonly onChange: (change: DeviceTopologyChange) => void,
    options?: { debounceMs?: number; mediaDevices?: MediaDevices },
  ) {
    this.debounceMs = options?.debounceMs ?? 1500;
    this.mediaDevices =
      options?.mediaDevices ??
      (typeof navigator !== "undefined"
        ? (navigator.mediaDevices ?? null)
        : null);
  }

  /** No-ops when mediaDevices/devicechange is unavailable. */
  async start(): Promise<void> {
    const mediaDevices = this.mediaDevices;
    if (this.listening || this.stopped) return;
    if (
      typeof mediaDevices?.addEventListener !== "function" ||
      typeof mediaDevices.enumerateDevices !== "function"
    ) {
      return;
    }

    this.baseline = await this.snapshot();
    if (this.stopped) return; // stop() raced the enumerate

    mediaDevices.addEventListener("devicechange", this.onDeviceChange);
    this.listening = true;
  }

  stop(): void {
    this.stopped = true;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.listening) {
      this.mediaDevices?.removeEventListener(
        "devicechange",
        this.onDeviceChange,
      );
      this.listening = false;
    }
  }

  /** Fresh enumerate that does NOT touch the diff baseline (heartbeat use). */
  async refreshSnapshot(): Promise<DeviceSnapshot | null> {
    return this.snapshot();
  }

  // devicechange fires in bursts (a Bluetooth profile switch removes and
  // adds several endpoints back-to-back); debounce so we diff the settled
  // topology exactly once.
  private onDeviceChange = (): void => {
    if (this.stopped) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.evaluate();
    }, this.debounceMs);
  };

  private async evaluate(): Promise<void> {
    // A newer devicechange supersedes an in-flight evaluation; a stale
    // enumerate resolving late must not touch the baseline or report a
    // reversed diff.
    const generation = ++this.evalGeneration;
    const current = await this.snapshot();
    if (this.stopped || generation !== this.evalGeneration || !current) return;

    const previous = this.baseline;
    this.baseline = current;
    if (!previous) return;

    const change = diffDeviceSnapshots(previous, current);
    if (change) this.onChange(change);
  }

  private async snapshot(): Promise<DeviceSnapshot | null> {
    if (typeof this.mediaDevices?.enumerateDevices !== "function") return null;
    try {
      return snapshotFromDevices(await this.mediaDevices.enumerateDevices());
    } catch {
      return null;
    }
  }
}
