"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polishChangeNeedsRestart = exports.needsPolishOnlyFnListener = void 0;
exports.stopDictationHotkeyListeners = stopDictationHotkeyListeners;
exports.setMacosCaptureMode = setMacosCaptureMode;
exports.recoverDictationHotkeyState = recoverDictationHotkeyState;
exports.startDictationHotkeyListeners = startDictationHotkeyListeners;
const electron_log_1 = __importDefault(require("electron-log"));
const chord_listener_args_1 = require("./chord-listener-args");
const dictation_binding_1 = require("./dictation-binding");
const fn_listener_callbacks_1 = require("./fn-listener-callbacks");
const globe_key_listener_1 = require("./globe-key-listener");
const hands_free_binding_1 = require("./hands-free-binding");
const macos_chord_listener_1 = require("./macos-chord-listener");
const macos_shared_chord_1 = require("./macos-shared-chord");
const polish_binding_1 = require("./polish-binding");
const windows_key_listener_1 = require("./windows-key-listener");
const windows_listener_args_1 = require("./windows-listener-args");
function stopDictationHotkeyListeners() {
    (0, globe_key_listener_1.stopGlobeKeyListener)();
    (0, macos_chord_listener_1.stopMacosChordListener)();
    (0, windows_key_listener_1.stopWindowsKeyListener)();
}
/** Set when capture started the Fn listener, so capture also stops it. */
let globeStartedForCapture = false;
/**
 * Keeps an Fn listener running while settings records a shortcut, since the
 * page never receives Fn from macOS itself. Chord listeners stop instead, so
 * the shortcut being replaced cannot fire. A chord dictation shortcut leaves
 * no Fn listener running, so capture starts one — otherwise Fn could never be
 * recorded by someone who is not already using it. A polish-only listener is
 * swapped for a full one, or pressing Fn alone would trigger the Globe action.
 */
function setMacosCaptureMode(enabled, callbacks) {
    if (!enabled) {
        (0, globe_key_listener_1.setGlobeCaptureMode)(false);
        if (globeStartedForCapture) {
            globeStartedForCapture = false;
            (0, globe_key_listener_1.stopGlobeKeyListener)();
        }
        return;
    }
    (0, macos_chord_listener_1.stopMacosChordListener)();
    if ((0, globe_key_listener_1.isGlobeListenerPolishOnly)())
        (0, globe_key_listener_1.stopGlobeKeyListener)();
    if (!(0, globe_key_listener_1.isGlobeKeyListenerRunning)()) {
        (0, globe_key_listener_1.setGlobeHoldChord)(null);
        (0, globe_key_listener_1.startGlobeKeyListener)(callbacks);
        globeStartedForCapture = true;
    }
    (0, globe_key_listener_1.setGlobeCaptureMode)(true);
}
function recoverDictationHotkeyState() {
    if (process.platform !== "darwin")
        return;
    (0, globe_key_listener_1.restoreLeftoverFnUsage)();
}
/**
 * One native listener watches Fn, so it serves a single role: the dictation
 * hold, or bare-Fn hands-free while push to talk is a chord.
 */
function startFnBinding(role, binding, callbacks) {
    if (role === "handsFree" && (0, dictation_binding_1.usesDarwinFnBinding)(binding)) {
        (0, globe_key_listener_1.setGlobeHoldChord)(null);
        (0, globe_key_listener_1.startGlobeKeyListener)((0, fn_listener_callbacks_1.fnHandsFreeCallbacks)(callbacks));
        return;
    }
    if (role !== "dictation") {
        electron_log_1.default.error(`[Dictation] Fn is not supported for the ${role} shortcut`);
        return;
    }
    (0, globe_key_listener_1.setGlobeHoldChord)(binding.key ? ((0, dictation_binding_1.macVirtualKeyForToken)(binding.key) ?? null) : null);
    (0, globe_key_listener_1.startGlobeKeyListener)(callbacks);
}
/** An Fn polish lives on the Fn listener, which nothing else starts here. */
const needsPolishOnlyFnListener = (dictation, handsFree, polish) => polish?.type === "darwin-fn" &&
    dictation.type !== "darwin-fn" &&
    !(handsFree && (0, dictation_binding_1.usesDarwinFnBinding)(handsFree));
