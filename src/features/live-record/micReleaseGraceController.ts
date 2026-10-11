export interface RecorderSnapshot {
  isActive: boolean;
  processId: number | undefined;
  meetingId: string | undefined;
}

export type GraceTimerHandle = unknown;

export interface GraceConfig {
  initialDelayMs: number;
  retryMs: number;
  maxGraceMs: number;
}

export const DEFAULT_GRACE_CONFIG: GraceConfig = {
  initialDelayMs: 6000,
  retryMs: 30000,
  maxGraceMs: 600000,
};

export interface GraceControllerDeps {
  now: () => number;
  schedule: (fn: () => void, ms: number) => GraceTimerHandle;
  cancel: (handle: GraceTimerHandle) => void;
  isReachable: () => Promise<boolean>;
  getSnapshot: () => RecorderSnapshot;
  stopRecording: () => Promise<void>;
  onError?: (message: string, meta: Record<string, unknown>) => void;
  config?: GraceConfig;
}

export interface MicReleaseGraceController {
  onMicStopped: (pid: number) => void;
  /** Returns true when a pending grace check was cancelled. */
  onMicStarted: (pid: number) => boolean;
  cancelAll: () => void;
}

interface GraceEntry {
  dropTime: number;
  generation: number;
  handle: GraceTimerHandle;
}

/**
 * Per-process grace loop for auto-stopping a recording after the mic is
 * released. On mic loss it waits `initialDelayMs`, then probes reachability:
 * reachable → the meeting really ended → stop; unreachable → likely a network
 * outage → retry every `retryMs` until reachable or `maxGraceMs` elapses.
 * `onMicStarted` cancels the loop (mic resumed). `generation` invalidates any
 * in-flight check whose entry has been cleared or re-armed during its await.
 */
export const createMicReleaseGraceController = (
  deps: GraceControllerDeps,
): MicReleaseGraceController => {
  const config = deps.config ?? DEFAULT_GRACE_CONFIG;
  const entries = new Map<number, GraceEntry>();
  let generationCounter = 0;

  const clearEntry = (pid: number) => {
    const entry = entries.get(pid);
    if (!entry) return false;
    deps.cancel(entry.handle);
    entries.delete(pid);
    return true;
  };

  const stop = (pid: number, meetingId: string | undefined) => {
    deps.stopRecording().catch((error) => {
      deps.onError?.("Auto-stop on mic release failed", {
        pid,
        meetingId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  };

  const runCheck = async (pid: number, generation: number) => {
    const entry = entries.get(pid);
    if (!entry || entry.generation !== generation) return;

    const snapshot = deps.getSnapshot();
    if (!snapshot.isActive || snapshot.processId !== pid) {
      entries.delete(pid);
      return;
    }

    let reachable: boolean;
    try {
      reachable = await deps.isReachable();
    } catch {
      // A broken/missing probe must not strand the session forever — fail safe
      // to the previous behavior (treat as reachable → stop).
      reachable = true;
    }

    // Re-validate after the await: the recording may have ended, switched
    // process, or the mic may have resumed (which clears/re-arms the entry).
    const afterProbe = entries.get(pid);
    if (!afterProbe || afterProbe.generation !== generation) return;

    const snapshotAfter = deps.getSnapshot();
    if (!snapshotAfter.isActive || snapshotAfter.processId !== pid) {
      entries.delete(pid);
      return;
    }

    if (reachable) {
      entries.delete(pid);
      stop(pid, snapshotAfter.meetingId);
      return;
    }

    if (deps.now() - afterProbe.dropTime >= config.maxGraceMs) {
      entries.delete(pid);
      stop(pid, snapshotAfter.meetingId);
      return;
    }

    // Reschedule within the same grace episode; the generation is intentionally
    // unchanged so a later mic_started/mic_stopped can still invalidate this loop.
    afterProbe.handle = deps.schedule(
      () => void runCheck(pid, generation),
      config.retryMs,
    );
  };

  return {
    onMicStopped: (pid) => {
      clearEntry(pid);
      const generation = (generationCounter += 1);
      const handle = deps.schedule(
        () => void runCheck(pid, generation),
        config.initialDelayMs,
      );
      entries.set(pid, { dropTime: deps.now(), generation, handle });
    },
    onMicStarted: (pid) => clearEntry(pid),
    cancelAll: () => {
      for (const entry of entries.values()) deps.cancel(entry.handle);
      entries.clear();
    },
  };
};
