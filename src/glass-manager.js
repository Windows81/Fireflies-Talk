"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlassManager = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const secure_require_1 = require("./secure-require");
// Import the native addon based on platform
let glassNative = null;
try {
    if (process.platform === "darwin") {
        glassNative = (0, secure_require_1.secureRequire)("native-glass-macos");
        if (glassNative.isAvailable()) {
            electron_log_1.default.info("[GlassManager] macOS native addon loaded successfully");
        }
        else {
            electron_log_1.default.warn("[GlassManager] macOS native addon not available");
        }
    }
    else if (process.platform === "win32") {
        glassNative = (0, secure_require_1.secureRequire)("native-glass-windows");
        electron_log_1.default.info("[GlassManager] Windows native addon loaded successfully");
    }
}
catch (error) {
    electron_log_1.default.error("[GlassManager] Failed to load native addon:", error);
}
/**
 * GlassManager: manages native blur underlays for per-panel vibrancy
 * - macOS: NSVisualEffectView positioned behind WebContents
 * - Windows: Child HWND with DWM blur or Acrylic
 */
class GlassManager {
    constructor(window) {
        this.panelStates = new Map();
        this.window = window;
        if (process.platform === "darwin" &&
            (!glassNative || !glassNative.isAvailable())) {
            electron_log_1.default.warn("[GlassManager] Native addon not available, glass effects disabled");
        }
    }
    /**
     * Create or update a glass underlay for a panel
     */
    upsert(id, rect) {
        if (!glassNative)
            return;
        if (process.platform === "darwin" && !glassNative.isAvailable())
            return;
        if (process.platform !== "darwin" && process.platform !== "win32")
            return;
        const existing = this.panelStates.get(id);
        const radius = rect.radius ?? 8;
        const appearance = rect.appearance ?? "auto";
        // Get native window handle and create glass layer based on platform
        const handle = this.window.getNativeWindowHandle();
        // Check if we have a hidden layer (0x0 size) — native view still exists, just resize it
        const isHidden = existing && existing.width === 0 && existing.height === 0;
        if (isHidden) {
            // Try to restore the hidden view by updating its frame (avoids expensive remove+create)
            const success = glassNative.update(id, rect.x, rect.y, rect.width, rect.height);
            if (success) {
                this.panelStates.set(id, rect);
                return;
            }
            // Update failed — native view may be gone, clean up and fall through to create
            electron_log_1.default.warn(`[GlassManager] Update-from-hidden failed for ${id}, recreating...`);
            glassNative.remove(id);
            this.panelStates.delete(id);
        }
        if (!existing || isHidden) {
            // Create new glass layer
            let success;
            if (process.platform === "darwin") {
                // macOS: NSView* pointer
                const windowHandle = handle.readBigUInt64LE(0);
                success = glassNative.create(id, windowHandle, rect.x, rect.y, rect.width, rect.height, radius, "menu", // menu provides lightest vibrancy which shows bg as much as it can
                appearance);
            }
            else {
                // Windows: HWND (32 or 64 bit depending on arch)
                const windowHandle = process.arch === "ia32"
                    ? handle.readUInt32LE(0)
                    : handle.readBigInt64LE(0);
                // Windows: use Acrylic (true) for Windows 10+
                success = glassNative.create(id, windowHandle, rect.x, rect.y, rect.width, rect.height, radius, true);
            }
            if (success) {
                this.panelStates.set(id, rect);
            }
            else {
                electron_log_1.default.error(`[GlassManager] Failed to create glass layer: ${id}`);
            }
        }
        else {
            // Update existing glass layer (only if position/size changed)
            if (existing.x !== rect.x ||
                existing.y !== rect.y ||
                existing.width !== rect.width ||
                existing.height !== rect.height) {
                const success = glassNative.update(id, rect.x, rect.y, rect.width, rect.height);
                if (success) {
                    this.panelStates.set(id, rect);
                }
                else {
                    // Update failed - native layer might be missing, try recreate
                    electron_log_1.default.warn(`[GlassManager] Update failed for ${id}, recreating...`);
                    this.panelStates.delete(id);
                    // Recursively call upsert to create it fresh
                    this.upsert(id, rect);
                }
            }
        }
    }
    /**
     * Hide a glass underlay by setting its size to zero
     */
    hide(id) {
        if (!glassNative)
            return;
        if (process.platform === "darwin" && !glassNative.isAvailable())
            return;
        if (process.platform !== "darwin" && process.platform !== "win32")
            return;
        // Only hide if the panel was previously created
        if (this.panelStates.has(id)) {
            glassNative.update(id, 0, 0, 0, 0);
            this.panelStates.set(id, { x: 0, y: 0, width: 0, height: 0 });
        }
    }
    /**
     * Remove a glass underlay
     */
    remove(id) {
        if (!glassNative)
            return;
        if (process.platform === "darwin" && !glassNative.isAvailable())
            return;
        if (process.platform !== "darwin" && process.platform !== "win32")
            return;
        // Only remove if the panel was previously created
        if (this.panelStates.has(id)) {
            glassNative.remove(id);
            this.panelStates.delete(id);
        }
    }
    /**
     * Re-apply all visible glass positions to native after a window resize.
     * Cocoa Y is bottom-relative (contentHeight - y - height), so when the
     * window height changes, every glass panel's visual position shifts.
     * Calling this immediately after setBounds() prevents a 1-frame flash.
     */
    adjustForResize() {
        if (!glassNative)
            return;
        if (process.platform === "darwin" && !glassNative.isAvailable())
            return;
        if (process.platform !== "darwin" && process.platform !== "win32")
            return;
        for (const [id, rect] of this.panelStates) {
            // Skip hidden panels (0x0)
            if (rect.width === 0 && rect.height === 0)
                continue;
            glassNative.update(id, rect.x, rect.y, rect.width, rect.height);
        }
    }
    /**
     * Clean up all glass underlays for this window only
     */
    dispose() {
        if (!glassNative)
            return;
        if (process.platform === "darwin" && !glassNative.isAvailable())
            return;
        if (process.platform !== "darwin" && process.platform !== "win32")
            return;
        // Remove only the glass layers managed by this instance
        // Don't call removeAll() as it would remove layers from other windows
        const panelIds = Array.from(this.panelStates.keys());
        for (const panelId of panelIds) {
            glassNative.remove(panelId);
        }
        this.panelStates.clear();
    }
}
exports.GlassManager = GlassManager;
//# sourceMappingURL=glass-manager.js.map