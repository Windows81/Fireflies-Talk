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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markStartMinimizedAfterUpdateRestart = markStartMinimizedAfterUpdateRestart;
exports.markPostUpdateReleaseNotesAfterRestart = markPostUpdateReleaseNotesAfterRestart;
exports.getPostUpdateReleaseNotes = getPostUpdateReleaseNotes;
exports.clearPostUpdateReleaseNotes = clearPostUpdateReleaseNotes;
exports.clearStartMinimizedAfterUpdateRestart = clearStartMinimizedAfterUpdateRestart;
exports.consumeStartMinimizedAfterUpdateRestart = consumeStartMinimizedAfterUpdateRestart;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const platform_1 = require("./platform");
const START_MINIMIZED_AFTER_UPDATE_FILE = "start-minimized-after-update";
const POST_UPDATE_RELEASE_NOTES_FILE = "post-update-release-notes.json";
/**
 * How long a minimized-restart mark stays meaningful.
 *
 * The mark is written immediately before `quitAndInstall`, and the relaunch it
 * describes happens as soon as the installer finishes — seconds, at most a
 * minute or two on a slow machine. Anything older than this is a mark whose
 * restart never happened (a failed install, a crash, a force quit), and honouring
 * it would hide the window, the taskbar entry and the dock icon on an ordinary
 * launch — leaving the tray as the only way back into the app.
 */
const START_MINIMIZED_MARK_MAX_AGE_MS = 10 * 60 * 1000;
function getRestartStatePath() {
    return path.join(electron_1.app.getPath("userData"), START_MINIMIZED_AFTER_UPDATE_FILE);
}
function getPostUpdateReleaseNotesPath() {
    return path.join(electron_1.app.getPath("userData"), POST_UPDATE_RELEASE_NOTES_FILE);
}
function markStartMinimizedAfterUpdateRestart() {
    if (!(0, platform_1.isSilentAutoRestartSupported)())
        return;
    try {
        fs.writeFileSync(getRestartStatePath(), String(Date.now()), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[AUTO-UPDATER] Failed to persist minimized restart state", error);
    }
}
function markPostUpdateReleaseNotesAfterRestart(notes) {
    if (!notes?.version) {
        clearPostUpdateReleaseNotes();
        return;
    }
    try {
        fs.writeFileSync(getPostUpdateReleaseNotesPath(), JSON.stringify(notes), "utf8");
    }
    catch (error) {
        electron_log_1.default.warn("[AUTO-UPDATER] Failed to persist release notes", error);
    }
}
function getPostUpdateReleaseNotes(currentVersion = electron_1.app.getVersion()) {
    try {
        const statePath = getPostUpdateReleaseNotesPath();
        if (!fs.existsSync(statePath))
            return null;
        const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
        if (parsed.version !== currentVersion ||
            (parsed.releaseNotes !== null &&
                parsed.releaseNotes !== undefined &&
                typeof parsed.releaseNotes !== "string")) {
            return null;
        }
        return {
            version: parsed.version,
            releaseName: parsed.releaseName ?? null,
            releaseNotes: parsed.releaseNotes?.trim() || null,
        };
    }
    catch (error) {
        electron_log_1.default.warn("[AUTO-UPDATER] Failed to read release notes", error);
        return null;
    }
}
function clearPostUpdateReleaseNotes() {
    try {
        const statePath = getPostUpdateReleaseNotesPath();
        if (fs.existsSync(statePath)) {
            fs.unlinkSync(statePath);
        }
    }
    catch (error) {
        electron_log_1.default.warn("[AUTO-UPDATER] Failed to clear release notes", error);
    }
}
/**
 * Drop the mark without acting on it, for when the install it was written for
 * never happened. Left behind, it hides the window, the taskbar entry and the
 * dock icon on the next *ordinary* launch.
 */
function clearStartMinimizedAfterUpdateRestart() {
    try {
        fs.unlinkSync(getRestartStatePath());
    }
    catch (error) {
        if (isFileNotFoundError(error))
            return;
        electron_log_1.default.warn("[AUTO-UPDATER] Failed to clear minimized restart state", error);
    }
}
function consumeStartMinimizedAfterUpdateRestart() {
    if (!(0, platform_1.isSilentAutoRestartSupported)())
        return false;
    let markedAt = null;
    try {
        markedAt = Number.parseInt(fs.readFileSync(getRestartStatePath(), "utf8"), 10);
    }
    catch (error) {
        if (isFileNotFoundError(error)) {
            return false;
        }
        electron_log_1.default.error("[AUTO-UPDATER] Failed to consume minimized restart state", error);
        return false;
    }
    // Always remove it, whether or not it is honoured — a mark that survived its
    // own launch would keep hiding the app on every launch after this one.
    clearStartMinimizedAfterUpdateRestart();
    // The timestamp has always been written here but never read. Treating an old
    // mark as expired makes the whole class of "the restart never happened" bug
    // self-healing, including paths with no cleanup hook at all: a crash or a
    // force quit between marking and installing.
    const age = Number.isFinite(markedAt) ? Date.now() - Number(markedAt) : NaN;
    if (!Number.isFinite(age) ||
        age < 0 ||
        age > START_MINIMIZED_MARK_MAX_AGE_MS) {
        electron_log_1.default.warn("[AUTO-UPDATER] Ignoring stale minimized restart state", {
            markedAt,
            ageMs: Number.isFinite(age) ? age : null,
            maxAgeMs: START_MINIMIZED_MARK_MAX_AGE_MS,
        });
        return false;
    }
    return true;
}
function isFileNotFoundError(error) {
    return Boolean(error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT");
}
//# sourceMappingURL=restart-state.js.map