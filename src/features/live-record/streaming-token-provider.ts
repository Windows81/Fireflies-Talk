// Desktop streams audio from the Electron main process, which has no refresh
// token and no auth store. Main asks this renderer for an access token before
// every connect and reconnect, so a long meeting never keeps dialing with the
// token it started with — refreshing (and updating global auth state) stays
// here, in the same single-flight path every GraphQL request uses.
import { isDesktop } from "@/utils/device";
import { Logger } from "@/logger";
import { authApi } from "../auth";

const logger = new Logger("StreamingTokenProvider");

export function initStreamingTokenProvider(): void {
  if (!isDesktop) return;

  window.electron?.streaming?.onTokenRequest?.(async () => {
    const tokens = await authApi.getOrRefreshTokens();
    if (!tokens?.accessToken) {
      logger.error("no access token available for streaming");
      return null;
    }
    return tokens.accessToken;
  });
}
