"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const fakeClipboard = {
    text: "",
    formats: [],
    reads: 0,
    readText: () => {
        fakeClipboard.reads += 1;
        return fakeClipboard.text;
    },
    availableFormats: () => fakeClipboard.formats,
    image: "",
    imageReads: 0,
    readImage: () => {
        fakeClipboard.imageReads += 1;
        return { isEmpty: () => false, name: fakeClipboard.image };
    },
};
node_test_1.mock.module("electron", { namedExports: { clipboard: fakeClipboard } });
node_test_1.mock.module("electron-log", {
    defaultExport: { info() { }, warn() { }, error() { }, debug() { } },
});
const load = () => import("./dictation-clipboard-prefetch.js");
function reset(text) {
    fakeClipboard.text = text;
    fakeClipboard.formats = [];
    fakeClipboard.reads = 0;
}
(0, node_test_1.test)("a prefetched snapshot is used while the clipboard is unchanged", async () => {
    reset("original");
    const { prefetchClipboardSnapshot, takeClipboardSnapshot } = await load();
    prefetchClipboardSnapshot();
    const readsAfterPrefetch = fakeClipboard.reads;
    strict_1.default.deepEqual(takeClipboardSnapshot(), {
        type: "text",
        text: "original",
    });
    // One validating read; no second full snapshot.
    strict_1.default.equal(fakeClipboard.reads - readsAfterPrefetch, 1);
});
(0, node_test_1.test)("a copy made after the prefetch wins", async () => {
    reset("original");
    const { prefetchClipboardSnapshot, takeClipboardSnapshot } = await load();
    prefetchClipboardSnapshot();
    fakeClipboard.text = "copied while recording";
    strict_1.default.deepEqual(takeClipboardSnapshot(), {
        type: "text",
        text: "copied while recording",
    });
});
(0, node_test_1.test)("a snapshot is consumed once", async () => {
    reset("first");
    const { prefetchClipboardSnapshot, takeClipboardSnapshot, hasClipboardPrefetch, } = await load();
    prefetchClipboardSnapshot();
    takeClipboardSnapshot();
    strict_1.default.equal(hasClipboardPrefetch(), false);
    fakeClipboard.text = "second";
    strict_1.default.deepEqual(takeClipboardSnapshot(), { type: "text", text: "second" });
});
(0, node_test_1.test)("a discarded prefetch is read afresh", async () => {
    reset("before");
    const { prefetchClipboardSnapshot, discardClipboardPrefetch, takeClipboardSnapshot, } = await load();
    prefetchClipboardSnapshot();
    discardClipboardPrefetch();
    fakeClipboard.text = "after";
    strict_1.default.deepEqual(takeClipboardSnapshot(), { type: "text", text: "after" });
});
(0, node_test_1.test)("an image is only read at the paste, so a newer image wins", async () => {
    reset("");
    fakeClipboard.formats = ["image/png"];
    fakeClipboard.image = "older";
    const { prefetchClipboardSnapshot, takeClipboardSnapshot, hasClipboardPrefetch, } = await load();
    const readsBefore = fakeClipboard.imageReads;
    prefetchClipboardSnapshot();
    strict_1.default.equal(hasClipboardPrefetch(), false);
    strict_1.default.equal(fakeClipboard.imageReads, readsBefore);
    fakeClipboard.image = "newer";
    const taken = takeClipboardSnapshot();
    strict_1.default.ok(taken?.type === "image");
    strict_1.default.equal(taken.image.name, "newer");
});
(0, node_test_1.test)("an empty clipboard stays valid until something is copied", async () => {
    reset("");
    const { prefetchClipboardSnapshot, takeClipboardSnapshot } = await load();
    prefetchClipboardSnapshot();
    strict_1.default.equal(takeClipboardSnapshot(), null);
    prefetchClipboardSnapshot();
    fakeClipboard.text = "now something";
    strict_1.default.deepEqual(takeClipboardSnapshot(), {
        type: "text",
        text: "now something",
    });
});
//# sourceMappingURL=dictation-clipboard-prefetch.test.js.map