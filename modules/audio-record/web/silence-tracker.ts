/**
 * Detects "effectively dead" audio — capture paths that keep delivering
 * frames on time while their content is digital silence — and escalates
 * recovery. Complements the data-stall watchdog in AudioRecorder, which only
 * notices when frames stop flowing entirely.
 *
 * Why a dB threshold instead of an exact-zero sample test: on Windows the
 * two capture paths die differently. A WASAPI loopback whose render endpoint
 * vanished keeps pumping mathematical zeros (our RMS meter clamps them to
 * -240 dB), but a dead microphone path emits ~1 LSB of audio-engine dither
 * (~1e-6 amplitude ≈ -119 dB) — never exact zeros, so a `sample !== 0` test
 * is blind to it. A typical live mic (silent room, AEC on) idles above
 * ~-90 dB thanks to electrical/room noise floor, so -100 dB is the default
 * dividing line.
 *
 * The default line is NOT universal: Bluetooth headsets with onboard noise
 * cancelling gate a perfectly LIVE mic into the dead-dither band (observed:
 * soundcore Q30 idling at -117.6 dB with a live, unmuted track). No static
 * threshold can separate that from death — the observables are identical.
 * The tie-breaker is re-acquisition itself: if a re-acquire SUCCEEDS and the
 * fresh OS stream still reads the same floor, that floor is what the device
 * genuinely produces, so the ladder calibrates the source's dead threshold
 * below it for the rest of the session instead of churning the device
 * (each BT mic re-open risks an audible A2DP→HFP profile bounce). Exact-zero
 * floors (≤ ADAPT_FLOOR_MIN_DB) never calibrate — zeros through a path whose
 * source is alive mean a wedged graph, where escalating to a restart is
 * right — and any device-topology change resets calibration so a genuinely
 * new/dead route gets fresh detection.
 */

/** RMS level at or below which a source counts as dead air (≈1e-5 amplitude). */
export const EFFECTIVELY_DEAD_DB = -100;

/** Below this, a floor is exact-zero territory — never a transducer, so never calibrated. */
const ADAPT_FLOOR_MIN_DB = -140;
/** Calibrated thresholds sit this far under the verified floor. */
const ADAPT_MARGIN_DB = 6;
/** Samples (5s health ticks) to wait after a successful re-acquire before judging it. */
const VERIFY_TICKS = 3;

export type DeadAirSource = "microphone" | "system" | "mix";

/**
 * Result of a re-acquisition the ladder requested. "blocked" = dropped
 * before attempting (refunds the budget); "failed" = attempted but errored
 * (counts, retryable); "recovered" = a fresh stream was swapped in (starts
 * floor verification).
 */
export type ReacquireOutcome = "recovered" | "failed" | "blocked";

/** Per-source RMS levels in dB; null when the source has no analyser. */
export interface DeadAirLevels {
  micDb: number | null;
  systemDb: number | null;
  mixDb: number | null;
  /**
   * The mic is intentionally gated (dictation holding the meeting-mic gate),
   * not failing. While set, the post-mix analyser reads only the system
   * branch, so a low mix can't tell a dead pipeline from a quiet meeting —
   * the system-reacquire rung still runs but the destructive graph-restart
   * rung stays suspended.
   */
  micGated?: boolean;
}

export interface SilenceTrackerActions {
  reacquireMicrophone(reason: string): void;
  reacquireSystemAudio(reason: string): void;
  restartAudioGraph(reason: string): void;
  log?(message: string): void;
}

