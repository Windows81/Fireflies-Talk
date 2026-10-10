"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpdateStatusChangedCallback = setUpdateStatusChangedCallback;
exports.getUpdateStatus = getUpdateStatus;
exports.setupAutoUpdater = setupAutoUpdater;
exports.checkForUpdates = checkForUpdates;
exports.installUpdate = installUpdate;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const utils_1 = require("../utils");
const release_notes_1 = require("./release-notes");
const platform_1 = require("./platform");
const quit_readiness_1 = require("../quit-readiness");
const restart_state_1 = require("./restart-state");
const auto_install_1 = require("./auto-install");
const windows_squirrel_migration_1 = require("./windows-squirrel-migration");
// Update state tracking
let updateAvailable = false;
let updateDownloaded = false;
let updateInfo = null;
let updateError = null;
let isCheckingForUpdates = false;
let isInstallingUpdate = false;
let quitSequenceStarted = false;
let activeCheckTrigger = null;
let activeCheckPhase = "stable";
let activeDownloadAttempt = null;
let prepareForQuit = () => Promise.resolve();
let cancelPreparedQuit = () => { };
/**
 * Set once the staged installer turns out to be the Squirrel one *and* this
 * install can actually run the hand-off. Installing it then goes through
 * `windows-squirrel-migration` instead of `quitAndInstall`, so every path that
 * would otherwise hand it to electron-updater has to know.
 *
 * The plan is resolved when the download lands rather than when the user
 * installs, because the two answers have to agree. Deciding late meant a
 * machine that cannot be migrated still had the update staged and
 * `autoInstallOnAppQuit` switched off, so nothing installed it, and
 * `updateDownloaded` then short-circuited every later check — a permanent
 * error with no way forward.
 */
let stagedSquirrelMigration = null;
function getUpdaterDebugState() {
    return {
        currentVersion: electron_1.app.getVersion(),
        platform: process.platform,
        updateAvailable,
        updateDownloaded,
        updateInfoVersion: updateInfo?.version ?? null,
        updateError,
        isCheckingForUpdates,
        activeCheckTrigger,
        activeCheckPhase,
        activeDownloadAttempt,
        isInstallingUpdate,
        quitSequenceStarted,
        stagedSquirrelInstallerPath: stagedSquirrelMigration?.installerPath ?? null,
    };
}
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
/**
 * True when electron-updater could not find the channel file at all — the
 * `migration.yml` that does not exist until the new app is published.
 * `newError` tags it, so this does not depend on the message text.
 */
function isMissingChannelError(error) {
    return (error?.code ===
        "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
}
let onStatusChanged = null;
function setUpdateStatusChangedCallback(cb) {
    onStatusChanged = cb;
}
/**
 * Notify all renderer processes of status change
 */
function notifyStatusChanged() {
    const status = getUpdateStatus();
    electron_1.BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send("updater:status-changed", status);
    });
    onStatusChanged?.();
}
/**
 * Get the current update status
 */
function getUpdateStatus() {
    const currentVersion = electron_1.app.getVersion();
    return {
        updateAvailable,
        updateDownloaded,
        updateInfo,
        updateError,
        currentVersion,
        postUpdateReleaseNotes: (0, restart_state_1.getPostUpdateReleaseNotes)(currentVersion),
        selfUpdateSupported: (0, platform_1.isSelfUpdateSupported)(),
    };
}
/**
 * Configure and initialize auto-updater
 * This should be called after app is ready
 */
