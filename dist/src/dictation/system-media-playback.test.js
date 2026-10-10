"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const system_media_playback_parse_1 = require("./system-media-playback-parse");
(0, node_test_1.test)("parseMediaActionToken reads the first token", () => {
    strict_1.default.equal((0, system_media_playback_parse_1.parseMediaActionToken)("paused Chrome.App Spotify.exe\n", "pause"), true);
    strict_1.default.equal((0, system_media_playback_parse_1.parseMediaActionToken)("noop\n", "pause"), false);
    strict_1.default.equal((0, system_media_playback_parse_1.parseMediaActionToken)("resumed\n", "resume"), true);
    strict_1.default.equal((0, system_media_playback_parse_1.parseMediaActionToken)("noop\n", "resume"), false);
});
(0, node_test_1.test)("parseWindowsPausedSources keeps every paused session id", () => {
    strict_1.default.deepEqual((0, system_media_playback_parse_1.parseWindowsPausedSources)("paused Chrome.App Spotify.exe"), [
        "Chrome.App",
        "Spotify.exe",
    ]);
    strict_1.default.deepEqual((0, system_media_playback_parse_1.parseWindowsPausedSources)("noop"), []);
});
(0, node_test_1.test)("parseAdapterPlaying reads the adapter JSON playing flag", () => {
    strict_1.default.equal((0, system_media_playback_parse_1.parseAdapterPlaying)('{"playing":true,"title":"x"}'), true);
    strict_1.default.equal((0, system_media_playback_parse_1.parseAdapterPlaying)('{"playing":false}'), false);
    strict_1.default.equal((0, system_media_playback_parse_1.parseAdapterPlaying)("null"), false);
    strict_1.default.equal((0, system_media_playback_parse_1.parseAdapterPlaying)(""), false);
    strict_1.default.equal((0, system_media_playback_parse_1.parseAdapterPlaying)("not-json"), null);
});
//# sourceMappingURL=system-media-playback.test.js.map