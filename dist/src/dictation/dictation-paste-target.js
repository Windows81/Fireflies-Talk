"use strict";
/**
 * Paste-target verdicts reported by the native paste helpers.
 *
 * Both helpers answer `OK <TARGET|NONE|UNKNOWN> <ms>` after posting the paste
 * keystroke: TARGET when the focused element could take text, NONE when the
 * paste confidently landed nowhere (desktop, file list, static content),
 * UNKNOWN when the probe could not tell. Only NONE changes behaviour — an
 * uncertain probe must never suppress a paste or show a false toast. A paste
 * ACK adds a fourth token, the microseconds the helper spent on it.
 *
 * Some apps take a paste with nothing focused: Slack, Claude and Cursor move
 * focus into their composer and insert there. The element focused at the
 * keystroke says NONE for those, so when it does, the helpers are asked again
 * (`PROBE`) once the app has handled the paste — focus now resting in a field
 * means the text landed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASTE_TARGET_RECHECK_DELAY_MS = exports.UNKNOWN_PASTE_TARGET = void 0;
exports.parsePasteAck = parsePasteAck;
exports.needsPasteTargetRecheck = needsPasteTargetRecheck;
exports.settlePasteTarget = settlePasteTarget;
exports.shouldFallbackToClipboard = shouldFallbackToClipboard;
exports.UNKNOWN_PASTE_TARGET = {
    verdict: "unknown",
    probeMs: 0,
};
const VERDICT_TOKENS = {
    TARGET: "editable",
    NONE: "none",
    UNKNOWN: "unknown",
};
/** Parses a helper ACK line. Bare `OK` (older helper) is treated as unknown. */
function parsePasteAck(line) {
    const tokens = line.trim().split(/\s+/);
    if (tokens[0] !== "OK")
        return null;
    if (tokens.length === 1)
        return exports.UNKNOWN_PASTE_TARGET;
    if (tokens.length !== 3 && tokens.length !== 4)
        return null;
    const verdict = VERDICT_TOKENS[tokens[1]];
    if (!verdict)
        return null;
    const [probeMs, helperUs] = tokens.slice(2);
    if (!tokens.slice(2).every((token) => /^\d+$/.test(token)))
        return null;
    return {
        verdict,
        probeMs: Number(probeMs),
        ...(helperUs !== undefined && { helperUs: Number(helperUs) }),
    };
}
/** How long the target app gets to handle the paste before focus is re-read. */
exports.PASTE_TARGET_RECHECK_DELAY_MS = 100;
/** Whether the element focused at the keystroke leaves the outcome open. */
function needsPasteTargetRecheck(probe) {
    return probe.verdict !== "editable";
}
/**
 * Combines the verdict at the keystroke with the one read after the app
 * handled it. A decisive re-read wins: focus that moved into a field means the
 * paste landed there; focus still on nothing confirms it did not. When the
 * re-read could not tell (or there was none), the first verdict stands.
 */
function settlePasteTarget(atKeystroke, afterPaste) {
    if (!needsPasteTargetRecheck(atKeystroke))
        return atKeystroke;
    if (!afterPaste || afterPaste.verdict === "unknown")
        return atKeystroke;
    return afterPaste;
}
/** Keep the dictation on the clipboard only when nothing could have taken it. */
function shouldFallbackToClipboard(probe) {
    return probe.verdict === "none";
}
//# sourceMappingURL=dictation-paste-target.js.map