exports.needsPolishOnlyFnListener = needsPolishOnlyFnListener;
/**
 * Whether a polish change needs the listeners restarted. A chord polish runs
 * on its own helper, so any change to it does. An Fn polish only does when it
 * starts or stops needing the Fn listener; its keys update live.
 */
const polishChangeNeedsRestart = (dictation, handsFree, previous, next) => {
    if (previous?.type === "chord" || next?.type === "chord") {
        return !(0, polish_binding_1.polishBindingsEqual)(previous, next);
    }
    return ((0, exports.needsPolishOnlyFnListener)(dictation, handsFree, previous) !==
        (0, exports.needsPolishOnlyFnListener)(dictation, handsFree, next));
};
exports.polishChangeNeedsRestart = polishChangeNeedsRestart;
function startMacosChord(role, binding, callbacks, extraArgs = []) {
    const args = (0, chord_listener_args_1.macChordListenerArgs)(binding);
    if ("error" in args) {
        electron_log_1.default.error("[Dictation] Cannot start macOS chord listener:", args.error);
        return;
    }
    (0, macos_chord_listener_1.startMacosChordListener)(role, callbacks, [...args, ...extraArgs]);
}
/**
 * Polish fires the moment its chord goes down, so it only answers to its exact
 * modifiers. Two helpers on one key starve each other, so a polish chord that
 * shares a key with another shortcut stays off rather than break it. Recorders
 * refuse that pairing, so only a hand-edited settings file gets here.
 */
function startPolishChord(polish, others, callbacks) {
    if (others.some((other) => (0, polish_binding_1.polishSharesKey)(polish, other))) {
        electron_log_1.default.warn("[Dictation] Polish shortcut shares its key with another shortcut; leaving polish off");
        return;
    }
    startMacosChord("polish", polish, callbacks, ["--exact-mods"]);
}
function startMacosBinding(role, binding, callbacks, extraArgs = []) {
    if (binding.type === "darwin-fn") {
        startFnBinding(role, binding, callbacks);
        return;
    }
    if (binding.type !== "chord") {
        const _exhaustive = binding;
        void _exhaustive;
        return;
    }
    startMacosChord(role, binding, callbacks, extraArgs);
}
function startDictationHotkeyListeners(binding, action, handsFree, polish, callbacks) {
    stopDictationHotkeyListeners();
    if (process.platform === "win32") {
        const args = (0, windows_listener_args_1.windowsListenerCliArgs)(binding, action, handsFree);
        if (args.length === 0)
            return;
        (0, windows_key_listener_1.startWindowsKeyListener)(callbacks, args);
        return;
    }
    if (process.platform !== "darwin")
        return;
    (0, globe_key_listener_1.setGlobeHandsFreeKey)((0, hands_free_binding_1.handsFreeFnKeyCode)(handsFree));
    // A helper swallows its key, so two helpers on the same key would starve
    // each other. The dictation helper then reports both roles.
    if ((0, macos_shared_chord_1.sharesChordTarget)(binding, action)) {
        startMacosBinding("dictation", binding, callbacks, [
            (0, macos_shared_chord_1.macSharedActionArg)(action),
        ]);
    }
    else {
        startMacosBinding("dictation", binding, callbacks);
        if (action)
            startMacosBinding("action", action, callbacks);
    }
    if (handsFree &&
        !(0, macos_shared_chord_1.sharesChordTarget)(binding, handsFree) &&
        !(0, macos_shared_chord_1.sharesChordTarget)(action ?? binding, handsFree)) {
        startMacosBinding("handsFree", handsFree, callbacks);
    }
    if (polish?.type === "chord") {
        startPolishChord(polish, [binding, action, handsFree], callbacks);
    }
    if ((0, exports.needsPolishOnlyFnListener)(binding, handsFree, polish)) {
        (0, globe_key_listener_1.setGlobeHoldChord)(null);
        (0, globe_key_listener_1.startGlobeKeyListener)((0, fn_listener_callbacks_1.fnPolishOnlyCallbacks)(callbacks), {
            polishOnly: true,
        });
    }
}
//# sourceMappingURL=dictation-hotkey-listeners.js.map