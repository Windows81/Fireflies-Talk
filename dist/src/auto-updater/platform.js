"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSilentAutoRestartSupported = isSilentAutoRestartSupported;
exports.isSelfUpdateSupported = isSelfUpdateSupported;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Silent auto-restart — download an update in the background, then quit and
 * reinstall without user interaction — is supported on macOS (Squirrel.Mac)
 * and Windows (NSIS silent install). Linux uses a different update flow.
 */
function isSilentAutoRestartSupported() {
    return process.platform === "darwin" || process.platform === "win32";
}
/**
 * Squirrel.Mac replaces the whole .app bundle in place, so it can only update a
 * bundle the running user owns. A .pkg installer writes the bundle as
 * root:wheel, so pkg-installed copies can never self-update.
 *
 * Ownership is the signal rather than write access: macOS bundle protection
 * makes access(W_OK) on an .app fail with EPERM even for bundles the user owns,
 * so it cannot distinguish a pkg install from a DMG one.
 */
function isBundleUserOwned() {
    // .../Fireflies.app/Contents/MacOS/Fireflies -> .../Fireflies.app
    const bundlePath = (0, node_path_1.resolve)(electron_1.app.getPath("exe"), "..", "..", "..");
    try {
        return (0, node_fs_1.statSync)(bundlePath).uid === process.getuid?.();
    }
    catch (error) {
        electron_log_1.default.warn("[updater] Could not stat app bundle to check ownership:", error);
        return true;
    }
}
/**
 * electron-updater only ships NSIS installers, so updating an MSI install would
 * lay an NSIS-registered copy over the MSI's product registration instead of
 * upgrading it. Our NSIS target is per-user (`nsis.perMachine: false` -> under
 * %LOCALAPPDATA%) while the MSI target is per-machine (-> %ProgramFiles%), so
 * the install root tells the two apart. Keep that config pinned or this check
 * stops discriminating.
 */
function isPerMachineWindowsInstall() {
    const programFileRoots = [
        process.env.ProgramFiles,
        process.env["ProgramFiles(x86)"],
        process.env.ProgramW6432,
    ].filter((dir) => Boolean(dir));
    const exePath = electron_1.app.getPath("exe").toLowerCase();
    return programFileRoots.some((dir) => exePath.startsWith(dir.toLowerCase() + node_path_1.sep));
}
/**
 * False when this install can never apply an in-place update, so the updater UI
 * must not offer one. Covers macOS .pkg and Windows .msi — both enterprise
 * formats that electron-builder excludes from auto-update:
 * https://www.electron.build/docs/features/auto-update/
 */
function isSelfUpdateSupported() {
    if (!electron_1.app.isPackaged) {
        return true;
    }
    if (process.platform === "darwin") {
        return isBundleUserOwned();
    }
    if (process.platform === "win32") {
        return !isPerMachineWindowsInstall();
    }
    return true;
}
//# sourceMappingURL=platform.js.map