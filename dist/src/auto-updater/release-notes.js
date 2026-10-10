"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUpdateInfo = toUpdateInfo;
function toUpdateInfo(info) {
    return {
        version: info.version,
        releaseName: typeof info.releaseName === "string" ? info.releaseName : null,
        releaseNotes: normalizeReleaseNotes(info.releaseNotes),
    };
}
function normalizeReleaseNotes(releaseNotes) {
    if (typeof releaseNotes === "string") {
        return releaseNotes.trim() || null;
    }
    if (!Array.isArray(releaseNotes)) {
        return null;
    }
    const notes = releaseNotes
        .map(formatReleaseNote)
        .filter(Boolean)
        .join("\n\n");
    return notes || null;
}
function formatReleaseNote(releaseNote) {
    if (typeof releaseNote === "string") {
        return releaseNote.trim();
    }
    if (!releaseNote || typeof releaseNote !== "object") {
        return "";
    }
    const { note, version } = releaseNote;
    if (typeof note !== "string") {
        return "";
    }
    const releaseNoteText = note.trim();
    if (!releaseNoteText)
        return "";
    return typeof version === "string"
        ? `## ${version}\n\n${releaseNoteText}`
        : releaseNoteText;
}
//# sourceMappingURL=release-notes.js.map