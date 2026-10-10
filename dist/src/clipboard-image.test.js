"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const clipboard_image_1 = require("./clipboard-image");
const PREFIX = "data:image/png;base64,";
/** A PNG header alone: enough for the checks that run before decoding. */
const pngHeader = (width, height) => {
    const header = Buffer.alloc(24);
    header.writeUInt32BE(0x89504e47, 0);
    header.write("IHDR", 12, "ascii");
    header.writeUInt32BE(width, 16);
    header.writeUInt32BE(height, 20);
    return PREFIX + header.toString("base64");
};
(0, node_test_1.test)("pngDimensions reads the size the file declares", () => {
    strict_1.default.deepEqual((0, clipboard_image_1.pngDimensions)(pngHeader(2400, 1260)), {
        width: 2400,
        height: 1260,
    });
});
(0, node_test_1.test)("pngDimensions refuses anything that is not a PNG header", () => {
    strict_1.default.equal((0, clipboard_image_1.pngDimensions)(PREFIX), undefined);
    strict_1.default.equal((0, clipboard_image_1.pngDimensions)(PREFIX + Buffer.from("not a png at all").toString("base64")), undefined);
});
(0, node_test_1.test)("the milestone card is acceptable", () => {
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardImage)(pngHeader(2400, 1260)), true);
});
(0, node_test_1.test)("a small file declaring enormous dimensions is refused", () => {
    // The length cap would pass this: it is a few dozen bytes.
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardImage)(pngHeader(30000, 30000)), false);
});
(0, node_test_1.test)("only PNG data URLs are taken", () => {
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardImage)("data:image/svg+xml;base64,PHN2"), false);
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardImage)("https://example.com/a.png"), false);
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardImage)(undefined), false);
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardImage)({}), false);
});
(0, node_test_1.test)("a caption rides along only while it stays a caption", () => {
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardCaption)("I've dictated 10,000 words with Talk."), true);
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardCaption)("x".repeat(4097)), false);
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardCaption)(""), false);
    strict_1.default.equal((0, clipboard_image_1.isAcceptableClipboardCaption)(undefined), false);
});
//# sourceMappingURL=clipboard-image.test.js.map