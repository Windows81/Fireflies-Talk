import { getLocalSettings } from "@/features/settings";
import { notifyDictationNotice } from "./dictationErrors";
import { recordDictationCapture } from "./dictationLastCapture";
import {
  onDictationMicrophoneEnded,
  openDictationMicrophone,
} from "./dictationMicrophone";
import {
  microphoneFallbackNotice,
  microphoneLostDuringDictationNotice,
} from "./dictationMicrophoneWatcher";
import { decideOnMicrophoneEnded } from "./dictationRuntimeStop";

export interface DictationMicrophoneLifecycleDeps {
  /** True once a newer start or a cancel made this capture irrelevant. */
  isStale: () => boolean;
  /** Whether the pill is showing this recording to the person. */
  isRevealed: () => boolean;
  requestStop: () => void;
  requestCancel: () => void;
}

export interface OpenedDictationMicrophone {
  stream: MediaStream;
  /** Stops watching the track; call before stopping the stream. */
  unwatch: () => void;
}

/**
 * Opens the chosen microphone for one dictation, says so when Talk had to use
 * another mic, and ends the recording if the mic disappears while it is open.
 * Resolves to null when the start was superseded before the mic opened.
 */
export async function openMicrophoneForDictation(
  deps: DictationMicrophoneLifecycleDeps,
): Promise<OpenedDictationMicrophone | null> {
  const capture = await openDictationMicrophone(
    getLocalSettings().dictationMicrophone,
  );
  recordDictationCapture(capture);
  const { stream } = capture;
  if (deps.isStale()) {
    stream.getTracks().forEach((track) => track.stop());
    return null;
  }

  // A missing mic is the watcher's to announce (it re-checks on every
  // capture); this covers a mic that is listed yet could not be opened.
  if (capture.usingFallback && capture.requested) {
    notifyDictationNotice(microphoneFallbackNotice(capture));
  }

  const unwatch = onDictationMicrophoneEnded(stream, () => {
    if (deps.isStale()) return;
    const decision = decideOnMicrophoneEnded(deps.isRevealed());
    if (decision.announce) {
      notifyDictationNotice(microphoneLostDuringDictationNotice(capture));
    }
    if (decision.action === "stop") deps.requestStop();
    else deps.requestCancel();
  });

  return { stream, unwatch };
}