export interface SilenceTrackerConfig {
  /** Level at or below which a source counts as dead air. */
  deadDb: number;
  /** Mic dead this long → re-acquire the microphone stream. */
  micReacquireAfterSec: number;
  /**
   * Mixed output dead this long → re-acquire system audio. Keyed on the mix
   * (not the system branch alone) because a quiet loopback is legitimate —
   * nothing playing produces exact zeros — while a dead mix means the mic
   * noise floor is gone too, which never happens on a healthy capture.
   */
  mixReacquireAfterSec: number;
  /**
   * A dead episode only ENDS once the level rises this far above the dead
   * threshold. A struggling capture path doesn't sit cleanly below the
   * line — it hovers around it (observed: a failing BT hands-free mic
   * wandering -93…-112 dB) — and without a hysteresis band every hop above
   * the threshold would reset the escalation clock, so recovery never runs.
   */
  hysteresisDb: number;
  /**
   * Once the mic has carried signal above this level (clear speech, not
   * bleed — a broken BT mic was observed leaking up to -86 dB of garbage),
   * the mic rung is disarmed for that stream: any later silence is a
   * noise-cancelling gate, and poking a proven Bluetooth link risks an
   * audible profile bounce right before the user's next utterance. Real
   * deaths of proven mics are recovered by the causal layers only
   * (devicechange, track events, graph restart).
   */
  micProofOfLifeDb: number;
  /** Each retry within an episode waits this multiple longer than the last. */
  reacquireBackoffMultiplier: number;
  /** Re-acquire attempts per source within one dead-air episode. */
  maxReacquireAttemptsPerEpisode: number;
  /** Everything dead this long (and re-acquire tried) → full graph restart. */
  graphRestartAfterSec: number;
  /** Ceiling for the doubling interval between repeated graph restarts. */
  graphRestartMaxIntervalSec: number;
}

export const DEFAULT_SILENCE_TRACKER_CONFIG: SilenceTrackerConfig = {
  deadDb: EFFECTIVELY_DEAD_DB,
  hysteresisDb: 10,
  micProofOfLifeDb: -65,
  micReacquireAfterSec: 45,
  mixReacquireAfterSec: 30,
  reacquireBackoffMultiplier: 2,
  maxReacquireAttemptsPerEpisode: 4,
  graphRestartAfterSec: 120,
  graphRestartMaxIntervalSec: 600,
};

interface LadderState {
  label: string;
  initialDelaySec: number;
  /** Level at or below which this source counts as dead; calibrated per session. */
  deadDb: number;
  /** Loudest level seen since the stream was (re)established — the proof-of-life latch. */
  maxDbSinceReset: number;
  deadSinceMs: number | null;
  attempts: number;
  nextActionAtMs: number;
  /** Countdown of samples judging the floor after a successful re-acquire. */
  verifyTicksLeft: number | null;
}

/**
 * Escalation ladder fed by periodic level samples. Guiding principle:
 * recover what was LOST — never poke what has proven itself, never conjure
 * what never existed. Silence is a normal state (listen-only meetings,
 * waiting rooms, noise-cancelling gates), so levels alone justify action
 * only in narrow, evidence-backed cases:
 *
 * 1. Mix dead ≥ 30s → re-grab system loopback. The legacy/fallback Windows
 *    `loopback` path can keep delivering zeros after its render endpoint
 *    vanishes, and re-acquiring binds it to the current default output;
 *    supported non-muted Windows uses all-device process loopback instead.
 *    Always allowed — the re-grab is invisible and touches no microphone.
 * 2. Mic dead ≥ 45s → re-acquire the microphone, but ONLY when the mic has
 *    never carried speech-level signal this stream AND the meeting is
 *    demonstrably live (system audio has played, or there is no system
 *    branch). A proven mic that reads silent is a noise-cancelling gate —
 *    the user's next utterance depends on us leaving the link alone.
 * 3. Everything dead ≥ 120s, after a re-acquire had its shot, and only if
 *    the signal was ONCE alive → full audio-graph restart with a doubling
 *    interval. From-birth-silent sessions never restart.
 *
 * Attempts are bounded per episode (contiguous dead period) with backoff so
 * an unfixable state doesn't thrash; budgets reset when signal returns or
 * the device topology changes (new topology = fresh chances).
 */
export class SilenceTracker {
  private readonly config: SilenceTrackerConfig;
  private readonly mic: LadderState;
  private readonly mix: LadderState;
  private systemDeadSinceMs: number | null = null;
  private systemMaxDbSinceReset = -Infinity;
  /**
   * The last time the mic gate opened. Dead time measured while gated is
   * ambiguous — a quiet mix may be nothing but the muted mic — so only
   * ungated dead time counts toward a graph restart.
   */
  private gateReleasedAtMs = 0;
  private wasMicGated = false;
  private restartNextAtMs = 0;
  private restartIntervalSec: number;

