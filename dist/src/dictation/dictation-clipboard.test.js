"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const node_url_1 = require("node:url");
// A file URL matches the resolved specifier on every platform (a Windows
// path would not).
const privateClipboardModule = (0, node_url_1.pathToFileURL)(node_path_1.default.resolve(process.cwd(), "src", "dictation", "windows-private-clipboard.ts")).href;
/** Fake system clipboard: the text Electron sees, plus every write made. */
const fakeClipboard = {
    text: "",
    html: "",
    writes: [],
    readText: () => fakeClipboard.text,
    readHTML: () => fakeClipboard.html,
    write: ({ text, html }) => {
        fakeClipboard.text = text;
        fakeClipboard.html = html;
        fakeClipboard.writes.push(text);
    },
    writeText: (text) => {
        fakeClipboard.text = text;
        fakeClipboard.html = "";
        fakeClipboard.writes.push(text);
    },
};
/** Fake private helper: the text it saw under the clipboard lock. */
const fakeHelper = {
    seenAtLock: "",
    requests: [],
};
node_test_1.mock.module("electron", { namedExports: { clipboard: fakeClipboard } });
node_test_1.mock.module("electron-log", {
    defaultExport: { info() { }, warn() { }, error() { }, debug() { } },
});
node_test_1.mock.module(privateClipboardModule, {
    namedExports: {
        setWindowsPrivateClipboardText: async (text, html, expect) => {
            fakeHelper.requests.push({ text, expect });
            // The helper decides against what is on the clipboard when it holds
            // the lock, not against what the caller saw earlier.
            if (expect !== null && fakeHelper.seenAtLock !== expect)
                return false;
            fakeClipboard.write({ text, html });
            return true;
        },
    },
});
const load = () => import("./dictation-clipboard.js");
const originalPlatform = process.platform;
const setPlatform = (platform) => {
    Object.defineProperty(process, "platform", { value: platform });
};
function reset(clipboardText) {
    fakeClipboard.text = clipboardText;
    fakeClipboard.html = "";
    fakeClipboard.writes = [];
    fakeHelper.requests = [];
    fakeHelper.seenAtLock = clipboardText;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
(0, node_test_1.test)("windows: kept dictation is put back when the clipboard still holds the paste", async (t) => {
    setPlatform("win32");
    t.after(() => setPlatform(originalPlatform));
    reset("second paste");
    const { restoreClipboardIfUnchanged } = await load();
    restoreClipboardIfUnchanged({ type: "dictation", text: "kept" }, "second paste");
    await flush();
    strict_1.default.deepEqual(fakeHelper.requests, [
        { text: "kept", expect: "second paste" },
    ]);
    strict_1.default.equal(fakeClipboard.text, "kept");
});
(0, node_test_1.test)("windows: a copy made while the helper call is in flight wins", async (t) => {
    setPlatform("win32");
    t.after(() => setPlatform(originalPlatform));
    reset("second paste");
    // Passes the caller's readText check, then the user copies before the
    // helper gets the clipboard lock.
    fakeHelper.seenAtLock = "user copy";
    fakeClipboard.text = "second paste";
    const { restoreClipboardIfUnchanged } = await load();
    restoreClipboardIfUnchanged({ type: "dictation", text: "kept" }, "second paste");
    fakeClipboard.text = "user copy";
    await flush();
    strict_1.default.equal(fakeHelper.requests.length, 1);
    strict_1.default.deepEqual(fakeClipboard.writes, []);
    strict_1.default.equal(fakeClipboard.text, "user copy");
});
(0, node_test_1.test)("windows: a skipped private write does not fall through to Electron", async (t) => {
    setPlatform("win32");
    t.after(() => setPlatform(originalPlatform));
    reset("user copy");
    const { writeClipboardForDictationPaste } = await load();
    const written = await writeClipboardForDictationPaste("kept", {
        onlyIfClipboardHolds: "second paste",
    });
    strict_1.default.equal(written, false);
    strict_1.default.deepEqual(fakeClipboard.writes, []);
});
(0, node_test_1.test)("windows: an unconditional write goes straight through", async (t) => {
    setPlatform("win32");
    t.after(() => setPlatform(originalPlatform));
    reset("anything");
    const { writeClipboardForDictationPaste } = await load();
    const written = await writeClipboardForDictationPaste("dictation");
    strict_1.default.equal(written, true);
    strict_1.default.deepEqual(fakeHelper.requests, [{ text: "dictation", expect: null }]);
    strict_1.default.equal(fakeClipboard.text, "dictation");
});
(0, node_test_1.test)("other platforms: the conditional write checks right before writing", async (t) => {
    setPlatform("darwin");
    t.after(() => setPlatform(originalPlatform));
    reset("second paste");
    const { writeClipboardForDictationPaste } = await load();
    strict_1.default.equal(await writeClipboardForDictationPaste("kept", {
        onlyIfClipboardHolds: "second paste",
    }), true);
    strict_1.default.equal(fakeClipboard.text, "kept");
    reset("user copy");
    strict_1.default.equal(await writeClipboardForDictationPaste("kept", {
        onlyIfClipboardHolds: "second paste",
    }), false);
    strict_1.default.deepEqual(fakeClipboard.writes, []);
    strict_1.default.deepEqual(fakeHelper.requests, []);
});
//# sourceMappingURL=dictation-clipboard.test.js.map