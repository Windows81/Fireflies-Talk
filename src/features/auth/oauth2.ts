import { Config } from "@/constants";
import { CanceledError } from "@/errors";
import { getLoginTrackingParams } from "@/tracking";
import { getActualPlatform, isDesktop } from "@/utils/device";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { openInEdgeBrowser } from "../settings/edgeBrowserUtils";
import { getLocalSettings } from "../settings/useLocalSettings";
import {
  type AuthProvider,
  buildOAuthAuthorizeUrl,
  NATIVE_LOGIN_REDIRECT_URI,
} from "./oauth2Url";
import type { AuthTokens } from "./types";

export type AuthLoginSuccess = {
  status: "success";
  tokens: AuthTokens;
  state: string | null;
};
export type AuthLoginResult = AuthLoginSuccess | { status: "pending" };

export const oauth2Login = async (
  type: AuthProvider,
  options: { state?: string | null } = {},
): Promise<AuthLoginResult> => {
  const platform = getActualPlatform();
  const redirectUri =
    platform === "web" ? Linking.createURL("login") : NATIVE_LOGIN_REDIRECT_URI;
  const url = buildOAuthAuthorizeUrl({
    type,
    platform,
    redirectUri,
    state: options.state,
    trackingParams: getLoginTrackingParams(),
    userServiceUrl: Config.USER_SERVICE_URL,
  });

  // Check if we should use Edge browser for outlook login
  const { useEdgeBrowserForOutlookLogin } = getLocalSettings();
  const shouldUseEdge = type === "outlook" && useEdgeBrowserForOutlookLogin;

  // If using Edge browser or on desktop, open in external browser and wait for deeplink
  if (isDesktop || shouldUseEdge) {
    // Open URL in external browser (or Edge if configured for outlook)
    if (shouldUseEdge) {
      await openInEdgeBrowser(url);
    } else {
      await Linking.openURL(url);
    }

    // Wait briefly so LoginScreen can receive the deep-link callback.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 2000);
    });
    return { status: "pending" };
  }

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
    showInRecents: true,
  });
  if (result.type === "cancel" || result.type === "dismiss") {
    throw new CanceledError();
  }
  if (result.type !== "success") {
    throw new Error("Login failed");
  }
  try {
    WebBrowser.dismissAuthSession();
  } catch {
    // do nothing
  }

  return parseLoginResponseFromUrl(result.url);
};

/**
 * Parse tokens from callback URL. OAuth state validation belongs in authApi,
 * because the store owns the pending app state.
 */
export function parseTokensFromUrl(urlStr: string): AuthTokens {
  return parseLoginResponseFromUrl(urlStr).tokens;
}

export function parseLoginResponseFromUrl(urlStr: string): AuthLoginSuccess {
  if (getActualPlatform() === "web") {
    const url = new URL(urlStr);
    const error = url.searchParams.get("error");
    if (error) {
      throw new Error(error);
    }
    const expiresAtParam = url.searchParams.get("expires_at");
    const refreshExpiresAtParam = url.searchParams.get("refresh_expires_at");
    return {
      status: "success",
      tokens: {
        accessToken: null,
        refreshToken: null,
        expiresAt: expiresAtParam ? Number(expiresAtParam) : null,
        refreshExpiresAt: refreshExpiresAtParam
          ? Number(refreshExpiresAtParam)
          : null,
      },
      state: url.searchParams.get("state"),
    };
  }

  const { queryParams } = Linking.parse(urlStr);
  if (!queryParams) {
    throw new Error("No query params");
  }
  if (queryParams.error) {
    throw new Error(queryParams.error as string);
  }
  const params = queryParams as AuthLoginResponseParams;
  return {
    status: "success",
    tokens: {
      accessToken: params.access_token || null,
      refreshToken: params.refresh_token || null,
      expiresAt: params.expires_at ? Number(params.expires_at) : null,
      refreshExpiresAt: params.refresh_expires_at
        ? Number(params.refresh_expires_at)
        : null,
    },
    state: params.state || null,
  };
}

export type AuthLoginResponseParams = {
  access_token: string | undefined;
  refresh_token: string | undefined;
  /** expiry of access token in seconds */
  expires_at: string | undefined;
  /** expiry of refresh token in seconds */
  refresh_expires_at: string | undefined;
  state: string | undefined;
};