  constructor(
    private readonly actions: SilenceTrackerActions,
    config?: Partial<SilenceTrackerConfig>,
  ) {
    this.config = { ...DEFAULT_SILENCE_TRACKER_CONFIG, ...config };
    this.mic = this.freshLadder("microphone", this.config.micReacquireAfterSec);
    this.mix = this.freshLadder(
      "mixed output",
      this.config.mixReacquireAfterSec,
    );
    this.restartIntervalSec = this.config.graphRestartAfterSec;
  }

  sample(levels: DeadAirLevels, nowMs: number): void {
    // Snapshot BEFORE advancing the ladders: a re-acquire fired this tick
    // must get at least one sample period to restore signal before the
    // restart rung is allowed to tear the graph down.
    const attemptsBeforeTick = this.mic.attempts + this.mix.attempts;

    if (levels.micDb !== null) {
      this.mic.maxDbSinceReset = Math.max(
        this.mic.maxDbSinceReset,
        levels.micDb,
      );
    }
    if (levels.mixDb !== null) {
      this.mix.maxDbSinceReset = Math.max(
        this.mix.maxDbSinceReset,
        levels.mixDb,
      );
    }
    if (levels.systemDb !== null) {
      this.systemMaxDbSinceReset = Math.max(
        this.systemMaxDbSinceReset,
        levels.systemDb,
      );
    }

    // The mic rung acts ONLY on a mic that has never proven itself, and only
    // once the meeting is demonstrably live (system audio has played, or
    // there is no system branch). A proven mic that reads dead is a
    // noise-cancelling gate — an hour of listen-only silence is normal, and
    // touching the Bluetooth link would jeopardize the user's next
    // utterance. Both-sides-silent waiting rooms trigger nothing.
    const micProven = this.mic.maxDbSinceReset > this.config.micProofOfLifeDb;
    const meetingHasHadAudio =
      levels.systemDb === null ||
      this.systemMaxDbSinceReset > this.aliveBandDb();
    const micCanFire = !micProven && meetingHasHadAudio;

    this.trackSystem(levels.systemDb, nowMs);
    this.advanceLadder(
      this.mic,
      levels.micDb,
      nowMs,
      micCanFire,
      (attempt, deadSec) =>
        this.fireReacquire("microphone", attempt, deadSec, (reason) =>
          this.actions.reacquireMicrophone(reason),
        ),
    );
    this.advanceLadder(
      this.mix,
      levels.mixDb,
      nowMs,
      true,
      (attempt, deadSec) =>
        this.fireReacquire("mixed output", attempt, deadSec, (reason) =>
          this.actions.reacquireSystemAudio(reason),
        ),
    );
    // Sync edges come through noteMicGate; the sampled flag only covers a
    // gate that was already held when this tracker was created.
    if (levels.micGated === true) this.wasMicGated = true;
    this.advanceRestartRung(levels, nowMs, attemptsBeforeTick);
  }

  /**
   * Gate transitions are reported here rather than inferred from the 5s
   * sampler — a gate cycle shorter than a tick would otherwise leave no
   * trace, and the release would never restart the restart-eligibility
   * clock.
   */
  noteMicGate(gated: boolean, nowMs: number): void {
    if (this.wasMicGated && !gated) this.gateReleasedAtMs = nowMs;
    this.wasMicGated = gated;
  }

  /** Dead-air duration per source, for heartbeat telemetry. */
  getDeadAirSec(source: DeadAirSource, nowMs: number): number {
    const since =
      source === "microphone"
        ? this.mic.deadSinceMs
        : source === "system"
          ? this.systemDeadSinceMs
          : this.mix.deadSinceMs;
    return since === null ? 0 : (nowMs - since) / 1000;
  }

  /**
   * A device-topology event gives every dead source a fresh chance: attempt
   * budgets AND calibrated thresholds reset — the learned noise floor
   * belongs to the previous device landscape. Scheduled rung times and the
   * restart rung are deliberately untouched: deferring them here would let
   * recurring unrelated device churn (a flaky dock, a webcam hot-plug)
   * starve recovery indefinitely. Dead-since timestamps are kept so
   * telemetry shows the full outage.
   */
  noteTopologyChange(): void {
    for (const ladder of [this.mic, this.mix]) {
      ladder.attempts = 0;
      ladder.deadDb = this.config.deadDb;
      ladder.verifyTicksLeft = null;
    }
  }

