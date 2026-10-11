/**
 * Informed microphone fallback for dead-air recovery.
 *
 * Re-opening the "default" device after dead air usually returns the same
 * dead route (observed: a Bluetooth hands-free mic that never engaged —
 * Chromium eventually re-routed the default track to the laptop's mic array
 * on its own, but only after ~2.5 minutes of lost audio). Instead of blind
 * re-acquisition, measure the freshly acquired stream; if it is still
 * lifeless, briefly open the other physical inputs, measure each, and hand
 * back the first one carrying real signal.
 */

import { EFFECTIVELY_DEAD_DB } from "./silence-tracker";

/**
 * A candidate must beat the dead threshold by this margin to count as live —
 * matching the tracker's hysteresis so a hold-band reading (a struggling
 * path hovering just above the threshold) is not mistaken for a working mic.
 */
const LIVE_MARGIN_DB = 10;
const MAX_CANDIDATES = 4;

export interface MicCandidate {
  deviceId: string;
  label: string;
}

export interface MicProbeDeps {
  /** Peak RMS level (dB) of the stream over a short observation window. */
  measureStreamDb(stream: MediaStream): Promise<number>;
  /** Physical audio inputs (no "default"/"communications" pseudo-entries). */
  enumerateInputs(): Promise<MicCandidate[]>;
  openStream(deviceId: string): Promise<MediaStream>;
  /**
   * Re-open the SAME device with all audio processing disabled. On Windows,
   * Chromium then requests a RAW capture stream (AUDCLNT_STREAMOPTIONS_RAW),
   * bypassing driver/OEM enhancement APOs (Voice Focus, Waves, Dolby …) that
   * can gate a healthy mic to silence. Tried before switching devices: the
   * user's chosen mic without enhancements beats a different mic.
   */
  reopenUnprocessed?(): Promise<MediaStream>;
  stopStream(stream: MediaStream): void;
  deadDb?: number;
  log?(message: string): void;
}

/**
 * Returns a live replacement stream when `currentStream` is lifeless and
 * another input carries signal; null means "keep the current stream"
 * (either it's live enough, or nothing better exists).
 */
export async function findLiveMicrophone(
  currentStream: MediaStream,
  deps: MicProbeDeps,
): Promise<{ stream: MediaStream; label: string } | null> {
  const liveDb = (deps.deadDb ?? EFFECTIVELY_DEAD_DB) + LIVE_MARGIN_DB;

  const currentDb = await deps.measureStreamDb(currentStream);
  if (currentDb > liveDb) return null;

  const currentTrack = currentStream.getAudioTracks()[0];
  const currentDeviceId = currentTrack?.getSettings().deviceId;
  const currentLabel = currentTrack?.label ?? "";

  // First preference: the same device with OS/browser processing disabled —
  // if Windows audio enhancements were gating it, the raw stream comes alive.
  if (deps.reopenUnprocessed) {
    let rawStream: MediaStream | null = null;
    try {
      rawStream = await deps.reopenUnprocessed();
      const rawDb = await deps.measureStreamDb(rawStream);
      if (rawDb > liveDb) {
        deps.log?.(
          `Microphone reads ${currentDb.toFixed(1)} dB processed but ${rawDb.toFixed(1)} dB raw — audio enhancements/processing appear to be suppressing it; switching to unprocessed capture on the same device.`,
        );
        return { stream: rawStream, label: `${currentLabel} (unprocessed)` };
      }
      deps.stopStream(rawStream);
      rawStream = null;
    } catch {
      if (rawStream) deps.stopStream(rawStream);
    }
  }

  let inputs: MicCandidate[];
  try {
    inputs = await deps.enumerateInputs();
  } catch {
    return null;
  }
  const candidates = inputs
    .filter(
      (input) =>
        input.deviceId &&
        input.deviceId !== currentDeviceId &&
        input.label !== currentLabel,
    )
    .slice(0, MAX_CANDIDATES);

  for (const candidate of candidates) {
    let stream: MediaStream | null = null;
    try {
      stream = await deps.openStream(candidate.deviceId);
      const db = await deps.measureStreamDb(stream);
      if (db > liveDb) {
        deps.log?.(
          `Re-acquired microphone is still silent (${currentDb.toFixed(1)} dB); switching to "${candidate.label}" which shows signal (${db.toFixed(1)} dB).`,
        );
        return { stream, label: candidate.label };
      }
      deps.stopStream(stream);
      stream = null;
    } catch {
      if (stream) deps.stopStream(stream);
    }
  }

  deps.log?.(
    `Re-acquired microphone is silent (${currentDb.toFixed(1)} dB) and no other input shows signal — keeping the current device.`,
  );
  return null;
}

/**
 * Default level measurement: peak RMS over a short window, sampled off a
 * temporary analyser on the live AudioContext. Does not stop the stream.
 */
export async function measureStreamMaxDb(
  context: AudioContext,
  stream: MediaStream,
  opts?: { settleMs?: number; windowMs?: number; sampleIntervalMs?: number },
): Promise<number> {
  const settleMs = opts?.settleMs ?? 250;
  const windowMs = opts?.windowMs ?? 1000;
  const sampleIntervalMs = opts?.sampleIntervalMs ?? 150;

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  const buffer = new Float32Array(analyser.fftSize);
  source.connect(analyser);

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  try {
    await wait(settleMs);
    let maxDb = -Infinity;
    const deadline = Date.now() + windowMs;
    do {
      analyser.getFloatTimeDomainData(buffer);
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        sumSq += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sumSq / buffer.length);
      maxDb = Math.max(maxDb, 20 * Math.log10(Math.max(rms, 1e-12)));
      await wait(sampleIntervalMs);
    } while (Date.now() < deadline);
    return maxDb;
  } finally {
    source.disconnect();
  }
}
