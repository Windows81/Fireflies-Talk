"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSiteUrl = normalizeSiteUrl;
const MAX_SITE_URL_CHARS = 2048;
function withoutQuery(url) {
    const hashAt = url.indexOf("#");
    const beforeHash = hashAt === -1 ? url : url.slice(0, hashAt);
    const hash = hashAt === -1 ? "" : url.slice(hashAt);
    const queryAt = beforeHash.indexOf("?");
    const path = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);
    return `${path}${hash}`;
}
function normalizeSiteUrl(value) {
    const trimmed = value?.trim();
    if (!trimmed)
        return undefined;
    const stripped = withoutQuery(trimmed);
    if (!stripped)
        return undefined;
    return stripped.slice(0, MAX_SITE_URL_CHARS);
}
//# sourceMappingURL=dictation-site-url.js.map