function setupAutoUpdater(options) {
    // Above every early return below: a dev or externally-managed install still
    // quits through `before-quit`, and leaving these as no-ops there would drop
    // the recording finalization on exactly the builds that are hardest to test.
    prepareForQuit = options?.prepareForQuit ?? prepareForQuit;
    cancelPreparedQuit = options?.cancelPreparedQuit ?? cancelPreparedQuit;
    // Skip auto-updates in development
    if ((0, utils_1.isDev)()) {
        electron_log_1.default.info("[AUTO-UPDATER] Skipping in development mode");
        return;
    }
    // Enterprise installs (Windows .msi, macOS .pkg) are updated by whatever
    // deployed them. electron-updater only ever produces the per-user installer,
    // so an update here would lay a second, unmanaged copy beside the managed
    // one — and on Windows that is now a Squirrel install, which would leave the
    // machine running two apps out of one %APPDATA%\Fireflies. The UI already
    // reads `selfUpdateSupported` and hides the update controls; this stops the
    // background check that would otherwise still stage a download behind it.
    if (!(0, platform_1.isSelfUpdateSupported)()) {
        electron_log_1.default.info("[AUTO-UPDATER] Skipping: this install is managed externally", {
            platform: process.platform,
            exePath: electron_1.app.getPath("exe"),
        });
        return;
    }
    // Configure auto-updater logging
    electron_updater_1.autoUpdater.logger = electron_log_1.default;
    // Don't auto-download — update state is coordinated through our event handlers.
    electron_updater_1.autoUpdater.autoDownload = false;
    // Auto-install updates when app closes
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    (0, quit_readiness_1.onFinalQuit)(persistDownloadedUpdateReleaseNotes);
    (0, quit_readiness_1.onFinalQuit)(() => {
        quitSequenceStarted = true;
    });
    // Setup event handlers
    setupUpdateEventHandlers();
    (0, auto_install_1.setupDownloadedUpdateAutoInstall)({
        installUpdate: () => {
            void installDownloadedUpdate("auto");
        },
        isInstallingUpdate: () => isInstallingUpdate,
        isUpdateDownloaded: () => updateDownloaded,
    });
    // Check for updates on startup (after a small delay)
    setTimeout(() => {
        checkForUpdates("startup");
    }, 5000); // Wait 5 seconds after app start
    // Check for updates every 4 hours
    setInterval(() => {
        checkForUpdates("interval");
    }, 4 * 60 * 60 * 1000);
}
/**
 * Manually check for updates
 */
function checkForUpdates(trigger = "manual") {
    // Not only in setupAutoUpdater: that early-returns for a managed install
    // without configuring anything, so electron-updater keeps its own defaults —
    // `autoDownload` and `autoInstallOnAppQuit` are both true. A check reaching
    // it from the tray or from IPC would then stage and install an unmanaged
    // copy over the MSI/pkg, which is the exact outcome that guard exists to
    // prevent. Every public entry point has to carry it.
    if (!(0, platform_1.isSelfUpdateSupported)()) {
        electron_log_1.default.info("[AUTO-UPDATER] Update check refused", {
            reason: "this install is managed externally",
            trigger,
            state: getUpdaterDebugState(),
        });
        return;
    }
    if ((0, utils_1.isDev)()) {
        electron_log_1.default.info("[AUTO-UPDATER] Update check skipped", {
            reason: "development",
            trigger,
            state: getUpdaterDebugState(),
        });
        return;
    }
    // Skip the check once an update is already downloaded this session.
    // Electron 39.6+ deletes the previously-staged update directory on every
    // checkForUpdates() call (see electron/electron#50200), but ShipItState.plist
    // still references it — so a subsequent quitAndInstall reads a stale path
    // and silently fails. Leaving the staged update alone avoids the race.
    if (updateDownloaded) {
        electron_log_1.default.info("[AUTO-UPDATER] Update check skipped", {
            reason: "update already downloaded",
            trigger,
            state: getUpdaterDebugState(),
        });
        return;
    }
    // Prevent overlapping check calls. On macOS, quitAndInstall() internally
    // calls checkForUpdates() via Squirrel — if our periodic check is already
    // in flight, the native observer gets registered twice and Chromium fires
    // a NOTREACHED assertion (DESKTOP-FF-26).
    if (isCheckingForUpdates) {
        electron_log_1.default.info("[AUTO-UPDATER] Update check skipped", {
            reason: "check already in progress",
            trigger,
            state: getUpdaterDebugState(),
        });
        return;
    }
    // Reset error state when checking
    updateError = null;
    isCheckingForUpdates = true;
    activeCheckTrigger = trigger;
    runUpdateCheck("stable");
}
/**
 * Point the updater at one of the two feeds.
 *
 * `STABLE_UPDATE_CHANNEL` is the value already baked into `app-update.yml`, so
 * setting it explicitly changes nothing about the ordinary path — it only makes
 * the second phase reversible, because electron-updater refuses to take `null`
 * back once a channel has been set.
 */
