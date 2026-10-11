/**
 * Email clients, by the display name `resolvePasteTarget` gives them. Mirrors
 * the email apps dictation-ff formats as email, plus the web and desktop
 * clients the paste-target module already names.
 */
export const EMAIL_APPS: ReadonlySet<string> = new Set([
  "Gmail",
  "Outlook",
  "Apple Mail",
  "Superhuman",
  "Proton Mail",
  "Fastmail",
  "Yahoo Mail",
  "Spark",
  "HEY",
  "Zoho Mail",
  "Missive",
  "Thunderbird",
  "Airmail",
  "Mimestream",
  "Canary Mail",
]);

export const isEmailApp = (pastedApp?: string): pastedApp is string =>
  !!pastedApp && EMAIL_APPS.has(pastedApp);
