import { siteTargetName } from "./dictationPasteTargetSites";

/**
 * App names the OS reports in a form people don't use. Keys are lowercased
 * names as they arrive from the screen-context reader.
 */
const APP_NAME_ALIASES: Record<string, string> = {
  code: "VS Code",
  "visual studio code": "VS Code",
  chrome: "Chrome",
  "google chrome": "Chrome",
  "google chrome canary": "Chrome",
  msedge: "Edge",
  "microsoft edge": "Edge",
  outlook: "Outlook",
  "microsoft outlook": "Outlook",
  // The new Outlook for Windows runs as olk.exe.
  olk: "Outlook",
  // Windows reports the Slack desktop app as slack.exe.
  slack: "Slack",
  teams: "Teams",
  "microsoft teams": "Teams",
  winword: "Word",
  "microsoft word": "Word",
  excel: "Excel",
  "microsoft excel": "Excel",
  powerpnt: "PowerPoint",
  "microsoft powerpoint": "PowerPoint",
  chatgpt: "ChatGPT",
  "claude for desktop": "Claude",
  iterm2: "iTerm",
  "zoom.us": "Zoom",
  whatsapp: "WhatsApp",
  "google docs": "Google Docs",
  "google drive": "Google Drive",
  "google chrome beta": "Chrome",
  "google chrome dev": "Chrome",
  chromium: "Chromium",
  "microsoft edge beta": "Edge",
  "microsoft edge dev": "Edge",
  "brave browser": "Brave",
  "brave-browser": "Brave",
  "firefox developer edition": "Firefox",
  "mozilla firefox": "Firefox",
  arc: "Arc",
  dia: "Dia",
  // The Windows reader reports a process name, so each browser in its
  // allowlist needs an entry here or it never reaches BROWSER_TARGETS.
  atlas: "ChatGPT Atlas",
  brave: "Brave",
  comet: "Comet",
  duckduckgo: "DuckDuckGo",
  ecosia: "Ecosia",
  firefox: "Firefox",
  floorp: "Floorp",
  helium: "Helium",
  librewolf: "LibreWolf",
  mullvadbrowser: "Mullvad Browser",
  opera: "Opera",
  operagx: "Opera",
  orion: "Orion",
  safari: "Safari",
  sidekick: "Sidekick",
  sigmaos: "SigmaOS",
  thorium: "Thorium",
  tor: "Tor Browser",
  vivaldi: "Vivaldi",
  waterfox: "Waterfox",
  wavebox: "Wavebox",
  zen: "Zen",
  "zen browser": "Zen",
  // Pre-release channels the macOS reader already recognises as browsers.
  "safari technology preview": "Safari",
  "firefox nightly": "Firefox",
  "firefox esr": "Firefox",
  "microsoft edge canary": "Edge",
  "brave browser beta": "Brave",
  "brave browser nightly": "Brave",
  "opera beta": "Opera",
  "opera developer": "Opera",
  "opera gx": "Opera",
  "vivaldi snapshot": "Vivaldi",
  "google meet": "Google Meet",
  "meet.google.com": "Google Meet",
  "cisco webex meetings": "Webex",
  webex: "Webex",
  "claude code": "Claude Code",
  claude: "Claude",
  "chatgpt atlas": "ChatGPT Atlas",
  "le chat": "Mistral",
  "meta ai": "Meta AI",
  devin: "Devin",
  "visual studio code - insiders": "VS Code",
  cursor: "Cursor",
  "apple mail": "Apple Mail",
  mail: "Apple Mail",
  messages: "iMessage",
  imessage: "iMessage",
  "proton mail": "Proton Mail",
  protonmail: "Proton Mail",
  "yahoo mail": "Yahoo Mail",
  "zoho mail": "Zoho Mail",
  "spark desktop": "Spark",
  spark: "Spark",
  hey: "HEY",
  thunderbird: "Thunderbird",
  "mozilla thunderbird": "Thunderbird",
  "airmail 5": "Airmail",
  notes: "Apple Notes",
  "apple notes": "Apple Notes",
  "github desktop": "GitHub",
  github: "GitHub",
  x: "X",
  twitter: "X",
  "ms teams": "Teams",
  "microsoft teams classic": "Teams",
  "microsoft teams (work or school)": "Teams",
  telegram: "Telegram",
  "telegram desktop": "Telegram",
  signal: "Signal",
  "facebook messenger": "Messenger",
  messenger: "Messenger",
  "google chat": "Google Chat",
  wechat: "WeChat",
  weixin: "WeChat",
  line: "Line",
  viber: "Viber",
  skype: "Skype",
  terminal: "Terminal",
  "iterm 2": "iTerm",
  figma: "Figma",
  obsidian: "Obsidian",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  reddit: "Reddit",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  bluesky: "Bluesky",
  pinterest: "Pinterest",
  mastodon: "Mastodon",
  circle: "Circle",
  muse: "Muse",
  fireflies: "Fireflies",
  "fireflies.ai": "Fireflies",
};

/**
 * Display names that are browsers. A browser is a container, not a
 * destination, so when the address bar tells us which web app is open we name
 * that instead — otherwise every Gmail dictation reads as "Chrome".
 */
const BROWSER_TARGETS: ReadonlySet<string> = new Set([
  "Chrome",
  "Chromium",
  "Safari",
  "Firefox",
  "Edge",
  "Brave",
  "Arc",
  "Dia",
  "Opera",
  "Vivaldi",
  "Comet",
  "ChatGPT Atlas",
  "Zen",
  "Orion",
  "DuckDuckGo",
  "SigmaOS",
  "Sidekick",
  "Ecosia",
  "Wavebox",
  "Floorp",
  "LibreWolf",
  "Waterfox",
  "Thorium",
  "Tor Browser",
  "Helium",
  "Mullvad Browser",
]);

export const isBrowserTarget = (target?: string): boolean =>
  !!target && BROWSER_TARGETS.has(target);

/**
 * Tidies the frontmost app's name for the history list: drops the `.app`
 * wrapper macOS reports, collapses whitespace, and swaps the handful of names
 * that read badly ("Code" for VS Code, "Google Chrome" for Chrome).
 */
export const formatPasteTarget = (appName?: string): string | undefined => {
  if (!appName) return undefined;

  const cleaned = appName
    .trim()
    .replace(/\.app$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;

  const key = cleaned.toLowerCase();
  // A bare index would return inherited Object.prototype members for names
  // like "constructor", handing back a function instead of a string.
  return Object.prototype.hasOwnProperty.call(APP_NAME_ALIASES, key)
    ? APP_NAME_ALIASES[key]
    : cleaned;
};

/**
 * The name the history row should show for a dictation. Prefers the web app
 * behind a browser's address bar, and falls back to the frontmost app's own
 * name — including for browsers on a site we have no better name for.
 */
export const resolvePasteTarget = (context?: {
  appName?: string;
  siteUrl?: string;
}): string | undefined => {
  const app = formatPasteTarget(context?.appName);
  if (!isBrowserTarget(app)) return app;
  return siteTargetName(context?.siteUrl) ?? app;
};