function selectUpdateChannel(phase) {
    electron_updater_1.autoUpdater.channel =
        phase === "migration" ? windows_squirrel_migration_1.MIGRATION_UPDATE_CHANNEL : windows_squirrel_migration_1.STABLE_UPDATE_CHANNEL;
    // Assigning `channel` forces `allowDowngrade` on as a side effect. Neither
    // feed ever wants it: both only move forward, and leaving it set would let a
    // manifest that regressed walk users backwards.
    electron_updater_1.autoUpdater.allowDowngrade = false;
}
/**
 * Whether the check that just came up empty should be followed by a look at the
 * migration channel.
 *
 * Only from the stable phase, which is what enforces the upgrade order: the
 * migration release is offered *only* to an install that has already confirmed
 * it is the newest build of this app. Anything older is told about the newest
 * 0.x instead and comes back for the migration on its next check.
 */
function willProbeMigrationChannel() {
    return (activeCheckPhase === "stable" &&
        (0, windows_squirrel_migration_1.shouldProbeMigrationChannel)(process.platform));
}
/**
 * Run one phase of a check, and chain into the next when there is one.
 *
 * Two feeds rather than one, because a static manifest cannot tell who is
 * asking. `latest.yml` is the only thing installs older than this build will
 * ever read, and none of them can install a Squirrel setup — so it has to keep
 * naming the newest 0.x, and the Squirrel release has to live somewhere those
 * installs will never look. See `windows-squirrel-migration.ts`.
 */
function runUpdateCheck(phase) {
    activeCheckPhase = phase;
    selectUpdateChannel(phase);
    electron_log_1.default.info("[AUTO-UPDATER] Starting update check", {
        trigger: activeCheckTrigger,
        phase,
        state: getUpdaterDebugState(),
    });
    electron_updater_1.autoUpdater
        .checkForUpdates()
        .then((result) => {
        if (result?.isUpdateAvailable)
            return;
        // electron-updater clears its own in-flight promise before resolving this
        // one, so the follow-up really runs a second check rather than handing
        // back the one that just finished.
        if (willProbeMigrationChannel())
            runUpdateCheck("migration");
    })
        .catch((error) => {
        // The `error` event fired for this first and has already taken the check
        // state down; this is the same failure arriving a second time, so it only
        // has to stay quiet where that handler did.
        if (activeCheckPhase === "migration")
            return;
        isCheckingForUpdates = false;
        const failedTrigger = activeCheckTrigger;
        activeCheckTrigger = null;
        updateError = getErrorMessage(error);
        electron_log_1.default.error("[AUTO-UPDATER] Failed to check for updates", {
            trigger: failedTrigger,
            error: updateError,
            state: getUpdaterDebugState(),
        });
        notifyStatusChanged();
    });
}
/**
 * Install downloaded update and restart the app.
 */
function installUpdate() {
    // Same reason as checkForUpdates: nothing can be staged for a managed
    // install, and anything that looks staged did not come from here.
    if (!(0, platform_1.isSelfUpdateSupported)()) {
        electron_log_1.default.info("[AUTO-UPDATER] Update install refused", {
            reason: "this install is managed externally",
            state: getUpdaterDebugState(),
        });
        return;
    }
    void installDownloadedUpdate("manual");
}
/**
 * Undo every piece of state committed just before `quitAndInstall`. The
 * minimized mark would otherwise hide the window, the taskbar entry and the
 * dock icon on the next ordinary launch, `isInstallingUpdate` gates every later
 * install attempt this session, and `isQuitting` would turn the next window
 * close into a real quit instead of hiding to the tray.
 *
 * A no-op once the quit sequence has started, because the install is then
 * genuinely in flight: macOS runs its own checkForUpdates() through Squirrel
 * inside quitAndInstall(), so a stray error can surface while the app is already
 * going away. Tearing the state down there would drop the minimized mark the
 * restart depends on, and clearing `isQuitting` would make the main window's
 * close handler cancel the pending quit (see windowing.ts).
 */
