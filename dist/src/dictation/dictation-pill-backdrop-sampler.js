"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDictationPillBackdropSampling = startDictationPillBackdropSampling;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_pill_backdrop_1 = require("./dictation-pill-backdrop");
const windows_overlay_activation_1 = require("./windows-overlay-activation");
/**
 * A sample is one small blit off the screen DC, well under a millisecond, so
 * it can run often enough that a window switching underneath the pill reads
 * as instant rather than as a beat later.
 */
const SAMPLE_INTERVAL_MS = 150;
/**
 * Tells the pill whether it floats over something light or dark, reporting
 * whenever that changes. Returns a stop function.
 *
 * Windows reads the actual pixels of a strip of screen right beside the pill
 * through the overlay addon: one tiny blit, no display capture. Without the
 * addon nothing is sampled.
 *
 * macOS cannot read the screen without the Screen Recording permission, which
 * the pill must not ask for, so it follows the system appearance instead:
 * over a Mac in dark mode nearly every window is dark, and vice versa.
 *
 * Unsampled, the pill keeps its dark-backdrop look.
 */
function startDictationPillBackdropSampling(options) {
    if (process.platform === "win32")
        return startWindowsPixelSampling(options);
    return startAppearanceFollowing(options);
}
function startWindowsPixelSampling(options) {
    // Only the addon's absence is final. A read can fail on its own — a DC or
    // blit refused for a moment — and the next tick simply tries again.
    if (!(0, windows_overlay_activation_1.hasWindowsOverlayNative)())
        return () => { };
    let previous = null;
    const sample = () => {
        const wanted = options.getRegion();
        if (!wanted)
            return;
        try {
            // A host anchored at a display's end can hang its strip past the edge,
            // where there are no pixels; read only what is on the display.
            const display = electron_1.screen.getDisplayMatching(wanted);
            const region = (0, dictation_pill_backdrop_1.clipRect)(wanted, display.bounds);
            if (!region)
                return;
            // The addon works in physical pixels of the virtual desktop.
            const luminance = (0, windows_overlay_activation_1.readWindowsScreenLuminance)(electron_1.screen.dipToScreenRect(null, region));
            if (luminance === null)
                return;
            const next = (0, dictation_pill_backdrop_1.classifyDictationPillBackdrop)(previous, luminance);
            if (next !== previous) {
                previous = next;
                options.onChange(next);
            }
        }
        catch (error) {
            electron_log_1.default.warn("[DictationPill] Backdrop sample failed", error);
        }
    };
    sample();
    const timer = setInterval(sample, SAMPLE_INTERVAL_MS);
    return () => clearInterval(timer);
}
function startAppearanceFollowing(options) {
    const report = () => options.onChange(electron_1.nativeTheme.shouldUseDarkColors ? "dark" : "light");
    report();
    electron_1.nativeTheme.on("updated", report);
    return () => {
        electron_1.nativeTheme.off("updated", report);
    };
}
//# sourceMappingURL=dictation-pill-backdrop-sampler.js.map