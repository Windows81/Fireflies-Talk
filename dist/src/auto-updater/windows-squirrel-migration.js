"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMigrationScript = exports.MIGRATION_UPDATE_CHANNEL = exports.STABLE_UPDATE_CHANNEL = void 0;
exports.isSquirrelMigrationVersion = isSquirrelMigrationVersion;
exports.shouldProbeMigrationChannel = shouldProbeMigrationChannel;
exports.squirrelInstallRootCandidates = squirrelInstallRootCandidates;
exports.planSquirrelMigration = planSquirrelMigration;
exports.startSquirrelMigration = startSquirrelMigration;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
// Every path this module touches is a Windows path — the NSIS install root,
// the uninstaller beside the exe, the %LOCALAPPDATA% install candidates, the
// %TEMP% script — and none of it runs anywhere but win32. Pinning the Windows
// implementation rather than taking the host's keeps `\` the separator and
// keeps the tests meaningful on a POSIX CI runner, where the default `path`
// joins with `/` and `dirname("C:\a\b.exe")` is `"."`.
const path_1 = require("path");
const windows_squirrel_script_1 = require("./windows-squirrel-script");
Object.defineProperty(exports, "buildMigrationScript", { enumerable: true, get: function () { return windows_squirrel_script_1.buildMigrationScript; } });
/**
 * Hand-off from this app's electron-builder/NSIS install to the rewritten
 * app's Squirrel.Windows install.
 *
 * `autoUpdater` cannot do this itself. Its NSIS installer contract is
 * `installer.exe --updated /S --force-run`, and Squirrel's `Setup.exe`
 * understands none of those three: it would install with its progress window
 * on screen, and afterwards the previous install would still be registered,
 * still own the auto-launch entry, and still contend for the single-instance
 * lock — both apps share the same `%APPDATA%\Fireflies` user-data directory.
 *
 * So on the migration update only, the install is driven from here instead:
 *
 *   1. `Setup.exe --silent` — Squirrel's own silent switch. Installs per-user
 *      under `%LOCALAPPDATA%`, so no elevation prompt.
 *   2. the NSIS uninstaller, silently — only if step 1 succeeded, so a failed
 *      install never leaves the machine with no app at all.
 *   3. `Update.exe --processStart` — because `--silent` also suppresses the
 *      app launch Squirrel would otherwise do, and the user is expecting their
 *      app to come back.
 *
 * The three steps run from a temporary script rather than from here, because
 * they have to outlive the process that starts them: this app is quitting so
 * that step 2 has nothing of its own left to close.
 *
 * Nothing in this file imports `electron`, so all of it is exercised by
 * `windows-squirrel-migration.test.ts` under plain Node.
 */
/**
 * Squirrel `name` in the new app's forge config, and the id of the `.nupkg` it
 * produces.
 *
 * NOT the install directory. Squirrel truncates the package id at the first dot
 * when deriving that, so `ai.fireflies.desktop` installs to
 * `%LOCALAPPDATA%\ai` — while still using the *full* id for the app user model
 * id. Verified against a real 1.0.0 install:
 *
 *   Program: About to install to: C:\Users\...\AppData\Local\ai
 *
 * So the root is resolved at run time rather than assumed; see
 * {@link squirrelInstallRootCandidates}.
 */
const SQUIRREL_PACKAGE_ID = "ai.fireflies.desktop";
/** electron-builder writes `Uninstall ${productName}.exe` beside the app. */
const NSIS_UNINSTALLER_NAME = "Uninstall Fireflies.exe";
/**
 * The rewritten app's first version. This app's own series is 0.x and stays
 * there, so the major version alone separates "this update is the migration"
 * from "this update is another build of this app".
 */
