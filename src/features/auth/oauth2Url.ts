export type AuthProvider = "google" | "outlook";

export const NATIVE_LOGIN_REDIRECT_URI = "fireflies://login";

type LoginTrackingParams = {
  timezone?: string | null;
  referral?: string | null;
};

type BuildOAuthAuthorizeUrlParams = {
  type: AuthProvider;
  platform: string;
  redirectUri: string;
  state?: string | null;
  trackingParams: LoginTrackingParams;
  userServiceUrl: string;
};

const userServiceProvider: Record<AuthProvider, "google" | "office365"> = {
  google: "google",
  outlook: "office365",
};

const userServicePlatformByClientPlatform: Record<
  string,
  "mobile" | "mobile-web" | "desktop-ff"
> = {
  ios: "mobile",
  android: "mobile",
  web: "mobile-web",
  darwin: "desktop-ff",
  win32: "desktop-ff",
  linux: "desktop-ff",
};

export function buildOAuthAuthorizeUrl({
  type,
  platform,
  redirectUri,
  state,
  trackingParams,
  userServiceUrl,
}: BuildOAuthAuthorizeUrlParams) {
  const userServicePlatform = userServicePlatformByClientPlatform[platform];
  const baseUrl = `${userServiceUrl}/auth/${userServicePlatform}/authorize`;
  const urlParams = new URLSearchParams();

  const provider = userServiceProvider[type];
  urlParams.set("type", provider);
  if (provider === "google") {
    urlParams.set("hd", "false");
  } else {
    urlParams.set("prompt", "select_account");
  }
  urlParams.set("redirect_uri", redirectUri);

  if (state) {
    urlParams.set("state", state);
  }
  Object.entries(trackingParams).forEach(([key, value]) => {
    if (value) {
      urlParams.set(key, value);
    }
  });

  return `${baseUrl}?${urlParams.toString()}`;
}