function rollbackFailedInstallState() {
    if (quitSequenceStarted)
        return;
    isInstallingUpdate = false;
    electron_1.app.isQuitting = false;
    cancelPreparedQuit();
    (0, restart_state_1.clearStartMinimizedAfterUpdateRestart)();
}
async function installDownloadedUpdate(trigger) {
    if (!updateDownloaded) {
        electron_log_1.default.warn("[AUTO-UPDATER] No update downloaded to install", {
            trigger,
            state: getUpdaterDebugState(),
        });
        return;
    }
    if (isInstallingUpdate) {
        electron_log_1.default.info("[AUTO-UPDATER] Update install already in progress", {
            trigger,
            state: getUpdaterDebugState(),
        });
        return;
    }
    electron_log_1.default.info("[AUTO-UPDATER] Installing update and restarting", {
        trigger,
        state: getUpdaterDebugState(),
    });
    isInstallingUpdate = true;
    // Finish any live recording before anything below can take the app away.
    // Every install path returns from this function without coming back —
    // `quitAndInstall` and the Squirrel hand-off both quit — so this has to stay
    // above all of them, not next to whichever one it was written against.
    try {
        await prepareForQuit();
    }
    catch (error) {
        electron_log_1.default.error("[AUTO-UPDATER] Failed to prepare for update restart", {
            trigger,
            error: getErrorMessage(error),
            state: getUpdaterDebugState(),
        });
    }
    (0, auto_install_1.clearDownloadedUpdateInstallCheck)();
    persistDownloadedUpdateReleaseNotes();
    // Auto/background restarts are unexpected, so relaunch into a minimized
    // window to stay non-intrusive. A manual "Install & Restart" click means the
    // user is actively waiting, so leave the window visible. No-ops on
    // unsupported platforms.
    if (trigger === "auto") {
        (0, restart_state_1.markStartMinimizedAfterUpdateRestart)();
    }
    // Set the isQuitting flag to allow windows to close properly
    electron_1.app.isQuitting = true;
    if (stagedSquirrelMigration) {
        // Reports its own failures; nothing here can wait for it, because on
        // success the app is already quitting.
        void installSquirrelMigration(stagedSquirrelMigration, trigger);
        return;
    }
    // isSilent only affects Windows (NSIS): true runs the installer without its
    // wizard UI. isForceRunAfter relaunches the app once the install completes.
    const isSilentInstall = process.platform === "win32";
    try {
        electron_updater_1.autoUpdater.quitAndInstall(isSilentInstall, true);
    }
    catch (error) {
        // On success the app is already going away, so only a failure to *start* the
        // install returns here, with the app still running on the old version.
        rollbackFailedInstallState();
        updateError = getErrorMessage(error);
        electron_log_1.default.error("[AUTO-UPDATER] Failed to start update install", {
            trigger,
            error: updateError,
            state: getUpdaterDebugState(),
        });
        notifyStatusChanged();
    }
}
/**
 * Install the Squirrel migration and quit, rather than handing the setup to
 * electron-updater. See `windows-squirrel-migration.ts` for why.
 *
 * A failure here is recoverable: nothing has been uninstalled and nothing has
 * been replaced, so unwinding the install state leaves the user on this version
 * with the update still staged, and the next attempt tries again.
 */
async function installSquirrelMigration(plan, trigger) {
    if (await (0, windows_squirrel_migration_1.startSquirrelMigration)({
        plan,
        tempDir: electron_1.app.getPath("temp"),
        logger: electron_log_1.default,
    })) {
        electron_log_1.default.info("[AUTO-UPDATER] Quitting for the Squirrel migration", {
            trigger,
            state: getUpdaterDebugState(),
        });
        electron_1.app.quit();
        return;
    }
    rollbackFailedInstallState();
    updateError = "Could not start the Windows migration installer";
    electron_log_1.default.error("[AUTO-UPDATER] Squirrel migration hand-off failed", {
        trigger,
        installerPath: plan.installerPath,
        state: getUpdaterDebugState(),
    });
    notifyStatusChanged();
}
function persistDownloadedUpdateReleaseNotes() {
    if (!updateDownloaded)
        return;
    (0, restart_state_1.markPostUpdateReleaseNotesAfterRestart)(updateInfo);
}
/**
 * Setup all event handlers for the update process
 */