const SQUIRREL_MIN_MAJOR_VERSION = 1;
/**
 * Whether this update is the switch to Squirrel rather than another 0.x build
 * of this app.
 *
 * The version is the whole rule, deliberately. This app keeps shipping ordinary
 * NSIS updates alongside the migration, and every one of them must go through
 * `quitAndInstall` exactly as before — so the test has to be something a 0.x
 * release can never accidentally satisfy. Artifact naming was the earlier
 * signal and is not used: it describes how a file was built, not which app it
 * installs, and one renamed artifact would have been enough to send a 0.x
 * update down the migration path.
 *
 * Deliberately offline. Asking the server which artifact it just served would
 * be more direct, but it would also put a network call between the user
 * clicking install and the install starting.
 */
function isSquirrelMigrationVersion(version) {
    const major = Number.parseInt(version.split(".")[0] ?? "", 10);
    return Number.isInteger(major) && major >= SQUIRREL_MIN_MAJOR_VERSION;
}
/**
 * The channel every build of this app has always polled: `<releases>/latest.yml`.
 *
 * It must keep naming the newest *0.x* build forever, because it is the only
 * thing installs that predate the migration will ever read, and they have no
 * code that can cope with a Squirrel setup — handed one, they would run it with
 * NSIS switches it ignores, put its window on screen, and leave the old install
 * in place. Freezing this channel at the last NSIS build is what forces those
 * installs to step through it instead of jumping straight to 1.0.0.
 */
exports.STABLE_UPDATE_CHANNEL = "latest";
/**
 * The channel the Squirrel release is published on: `<releases>/migration.yml`.
 *
 * Written only by the new app's release pipeline, and read only by a build that
 * has already established it is the newest 0.x — so reaching it *is* the proof
 * that the hand-off in this file is the one to run. Keeping it out of
 * `latest.yml` is what makes the ordering a property of the feed rather than of
 * release timing: publishing 1.0.0 never touches the stable channel, and
 * publishing another 0.x never touches this one.
 *
 * Its absence is normal and not an error. Until the new app ships, nothing is
 * published here and the request 404s.
 */
exports.MIGRATION_UPDATE_CHANNEL = "migration";
/**
 * Whether to look at the migration channel at all.
 *
 * Windows only. macOS ships the same DMG/ZIP layout before and after the
 * rewrite, so an install of any age updates straight across and needs no
 * staging — and a channel set there would send electron-updater looking for a
 * `migration-mac.yml` that does not exist.
 */
function shouldProbeMigrationChannel(platform) {
    return platform === "win32";
}
/**
 * Directories the new app may have installed into, most likely first.
 *
 * Two guesses rather than one because the rule that produces them is Squirrel's
 * and undocumented: the truncation observed today, and the whole id in case a
 * future Squirrel stops truncating or the package is renamed to something
 * dot-free. Both are only accepted if they hold this app's own executable, so a
 * generic directory like `%LOCALAPPDATA%\ai` cannot resolve to somebody else's
 * Squirrel app.
 */
function squirrelInstallRootCandidates(localAppData, packageId = SQUIRREL_PACKAGE_ID) {
    const names = [packageId.split(".")[0], packageId];
    return [...new Set(names)].map((name) => path_1.win32.join(localAppData, name));
}
/**
 * Resolve the paths the hand-off needs, or null when this install must not run
 * one.
 *
 * The per-user check is the important one. A per-machine MSI install lives
 * under Program Files, is managed by IT tooling rather than by this updater,
 * and shares none of the assumptions below — uninstalling it would need
 * elevation and would fight whatever deployed it.
 */
/**
 * Whether a path can be embedded in the generated batch script.
 *
 * Every path the script names is quoted, which makes `&`, `^` and spaces inert
 * — but not `%`. cmd expands `%...%` inside double quotes too, so a profile
 * directory containing one would rewrite the command before it ran. `"` would
 * end the quoting outright.
 *
 * These are the machine's own paths rather than anything remote, so this is
 * about a hand-off that silently does the wrong thing rather than about an
 * attacker — but the failure is invisible either way, and refusing is cheap.
 * Refusing means no plan, which {@link planSquirrelMigration}'s caller turns
 * into an ordinary install.
 */
