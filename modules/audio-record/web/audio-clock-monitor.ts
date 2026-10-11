/**
 * Compares the AudioContext's render clock with wall time.
 *
 * Everything the recorder captures reaches the PCM stream and the encoder
 * through the context's render loop, so a context that renders slower than
 * real time drops audio while every other signal looks healthy: frames keep
 * arriving and levels stay normal. The transcript clock on the server only
 * advances by the audio it receives, so the missing time surfaces as a
 * transcript that ends early, or as a hole after a reconnect.
 *
 * Observed on Windows 11 with a timer-paced render sink while the window was
 * minimized: 15.6 ms timer ticks rendering 10 ms each, ≈0.64× real time.
 */

/** A window measuring below this share of real time is slow; healthy ones measure 0.97–1.02. */
const SLOW_RATIO = 0.9;

/**
 * An episode ends only once a window measures at least this. Machines that
 * hover around the slow line otherwise open and close an episode every few
 * windows: in the field, 61% of recoveries landed between 0.90 and 0.95.
 */
const RECOVERED_RATIO = 0.95;

/**
 * Slow windows an episode needs before it is reported. A lone slow window
 * (55% of field episodes) drops a quarter second of audio and is not worth
 * a log line; its time still counts toward the session total.
 */
const MIN_EPISODE_WINDOWS = 2;

/**
 * Readings are taken every 5 s. A longer gap means the machine slept or the
 * sampler stalled, and the context did not render through it by design.
 */
const MAX_WINDOW_MS = 15000;

export type AudioClockTransition =
  | { kind: "slow"; ratio: number; episode: number }
  | { kind: "recovered"; ratio: number; slowForSec: number; episode: number };

export class AudioClockMonitor {
  private clock: object | null = null;
  private lastAudioSec = 0;
  private lastWallMs = 0;
  private ratio: number | null = null;
  /** Slow time in the current episode; null while no episode is open. */
  private episodeSlowMs: number | null = null;
  private episodeWindows = 0;
  private episodeReported = false;
  /** Episodes long enough to have been reported, this session. */
  private episodes = 0;
  private slowTotalMs = 0;

  /**
   * Feed one reading of `clock` (the context being measured). The first
   * reading of a clock only sets the baseline: a rebuilt context restarts its
   * currentTime at zero.
   */
  sample(
    clock: object,
    audioSec: number,
    wallMs: number,
  ): AudioClockTransition | null {
    const previous =
      this.clock === clock
        ? { audioSec: this.lastAudioSec, wallMs: this.lastWallMs }
        : null;
    this.clock = clock;
    this.lastAudioSec = audioSec;
    this.lastWallMs = wallMs;
    // A reading that only sets a baseline leaves no window to report, so
    // the previous ratio must not outlive the context or gap it measured.
    if (!previous) {
      this.ratio = null;
      return null;
    }

    const windowMs = wallMs - previous.wallMs;
    if (windowMs <= 0 || windowMs > MAX_WINDOW_MS) {
      this.ratio = null;
      return null;
    }

    const ratio = (audioSec - previous.audioSec) / (windowMs / 1000);
    this.ratio = ratio;
    if (ratio < SLOW_RATIO) {
      this.slowTotalMs += windowMs;
      this.episodeSlowMs = (this.episodeSlowMs ?? 0) + windowMs;
      this.episodeWindows++;
      const reportable =
        !this.episodeReported && this.episodeWindows >= MIN_EPISODE_WINDOWS;
      if (!reportable) return null;
      this.episodeReported = true;
      this.episodes++;
      return { kind: "slow", ratio, episode: this.episodes };
    }

    // Between the two lines the episode stays open, unreported or not.
    if (this.episodeSlowMs === null || ratio < RECOVERED_RATIO) return null;
    const slowForSec = this.episodeSlowMs / 1000;
    const reported = this.episodeReported;
    this.episodeSlowMs = null;
    this.episodeWindows = 0;
    this.episodeReported = false;
    return reported
      ? { kind: "recovered", ratio, slowForSec, episode: this.episodes }
      : null;
  }

  /** Slow episodes long enough to be reported, this session. */
  getEpisodes(): number {
    return this.episodes;
  }

  /**
   * Drop the baseline because the context stopped rendering on purpose
   * (suspended, or mid-rebuild). The last ratio no longer describes a live
   * context, so it is cleared too. An open slow episode is kept: it describes
   * the recording, not one context, and ends at the next real-time window,
   * so a rebuild that fixes the slowness is reported as a recovery.
   */
  reset(): void {
    this.clock = null;
    this.ratio = null;
  }

  /** Render/wall ratio over the latest window; null when the latest reading only set a baseline, and after reset(). */
  getRatio(): number | null {
    return this.ratio;
  }

  /** Total wall time measured running slow this session. */
  getSlowSec(): number {
    return this.slowTotalMs / 1000;
  }
}
