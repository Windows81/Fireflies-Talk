"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_clipboard_html_1 = require("./dictation-clipboard-html");
(0, node_test_1.test)("markdownToClipboardHtml converts bold and paragraph breaks", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("Hello **world**");
    strict_1.default.equal(html, '<div dir="auto">Hello <strong>world</strong></div>');
});
(0, node_test_1.test)("markdownToClipboardHtml uses double breaks between paragraphs", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("Line one\n\nLine two");
    strict_1.default.equal(html, '<div dir="auto">Line one<br><br>Line two</div>');
});
(0, node_test_1.test)("markdownToClipboardHtml keeps soft line breaks within a paragraph", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("First line\nSecond line");
    strict_1.default.match(html, /First line<br>Second line/);
});
(0, node_test_1.test)("markdownToClipboardHtml keeps lists and links", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("- one\n- two\n\nSee [docs](https://example.com)");
    strict_1.default.match(html, /<ul>/);
    strict_1.default.match(html, /<li>one<\/li>/);
    strict_1.default.match(html, /<a href="https:\/\/example.com">docs<\/a>/);
    strict_1.default.match(html, /<\/ul><div dir="auto"><br><br>See /);
});
(0, node_test_1.test)("markdownToClipboardHtml does not break before a list", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("I went to market and I bought:\n- Pineapple\n- Chocolate");
    strict_1.default.match(html, /<div dir="auto">I went to market and I bought:<\/div><ul>/);
    strict_1.default.doesNotMatch(html, /<br>/);
});
(0, node_test_1.test)("markdownToClipboardHtml keeps a blank line before a list", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("I went to market and I bought:\n\n- Pineapple\n- Chocolate");
    strict_1.default.match(html, /<div dir="auto">I went to market and I bought:<br><br><\/div>\s*<ul>/);
});
(0, node_test_1.test)("markdownToClipboardHtml does not add trailing gaps in blockquotes", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("> quoted text");
    strict_1.default.equal(html, "<blockquote>quoted text</blockquote>");
});
(0, node_test_1.test)("markdownToClipboardHtml does not inject gap markers inside fenced code", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("```\nIntro\n\n- not a list\n```");
    strict_1.default.doesNotMatch(html, /CLIPBOARD_GAP/);
});
(0, node_test_1.test)("markdownToClipboardHtml uses dir=auto so RTL prose is not forced LTR", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)(" مرحبا ".trim());
    strict_1.default.equal(html, '<div dir="auto">مرحبا</div>');
});
(0, node_test_1.test)("markdownToClipboardHtml wraps prose after a list so Gmail does not indent it", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("- one\n\nText");
    strict_1.default.match(html, /<ul>/);
    strict_1.default.match(html, /<div dir="auto"><br><br>Text<\/div>/);
});
(0, node_test_1.test)("markdownToClipboardHtml keeps nested lists intact", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("- outer\n  - inner\n- next");
    strict_1.default.match(html, /<ul>/);
    strict_1.default.doesNotMatch(html, /<div dir="auto"><\/li>/);
    strict_1.default.match(html, /inner/);
});
(0, node_test_1.test)("markdownToClipboardHtml keeps a list inside a blockquote intact", () => {
    const html = (0, dictation_clipboard_html_1.markdownToClipboardHtml)("> - quoted\n> - items");
    strict_1.default.match(html, /<blockquote>/);
    strict_1.default.match(html, /<ul>/);
    strict_1.default.doesNotMatch(html, /<div dir="auto"><\/li>/);
});
//# sourceMappingURL=dictation-clipboard-html.test.js.map