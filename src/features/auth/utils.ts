import type { AuthLoginResponseParams } from "./oauth2";
import type { AuthTokens } from "./types";

const EXPIRATION_GRACE_PERIOD = 60 * 1000; // 1 minute

export function isTokenExpired(tokens: AuthTokens) {
  const expiresAt = tokens.expiresAt;
  // this also causes the previous version of storage,
  // which does not have expires info to refresh
  if (!expiresAt) {
    return true;
  }
  if (expiresAt * 1000 - Date.now() < EXPIRATION_GRACE_PERIOD) {
    return true;
  }
  return false;
}

export function toAuthTokens(
  queryParams: Record<string, string | string[] | undefined>,
) {
  if (!queryParams) throw new Error("No query params");
  if (queryParams.error) throw new Error(String(queryParams.error));
  const p = queryParams as AuthLoginResponseParams;
  return {
    accessToken: p.access_token || null,
    refreshToken: p.refresh_token || null,
    expiresAt: p.expires_at ? Number(p.expires_at) : null,
    refreshExpiresAt: p.refresh_expires_at
      ? Number(p.refresh_expires_at)
      : null,
  };
}
