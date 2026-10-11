const CONSENT_COOKIE_NAME = "ff_consent";
const COOKIE_MAX_AGE = 33696000; // 390 days

const getRootDomain = (): string | null => {
  const host = window.location.hostname;

  if (host === "localhost" || !host.includes(".")) return null;

  const parts = host.split(".");
  const base = parts.length <= 2 ? host : parts.slice(-2).join(".");

  return `.${base}`;
};

export const readConsentFromStorage = (): string | null => {
  try {
    const match = document.cookie.match(
      new RegExp("(?:^|; )" + CONSENT_COOKIE_NAME + "=([^;]*)"),
    );
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};

export const writeConsentToStorage = (value: string): void => {
  const domain = getRootDomain();
  const encoded = encodeURIComponent(value);
  const domainAttr = domain ? `; domain=${domain}` : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${encoded}; path=/${domainAttr}; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
};