function isEmbeddablePath(value) {
    return !value.includes("%") && !value.includes('"');
}
function planSquirrelMigration({ installerPath, exePath, localAppData, platform = process.platform, fileExists = fs_1.existsSync, }) {
    if (platform !== "win32")
        return null;
    if (!localAppData)
        return null;
    if (![installerPath, exePath, localAppData].every(isEmbeddablePath)) {
        return null;
    }
    const installRoot = path_1.win32.dirname(exePath);
    const isPerUserInstall = installRoot
        .toLowerCase()
        .startsWith(localAppData.toLowerCase() + path_1.win32.sep);
    if (!isPerUserInstall)
        return null;
    const uninstallerPath = path_1.win32.join(installRoot, NSIS_UNINSTALLER_NAME);
    return {
        installerPath,
        uninstallerPath: fileExists(uninstallerPath) ? uninstallerPath : null,
        installRoots: squirrelInstallRootCandidates(localAppData),
        localAppData,
    };
}
/**
 * Start the hand-off and return true once it is running. The caller quits
 * immediately afterwards — the uninstaller in step 2 must not find this app
 * alive, and step 3 brings the user back into the new one.
 */
async function startSquirrelMigration({ plan, tempDir, logger, launchScript = defaultLaunchScript, writeScript = (scriptPath, contents) => (0, fs_1.writeFileSync)(scriptPath, contents, "utf8"), }) {
    const scriptPath = path_1.win32.join(tempDir, `fireflies-squirrel-migration-${Date.now()}.cmd`);
    try {
        writeScript(scriptPath, (0, windows_squirrel_script_1.buildMigrationScript)(plan));
    }
    catch (error) {
        logger.error("[AUTO-UPDATER] Could not write the migration script", {
            scriptPath,
            error,
        });
        return false;
    }
    try {
        // Awaited, because the caller quits the app on `true`. `spawn` reports a
        // launch failure asynchronously, so returning as soon as the call is made
        // would report success for a process that never started and close the app
        // on top of it, leaving the user with nothing running and no installer.
        // This waits only for the process to *exist*, not for the install to
        // finish — the uninstall in step 2 still needs this app gone.
        await launchScript(scriptPath, tempDir, logger);
        logger.info("[AUTO-UPDATER] Started the Squirrel migration hand-off", {
            scriptPath,
            installerPath: plan.installerPath,
            uninstallerPath: plan.uninstallerPath,
            installRoots: plan.installRoots,
        });
        return true;
    }
    catch (error) {
        logger.error("[AUTO-UPDATER] Could not start the migration script", {
            scriptPath,
            error,
        });
        return false;
    }
}
/**
 * Launch the generated script detached, so it outlives the quit that follows.
 */
/**
 * Node emits exactly one of `spawn` or `error`, so the race below settles
 * either way. The timeout only covers the case where neither arrives; it
 * resolves rather than rejects, because a missing event is not evidence that
 * the process failed to start.
 */
const LAUNCH_CONFIRM_TIMEOUT_MS = 5000;
function defaultLaunchScript(scriptPath, tempDir, logger) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", scriptPath], {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
            // cwd must not be the directory step 2 deletes.
            cwd: tempDir,
        });
        const settle = (finish) => {
            clearTimeout(timer);
            // Only after the outcome is known: unref'ing first would let the event
            // loop drain before either event arrives.
            child.unref();
            finish();
        };
        const timer = setTimeout(() => {
            logger.info("[AUTO-UPDATER] Migration launch unconfirmed; proceeding", {
                scriptPath,
            });
            settle(resolve);
        }, LAUNCH_CONFIRM_TIMEOUT_MS);
        child.once("spawn", () => settle(resolve));
        child.once("error", (error) => {
            logger.error("[AUTO-UPDATER] The migration script failed to launch", {
                scriptPath,
                error,
            });
            settle(() => reject(error));
        });
    });
}
//# sourceMappingURL=windows-squirrel-migration.js.map