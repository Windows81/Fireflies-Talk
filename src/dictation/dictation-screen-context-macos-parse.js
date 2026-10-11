"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMacosScreenContext = parseMacosScreenContext;
const dictation_site_url_1 = require("./dictation-site-url");
function parseMacosScreenContext(stdout) {
    let parsed;
    try {
        parsed = JSON.parse(stdout);
    }
    catch {
        return null;
    }
    const appName = typeof parsed.appName === "string" ? parsed.appName.trim() : "";
    if (!appName)
        return null;
    const visibleText = typeof parsed.visibleText === "string" ? parsed.visibleText.trim() : "";
    return {
        appName,
        windowTitle: typeof parsed.windowTitle === "string" ? parsed.windowTitle : "",
        visibleText: visibleText || undefined,
        siteUrl: (0, dictation_site_url_1.normalizeSiteUrl)(typeof parsed.siteUrl === "string" ? parsed.siteUrl : undefined),
    };
}
//# sourceMappingURL=dictation-screen-context-macos-parse.js.map