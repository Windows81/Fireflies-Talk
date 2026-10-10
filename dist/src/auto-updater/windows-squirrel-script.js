"use strict";
/**
 * The batch script that performs the NSIS-to-Squirrel hand-off, and the plan it
 * is built from.
 *
 * Split from `windows-squirrel-migration.ts` so that generating the script is
 * separable from deciding whether to run one and from launching it: this half
 * is a pure function over a plan, and every branch of the script it emits is
 * asserted on the text rather than by running an installer.
 *
 * The script runs from a temporary file rather than from the app, because its
 * steps have to outlive the process that starts them — the app is quitting so
 * that the uninstall in step 2 has nothing of its own left to close.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMigrationScript = buildMigrationScript;
/** electron-forge `executableName` in the new app. */
const SQUIRREL_EXE_NAME = "Fireflies.exe";
/**
 * The batch script that runs the three steps.
 *
 * A script file rather than a `cmd /c` one-liner: every path here contains
 * spaces, and cmd's quoting rules for a chained command line are their own
 * subject. Inside a script each command is an ordinary line.
 */
function buildMigrationScript(plan) {
    const lines = [
        "@echo off",
        "setlocal",
        // Squirrel's own silent switch. `call` so the script waits for it.
        `call "${plan.installerPath}" --silent`,
        // A failed install must not take the working app with it.
        "if errorlevel 1 exit /b %errorlevel%",
    ];
    if (plan.uninstallerPath) {
        // Nothing of this app is running by now, so the uninstaller has nothing to
        // close. No `--delete-app-data`: %APPDATA%\Fireflies is the directory the
        // new app reads the migrated session and settings out of.
        lines.push(`call "${plan.uninstallerPath}" /currentuser /S`);
    }
    lines.push(
    // Find where Squirrel actually put the app.
    //
    // Both files must be present before a root is accepted: `Update.exe` alone
    // matches any Squirrel app, and the truncated candidate can be a directory
    // as generic as `%LOCALAPPDATA%\ai`.
    'set "FF_ROOT="', `for %%R in (${plan.installRoots.map((root) => `"${root}"`).join(" ")}) do (`, `  if not defined FF_ROOT if exist "%%~R\\Update.exe" if exist "%%~R\\${SQUIRREL_EXE_NAME}" set "FF_ROOT=%%~R"`, ")", 
    // Last resort. Squirrel derives the install directory by a rule of its own
    // — today it truncates the package id at the first dot — and guessing wrong
    // silently strands the user with the new app installed but never started.
    // Scanning for the same pair finds it whatever the directory is called.
    `pushd "${plan.localAppData}"`, "for /d %%D in (*) do (", `  if not defined FF_ROOT if exist "%%~fD\\Update.exe" if exist "%%~fD\\${SQUIRREL_EXE_NAME}" set "FF_ROOT=%%~fD"`, ")", "popd", "if not defined FF_ROOT goto :done", 
    // Step 2 deleted this: the NSIS uninstaller removes `Desktop\Fireflies.lnk`
    // by name, and Squirrel had just created its own shortcut at that same
    // path. Recreating is Squirrel's own idempotent operation and also repairs
    // the Start Menu entry if that collided too.
    `call "%FF_ROOT%\\Update.exe" --createShortcut=${SQUIRREL_EXE_NAME}`, 
    // `--silent` suppressed Squirrel's own launch, so start the app here.
    // `Update.exe` resolves whichever app-<version> directory is current.
    `start "" "%FF_ROOT%\\Update.exe" --processStart "${SQUIRREL_EXE_NAME}"`, ":done", 
    // Self-delete: cmd has already read this far, so removing the file is safe.
    'del /f /q "%~f0"', "");
    return lines.join("\r\n");
}
//# sourceMappingURL=windows-squirrel-script.js.map