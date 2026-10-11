import { parseTokensFromUrl } from "./oauth2";
import type { AuthTokens } from "./types";

const FALLBACK_ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60;

// Only the expiry is needed, so decoding the payload by hand avoids a JWT library.
export function getJwtExpiration(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload: unknown = JSON.parse(atob(padded));
    if (typeof payload !== "object" || payload === null) return null;
    const exp = (payload as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/**
 * Wraps a bare access token in `AuthTokens`. `expiresAt` is in seconds, like
 * the OAuth callback params, so `isTokenExpired` can evaluate it.
 */
export function accessTokenToAuthTokens(
  accessToken: string,
  nowMs = Date.now(),
): AuthTokens {
  return {
    accessToken,
    refreshToken: null,
    expiresAt:
      getJwtExpiration(accessToken) ??
      Math.floor(nowMs / 1000) + FALLBACK_ACCESS_TOKEN_LIFETIME_SECONDS,
    refreshExpiresAt: null,
  };
}

function isUrl(candidate: string) {
  try {
    new URL(candidate);
    return true;
  } catch {
    return false;
  }
}

/** Accepts either a full auth callback URL or a bare access token. */
export function resolveManualLoginTokens(input: string): AuthTokens {
  const candidate = input.trim();
  return isUrl(candidate)
    ? parseTokensFromUrl(candidate)
    : accessTokenToAuthTokens(candidate);
}
