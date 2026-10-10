"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWindowsPausedSources = exports.parseAdapterPlaying = exports.parseMediaActionToken = void 0;
const parseMediaActionToken = (stdout, action) => {
    const token = stdout.trim().split(/\s+/).at(0) ?? "";
    return action === "pause" ? token === "paused" : token === "resumed";
};
exports.parseMediaActionToken = parseMediaActionToken;
const parseAdapterPlaying = (stdout) => {
    const output = stdout.trim();
    if (!output || output === "null") {
        return false;
    }
    try {
        return Boolean(JSON.parse(output).playing);
    }
    catch {
        return null;
    }
};
exports.parseAdapterPlaying = parseAdapterPlaying;
const parseWindowsPausedSources = (stdout) => {
    const parts = stdout.trim().split(/\s+/);
    if (parts[0] !== "paused") {
        return [];
    }
    return parts.slice(1).filter(Boolean);
};
exports.parseWindowsPausedSources = parseWindowsPausedSources;
//# sourceMappingURL=system-media-playback-parse.js.map