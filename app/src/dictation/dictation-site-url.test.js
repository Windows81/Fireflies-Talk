"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_site_url_1 = require("./dictation-site-url");
(0, node_test_1.test)("normalizeSiteUrl trims, drops empties, and caps length", () => {
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)("  https://mail.google.com  "), "https://mail.google.com");
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)(""), undefined);
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)("   "), undefined);
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)(null), undefined);
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)("x".repeat(3000))?.length, 2048);
});
(0, node_test_1.test)("normalizeSiteUrl drops query params before they reach screen context", () => {
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)("https://docs.google.com/document/d/abc/edit?usp=sharing&token=secret#heading"), "https://docs.google.com/document/d/abc/edit#heading");
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)("  https://example.com/path?q=1  "), "https://example.com/path");
    strict_1.default.equal((0, dictation_site_url_1.normalizeSiteUrl)("?only=query"), undefined);
    const secret = "s".repeat(100);
    const longPath = (0, dictation_site_url_1.normalizeSiteUrl)(`https://example.com/${"p".repeat(3000)}?token=${secret}`);
    strict_1.default.equal(longPath?.includes("token"), false);
    strict_1.default.equal(longPath?.includes(secret), false);
    strict_1.default.equal(longPath?.length, 2048);
});
//# sourceMappingURL=dictation-site-url.test.js.map