  /**
   * Feed back what happened to a re-acquisition this ladder requested.
   * "blocked" (dropped before attempting — another recovery in flight,
   * cooldown, override stream) refunds the budget so no-ops don't exhaust
   * the ladder or arm the restart rung; the rung keeps its scheduled time
   * so pacing is preserved. "recovered" opens the floor-verification
   * window. "failed" just counts — real failures stay retryable.
   */
  noteReacquireOutcome(
    source: "microphone" | "mix",
    outcome: ReacquireOutcome,
  ): void {
    const ladder = source === "microphone" ? this.mic : this.mix;
    if (outcome === "blocked") {
      ladder.attempts = Math.max(0, ladder.attempts - 1);
      return;
    }
    if (outcome === "recovered") {
      ladder.verifyTicksLeft = VERIFY_TICKS;
      if (source === "microphone") {
        // A new physical stream was swapped in — its proof-of-life starts
        // over. (The mix is a graph node, not a stream; its history stands.)
        ladder.maxDbSinceReset = -Infinity;
      }
    }
  }

  /** Current dead threshold per ladder (default or session-calibrated). */
  getDeadThresholdDb(source: "microphone" | "mix"): number {
    return (source === "microphone" ? this.mic : this.mix).deadDb;
  }

  /**
   * Forget all episode state for a fresh measurement. Used on resume:
   * dead-air time must not span a pause, or a stale episode would burst
   * straight to the top of the ladder seconds after resuming.
   */
  reset(): void {
    this.resetLadder(this.mic);
    this.resetLadder(this.mix);
    this.systemDeadSinceMs = null;
    this.gateReleasedAtMs = 0;
    this.wasMicGated = false;
    this.restartNextAtMs = 0;
    this.restartIntervalSec = this.config.graphRestartAfterSec;
  }

  private freshLadder(label: string, initialDelaySec: number): LadderState {
    return {
      label,
      initialDelaySec,
      deadDb: this.config.deadDb,
      maxDbSinceReset: -Infinity,
      deadSinceMs: null,
      attempts: 0,
      nextActionAtMs: 0,
      verifyTicksLeft: null,
    };
  }

  /** Level above which a source counts as demonstrably alive (exits the hysteresis band). */
  private aliveBandDb(): number {
    return this.config.deadDb + this.config.hysteresisDb;
  }

  // Ends the episode; the calibrated threshold survives (same device).
  private resetLadder(ladder: LadderState): void {
    ladder.deadSinceMs = null;
    ladder.attempts = 0;
    ladder.nextActionAtMs = 0;
    ladder.verifyTicksLeft = null;
  }

  private trackSystem(systemDb: number | null, nowMs: number): void {
    if (systemDb === null || systemDb > this.config.deadDb) {
      this.systemDeadSinceMs = null;
      return;
    }
    this.systemDeadSinceMs ??= nowMs;
  }

  private advanceLadder(
    ladder: LadderState,
    db: number | null,
    nowMs: number,
    canFire: boolean,
    fire: (attempt: number, deadSec: number) => void,
  ): void {
    if (db === null) {
      this.resetLadder(ladder);
      return;
    }
    if (ladder.deadSinceMs === null) {
      // Entering an episode requires the level at or below the threshold…
      if (db > ladder.deadDb) return;
      ladder.deadSinceMs = nowMs;
      ladder.nextActionAtMs = nowMs + ladder.initialDelaySec * 1000;
      return;
    }
    // …but ending one requires clearing the hysteresis band: readings
    // hovering just above the threshold are a struggling path flickering
    // across the line, not proof of life — they must not reset the clock.
    if (db > ladder.deadDb + this.config.hysteresisDb) {
      this.resetLadder(ladder);
      return;
    }

    // A successful re-acquire is pending judgment: if the FRESH stream still
    // reads this floor after the window, the floor is what the device
    // genuinely produces (an NC gate, not death) — calibrate instead of
    // churning the device.
    if (ladder.verifyTicksLeft !== null) {
      ladder.verifyTicksLeft--;
      if (ladder.verifyTicksLeft > 0) return;
      ladder.verifyTicksLeft = null;
      this.calibrateFloor(ladder, db);
      return;
    }

    // Gated rungs keep tracking the episode (telemetry, hysteresis) but
    // take no action.
    if (!canFire) return;
    if (ladder.attempts >= this.config.maxReacquireAttemptsPerEpisode) return;
    if (nowMs < ladder.nextActionAtMs) return;

    ladder.attempts++;
    const backoffSec =
      ladder.initialDelaySec *
      this.config.reacquireBackoffMultiplier ** ladder.attempts;
    ladder.nextActionAtMs = nowMs + backoffSec * 1000;
    fire(ladder.attempts, (nowMs - ladder.deadSinceMs) / 1000);
  }

