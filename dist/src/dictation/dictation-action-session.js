"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endActionHold = exports.beginActionHold = exports.resetActionSessionFlags = exports.clearForceCommandMode = exports.setDictationHeld = exports.isActionHeld = exports.isDictationHeld = exports.isForceCommandMode = void 0;
let dictationHeld = false;
let actionHeld = false;
let forceCommandMode = false;
const isForceCommandMode = () => forceCommandMode;
exports.isForceCommandMode = isForceCommandMode;
const isDictationHeld = () => dictationHeld;
exports.isDictationHeld = isDictationHeld;
const isActionHeld = () => actionHeld;
exports.isActionHeld = isActionHeld;
const setDictationHeld = (held) => {
    dictationHeld = held;
};
exports.setDictationHeld = setDictationHeld;
const clearForceCommandMode = () => {
    forceCommandMode = false;
};
exports.clearForceCommandMode = clearForceCommandMode;
const resetActionSessionFlags = () => {
    dictationHeld = false;
    actionHeld = false;
    forceCommandMode = false;
};
exports.resetActionSessionFlags = resetActionSessionFlags;
const beginActionHold = (params) => {
    actionHeld = true;
    if (params.holdState.recording) {
        forceCommandMode = true;
        params.upgradeToCommand();
        return;
    }
    params.beginHold();
    if (params.isRecording())
        forceCommandMode = true;
};
exports.beginActionHold = beginActionHold;
const endActionHold = (endHold) => {
    actionHeld = false;
    if (dictationHeld)
        return;
    endHold();
};
exports.endActionHold = endActionHold;
//# sourceMappingURL=dictation-action-session.js.map