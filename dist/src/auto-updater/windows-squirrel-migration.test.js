"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const windows_squirrel_migration_1 = require("./windows-squirrel-migration");
const LOCAL_APP_DATA = "C:\\Users\\ada\\AppData\\Local";
const NSIS_INSTALL_DIR = `${LOCAL_APP_DATA}\\Programs\\fireflies-desktop`;
const NSIS_EXE = `${NSIS_INSTALL_DIR}\\Fireflies.exe`;
(0, node_test_1.test)("treats 1.0.0 and above as the migration", () => {
    for (const version of ["1.0.0", "1.2.3", "2.0.0", "1.0.0-rc.1"]) {
        strict_1.default.equal((0, windows_squirrel_migration_1.isSquirrelMigrationVersion)(version), true, version);
    }
});
(0, node_test_1.test)("leaves every 0.x update on the electron-updater path", () => {
    // This app keeps shipping ordinary NSIS releases after the migration exists;
    // none of them may take the Squirrel hand-off.
    for (const version of ["0.1.41", "0.1.42", "0.2.0", "0.9.99"]) {
        strict_1.default.equal((0, windows_squirrel_migration_1.isSquirrelMigrationVersion)(version), false, version);
    }
});
(0, node_test_1.test)("ignores the artifact name entirely", () => {
    // Naming describes how a file was built, not which app it installs. A 0.x
    // artifact that happened to carry an arch suffix must still install normally.
    strict_1.default.equal((0, windows_squirrel_migration_1.isSquirrelMigrationVersion)("0.1.42"), false);
});
(0, node_test_1.test)("treats an unparseable version as not-a-migration", () => {
    for (const version of ["not-a-version", "", "v"]) {
        strict_1.default.equal((0, windows_squirrel_migration_1.isSquirrelMigrationVersion)(version), false, version);
    }
});
(0, node_test_1.test)("keeps the migration off the channel older installs read", () => {
    // The whole ordering guarantee rests on these being different files. An
    // install that predates the migration only ever reads `latest.yml`, and
    // handed a Squirrel setup it would run the visible installer with NSIS
    // switches and leave the old app in place.
    strict_1.default.equal(windows_squirrel_migration_1.STABLE_UPDATE_CHANNEL, "latest");
    strict_1.default.notEqual(windows_squirrel_migration_1.MIGRATION_UPDATE_CHANNEL, windows_squirrel_migration_1.STABLE_UPDATE_CHANNEL);
});
(0, node_test_1.test)("probes the migration channel on Windows only", () => {
    // macOS ships the same DMG/ZIP layout on both sides of the rewrite, so an
    // install of any age updates straight across. A channel set there would send
    // electron-updater after a `migration-mac.yml` nobody publishes.
    strict_1.default.equal((0, windows_squirrel_migration_1.shouldProbeMigrationChannel)("win32"), true);
    strict_1.default.equal((0, windows_squirrel_migration_1.shouldProbeMigrationChannel)("darwin"), false);
    strict_1.default.equal((0, windows_squirrel_migration_1.shouldProbeMigrationChannel)("linux"), false);
});
(0, node_test_1.test)("puts the truncated install root first, because that is what Squirrel uses", () => {
    // A real 1.0.0 install logged: "About to install to: ...\AppData\Local\ai".
    // Squirrel cuts the package id at the first dot for the directory, while
    // still using the whole id for the app user model id.
    strict_1.default.deepEqual((0, windows_squirrel_migration_1.squirrelInstallRootCandidates)(LOCAL_APP_DATA), [
        `${LOCAL_APP_DATA}\\ai`,
        `${LOCAL_APP_DATA}\\ai.fireflies.desktop`,
    ]);
});
(0, node_test_1.test)("collapses the candidates when the package id has no dot to cut", () => {
    strict_1.default.deepEqual((0, windows_squirrel_migration_1.squirrelInstallRootCandidates)(LOCAL_APP_DATA, "fireflies-desktop"), [`${LOCAL_APP_DATA}\\fireflies-desktop`]);
});
(0, node_test_1.test)("plans the hand-off for a per-user NSIS install", () => {
    const plan = (0, windows_squirrel_migration_1.planSquirrelMigration)({
        installerPath: "C:\\temp\\Fireflies Setup 1.0.0-x64.exe",
        exePath: NSIS_EXE,
        localAppData: LOCAL_APP_DATA,
        platform: "win32",
        fileExists: () => false,
    });
    strict_1.default.ok(plan);
    strict_1.default.equal(plan.localAppData, LOCAL_APP_DATA);
    strict_1.default.deepEqual(plan.installRoots, [
        `${LOCAL_APP_DATA}\\ai`,
        `${LOCAL_APP_DATA}\\ai.fireflies.desktop`,
    ]);
    // Not present on this machine, so there is nothing to uninstall; the new
    // app's own first-run cleanup is the backstop.
    strict_1.default.equal(plan.uninstallerPath, null);
});
(0, node_test_1.test)("plans the uninstall step when the NSIS uninstaller is beside the app", () => {
    const plan = (0, windows_squirrel_migration_1.planSquirrelMigration)({
        installerPath: "C:\\temp\\Fireflies Setup 1.0.0-x64.exe",
        exePath: NSIS_EXE,
        localAppData: LOCAL_APP_DATA,
        platform: "win32",
        fileExists: (candidate) => candidate === `${NSIS_INSTALL_DIR}\\Uninstall Fireflies.exe`,
    });
    strict_1.default.equal(plan?.uninstallerPath, `${NSIS_INSTALL_DIR}\\Uninstall Fireflies.exe`);
});
(0, node_test_1.test)("refuses to migrate a per-machine install", () => {
    // The MSI target installs under Program Files and is managed by IT tooling:
    // uninstalling it would need elevation and would fight whatever deployed it.
    const plan = (0, windows_squirrel_migration_1.planSquirrelMigration)({
        installerPath: "C:\\temp\\Fireflies Setup 1.0.0-x64.exe",
        exePath: "C:\\Program Files\\Fireflies\\Fireflies.exe",
        localAppData: LOCAL_APP_DATA,
        platform: "win32",
    });
    strict_1.default.equal(plan, null);
});
(0, node_test_1.test)("refuses to migrate off Windows", () => {
    strict_1.default.equal((0, windows_squirrel_migration_1.planSquirrelMigration)({
        installerPath: "/tmp/Fireflies Setup 1.0.0-x64.exe",
        exePath: "/Applications/Fireflies.app/Contents/MacOS/Fireflies",
        localAppData: LOCAL_APP_DATA,
        platform: "darwin",
        fileExists: () => true,
    }), null);
});
const FULL_PLAN = {
    installerPath: "C:\\temp\\Fireflies Setup 1.0.0-x64.exe",
    uninstallerPath: `${NSIS_INSTALL_DIR}\\Uninstall Fireflies.exe`,
    installRoots: [
        `${LOCAL_APP_DATA}\\ai`,
        `${LOCAL_APP_DATA}\\ai.fireflies.desktop`,
    ],
    localAppData: LOCAL_APP_DATA,
};
(0, node_test_1.test)("refuses a path cmd would reinterpret inside the script", () => {
    // Quoting makes `&` and spaces inert in a .cmd, but cmd still expands
    // `%...%` inside double quotes. A profile directory holding one would
    // rewrite the command before it ran, and the caller turns "no plan" into an
    // ordinary install rather than a silently wrong hand-off.
    const plan = (0, windows_squirrel_migration_1.planSquirrelMigration)({
        installerPath: "C:\\temp\\Fireflies Setup 1.0.0-x64.exe",
        exePath: `${LOCAL_APP_DATA}\\Programs\\ff%PATH%\\Fireflies.exe`,
        localAppData: LOCAL_APP_DATA,
        platform: "win32",
        fileExists: () => false,
    });
    strict_1.default.equal(plan, null);
});
(0, node_test_1.test)("still plans for an ordinary path containing an ampersand", () => {
    // `&` is a command separator in cmd but inert inside the quotes the script
    // already uses, and account names containing one are not exotic.
    const plan = (0, windows_squirrel_migration_1.planSquirrelMigration)({
        installerPath: "C:\\temp\\Fireflies Setup 1.0.0-x64.exe",
        exePath: `${LOCAL_APP_DATA}\\Programs\\A & B\\Fireflies.exe`,
        localAppData: LOCAL_APP_DATA,
        platform: "win32",
        fileExists: () => false,
    });
    strict_1.default.ok(plan);
});
(0, node_test_1.test)("writes the hand-off script where the launcher will find it", async () => {
    // A Windows temp directory, because that is what `app.getPath("temp")`
    // returns in production. Nothing here touches the real filesystem: on a
    // POSIX CI host `writeFileSync` would resolve this Windows path against the
    // working directory and quietly succeed, testing the host's path rules
    // instead of Windows'.
    const tempDir = "C:\\Users\\ada\\AppData\\Local\\Temp";
    const written = [];
    const launched = [];
    const started = await (0, windows_squirrel_migration_1.startSquirrelMigration)({
        plan: FULL_PLAN,
        tempDir,
        logger: { info: () => { }, error: () => { } },
        writeScript: (scriptPath, contents) => written.push({ scriptPath, contents }),
        // Never the real launcher: it would run an installer and an uninstaller on
        // whatever machine is running the suite.
        launchScript: async (scriptPath, dir) => {
            launched.push({ scriptPath, tempDir: dir });
        },
    });
    strict_1.default.equal(started, true);
    strict_1.default.equal(written.length, 1);
    strict_1.default.equal(launched.length, 1);
    // The launcher must be handed the file that was just written, in the
    // directory it was told to use — and its working directory must not be one
    // step 2 deletes.
    strict_1.default.equal(launched[0].scriptPath, written[0].scriptPath);
    strict_1.default.equal(launched[0].tempDir, tempDir);
    strict_1.default.ok(written[0].scriptPath.startsWith(`${tempDir}\\`));
    strict_1.default.ok(written[0].scriptPath.endsWith(".cmd"));
    strict_1.default.equal(written[0].contents, (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN));
});
(0, node_test_1.test)("reports failure rather than quitting when the script cannot be written", async () => {
    // The caller quits the app on `true`. A failed write must come back as
    // `false`, or the user is left with no app running and no installer
    // started — and nothing may be launched.
    const errors = [];
    let launches = 0;
    const started = await (0, windows_squirrel_migration_1.startSquirrelMigration)({
        plan: FULL_PLAN,
        tempDir: "C:\\Users\\ada\\AppData\\Local\\Temp",
        logger: { info: () => { }, error: (message) => errors.push(message) },
        writeScript: () => {
            throw new Error("EACCES");
        },
        launchScript: async () => {
            launches += 1;
        },
    });
    strict_1.default.equal(started, false);
    strict_1.default.equal(launches, 0);
    strict_1.default.equal(errors.length, 1);
});
(0, node_test_1.test)("does not report success when the launch fails asynchronously", async () => {
    // spawn reports a failed launch after the call returns. Reporting success
    // then would quit the app on top of an installer that never started, leaving
    // the user with nothing running -- so the result has to wait for the process
    // to exist.
    const errors = [];
    const started = await (0, windows_squirrel_migration_1.startSquirrelMigration)({
        plan: FULL_PLAN,
        tempDir: "C:\\Users\\ada\\AppData\\Local\\Temp",
        logger: { info: () => { }, error: (message) => errors.push(message) },
        writeScript: () => { },
        launchScript: () => Promise.reject(new Error("ENOENT")),
    });
    strict_1.default.equal(started, false);
    strict_1.default.equal(errors.length, 1);
});
(0, node_test_1.test)("the script installs silently, then uninstalls, then relaunches", () => {
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN);
    const installAt = script.indexOf(`"${FULL_PLAN.installerPath}" --silent`);
    const uninstallAt = script.indexOf(`"${FULL_PLAN.uninstallerPath}"`);
    const launchAt = script.indexOf("--processStart");
    strict_1.default.ok(installAt > -1, "installs the Squirrel setup");
    strict_1.default.ok(uninstallAt > installAt, "uninstalls after installing");
    strict_1.default.ok(launchAt > uninstallAt, "relaunches last");
});
(0, node_test_1.test)("the script never uninstalls after a failed install", () => {
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN);
    const lines = script.split("\r\n");
    const installIndex = lines.findIndex((line) => line.includes("--silent"));
    const uninstallIndex = lines.findIndex((line) => line.includes("Uninstall Fireflies.exe"));
    // Between the two, so a machine whose install failed keeps a working app.
    const guardIndex = lines.findIndex((line) => line.startsWith("if errorlevel 1 exit"));
    strict_1.default.ok(guardIndex > installIndex && guardIndex < uninstallIndex);
});
(0, node_test_1.test)("the script never passes --delete-app-data to the uninstaller", () => {
    // %APPDATA%\Fireflies is shared with the new app and holds the session and
    // settings it is about to migrate.
    strict_1.default.equal((0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN).includes("--delete-app-data"), false);
});
(0, node_test_1.test)("the script tries every candidate install root, best guess first", () => {
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN);
    const forLine = script
        .split("\r\n")
        .find((line) => line.startsWith("for %%R in ("));
    strict_1.default.ok(forLine);
    strict_1.default.ok(forLine.indexOf(`"${LOCAL_APP_DATA}\\ai"`) > -1);
    strict_1.default.ok(forLine.indexOf(`"${LOCAL_APP_DATA}\\ai"`) <
        forLine.indexOf(`"${LOCAL_APP_DATA}\\ai.fireflies.desktop"`));
});
(0, node_test_1.test)("a candidate root needs this app's own executable, not just Update.exe", () => {
    // The truncated root can be as generic as %LOCALAPPDATA%\ai, which another
    // vendor's Squirrel app could also have claimed.
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN);
    strict_1.default.ok(script.includes('if exist "%%~R\\Update.exe" if exist "%%~R\\Fireflies.exe" set "FF_ROOT=%%~R"'));
});
(0, node_test_1.test)("the script recreates the shortcut the uninstaller deleted", () => {
    // The NSIS uninstaller removes Desktop\Fireflies.lnk by name, and Squirrel
    // had just created its own shortcut at that same path.
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN);
    const uninstallAt = script.indexOf(`"${FULL_PLAN.uninstallerPath}"`);
    const shortcutAt = script.indexOf("--createShortcut=Fireflies.exe");
    const launchAt = script.indexOf("--processStart");
    strict_1.default.ok(shortcutAt > uninstallAt, "recreates after the uninstall");
    strict_1.default.ok(launchAt > shortcutAt, "and before the app is launched");
});
(0, node_test_1.test)("the script falls back to scanning LOCALAPPDATA for the install", () => {
    // Squirrel's directory-naming rule is its own and undocumented; guessing
    // wrong once already left the app installed but never started.
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)(FULL_PLAN);
    strict_1.default.ok(script.includes(`pushd "${LOCAL_APP_DATA}"`));
    strict_1.default.ok(script.includes('if exist "%%~fD\\Update.exe" if exist "%%~fD\\Fireflies.exe" set "FF_ROOT=%%~fD"'));
});
(0, node_test_1.test)("the script still relaunches when there is nothing to uninstall", () => {
    const script = (0, windows_squirrel_migration_1.buildMigrationScript)({ ...FULL_PLAN, uninstallerPath: null });
    strict_1.default.equal(script.includes("Uninstall Fireflies.exe"), false);
    strict_1.default.ok(script.includes("--processStart"));
});
//# sourceMappingURL=windows-squirrel-migration.test.js.map