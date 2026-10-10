"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildActiveIcon = buildActiveIcon;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
// Box-filter: average alpha of all source pixels that map to (x, y) in the output.
function sampleAlpha(src, x, y, scale) {
    let a = 0;
    let n = 0;
    for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
            const si = (Math.floor(y * scale + sy) * src.width + Math.floor(x * scale + sx)) *
                4;
            a += src.data[si + 3];
            n++;
        }
    }
    return n > 0 ? a / n : 0;
}
/**
 * Builds the active recording tray icon: downscales the source PNG to 32×32,
 * recolors it to match the menu bar, and overlays a green dot.
 * Writes a @2x PNG to a temp file so createFromPath handles retina scaling.
 *
 * The foreground follows `nativeTheme.shouldUseDarkColors` — the same signal
 * macOS uses to tint the default (template) tray icon. Using it here keeps the
 * recording icon's color consistent with the idle icon. The app pins
 * themeSource to "dark", so both render light; if that pin is ever lifted, both
 * adapt to the real system theme together.
 */
function buildActiveIcon(sourcePngPath) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
        const { PNG } = require("pngjs");
        const src = PNG.sync.read(fs.readFileSync(sourcePngPath));
        const fg = electron_1.nativeTheme.shouldUseDarkColors ? 255 : 0;
        const SIZE = 32;
        const scale = src.width / SIZE;
        const out = new PNG({ width: SIZE, height: SIZE });
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const idx = (y * SIZE + x) * 4;
                out.data[idx] = fg;
                out.data[idx + 1] = fg;
                out.data[idx + 2] = fg;
                out.data[idx + 3] = Math.round(sampleAlpha(src, x, y, scale));
            }
        }
        // Green dot (#34C759), bottom-right corner, radius 5px
        const cx = 26, cy = 26, r = 5;
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) > r)
                    continue;
                const idx = (y * SIZE + x) * 4;
                out.data[idx] = 52;
                out.data[idx + 1] = 199;
                out.data[idx + 2] = 89;
                out.data[idx + 3] = 255;
            }
        }
        // @2x suffix tells Electron this is a retina-resolution image
        const tmpPath = path.join(os.tmpdir(), "ff-tray-active@2x.png");
        fs.writeFileSync(tmpPath, PNG.sync.write(out));
        return electron_1.nativeImage.createFromPath(tmpPath);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=tray-icon-builder.js.map