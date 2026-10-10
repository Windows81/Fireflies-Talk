"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setShortcutCaptureActive = exports.isShortcutCaptureActive = void 0;
const captureSession = { active: false };
const isShortcutCaptureActive = () => captureSession.active;
exports.isShortcutCaptureActive = isShortcutCaptureActive;
const setShortcutCaptureActive = (active) => {
    captureSession.active = active;
};
exports.setShortcutCaptureActive = setShortcutCaptureActive;
//# sourceMappingURL=shortcut-capture-session.js.map