"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextDictationPasteEpoch = nextDictationPasteEpoch;
exports.createDictationStopArm = createDictationStopArm;
exports.createDictationPasteGuardState = createDictationPasteGuardState;
exports.isDictationPasteEpoch = isDictationPasteEpoch;
exports.decideDictationPaste = decideDictationPaste;
exports.finishDictationPaste = finishDictationPaste;
let pasteEpochCounter = 0;
function nextDictationPasteEpoch() {
    pasteEpochCounter += 1;
    return pasteEpochCounter;
}
function createDictationStopArm() {
    let armed = false;
    return {
        arm() {
            armed = true;
        },
        disarm() {
            armed = false;
        },
        takeEpoch() {
            if (!armed)
                return null;
            armed = false;
            return nextDictationPasteEpoch();
        },
    };
}
function createDictationPasteGuardState() {
    return { inFlightEpoch: null, lastAcceptedEpoch: null };
}
function isDictationPasteEpoch(epoch) {
    return typeof epoch === "number" && Number.isFinite(epoch) && epoch >= 1;
}
function decideDictationPaste(state, epoch) {
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
function finishDictationPaste(state, result) {
    if (!isDictationPasteEpoch(result.epoch)) {
        return state;
    }
    return {
        inFlightEpoch: state.inFlightEpoch === result.epoch ? null : state.inFlightEpoch,
        lastAcceptedEpoch: result.ok ? result.epoch : state.lastAcceptedEpoch,
    };
}
//# sourceMappingURL=dictation-paste-guard.js.map