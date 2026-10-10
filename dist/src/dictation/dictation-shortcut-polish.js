"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerPolish = triggerPolish;
exports.isCurrentlyPolishing = isCurrentlyPolishing;
const dictation_paste_guard_1 = require("./dictation-paste-guard");
const dictation_hold_machine_1 = require("./dictation-hold-machine");
const dictation_mode_1 = require("./dictation-mode");
const dictation_polish_read_1 = require("./dictation-polish-read");
const system_media_playback_1 = require("./system-media-playback");
let isPolishing = false;
async function checkAndPolishSelectedText(ctx, generation) {
    if (!ctx.isDictationEnabled())
        return false;
    const hs = ctx.getHoldState();
    if (hs.recording || hs.latched || hs.pendingDoubleTap || isPolishing)
        return false;
    if (generation !== ctx.getPolishGeneration())
        return false;
    isPolishing = true;
    try {
        const selectedText = await (0, dictation_polish_read_1.readSelectedTextForPolish)();
        if (generation !== ctx.getPolishGeneration() || !selectedText)
            return false;
        ctx.sendToMain("dictation:polish-selection", selectedText, (0, dictation_paste_guard_1.nextDictationPasteEpoch)());
        return true;
    }
    finally {
        isPolishing = false;
    }
}
function triggerPolish(ctx) {
    ctx.clearPendingLatchedFnDown();
    if (!ctx.isDictationEnabled())
        return;
    if (isPolishing)
        return;
    if (!(0, dictation_mode_1.canBeginDictation)(ctx.getRendererState()))
        return;
    const hs = ctx.getHoldState();
    const wasActive = hs.recording || hs.latched;
    ctx.setHoldState((0, dictation_hold_machine_1.initialDictationHoldState)());
    ctx.clearDoubleTapTimer();
    ctx.unregisterCancelShortcut();
    const generation = ctx.bumpPolishGeneration();
    if (wasActive) {
        ctx.disarmStopArm();
        (0, system_media_playback_1.onDictationShortcutReleased)();
        ctx.sendToMain("dictation:cancel");
    }
    void checkAndPolishSelectedText(ctx, generation);
}
function isCurrentlyPolishing() {
    return isPolishing;
}
//# sourceMappingURL=dictation-shortcut-polish.js.map