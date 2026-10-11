"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBackend = resolveBackend;
const backend_macos_1 = require("./backend-macos");
const backend_windows_1 = require("./backend-windows");
/**
 * The backend for this platform, or null where there is no virtual camera.
 *
 * Resolved once at module load. Both modules are imported unconditionally
 * because neither touches its native addon until asked — importing is free, and
 * a dynamic require here would defeat the bundler and the type checker.
 */
function resolveBackend() {
    if (process.platform === "darwin")
        return backend_macos_1.macosBackend;
    if (process.platform === "win32")
        return backend_windows_1.windowsBackend;
    return null;
}
//# sourceMappingURL=backend-index.js.map