"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENTRY_DSN = exports.CHILD_WINDOW_ROUTES = exports.FLOATING_WINDOW_ROUTES = exports.DEEPLINK_PROTOCOL = exports.DEEPLINK_SCHEME = exports.WEB_ORIGIN = exports.CORS_PROXY_PORT = exports.APP_ORIGIN = exports.APP_SCHEME = exports.TRUSTED_URLS = exports.BLACKLIST_AUDIO_PROCESS_NAMES = void 0;
exports.BLACKLIST_AUDIO_PROCESS_NAMES = [
    "CoreSpeech",
    "corespeechd",
    "systemsoundserverd",
];
exports.TRUSTED_URLS = [
    "*://*.fireflies.dev/*",
    "*://*.fireflies.ai/*",
    "ws://*.fireflies.dev/*",
    "wss://*.fireflies.dev/*",
    "ws://*.fireflies.ai/*",
    "wss://*.fireflies.ai/*",
];
exports.APP_SCHEME = "desktop-ff";
exports.APP_ORIGIN = `${exports.APP_SCHEME}://-`;
exports.CORS_PROXY_PORT = 3033;
// Web origin to use for CORS where server expects same domain only
exports.WEB_ORIGIN = "https://desktop.fireflies.ai";
exports.DEEPLINK_SCHEME = "fireflies";
// For URL.protocol comparisons use the trailing colon variant:
exports.DEEPLINK_PROTOCOL = `${exports.DEEPLINK_SCHEME}://`;
// Routes that should open in floating windows
exports.FLOATING_WINDOW_ROUTES = ["live"];
// Routes that should open as another window child of main-window
exports.CHILD_WINDOW_ROUTES = ["live"];
// Public Sentry DSN for the Electron main/preload process. A DSN is a client-side
// ingestion key (ships in the app), not a secret — safe to hardcode.
exports.SENTRY_DSN = "https://401e1a062ddb793037a36eee5ed5e82e@o207331.ingest.us.sentry.io/4510982345785344";
//# sourceMappingURL=constants.js.map