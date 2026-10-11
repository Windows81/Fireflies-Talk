import type { MutableRefObject } from "react";
import {
  recordSpeechWindow,
  type SpeechGateState,
} from "./dictationSpeechGate";
import { createWarmSlot } from "./warmAudioContext";

// Creating an AudioContext synchronously can block tens of milliseconds, so
// keep one warm for the next press.
const meterSlot = createWarmSlot(() => new AudioContext());
export const prewarmDictationMeterContext = meterSlot.prewarm;
export const takeDictationMeterContext = meterSlot.take;

// Rough gain so typical speech reads as a visible (but not clipped) wave —
// raw RMS off a centered byte waveform is usually well under 0.1.
const LEVEL_GAIN = 4;
const PEAK_GAIN = 2.2;

export interface WaveformLoudness {
  rms: number;
  peak: number;
  /** 0..1 display level; loud speech through Chromium's gain control hits 1. */
  level: number;
}

/** Loudness of one analyser window of byte time-domain samples. */
export function measureWaveform(data: Uint8Array): WaveformLoudness {
  let sumSquares = 0;
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const centered = (data[i] - 128) / 128;
    sumSquares += centered * centered;
    const abs = Math.abs(centered);
    if (abs > peak) peak = abs;
  }
  const rms = Math.sqrt(sumSquares / data.length);
  const level = Math.min(1, Math.max(rms * LEVEL_GAIN, peak * PEAK_GAIN));
  return { rms, peak, level };
}

export function createResumedAudioContext(): AudioContext {
  const audioContext = takeDictationMeterContext();

  // Talk's hotkey is not a renderer gesture, so Chromium may start this
  // context suspended. Resume so the analyser sees the selected mic.
  if (audioContext.state === "suspended") {
    void audioContext.resume().then(
      () => undefined,
      () => undefined,
    );
  }

  return audioContext;
}

export function startDictationLevelMeter(options: {
  stream: MediaStream;
  audioContextRef: MutableRefObject<AudioContext | null>;
  levelIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  speechGateRef: MutableRefObject<SpeechGateState | null>;
  shouldReportLevel: () => boolean;
}): void {
  const audioContext = createResumedAudioContext();
  options.audioContextRef.current = audioContext;
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  audioContext.createMediaStreamSource(options.stream).connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  options.levelIntervalRef.current = setInterval(() => {
    analyser.getByteTimeDomainData(data);
    const { rms, peak, level } = measureWaveform(data);
    if (options.speechGateRef.current) {
      recordSpeechWindow(options.speechGateRef.current, rms, peak);
    }
    if (!options.shouldReportLevel()) return;
    window.electron!.dictation.reportLevel(level);
  }, 50);
}

export function stopDictationLevelMeter(options: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  levelIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
}): void {
  if (options.levelIntervalRef.current) {
    clearInterval(options.levelIntervalRef.current);
    options.levelIntervalRef.current = null;
  }
  options.audioContextRef.current?.close();
  options.audioContextRef.current = null;
}
