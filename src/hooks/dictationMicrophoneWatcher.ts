import {
  getLocalSettings,
  setDictationMicrophoneSilently,
  useLocalSettings,
} from "@/features/settings/useLocalSettings";
import type { DictationMicrophoneSelection } from "@/features/settings/dictationMicrophoneSelection";
import { useDictationLastCapture } from "./dictationLastCapture";
import {
  listDictationMicrophoneInventory,
  type DictationMicrophoneCapture,
  type DictationMicrophoneInventory,
} from "./dictationMicrophone";
import {
  microphoneDisplayName,
  reconcileDictationMicrophone,
  type MicrophoneWatchEvent,
  type MicrophoneWatchState,
  type ResolvedDictationMicrophone,
} from "./dictationMicrophoneIdentity";

/** macOS reports one hot-plug as a burst of devicechange events. */
const DEVICE_CHANGE_SETTLE_MS = 400;

const chosenMicrophoneName = (selection: DictationMicrophoneSelection) =>
  microphoneDisplayName(selection.label) || "Your chosen microphone";

export const microphoneWatchNotice = (
  event: Exclude<MicrophoneWatchEvent, null>,
  selection: DictationMicrophoneSelection,
): string => {
  const name = chosenMicrophoneName(selection);
  return event === "lost"
    ? `${name} isn't connected. Talk will use your system default microphone until it's back.`
    : `${name} is back. Talk will listen on it from your next dictation.`;
};

/** Said when the mic a dictation was recording through stopped mid-way. */
export const microphoneLostDuringDictationNotice = (
  capture: Pick<DictationMicrophoneCapture, "active">,
): string => {
  const name = capture.active.label || "Your microphone";
  return `${name} was disconnected, so Talk stopped and kept what it heard.`;
};

/** Said when the chosen mic is listed but could not be opened just now. */
export const microphoneFallbackNotice = (
  capture: Pick<DictationMicrophoneCapture, "requested" | "active">,
): string => {
  const name =
    microphoneDisplayName(capture.requested?.label ?? "") ||
    "Your chosen microphone";
  const active = capture.active.label || "your system default microphone";
  return `Couldn't use ${name} — it may be busy in another app. Listening on ${active} for now.`;
};

const sameSelection = (
  a: DictationMicrophoneSelection,
  b: DictationMicrophoneSelection,
): boolean =>
  a.deviceId === b.deviceId && a.label === b.label && a.groupId === b.groupId;

/**
 * The chosen mic under the id it has now, so the next open hits it directly
 * instead of having to match by name again. Also fills in a name or hardware
 * group the saved choice lacks (an id-only selection migrated from an older
 * version) so a later id change can still be matched.
 */
const healedSelection = (
  selection: DictationMicrophoneSelection,
  resolved: ResolvedDictationMicrophone | null,
): DictationMicrophoneSelection | null => {
  if (!resolved) return null;
  const healed = {
    deviceId: resolved.option.deviceId,
    label: resolved.option.label || selection.label,
    groupId: resolved.option.groupId || selection.groupId,
  };
  return sameSelection(healed, selection) ? null : healed;
};

/** What the watcher needs to know about the inputs attached right now. */
export type WatchedMicrophoneInventory = Pick<
  DictationMicrophoneInventory,
  "devices" | "observed"
>;

export interface DictationMicrophoneWatcherDeps {
  notify: (text: string) => void;
  listMicrophones?: () => Promise<WatchedMicrophoneInventory>;
  settleMs?: number;
}

const listWithoutPrompt = () =>
  listDictationMicrophoneInventory({ requestPermission: false });

/**
 * Keeps the saved microphone honest while Talk runs: when the person's mic
 * goes away it says so, and when it returns it says that too. Each dictation
 * opens the mic afresh, so the next recording after either notice is already
 * on the right device; a recording in progress when the mic vanishes is ended
 * by the runtime, which watches the open track itself.
 */
export function startDictationMicrophoneWatcher(
  deps: DictationMicrophoneWatcherDeps,
): () => void {
  const listMicrophones = deps.listMicrophones ?? listWithoutPrompt;
  let state: MicrophoneWatchState | null = null;
  let stopped = false;
  // Our own re-save is not a new choice; the settings trigger skips it.
  let healing = false;

  const saveHealed = (healed: DictationMicrophoneSelection) => {
    healing = true;
    try {
      setDictationMicrophoneSilently(healed);
    } finally {
      healing = false;
    }
  };

  const reconcile = async () => {
    const inventory = await listMicrophones();
    // Before mic access is granted the list says nothing about what is
    // attached; the first dictation grants it and triggers a fresh check.
    if (stopped || !inventory.observed) return;
    const selection = getLocalSettings().dictationMicrophone;
    const result = reconcileDictationMicrophone(
      state,
      selection,
      inventory.devices,
    );
    state = result.next;
    const healed = healedSelection(selection, result.resolved);
    if (healed) saveHealed(healed);
    if (result.event)
      deps.notify(microphoneWatchNotice(result.event, selection));
  };

  // Only the error kind is logged; device names never leave the UI.
  const check = () =>
    reconcile().catch((error: unknown) => {
      const kind = error instanceof Error ? error.name : "unknown";
      console.warn(`[dictation] microphone check failed: ${kind}`);
    });

  const queue = settledQueue(check, deps.settleMs ?? DEVICE_CHANGE_SETTLE_MS);
  const stopTriggers = watchMicrophoneTriggers({
    onDeviceChange: queue.schedule,
    onCaptureOpened: queue.schedule,
    onSelectionChanged: () => {
      if (healing) return;
      // A fresh choice starts from a clean slate so picking a mic that is
      // present never reads as "returned".
      state = null;
      queue.schedule();
    },
  });
  queue.runNow();

  return () => {
    stopped = true;
    queue.stop();
    stopTriggers();
  };
}

/** Runs `task` once per burst of `schedule()` calls, never two at a time. */
function settledQueue(task: () => Promise<void>, settleMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> = Promise.resolve();
  return {
    runNow: () => {
      running = running.then(task);
    },
    schedule: () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        running = running.then(task);
      }, settleMs);
    },
    stop: () => {
      if (timer) clearTimeout(timer);
    },
  };
}

interface MicrophoneTriggerHandlers {
  onDeviceChange: () => void;
  /** Opening a mic grants access, so the device list becomes readable. */
  onCaptureOpened: () => void;
  onSelectionChanged: () => void;
}

/** Wires up everything that can change what the watcher would conclude. */
function watchMicrophoneTriggers(handlers: MicrophoneTriggerHandlers) {
  const mediaDevices =
    typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  mediaDevices?.addEventListener?.("devicechange", handlers.onDeviceChange);

  const unsubscribeCapture = useDictationLastCapture.subscribe(
    (store, previous) => {
      if (store.lastCapture !== previous.lastCapture)
        handlers.onCaptureOpened();
    },
  );
  const unsubscribeSettings = useLocalSettings.subscribe(
    (settings, previous) => {
      if (settings.dictationMicrophone !== previous.dictationMicrophone)
        handlers.onSelectionChanged();
    },
  );

  return () => {
    mediaDevices?.removeEventListener?.(
      "devicechange",
      handlers.onDeviceChange,
    );
    unsubscribeCapture();
    unsubscribeSettings();
  };
}
