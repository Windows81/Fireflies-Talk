/**
 * Links inside a run's result.
 *
 * Fred answers in markdown, so "I posted it in the [FF Talk thread](https://…)"
 * arrives with the destination buried in syntax. The words are what the user
 * should read; the destination is something they should be able to press.
 *
 * Everything here is pure so the parsing stays testable, and because the text
 * is model output — it is treated as data to be scanned, never as instructions.
 */

export type ActionLink = {
  /** The destination, already checked for a safe scheme. */
  url: string;
  /** What the button says. */
  label: string;
};

const MARKDOWN_LINK = /\[([^\]]+)\]\((\S+?)\)/g;
const BARE_URL = /https?:\/\/[^\s<>()[\]]+/g;
/** `[^1]: [PM Team Chat](…)` on its own line — the definition of a citation. */
const FOOTNOTE_DEFINITION = /^[ \t]*\[\^[^\]]+\]:.*$/gm;
/** `sync[^1]` — the marker pointing at one. */
const FOOTNOTE_MARKER = /\[\^[^\]]+\]/g;

/** Model output decides these, so anything but the web and mail is refused. */
const SAFE_SCHEMES = ["http:", "https:", "mailto:"];

export function isSafeActionLink(url: string): boolean {
  try {
    return SAFE_SCHEMES.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/** Trailing punctuation belongs to the sentence, not the address. */
function trimUrl(url: string): string {
  return url.replace(/[.,;:!?]+$/, "");
}

function host(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostIs(site: string, domain: string): boolean {
  return site === domain || site.endsWith(`.${domain}`);
}

/**
 * Names the destination rather than repeating the sentence around it — a button
 * reading "FF Talk thread" says less about what pressing it does than "Thread".
 */
export function actionLinkLabel(url: string, linkText?: string): string {
  const site = host(url);
  if (url.startsWith("mailto:")) return "Email";

  if (hostIs(site, "slack.com")) {
    return /thread_ts|\/archives\//.test(url) ? "Thread" : "Slack";
  }
  if (site === "mail.google.com") {
    return /compose|drafts?/i.test(url) ? "Open draft" : "Gmail";
  }
  if (hostIs(site, "fireflies.ai")) return "Fireflies";
  if (hostIs(site, "notion.so")) return "Notion";
  if (hostIs(site, "docs.google.com")) return "Doc";
  if (hostIs(site, "calendar.google.com")) return "Calendar";
  if (hostIs(site, "github.com")) return "GitHub";
  const trimmed = linkText?.trim();
  if (trimmed)
    return trimmed.length > 22 ? `${trimmed.slice(0, 21)}…` : trimmed;
  return site.replace(/^www\./, "") || "Open link";
}

/**
 * Every safe destination in the text, in the order it appears and without
 * repeats — Fred often names the same thread twice in one sentence.
 */
/**
 * Citations are dropped from the prose entirely, so they are dropped here too.
 * The two have to agree: a link named in the text with no button under it is
 * a dead end, and a button for something the text never mentioned is a
 * surprise.
 */
export function extractActionLinks(text: string): ActionLink[] {
  const links: ActionLink[] = [];
  const seen = new Set<string>();
  const body = text.replace(FOOTNOTE_DEFINITION, "");

  const add = (rawUrl: string, linkText?: string) => {
    const url = trimUrl(rawUrl);
    if (!isSafeActionLink(url) || seen.has(url)) return;
    seen.add(url);
    links.push({ url, label: actionLinkLabel(url, linkText) });
  };

  for (const match of body.matchAll(MARKDOWN_LINK)) add(match[2], match[1]);
  // Bare urls too, minus the ones already taken from markdown above.
  for (const match of body.matchAll(BARE_URL)) add(match[0]);

  return links;
}

/** Labels a destination found outside the prose, e.g. in a tool's result. */
export function toActionLink(url: string): ActionLink | null {
  const trimmed = trimUrl(url);
  if (!isSafeActionLink(trimmed)) return null;
  return { url: trimmed, label: actionLinkLabel(trimmed) };
}

/**
 * Footnotes are references to sources, not destinations, and they get no
 * button — so the prose must not point at one either. Both the definition and
 * the little marker in the sentence come out.
 */
function dropFootnotes(text: string): string {
  return text
    .replace(FOOTNOTE_DEFINITION, "")
    .replace(FOOTNOTE_MARKER, "")
    .replace(/\n{3,}/g, "\n\n");
}

function stripEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/**
 * The text as it should be taken away.
 *
 * Unlike the on-screen version this keeps the addresses, spelled out in plain
 * text — the buttons are not coming with it into a document, so dropping the
 * link would lose something the draft needs.
 */
export function flattenActionMarkdown(text: string): string {
  return stripEmphasis(dropFootnotes(text).replace(MARKDOWN_LINK, "$1 ($2)"));
}

/**
 * The text as it should be read: link syntax collapsed to its words, emphasis
 * markers dropped. The destinations are buttons now, so the addresses would
 * only be noise in the prose.
 */
export function stripActionMarkdown(text: string): string {
  return dropFootnotes(text)
    .replace(MARKDOWN_LINK, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}
