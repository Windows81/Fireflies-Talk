// Ported from OpenWhispr's localSpeechGate.js (github.com/OpenWhispr/openwhispr,
// MIT License) — skip commit/cleanup when the recording never contained real
// speech (near-silent hold of the hotkey).
const SILENCE_RMS_THRESHOLD = 0.002;
const SPEECH_WINDOW_RMS_THRESHOLD = 0.003;
const SPEECH_WINDOW_PEAK_THRESHOLD = 0.02;
const STRONG_SPEECH_RMS_THRESHOLD = 0.006;

export interface SpeechGateState {
  peakRms: number;
  peakAmplitude: number;
  windowCount: number;
  speechWindowCount: number;
}

export function createSpeechGateState(): SpeechGateState {
  return { peakRms: 0, peakAmplitude: 0, windowCount: 0, speechWindowCount: 0 };
}

export function recordSpeechWindow(
  state: SpeechGateState,
  rms: number,
  peak: number,
): void {
  state.windowCount += 1;
  state.peakRms = Math.max(state.peakRms, rms);
  state.peakAmplitude = Math.max(state.peakAmplitude, peak);

  const isSpeechWindow =
    rms >= SPEECH_WINDOW_RMS_THRESHOLD && peak >= SPEECH_WINDOW_PEAK_THRESHOLD;
  if (isSpeechWindow) state.speechWindowCount += 1;
}

/**
 * Whether the recording captured by `state` should be discarded without
 * committing transcription. The session still needs `cancel()` so capture
 * does not stay open. Uses the stricter "insufficient speech" gate (not just
 * plain silence).
 */
export function shouldSkipTranscription(state: SpeechGateState): boolean {
  if (state.windowCount === 0) return false;
  if (state.peakRms < SILENCE_RMS_THRESHOLD) return true;
  const hasSpeech =
    state.speechWindowCount >= 1 ||
    state.peakRms >= STRONG_SPEECH_RMS_THRESHOLD;
  return !hasSpeech;
}