function setupUpdateEventHandlers() {
    electron_updater_1.autoUpdater.on("checking-for-update", () => {
        electron_log_1.default.info("[AUTO-UPDATER] Electron updater emitted checking-for-update", {
            trigger: activeCheckTrigger,
            state: getUpdaterDebugState(),
        });
    });
    electron_updater_1.autoUpdater.on("update-available", (info) => {
        const checkTrigger = activeCheckTrigger;
        isCheckingForUpdates = false;
        activeCheckTrigger = null;
        electron_log_1.default.info("[AUTO-UPDATER] Update available", {
            version: info.version,
            releaseDate: info.releaseDate,
            checkTrigger,
            state: getUpdaterDebugState(),
        });
        // Don't re-download a version we already have staged. Re-downloading races
        // with ShipItState.plist updates and causes quitAndInstall to read a stale
        // path (see electron/electron#50200).
        if (updateDownloaded && updateInfo?.version === info.version) {
            electron_log_1.default.info("[AUTO-UPDATER] Update download skipped", {
                reason: "same version already downloaded",
                version: info.version,
                checkTrigger,
                state: getUpdaterDebugState(),
            });
            return;
        }
        // Only the migration setup: it is published outside the legacy flat layout
        // and ships no blockmap, so asking for one costs a failed request and a
        // fallback to the full download anyway. Ordinary 0.x updates keep their
        // differential download — this app goes on shipping them, and the full
        // installer is a few hundred megabytes.
        electron_updater_1.autoUpdater.disableDifferentialDownload =
            process.platform === "win32" && (0, windows_squirrel_migration_1.isSquirrelMigrationVersion)(info.version);
        updateAvailable = true;
        updateInfo = (0, release_notes_1.toUpdateInfo)(info);
        updateError = null;
        notifyStatusChanged();
        downloadAvailableUpdate(info.version, checkTrigger);
    });
    electron_updater_1.autoUpdater.on("update-not-available", (info) => {
        // Being current on the stable channel is what qualifies this install for
        // the migration, not the end of the check. Hold the in-flight state so the
        // UI does not flash "up to date" and immediately start checking again.
        if (willProbeMigrationChannel()) {
            electron_log_1.default.info("[AUTO-UPDATER] Newest build of this app; probing migration", {
                version: info.version,
                trigger: activeCheckTrigger,
                state: getUpdaterDebugState(),
            });
            return;
        }
        const checkTrigger = activeCheckTrigger;
        isCheckingForUpdates = false;
        activeCheckTrigger = null;
        electron_log_1.default.info("[AUTO-UPDATER] Already on latest version", {
            version: info.version,
            checkTrigger,
            state: getUpdaterDebugState(),
        });
        updateAvailable = false;
        updateDownloaded = false;
        updateInfo = null;
        updateError = null;
        notifyStatusChanged();
    });
    electron_updater_1.autoUpdater.on("update-downloaded", (info) => {
        const downloadAttempt = activeDownloadAttempt;
        activeDownloadAttempt = null;
        updateDownloaded = true;
        updateInfo = (0, release_notes_1.toUpdateInfo)(info);
        updateError = null;
        // Only a 1.x update is the migration. This app keeps shipping 0.x NSIS
        // updates, and each of those must install through electron-updater exactly
        // as it always has.
        const isMigration = process.platform === "win32" && (0, windows_squirrel_migration_1.isSquirrelMigrationVersion)(info.version);
        stagedSquirrelMigration = isMigration
            ? (0, windows_squirrel_migration_1.planSquirrelMigration)({
                installerPath: info.downloadedFile,
                exePath: electron_1.app.getPath("exe"),
                localAppData: process.env.LOCALAPPDATA ?? "",
            })
            : null;
        if (isMigration && !stagedSquirrelMigration) {
            // Nothing here can drive the hand-off on this machine, so leave the
            // update to electron-updater: it runs the same Squirrel setup with NSIS
            // switches it ignores, which shows the installer window and skips the
            // uninstall, but it does install. The new app removes the previous
            // install itself on first launch, so the machine still converges — and a
            // visible installer beats being stuck on this version forever.
            electron_log_1.default.warn("[AUTO-UPDATER] Migration hand-off unavailable; installing normally", {
                version: info.version,
                exePath: electron_1.app.getPath("exe"),
            });
        }
        if (stagedSquirrelMigration) {
            // electron-updater's own on-quit install would run the same setup with
            // NSIS switches Squirrel ignores, putting its progress window on screen
            // and skipping the uninstall. Every install of this update now goes
            // through installDownloadedUpdate().
            electron_updater_1.autoUpdater.autoInstallOnAppQuit = false;
            electron_log_1.default.info("[AUTO-UPDATER] Staged update is the Squirrel migration", {
                version: info.version,
                installerPath: stagedSquirrelMigration.installerPath,
            });
        }
        electron_log_1.default.info("[AUTO-UPDATER] Update downloaded", {
            version: info.version,
            downloadAttempt,
            state: getUpdaterDebugState(),
        });
        notifyStatusChanged();
        (0, auto_install_1.scheduleDownloadedUpdateInstallCheck)("update downloaded");
    });
    electron_updater_1.autoUpdater.on("error", (error) => {
        isCheckingForUpdates = false;
        const failedCheckTrigger = activeCheckTrigger;
        const failedDownloadAttempt = activeDownloadAttempt;
        activeCheckTrigger = null;
        activeDownloadAttempt = null;
        // Only the manifest being absent. That is the ordinary steady state until
        // the new app ships, and this install is already on the newest build of
        // this app, so there is nothing to act on. Every other failure — a network
        // error, a malformed manifest — is real and must surface, or a user who
        // clicked "Check for Updates" is told there is nothing rather than that the
        // check failed. A download or install on that channel is a real failure
        // too, and falls through: only a check still holds `activeCheckTrigger`.
        if (activeCheckPhase === "migration" &&
            failedCheckTrigger !== null &&
            isMissingChannelError(error)) {
            electron_log_1.default.info("[AUTO-UPDATER] No migration release available", {
                reason: getErrorMessage(error),
                trigger: failedCheckTrigger,
                state: getUpdaterDebugState(),
            });
            notifyStatusChanged();
            return;
        }
        updateError = getErrorMessage(error);
        updateAvailable = false;
        updateDownloaded = false;
        // An install that failed asynchronously (Squirrel/NSIS erroring after
        // quitAndInstall already returned) leaves the same state committed. Only an
        // install in flight can have written the minimized mark — a check or
        // download error never did, so it must not touch that file.
        if (isInstallingUpdate) {
            rollbackFailedInstallState();
        }
        electron_log_1.default.error("[AUTO-UPDATER] Error", {
            error: updateError,
            failedCheckTrigger,
            failedDownloadAttempt,
            state: getUpdaterDebugState(),
        });
        (0, auto_install_1.clearDownloadedUpdateInstallCheck)();
        notifyStatusChanged();
    });
}
function downloadAvailableUpdate(version, trigger) {
    activeDownloadAttempt = { trigger, version };
    electron_log_1.default.info("[AUTO-UPDATER] Starting update download", {
        version,
        trigger,
        state: getUpdaterDebugState(),
    });
    electron_updater_1.autoUpdater.downloadUpdate().catch((error) => {
        const failedDownloadAttempt = activeDownloadAttempt;
        activeDownloadAttempt = null;
        updateAvailable = false;
        updateDownloaded = false;
        updateError = getErrorMessage(error);
        electron_log_1.default.error("[AUTO-UPDATER] Failed to download update", {
            error: updateError,
            failedDownloadAttempt,
            state: getUpdaterDebugState(),
        });
        notifyStatusChanged();
    });
}
//# sourceMappingURL=download-and-update.js.map