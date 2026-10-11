/**
 * Web apps people dictate into, keyed by the host that serves them. Pasting
 * into Gmail leaves the frontmost app as "Chrome", so without this the history
 * row would show a browser logo for every web destination. Keys are bare hosts
 * without `www.`; a host matches when it is equal to the key or a subdomain of
 * it, and the longest key wins so `mail.google.com` beats `google.com`.
 */
const SITE_TARGETS: Record<string, string> = {
  // Email
  "mail.google.com": "Gmail",
  "inbox.google.com": "Gmail",
  "outlook.office.com": "Outlook",
  "outlook.office365.com": "Outlook",
  "outlook.live.com": "Outlook",
  "outlook.com": "Outlook",
  "mail.proton.me": "Proton Mail",
  "protonmail.com": "Proton Mail",
  "mail.yahoo.com": "Yahoo Mail",
  "superhuman.com": "Superhuman",
  "fastmail.com": "Fastmail",
  "hey.com": "HEY",
  "mail.zoho.com": "Zoho Mail",
  "missiveapp.com": "Missive",
  "sparkmailapp.com": "Spark",

  // LLMs
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "aistudio.google.com": "Gemini",
  "perplexity.ai": "Perplexity",
  "copilot.microsoft.com": "Copilot",
  "copilot.cloud.microsoft": "Copilot",
  "copilot.com": "Copilot",
  "m365.cloud.microsoft": "Copilot",
  "grok.com": "Grok",
  "x.ai": "Grok",
  "chat.deepseek.com": "DeepSeek",
  "deepseek.com": "DeepSeek",
  "chat.mistral.ai": "Mistral",
  "mistral.ai": "Mistral",
  "meta.ai": "Meta AI",
  "devin.ai": "Devin",

  // Social
  "linkedin.com": "LinkedIn",
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "reddit.com": "Reddit",
  "tiktok.com": "TikTok",
  "youtube.com": "YouTube",
  "threads.com": "Threads",
  "threads.net": "Threads",
  "bsky.app": "Bluesky",
  "pinterest.com": "Pinterest",
  "mastodon.social": "Mastodon",
  "x.com": "X",
  "twitter.com": "X",

  // Communication
  "web.whatsapp.com": "WhatsApp",
  "web.telegram.org": "Telegram",
  "t.me": "Telegram",
  "discord.com": "Discord",
  "slack.com": "Slack",
  "teams.microsoft.com": "Teams",
  "teams.live.com": "Teams",
  "messenger.com": "Messenger",
  "chat.google.com": "Google Chat",
  "web.skype.com": "Skype",
  "web.wechat.com": "WeChat",

  // Meetings
  "meet.google.com": "Google Meet",
  "zoom.us": "Zoom",
  "webex.com": "Webex",
  "whereby.com": "Whereby",
  "gotomeeting.com": "GoToMeeting",
  "bluejeans.com": "BlueJeans",
  "riverside.fm": "Riverside",
  "loom.com": "Loom",
  "around.co": "Around",

  // Work
  "notion.so": "Notion",
  "notion.com": "Notion",
  "docs.google.com": "Google Docs",
  "drive.google.com": "Google Drive",
  "calendar.google.com": "Google Calendar",
  "github.com": "GitHub",
  "linear.app": "Linear",
  "atlassian.net": "Jira",
  "figma.com": "Figma",
  "app.asana.com": "Asana",
  "trello.com": "Trello",
  "clickup.com": "ClickUp",
  "monday.com": "Monday",
  "circle.so": "Circle",
  "fireflies.ai": "Fireflies",
  "dropbox.com": "Dropbox",
  "salesforce.com": "Salesforce",
  "hubspot.com": "HubSpot",
  "zendesk.com": "Zendesk",
};

/**
 * Products that share a host with something else and are told apart by their
 * path. The key is `<host>/<path prefix>`; the host half matches the same way
 * as SITE_TARGETS (equal, or a subdomain), so `atlassian.net/wiki` covers
 * `acme.atlassian.net/wiki/...`. Longest key wins.
 */
const SITE_PATH_TARGETS: Record<string, string> = {
  "github.com/copilot": "Copilot",
  "atlassian.net/wiki": "Confluence",
  "docs.google.com/spreadsheets": "Google Sheets",
  "docs.google.com/presentation": "Google Slides",
  "docs.google.com/forms": "Google Forms",
};

const hasScheme = (value: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(value);

const stripWww = (host: string) =>
  host.startsWith("www.") ? host.slice(4) : host;

const hostMatches = (host: string, key: string) =>
  host === key || host.endsWith(`.${key}`);

/** The value of the longest key that matches, so specific rules beat broad ones. */
const longestMatch = (
  table: Record<string, string>,
  matches: (key: string) => boolean,
): string | undefined => {
  let best: string | undefined;
  let bestLength = 0;
  for (const [key, value] of Object.entries(table)) {
    if (key.length > bestLength && matches(key)) {
      best = value;
      bestLength = key.length;
    }
  }
  return best;
};

/**
 * Names the web app behind a browser's address-bar URL. Returns undefined for
 * hosts we have no icon or better name for, so the caller keeps the browser's
 * own name rather than showing a bare domain in the history list.
 */
export const siteTargetName = (siteUrl?: string): string | undefined => {
  if (!siteUrl) return undefined;

  let url: URL;
  try {
    // Both readers accept a bare `host.tld/path` — Safari and Chrome hide the
    // scheme in the address bar — and `new URL` rejects those outright.
    url = new URL(hasScheme(siteUrl) ? siteUrl : `https://${siteUrl}`);
  } catch {
    return undefined;
  }

  const host = stripWww(url.hostname.toLowerCase());
  if (!host) return undefined;

  const path = url.pathname.toLowerCase();
  const pathMatch = longestMatch(SITE_PATH_TARGETS, (key) => {
    const slash = key.indexOf("/");
    const keyHost = key.slice(0, slash);
    const keyPath = key.slice(slash);
    if (!hostMatches(host, keyHost)) return false;
    return path === keyPath || path.startsWith(`${keyPath}/`);
  });
  if (pathMatch) return pathMatch;

  // Longest host key wins, so mail.google.com is not swallowed by google.com.
  return longestMatch(SITE_TARGETS, (key) => hostMatches(host, key));
};
