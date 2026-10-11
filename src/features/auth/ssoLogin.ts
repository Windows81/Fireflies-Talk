import { Config } from "@/constants";
import { CanceledError } from "@/errors";
import { getActualPlatform, isDesktop } from "@/utils/device";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { parseLoginResponseFromUrl, type AuthLoginResult } from "./oauth2";

const DESKTOP_OPEN_TIMEOUT_MS = 2000;

export const ssoLogin = async (
  ssoUrl: string,
  options: { state?: string | null } = {},
): Promise<AuthLoginResult> => {
  const url = new URL(`${Config.MOBILE_APP_URL}/api/auth/sso/start`);
  url.searchParams.set("platform", getActualPlatform());
  url.searchParams.set("ssoUrl", ssoUrl);
  if (options.state) {
    url.searchParams.set("state", options.state);
  }

  if (isDesktop) {
    // External browser handles the flow; LoginScreen handles the fireflies://
    // deep link on return. Timeout matches oauth2Login.
    await Linking.openURL(url.toString());
    await new Promise<void>((resolve) => {
      setTimeout(resolve, DESKTOP_OPEN_TIMEOUT_MS);
    });
    return { status: "pending" };
  }

  const result = await WebBrowser.openAuthSessionAsync(
    url.toString(),
    Linking.createURL("login"),
    { showInRecents: true },
  );
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
