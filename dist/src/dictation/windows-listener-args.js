"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.windowsListenerCliArgs = windowsListenerCliArgs;
const chord_listener_args_1 = require("./chord-listener-args");
function windowsListenerCliArgs(dictation, action, handsFree) {
    const args = [];
    if (dictation.type === "chord") {
        args.push(`--dictation=${(0, chord_listener_args_1.windowsHotkeyString)(dictation)}`);
    }
    if (action?.type === "chord") {
        args.push(`--action=${(0, chord_listener_args_1.windowsHotkeyString)(action)}`);
    }
    if (handsFree?.type === "chord") {
        args.push(`--handsfree=${(0, chord_listener_args_1.windowsHotkeyString)(handsFree)}`);
    }
    return args;
}
//# sourceMappingURL=windows-listener-args.js.map