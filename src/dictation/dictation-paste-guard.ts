let pasteEpochCounter = 0;

export function nextDictationPasteEpoch(): number {
  pasteEpochCounter += 1;
  return pasteEpochCounter;
}

export function createDictationStopArm() {
  let armed = false;
  return {
    arm() {
      armed = true;
    },
    disarm() {
      armed = false;
    },
    takeEpoch(): number | null {
      if (!armed) return null;
      armed = false;
      return nextDictationPasteEpoch();
    },
  };
}

export type DictationPasteGuardState = {
  inFlightEpoch: number | null;
  lastAcceptedEpoch: number | null;
};

export type DictationPasteSkipReason = "in-flight" | "replayed-epoch";

export type DictationPasteDecision =
  | { action: "run"; next: DictationPasteGuardState }
  | { action: "skip"; reason: DictationPasteSkipReason };

export function createDictationPasteGuardState(): DictationPasteGuardState {
  return { inFlightEpoch: null, lastAcceptedEpoch: null };
}

export function isDictationPasteEpoch(epoch: unknown): epoch is number {
  return typeof epoch === "number" && Number.isFinite(epoch) && epoch >= 1;
}

export function decideDictationPaste(
  state: DictationPasteGuardState,
  epoch: unknown,
): DictationPasteDecision {
  if (!isDictationPasteEpoch(epoch)) {
    return { action: "run", next: state };
  }
  if (state.lastAcceptedEpoch === epoch) {
    return { action: "skip", reason: "replayed-epoch" };
  }
  if (state.inFlightEpoch === epoch) {
    return { action: "skip", reason: "in-flight" };
  }
  return {
    action: "run",
    next: { ...state, inFlightEpoch: epoch },
  };
}

export function finishDictationPaste(
  state: DictationPasteGuardState,
  result: { ok: boolean; epoch: unknown },
): DictationPasteGuardState {
  if (!isDictationPasteEpoch(result.epoch)) {
    return state;
  }
  return {
    inFlightEpoch:
      state.inFlightEpoch === result.epoch ? null : state.inFlightEpoch,
    lastAcceptedEpoch: result.ok ? result.epoch : state.lastAcceptedEpoch,
  };
}
