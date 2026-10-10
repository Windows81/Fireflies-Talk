"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pngDimensions = pngDimensions;
exports.isAcceptableClipboardImage = isAcceptableClipboardImage;
exports.isAcceptableClipboardCaption = isAcceptableClipboardCaption;
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Comfortably past a 2400×1260 PNG of the milestone card, and far short of
 * anything that would trouble the main process.
 */
const MAX_CHARS = 32 * 1024 * 1024;
/**
 * The length above bounds the string, not what it expands to: a small, heavily
 * compressed PNG can declare enormous dimensions and exhaust the heap when it
 * is decoded. The card is 2400×1260, so this leaves room to spare.
 */
const MAX_SIDE = 4096;
const PNG_PREFIX = "data:image/png;base64,";
/**
 * The caption that rides with the card is one sentence and a link. This is
 * many times that, and still nothing the clipboard would struggle with.
 */
const MAX_CAPTION_CHARS = 4096;
const PNG_SIGNATURE = 0x89504e47;
/**
 * Width and height from the PNG header, read without decoding the pixels.
 * Undefined for anything that is not a PNG with a readable IHDR.
 */
function pngDimensions(dataUrl) {
    const header = Buffer.from(dataUrl.slice(PNG_PREFIX.length, PNG_PREFIX.length + 64), "base64");
    if (header.length < 24)
        return undefined;
    if (header.readUInt32BE(0) !== PNG_SIGNATURE)
        return undefined;
    if (header.toString("ascii", 12, 16) !== "IHDR")
        return undefined;
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}
/** Whether a renderer's payload is one this process is willing to decode. */
function isAcceptableClipboardImage(dataUrl) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith(PNG_PREFIX)) {
        return false;
    }
    if (dataUrl.length > MAX_CHARS) {
        electron_log_1.default.warn("[Clipboard] Image rejected: too large", dataUrl.length);
        return false;
    }
    const size = pngDimensions(dataUrl);
    if (!size) {
        electron_log_1.default.warn("[Clipboard] Image rejected: not a readable PNG");
        return false;
    }
    if (size.width > MAX_SIDE || size.height > MAX_SIDE) {
        electron_log_1.default.warn("[Clipboard] Image rejected: dimensions", size.width, size.height);
        return false;
    }
    return true;
}
/**
 * Whether a caption is one this process will put on the clipboard alongside
 * the image. The image limits say nothing about the text sent with it.
 */
function isAcceptableClipboardCaption(text) {
    if (typeof text !== "string" || !text)
        return false;
    if (text.length > MAX_CAPTION_CHARS) {
        electron_log_1.default.warn("[Clipboard] Caption rejected: too long", text.length);
        return false;
    }
    return true;
}
//# sourceMappingURL=clipboard-image.js.map