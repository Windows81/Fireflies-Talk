"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownToClipboardHtml = markdownToClipboardHtml;
exports.prewarmClipboardHtml = prewarmClipboardHtml;
const marked_1 = require("marked");
const GAP_MARKER = "<!--CLIPBOARD_GAP-->";
const FENCED_CODE = /(```[\s\S]*?```)/g;
const marked = new marked_1.Marked({ gfm: true, breaks: true });
function injectBlockGapMarkersInProse(markdown) {
    return markdown.replace(/\n\n+(?=(?:[-*+] |\d+\. |#{1,6} |>))/g, `\n${GAP_MARKER}\n`);
}
/** Blank markdown lines before a block need spacing; a single line break does not. */
function injectBlockGapMarkers(markdown) {
    return markdown
        .split(FENCED_CODE)
        .map((part, index) => index % 2 === 1 ? part : injectBlockGapMarkersInProse(part))
        .join("");
}
/**
 * `<p>` blocks paste fine but many apps flatten them to a single newline when
 * copying back out. Double `<br>` tracks markdown paragraph breaks more
 * faithfully while keeping lists, links, and emphasis intact.
 */
function paragraphsToBreaks(html) {
    return html
        .replace(/<!--CLIPBOARD_GAP-->\s*/g, "<br><br>")
        .replace(/<\/p>\s*<p>/g, "<br><br>")
        .replace(/<\/(ul|ol|blockquote|h[1-6])>\s*<p>/g, "</$1><br><br>")
        .replace(/<\/p>\s*(?=<(?:ul|ol|blockquote|h[1-6])\b)/g, "")
        .replace(/<blockquote>\s*<p>/g, "<blockquote>")
        .replace(/<\/p>\s*<\/blockquote>/g, "</blockquote>")
        .replace(/<li>\s*<p>/g, "<li>")
        .replace(/<\/p>\s*<\/li>/g, "</li>")
        .replace(/^<p>/, "")
        .replace(/<\/p>\s*$/, "")
        .replace(/<p>/g, "")
        .replace(/<\/p>\s*<br><br>/g, "<br><br>")
        .replace(/<\/p>/g, "<br><br>");
}
/**
 * Gmail treats bare text nodes beside block elements as list content and can
 * prepend indentation spaces. Wrap prose runs in a block container first.
 */
const CLIPBOARD_BLOCK_TAG = "ul|ol|blockquote|h[1-6]|div|table";
function nextClipboardBlock(html, from) {
    const re = new RegExp("<(" + CLIPBOARD_BLOCK_TAG + ")\\b", "ig");
    re.lastIndex = from;
    const match = re.exec(html);
    if (!match || match.index < from)
        return null;
    return { index: match.index, tag: match[1] };
}
function clipboardBlockEnd(html, start, tag) {
    const openRe = new RegExp("<" + tag + "\\b", "ig");
    const closeRe = new RegExp("</" + tag + ">", "ig");
    let depth = 0;
    let i = start;
    while (i < html.length) {
        openRe.lastIndex = i;
        closeRe.lastIndex = i;
        const open = openRe.exec(html);
        const close = closeRe.exec(html);
        if (!close)
            return html.length;
        if (open && open.index < close.index) {
            depth += 1;
            i = open.index + open[0].length;
            continue;
        }
        depth -= 1;
        i = close.index + close[0].length;
        if (depth === 0)
            return i;
    }
    return html.length;
}
function wrapClipboardHtmlBody(html) {
    const trimmed = html.trim();
    if (!trimmed)
        return trimmed;
    const out = [];
    let i = 0;
    while (i < trimmed.length) {
        const open = nextClipboardBlock(trimmed, i);
        if (open && open.index === i) {
            const end = clipboardBlockEnd(trimmed, i, open.tag);
            out.push(trimmed.slice(i, end));
            i = end;
            continue;
        }
        const proseEnd = open ? open.index : trimmed.length;
        const prose = trimmed.slice(i, proseEnd).trim();
        if (prose)
            out.push('<div dir="auto">' + prose + "</div>");
        i = proseEnd;
    }
    return out.join("");
}
/** Convert dictation Markdown to HTML for the text/html clipboard format. */
function markdownToClipboardHtml(markdown) {
    const html = marked.parse(injectBlockGapMarkers(markdown), { async: false });
    return wrapClipboardHtmlBody(paragraphsToBreaks(html));
}
/** The first conversion is slow; running one early keeps it off the first paste. */
function prewarmClipboardHtml() {
    markdownToClipboardHtml("Warm **up**\n\n- one\n- two");
}
//# sourceMappingURL=dictation-clipboard-html.js.map