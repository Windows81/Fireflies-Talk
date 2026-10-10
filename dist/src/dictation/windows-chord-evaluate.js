"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateWindowsChords = evaluateWindowsChords;
/**
 * Keep in sync with EvaluateChords in native-key-listener-windows.
 * Overlapping chords stay both down so releasing action does not KEY_UP dictation.
 */
function evaluateWindowsChords(actionSatisfied, dictationSatisfied, handsFreeSatisfied) {
    return {
        action: actionSatisfied,
        dictation: dictationSatisfied,
        handsFree: handsFreeSatisfied,
    };
}
//# sourceMappingURL=windows-chord-evaluate.js.map