import { measureWaveform } from "@/hooks/dictationMicMeter";

/**
 * Loudness a window has to reach before any bar lights. Room noise that
 * survives Chromium's noise suppression stays under it, so a silent room
 * reads as no bars rather than one or two flickering ones.
 */
export const MIC_METER_NOISE_FLOOR = 0.1;

/**
 * Share of the previous level kept each frame while sound fades, so the bars
 * step down smoothly between syllables instead of flickering to empty.
 */
export const MIC_METER_RELEASE = 0.85;

/** Time-domain window; long enough that one frame covers a few voice cycles. */
export const MIC_METER_FFT_SIZE = 1024;

/**
 * Overall loudness in 0..1 for one analyser window, shaped for a bar meter:
 * the same speech level the pill's waveform uses, gated by the noise floor
 * and stretched back to the full range, falling no faster than the release.
 */
export function micMeterLevel(waveform: Uint8Array, previous: number): number {
  const { level } = measureWaveform(waveform);
  return Math.max(aboveNoiseFloor(level), previous * MIC_METER_RELEASE);
}

/**
 * Bars lit from the left for a loudness in 0..1 — whispering lights a few,
 * shouting lights them all. Each entry is 1 for lit and 0 for dark.
 */
export function micMeterBars(level: number, barCount: number): number[] {
  const lit = Math.round(level * barCount);
  return Array.from({ length: barCount }, (_, bar) => (bar < lit ? 1 : 0));
}

function aboveNoiseFloor(level: number): number {
  if (level <= MIC_METER_NOISE_FLOOR) return 0;
  return (level - MIC_METER_NOISE_FLOOR) / (1 - MIC_METER_NOISE_FLOOR);
}
