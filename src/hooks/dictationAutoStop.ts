import type { DictationTranscriptionProvider } from "@/features/settings";
import { MAX_DICTATION_AUDIO_SECONDS } from "./dictationPcm";

export const DICTATION_MAX_AUDIO_SECONDS = {
  elevenlabs: 600,
  assembly: MAX_DICTATION_AUDIO_SECONDS,
  "assembly-chunked": 10 * 60,
  stream: 10 * 60,
} as const satisfies Record<DictationTranscriptionProvider, number>;

export const DICTATION_ARMED_MAX_SECONDS_KEY = "dictation-armed-max-seconds";

export const DICTATION_AUTO_STOP_WARNING_SECONDS = 10;
export const DICTATION_AUTO_STOP_URGENT_SECONDS = 3;

export function maxDictationAudioSeconds(
  provider: DictationTranscriptionProvider,
): number {
  return DICTATION_MAX_AUDIO_SECONDS[provider];
}

export function parseArmedDictationMaxSeconds(
  raw: string | null,
  fallback = MAX_DICTATION_AUDIO_SECONDS,
): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function remainingDictationSeconds(
  elapsedMs: number,
  maxSeconds = MAX_DICTATION_AUDIO_SECONDS,
): number {
  return Math.max(0, Math.ceil(maxSeconds - elapsedMs / 1000));
}

export function dictationAutoStopChipLabel(
  remainingSeconds: number,
): string | null {
  if (remainingSeconds > DICTATION_AUTO_STOP_WARNING_SECONDS) return null;
  if (remainingSeconds <= 0) return "Stopping";
  return `Stops in ${remainingSeconds}s`;
}

export function isDictationAutoStopUrgent(remainingSeconds: number): boolean {
  return remainingSeconds <= DICTATION_AUTO_STOP_URGENT_SECONDS;
}

export function createDictationAutoStopController(opts: {
  onStop: () => void;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
}): { arm: (maxSeconds?: number) => void; disarm: () => void } {
  const schedule = opts.setTimeout ?? setTimeout;
  const cancel = opts.clearTimeout ?? clearTimeout;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let generation = 0;

  const disarm = () => {
    generation += 1;
    if (timer == null) return;
    cancel(timer);
    timer = null;
  };

  const arm = (maxSeconds = MAX_DICTATION_AUDIO_SECONDS) => {
    disarm();
    const token = generation;
    timer = schedule(() => {
      if (token !== generation) return;
      timer = null;
      opts.onStop();
    }, maxSeconds * 1000);
  };

  return { arm, disarm };
}
