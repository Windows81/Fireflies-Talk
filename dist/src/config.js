"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envFlags = exports.envConfig = void 0;
const constants_1 = require("./constants");
// Runtime config for the Electron main process. The Sentry DSN is hardcoded (public,
// client-side ingestion key); the renderer's EXPO_PUBLIC_* values are baked into the web
// bundle at build time (from eas.json), so there's no runtime .env to load here.
const { NODE_ENV = "production" } = process.env;
exports.envConfig = {
    nodeEnv: NODE_ENV,
    sentryDsn: constants_1.SENTRY_DSN,
    micMonitorDebug: false,
};
exports.envFlags = {
    isDevelopment: NODE_ENV === "development",
    isProduction: NODE_ENV === "production",
    isStaging: NODE_ENV === "staging",
};
//# sourceMappingURL=config.js.map