  /**
   * Lower the ladder's dead threshold under a verified live floor. Exact-zero
   * floors never calibrate: a source that is alive upstream but reads zeros
   * means a wedged graph node, where escalating (not adapting) is correct.
   */
  private calibrateFloor(ladder: LadderState, floorDb: number): void {
    if (floorDb <= ADAPT_FLOOR_MIN_DB) return;
    const calibrated = Math.min(ladder.deadDb, floorDb - ADAPT_MARGIN_DB);
    if (calibrated < ladder.deadDb) {
      ladder.deadDb = calibrated;
      this.actions.log?.(
        `Calibrated ${ladder.label} noise floor: ${floorDb.toFixed(1)} dB persists on a freshly re-acquired stream (noise-cancelling gate, not a dead path) — treating below ${calibrated.toFixed(1)} dB as dead until the device topology changes.`,
      );
    }
    // The verified floor is the device's real output — end the episode so
    // the hysteresis band doesn't hold it open at the old threshold.
    this.resetLadder(ladder);
  }

  private fireReacquire(
    label: string,
    attempt: number,
    deadSec: number,
    action: (reason: string) => void,
  ): void {
    const reason = `${label} effectively silent for ${Math.round(deadSec)}s (attempt ${attempt}/${this.config.maxReacquireAttemptsPerEpisode})`;
    this.actions.log?.(`Dead air detected: ${reason}.`);
    action(reason);
  }

  /**
   * Nuclear rung. Watches whichever signal covers ALL live sources — the
   * post-mix level when mixing, else the mic — and only fires after a
   * source-level re-acquire already had its shot on an earlier tick.
   * First restart fires at graphRestartAfterSec dead; repeats follow at
   * 2×, 4×, … that interval, capped at graphRestartMaxIntervalSec.
   */
  private advanceRestartRung(
    levels: DeadAirLevels,
    nowMs: number,
    attemptsBeforeTick: number,
  ): void {
    // A gated mic makes the mix's silence ambiguous, so its dead reading
    // may justify re-acquisition but never a graph teardown.
    const primary = levels.micGated
      ? null
      : levels.mixDb !== null
        ? this.mix
        : levels.micDb !== null
          ? this.mic
          : null;
    if (!primary || primary.deadSinceMs === null) {
      this.restartNextAtMs = 0;
      this.restartIntervalSec = this.config.graphRestartAfterSec;
      return;
    }

    const deadSec =
      (nowMs - Math.max(primary.deadSinceMs, this.gateReleasedAtMs)) / 1000;
    if (deadSec < this.config.graphRestartAfterSec) return;
    if (attemptsBeforeTick === 0) return;
    // Restart recovers audio that was LOST — a session that has been silent
    // from birth (both-sides-quiet waiting room, listen-only with an NC
    // gate) must never be torn down over it.
    if (primary.maxDbSinceReset <= this.aliveBandDb()) return;
    if (nowMs < this.restartNextAtMs) return;

    this.restartIntervalSec = Math.min(
      this.restartIntervalSec * 2,
      this.config.graphRestartMaxIntervalSec,
    );
    this.restartNextAtMs = nowMs + this.restartIntervalSec * 1000;

    const reason = `audio effectively silent for ${Math.round(deadSec)}s despite source recovery attempts`;
    this.actions.log?.(
      `Dead air persists: ${reason} — restarting audio graph.`,
    );
    this.actions.restartAudioGraph(reason);
  }
}
