"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDictationDragOverlay = ensureDictationDragOverlay;
exports.showDictationDragOverlay = showDictationDragOverlay;
exports.updateDictationDragHighlight = updateDictationDragHighlight;
exports.hideDictationDragOverlay = hideDictationDragOverlay;
exports.destroyDictationDragOverlay = destroyDictationDragOverlay;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const dictation_pill_layout_1 = require("./dictation-pill-layout");
const dictation_pill_position_1 = require("./dictation-pill-position");
const dictation_pill_screen_1 = require("./dictation-pill-screen");
const macos_spaces_1 = require("../macos-spaces");
let overlay = null;
let overlayReady = false;
let lastHighlightKey = "";
let pendingHighlight = null;
/** Only the pill has a default spot to return to; the live bar keeps its place. */
let overlayShowsHomeZone = false;
const HOME_ZONE_PERCENT = dictation_pill_position_1.DICTATION_DOCK_HOME_ZONE_FRACTION * 100;
const OVERLAY_HTML = `<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:transparent}
body{background:rgba(8,6,16,.28)}
.edge{position:absolute;pointer-events:none;opacity:.28;transition:opacity .2s ease}
.edge.left,.edge.right{top:0;bottom:0;width:180px}
.edge.left{left:0;background:linear-gradient(90deg,rgba(122,90,248,.55),rgba(238,70,188,.18) 42%,transparent 92%)}
.edge.right{right:0;background:linear-gradient(270deg,rgba(122,90,248,.55),rgba(238,70,188,.18) 42%,transparent 92%)}
.edge.bottom{left:0;right:0;bottom:0;height:180px;background:linear-gradient(0deg,rgba(122,90,248,.55),rgba(238,70,188,.18) 38%,transparent 88%)}
.edge.top{left:0;right:0;top:0;height:180px;background:linear-gradient(180deg,rgba(122,90,248,.55),rgba(238,70,188,.18) 38%,transparent 88%)}
.d{position:absolute;background:rgba(255,255,255,.8);box-shadow:0 0 18px 7px rgba(255,255,255,.3),0 0 42px 14px rgba(122,90,248,.2);transform:translate(-50%,-50%) scale(1);opacity:.7;animation:g 1.6s ease-in-out infinite alternate;transition:opacity .2s ease,transform .2s ease,box-shadow .2s ease}
.h{width:44px;height:9px;border-radius:5px}
.v{width:9px;height:44px;border-radius:5px}
.d.active{opacity:1;transform:translate(-50%,-50%) scale(1.18);box-shadow:0 0 22px 10px rgba(255,255,255,.42),0 0 56px 18px rgba(122,90,248,.38)}
.z{position:absolute;pointer-events:none;opacity:0;border-radius:14px;transition:opacity .2s ease,background .2s ease}
.z.zh{left:50%;width:${HOME_ZONE_PERCENT}%;height:28px;transform:translateX(-50%)}
.z.zv{top:50%;height:${HOME_ZONE_PERCENT}%;width:28px;transform:translateY(-50%)}
.z[data-side="bottom"]{bottom:6px}
.z[data-side="top"]{top:6px}
.z[data-side="left"]{left:${dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET - 14}px}
.z[data-side="right"]{right:${dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET - 14}px}
.z.out{opacity:.5;background:rgba(122,90,248,.22);box-shadow:0 0 14px 4px rgba(122,90,248,.12)}
.z.in{opacity:1;background:rgba(122,90,248,.42);box-shadow:0 0 18px 6px rgba(238,70,188,.22)}
body[data-side="left"] .edge.left,
body[data-side="right"] .edge.right,
body[data-side="bottom"] .edge.bottom,
body[data-side="top"] .edge.top{opacity:calc(.28 + var(--glow,0) * .62)}
@keyframes g{from{opacity:.55}to{opacity:.95}}
</style>
<div class="edge left"></div>
<div class="edge right"></div>
<div class="edge bottom"></div>
<div class="edge top"></div>
<div class="z zh" data-side="bottom"></div>
<div class="z zh" data-side="top"></div>
<div class="z zv" data-side="left"></div>
<div class="z zv" data-side="right"></div>
<div class="d h" data-side="bottom" style="left:50%;top:calc(100% - 20px)"></div>
<div class="d h" data-side="top" style="left:50%;top:20px"></div>
<div class="d v" data-side="left" style="left:${dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET}px;top:50%"></div>
<div class="d v" data-side="right" style="left:calc(100% - ${dictation_pill_layout_1.DICTATION_PILL_SIDE_RAIL_INSET}px);top:50%"></div>
<script>
window.setDockHighlight=function(side,intensity,home){
  document.body.dataset.side=side;
  document.documentElement.style.setProperty('--glow',String(intensity));
  document.querySelectorAll('.d').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-side')===side);
  });
  document.querySelectorAll('.z').forEach(function(el){
    var on=el.getAttribute('data-side')===side;
    el.classList.toggle('in', on&&home==='in');
    el.classList.toggle('out', on&&home==='out');
  });
};
</script>`;
function applyHighlight(highlight) {
    if (!overlay || overlay.isDestroyed() || !overlay.webContents)
        return;
    if (!overlayReady) {
        pendingHighlight = highlight;
        return;
    }
    const { side, intensity, home } = highlight;
    void overlay.webContents
        .executeJavaScript(`window.setDockHighlight(${JSON.stringify(side)},${intensity},${JSON.stringify(home)})`, true)
        .catch((error) => {
        if (overlay?.isDestroyed())
            return;
        electron_log_1.default.warn("[DictationPill] overlay highlight failed:", error);
    });
}
function ensureDictationDragOverlay() {
    if (overlay && !overlay.isDestroyed())
        return overlay;
    overlayReady = false;
    overlay = new electron_1.BrowserWindow({
        show: false,
        frame: false,
        transparent: true,
        hasShadow: false,
        backgroundColor: "#00000000",
        skipTaskbar: true,
        focusable: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        ...(process.platform === "darwin" ? { type: "panel" } : {}),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });
    overlay.setIgnoreMouseEvents(true, { forward: true });
    (0, macos_spaces_1.keepWindowOnActiveSpace)(overlay);
    overlay.webContents.once("did-finish-load", () => {
        overlayReady = true;
        if (pendingHighlight) {
            applyHighlight(pendingHighlight);
            pendingHighlight = null;
        }
    });
    overlay.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(OVERLAY_HTML)}`);
    overlay.on("closed", () => {
        overlay = null;
        overlayReady = false;
        lastHighlightKey = "";
        pendingHighlight = null;
    });
    return overlay;
}
function showDictationDragOverlay(pillWindow, options = {}) {
    const win = ensureDictationDragOverlay();
    overlayShowsHomeZone = options.showHomeZone === true;
    const pillBounds = pillWindow?.getBounds();
    const anchor = pillBounds
        ? {
            x: pillBounds.x + pillBounds.width / 2,
            y: pillBounds.y + pillBounds.height / 2,
        }
        : electron_1.screen.getCursorScreenPoint();
    const display = electron_1.screen.getDisplayNearestPoint(anchor);
    lastHighlightKey = "";
    win.setBounds(display.workArea);
    // Windows pill is screen-saver; macOS pill sits at the status level.
    // Matching that band lets moveAbove stack the glow above the pill.
    win.setAlwaysOnTop(true, process.platform === "win32"
        ? "screen-saver"
        : dictation_pill_screen_1.DICTATION_PILL_MAC_WINDOW_LEVEL);
    win.showInactive();
    if (pillBounds)
        updateDictationDragHighlight(pillBounds);
    if (pillWindow && !pillWindow.isDestroyed()) {
        try {
            pillWindow.moveAbove(win.getMediaSourceId());
        }
        catch {
            // moveAbove is not available on every Windows build
        }
    }
}
/**
 * `visual` is the part of the host the user actually sees (the pill or rail),
 * which decides whether a drop lands back at the default spot.
 */
function updateDictationDragHighlight(bounds, visual = bounds) {
    if (!overlay || overlay.isDestroyed())
        return;
    const display = electron_1.screen.getDisplayNearestPoint({
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
    });
    const { side, intensity } = (0, dictation_pill_position_1.getDictationSnapProximity)(bounds, display.workArea);
    overlay.setBounds(display.workArea);
    const rounded = Math.round(intensity * 20) / 20;
    const home = homeZoneState(side, visual, display.workArea);
    const key = `${side}:${rounded}:${home}`;
    if (key === lastHighlightKey)
        return;
    lastHighlightKey = key;
    applyHighlight({ side, intensity: rounded, home });
}
function homeZoneState(side, visual, workArea) {
    if (!overlayShowsHomeZone)
        return "";
    const along = side === "bottom" || side === "top"
        ? visual.x + visual.width / 2
        : visual.y + visual.height / 2;
    return (0, dictation_pill_position_1.isWithinDictationDockHomeZone)(side, along, workArea) ? "in" : "out";
}
function hideDictationDragOverlay() {
    lastHighlightKey = "";
    pendingHighlight = null;
    overlayShowsHomeZone = false;
    if (overlay && !overlay.isDestroyed())
        overlay.hide();
}
function destroyDictationDragOverlay() {
    lastHighlightKey = "";
    pendingHighlight = null;
    overlayReady = false;
    if (overlay && !overlay.isDestroyed())
        overlay.close();
    overlay = null;
}
//# sourceMappingURL=dictation-pill-overlay.js.map