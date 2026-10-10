"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDictationPillSide = isDictationPillSide;
exports.parseSavedDictationPillDock = parseSavedDictationPillDock;
function isDictationPillSide(value) {
    return (value === "bottom" ||
        value === "left" ||
        value === "right" ||
        value === "top");
}
function readPersistedCoordinate(value) {
    if (!Number.isFinite(value))
        return undefined;
    return value;
}
function attachSavedPosition(dock, x, y) {
    if (x === undefined && y === undefined)
        return dock;
    if (x === undefined)
        return { ...dock, y };
    if (y === undefined)
        return { ...dock, x };
    return { ...dock, x, y };
}
function attachSavedAnchor(dock, anchor) {
    if (anchor === undefined)
        return dock;
    if (anchor < 0 || anchor > 1)
        return dock;
    return { ...dock, anchor };
}
function parseSavedDictationPillDock(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    // SAFETY: dock file is JSON; side and number checks reject invalid fields.
    const payload = raw;
    const side = payload.side;
    if (!isDictationPillSide(side))
        return null;
    const displayId = readPersistedCoordinate(payload.displayId);
    const x = readPersistedCoordinate(payload.x);
    const y = readPersistedCoordinate(payload.y);
    const anchor = readPersistedCoordinate(payload.anchor);
    const dock = displayId === undefined ? { side } : { side, displayId };
    return attachSavedAnchor(attachSavedPosition(dock, x, y), anchor);
}
//# sourceMappingURL=dictation-pill-dock.js.map