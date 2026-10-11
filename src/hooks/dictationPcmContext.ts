import { DICTATION_PCM_SAMPLE_RATE } from "./dictationPcm";
import { DICTATION_PCM_WORKLET_CODE } from "./dictationPcmWorklet";
import { createWarmSlot } from "./warmAudioContext";

export interface DictationPcmContextEntry {
  audioContext: AudioContext;
  workletReady: boolean;
}

const createPcmContextEntry = (): DictationPcmContextEntry => {
  const audioContext = new AudioContext({
    sampleRate: DICTATION_PCM_SAMPLE_RATE,
  });
  const entry: DictationPcmContextEntry = {
    audioContext,
    workletReady: false,
  };
  const worklet = audioContext.audioWorklet;
  if (!worklet) return entry;
  const blobUrl = URL.createObjectURL(
    new Blob([DICTATION_PCM_WORKLET_CODE], { type: "text/javascript" }),
  );
  worklet.addModule(blobUrl).then(
    () => {
      URL.revokeObjectURL(blobUrl);
      entry.workletReady = true;
    },
    () => {
      URL.revokeObjectURL(blobUrl);
    },
  );
  return entry;
};

// The warm context already has the PCM worklet loaded, so a hotkey press can
// connect a consumer synchronously instead of dropping the audio that would
// arrive while addModule is in flight.
const slot = createWarmSlot(createPcmContextEntry);

/** Keeps one AudioContext warm with the worklet loaded for the next press. */
export const prewarmDictationPcmContext = slot.prewarm;

/**
 * Hands the warm context to a capture and leaves the slot empty; the runtime
 * re-warms it once the dictation ends. The caller owns (and closes) the
 * returned context.
 */
export const takeDictationPcmContext = slot.take;
