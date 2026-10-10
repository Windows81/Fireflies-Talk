"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncate = truncate;
exports.buildTrayTitle = buildTrayTitle;
exports.buildTrayMenu = buildTrayMenu;
const electron_1 = require("electron");
const windowing_1 = require("./windowing");
const desktop_logged_in_1 = require("./desktop-logged-in");
const open_desktop_settings_1 = require("./open-desktop-settings");
const recording_context_store_1 = require("./recording-context-store");
const download_and_update_1 = require("./auto-updater/download-and-update");
const tray_settings_store_1 = require("./tray-settings-store");
const openDesktopSettings = (0, open_desktop_settings_1.createOpenDesktopSettings)({
    getMainWindow: () => windowing_1.mainWindow,
    createWindow: windowing_1.createWindow,
    isLoggedIn: desktop_logged_in_1.isDesktopLoggedIn,
});
const MAX_TITLE_LENGTH = 35;
const MAX_MEETING_TITLE_LENGTH = 20;
const MAX_UPCOMING_EVENTS = 3;
const TITLE_SHOW_THRESHOLD_MS = 6 * 60 * 60 * 1000;
function truncate(text, max) {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
function formatCountdown(diffMs) {
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1)
        return "now";
    if (diffMin < 60)
        return `in ${diffMin}m`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
}
function formatEventTime(startTime) {
    const d = new Date(startTime);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return m === 0
        ? `${hour}:00 ${ampm}`
        : `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
function getDayLabel(startTime, now) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfEvent = new Date(startTime);
    startOfEvent.setHours(0, 0, 0, 0);
    const diffDays = Math.round((startOfEvent.getTime() - startOfToday.getTime()) / 86400000);
    if (diffDays === 0)
        return "Today";
    if (diffDays === 1)
        return "Tomorrow";
    return new Date(startTime).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}
function hasAllowedHost(url, host) {
    if (!url)
        return false;
    try {
        const hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, "");
        return hostname === host || hostname.endsWith(`.${host}`);
    }
    catch {
        return false;
    }
}
function getPlatformIcon(url, lookupIcon) {
    if (hasAllowedHost(url, "meet.google.com"))
        return lookupIcon("google-meet-logo@2x.png");
    if (hasAllowedHost(url, "zoom.us"))
        return lookupIcon("zoom-logo@2x.png");
    if (hasAllowedHost(url, "teams.microsoft.com"))
        return lookupIcon("ms-teams-logo@2x.png");
    return undefined;
}
function splitEvents(calendarState, now) {
    const all = calendarState.upcomingEvents
        .filter((e) => e.endTime > now)
        .sort((a, b) => a.startTime - b.startTime);
    return {
        live: all.filter((e) => e.startTime <= now),
        upcoming: all
            .filter((e) => e.startTime > now)
            .slice(0, MAX_UPCOMING_EVENTS),
    };
}
function openInviteModal(url) {
    (0, windowing_1.showMainWindow)();
    if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
        return;
    windowing_1.mainWindow.webContents.send("tray-open-invite-modal", url ?? undefined);
}
function inviteBotDirectly(url) {
    (0, windowing_1.showMainWindow)();
    if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
        return;
    windowing_1.mainWindow.webContents.send("tray-invite-bot", url);
}
function openMeetingPrep(eventId) {
    (0, windowing_1.showMainWindow)();
    if (!windowing_1.mainWindow || windowing_1.mainWindow.isDestroyed())
        return;
    windowing_1.mainWindow.webContents.send("notification-navigate", `/meeting-prep?eventId=${encodeURIComponent(eventId)}`);
}
function joinAndTakeNotes(url, title) {
    void electron_1.shell.openExternal(url);
    if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
        windowing_1.mainWindow.show();
        windowing_1.mainWindow.focus();
        windowing_1.mainWindow.webContents.send("start-recording", { source: "tray", title });
    }
    else {
        (0, windowing_1.createWindow)();
    }
}
function buildMeetingSubmenu(event, isLive, lookupIcon) {
    const submenu = [];
    const hasMeetingPrep = Boolean(event.hasMeetingPrep);
    if (isLive && hasMeetingPrep) {
        submenu.push({
            label: "View Meeting Prep",
            click: () => openMeetingPrep(event.id),
        });
    }
    if (event.url) {
        if (event.fredAdded) {
            submenu.push({
                label: "Join Meeting",
                icon: getPlatformIcon(event.url, lookupIcon),
                click: () => void electron_1.shell.openExternal(event.url),
            });
        }
        else {
            submenu.push({
                label: "Join and Take Notes",
                icon: getPlatformIcon(event.url, lookupIcon),
                click: () => joinAndTakeNotes(event.url, event.title),
            });
        }
    }
    if (!event.fredAdded) {
        submenu.push({
            label: "Invite Notetaker",
            icon: lookupIcon("fireflies-menu@2x.png"),
            click: () => event.url ? inviteBotDirectly(event.url) : openInviteModal(),
        });
    }
    if (!isLive && hasMeetingPrep) {
        submenu.push({
            label: "View Meeting Prep",
            click: () => openMeetingPrep(event.id),
        });
    }
    return submenu;
}
function buildMeetingItem(event, isLive, lookupIcon) {
    const timeStr = formatEventTime(event.startTime);
    const suffix = isLive ? "  ●" : "";
    return {
        label: `┃ ${timeStr} · ${truncate(event.title, 28)}${suffix}`,
        submenu: buildMeetingSubmenu(event, isLive, lookupIcon),
    };
}
function buildTrayTitle(calendarState, now = Date.now()) {
    const recording = (0, recording_context_store_1.getRecordingContextSnapshot)();
    if (recording?.state === "recording") {
        const title = recording.title?.trim();
        return title ? truncate(`● ${title}`, MAX_TITLE_LENGTH) : "● Taking notes";
    }
    if (recording?.state === "paused")
        return "";
    if (calendarState.liveMeetings.length > 0) {
        return truncate(`● ${calendarState.liveMeetings[0].title}`, MAX_TITLE_LENGTH);
    }
    if (!(0, tray_settings_store_1.getShowNextEvent)())
        return "";
    const { live, upcoming } = splitEvents(calendarState, now);
    const next = live[0] ?? upcoming[0];
    if (!next)
        return "";
    const diffMs = next.startTime - now;
    if (diffMs > TITLE_SHOW_THRESHOLD_MS)
        return "";
    if (live.length > 0)
        return truncate(next.title, MAX_TITLE_LENGTH);
    return `${truncate(next.title, MAX_MEETING_TITLE_LENGTH)} · ${formatCountdown(diffMs)}`;
}
/**
 * The update entry, or nothing at all.
 *
 * Empty for a managed install (Windows .msi, macOS .pkg): it is updated by
 * whatever deployed it, so the action would only ever report a refusal. The
 * renderer already hides its own update controls on this same flag.
 */
function buildUpdateMenuItems() {
    const { updateDownloaded, updateAvailable, updateInfo, selfUpdateSupported } = (0, download_and_update_1.getUpdateStatus)();
    if (!selfUpdateSupported)
        return [];
    if (updateDownloaded) {
        return [
            {
                label: `Update to v${updateInfo?.version} — Restart to install`,
                click: () => (0, download_and_update_1.installUpdate)(),
            },
            { type: "separator" },
        ];
    }
    if (updateAvailable) {
        return [
            { label: `Downloading v${updateInfo?.version}…`, enabled: false },
            { type: "separator" },
        ];
    }
    return [
        { label: "Check for Updates", click: () => (0, download_and_update_1.checkForUpdates)("manual") },
        { type: "separator" },
    ];
}
function buildTrayMenu(calendarState, lookupIcon, onRebuild, now = Date.now()) {
    const recording = (0, recording_context_store_1.getRecordingContextSnapshot)();
    const items = [];
    if (recording?.state === "recording") {
        const label = recording.title?.trim()
            ? truncate(recording.title.trim(), 40)
            : "Taking notes";
        items.push({ label, enabled: false });
        items.push({
            label: "Stop",
            click: () => {
                if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                    // No meeting id, deliberately: the recorder rejects a stop whose id
                    // does not match its own, so naming one here would make this button a
                    // silent no-op whenever the tray's snapshot lags the recorder.
                    windowing_1.mainWindow.webContents.send("recording:stop", {});
                }
            },
        });
        items.push({ type: "separator" });
    }
    else if (recording?.state === "paused") {
        items.push({ label: "Taking notes (paused)", enabled: false });
        items.push({ type: "separator" });
    }
    else if (calendarState.liveMeetings.length > 0) {
        items.push({ label: "Notetaker recording", enabled: false });
        if (!windowing_1.liveWindow || windowing_1.liveWindow.isDestroyed()) {
            const { meetingId } = calendarState.liveMeetings[0];
            items.push({
                label: "Open live assist",
                click: () => (0, windowing_1.createChildWindow)(`/live/${meetingId}`, true),
            });
        }
        items.push({ type: "separator" });
    }
    const { live, upcoming } = splitEvents(calendarState, now);
    if (live.length > 0) {
        items.push({ label: "Happening now", enabled: false });
        for (const event of live) {
            items.push(buildMeetingItem(event, true, lookupIcon));
        }
        items.push({ type: "separator" });
    }
    if (upcoming.length > 0) {
        let lastDayLabel = "";
        for (const event of upcoming) {
            const dayLabel = getDayLabel(event.startTime, now);
            if (dayLabel !== lastDayLabel) {
                items.push({ label: dayLabel, enabled: false });
                lastDayLabel = dayLabel;
            }
            items.push(buildMeetingItem(event, false, lookupIcon));
        }
        items.push({ type: "separator" });
    }
    items.push({
        label: "Take Notes",
        click: () => {
            if (windowing_1.mainWindow && !windowing_1.mainWindow.isDestroyed()) {
                windowing_1.mainWindow.show();
                windowing_1.mainWindow.focus();
                windowing_1.mainWindow.webContents.send("start-recording", { source: "tray" });
            }
            else {
                (0, windowing_1.createWindow)();
            }
        },
    });
    items.push({ label: "Invite Notetaker", click: () => openInviteModal() });
    items.push({ type: "separator" });
    items.push({ label: "Open Fireflies", click: () => (0, windowing_1.showMainWindow)() });
    if ((0, desktop_logged_in_1.isDesktopLoggedIn)()) {
        items.push({ label: "Settings", click: () => openDesktopSettings() });
    }
    items.push({ type: "separator" });
    const showNext = (0, tray_settings_store_1.getShowNextEvent)();
    items.push({
        label: showNext ? "Hide Next Event" : "Show Next Event",
        click: () => {
            (0, tray_settings_store_1.setShowNextEvent)(!showNext);
            onRebuild();
        },
    });
    items.push({ type: "separator" });
    items.push(...buildUpdateMenuItems());
    items.push({
        label: "Quit",
        click: () => {
            electron_1.app.isQuitting = true;
            electron_1.app.quit();
        },
    });
    return electron_1.Menu.buildFromTemplate(items);
}
//# sourceMappingURL=tray-menu.js.map