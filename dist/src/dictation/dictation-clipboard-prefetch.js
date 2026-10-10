"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasClipboardPrefetch = hasClipboardPrefetch;
exports.prefetchClipboardSnapshot = prefetchClipboardSnapshot;
exports.discardClipboardPrefetch = discardClipboardPrefetch;
exports.takeClipboardSnapshot = takeClipboardSnapshot;
const electron_1 = require("electron");
const dictation_clipboard_1 = require("./dictation-clipboard");
// Reading the clipboard before a paste (an image has to be decoded) sits on
// the path between the transcript and the keystroke. Taking it while the
// person is still talking, or while the transcript is on its way, keeps that
// off the critical path. A snapshot only counts if the clipboard still holds
// what it did when read: a copy made in between must win, and so must the
// restore of an earlier dictation that has since put the user's clipboard back.
let prefetched = null;
const hasImage = () => electron_1.clipboard.availableFormats().some((format) => format.startsWith("image/"));
// Only decoding an image tells it apart from a newer one, and that read is the
// cost the prefetch saves, so an image snapshot is always taken afresh.
function stillMatchesClipboard(snapshot) {
    if (snapshot === null)
        return electron_1.clipboard.readText() === "" && !hasImage();
    return snapshot.type === "text" && electron_1.clipboard.readText() === snapshot.text;
}
function hasClipboardPrefetch() {
    return prefetched !== null;
}
function prefetchClipboardSnapshot() {
    // An image is read afresh at the paste anyway, so decoding it now is wasted.
    prefetched = hasImage() ? null : { snapshot: (0, dictation_clipboard_1.snapshotClipboard)() };
}
function discardClipboardPrefetch() {
    prefetched = null;
}
/** Consumes the prefetched snapshot when it is still current, else reads afresh. */
function takeClipboardSnapshot() {
    const held = prefetched;
    prefetched = null;
    return held && stillMatchesClipboard(held.snapshot)
        ? held.snapshot
        : (0, dictation_clipboard_1.snapshotClipboard)();
}
//# sourceMappingURL=dictation-clipboard-prefetch.js.map