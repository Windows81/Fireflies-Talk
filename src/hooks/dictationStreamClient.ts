import {
  createDictationStreamClient,
  DictationStreamError,
  type DictationStreamClient,
} from "@firefliesai/dictation-ff.react-dictation";
import { Config } from "@/constants";
import { authApi } from "@/features/auth";
import { getRequestMetadataHeaders } from "@/utils/request";

let client: DictationStreamClient | null = null;

/**
 * The stream endpoint lives next to the REST API, on the WebSocket scheme.
 * A browser WebSocket cannot send headers, so the client metadata the REST
 * calls send as headers rides in the query.
 */
export function dictationStreamUrl(dictationUrl: string): string {
  const base = dictationUrl.replace(/\/$/, "").replace(/^http/, "ws");
  const metadata = getRequestMetadataHeaders();
  const query = new URLSearchParams({
    source: "desktop",
    clientName: metadata["x-client-name"],
    clientVersion: metadata["x-client-version"],
  });
  return `${base}/api/dictation/stream?${query.toString()}`;
}

async function getDictationStreamToken(): Promise<string> {
  const accessToken = (await authApi.getOrRefreshTokens())?.accessToken;
  if (!accessToken) {
    throw new DictationStreamError("unauthenticated", "Not signed in");
  }
  return accessToken;
}

/**
 * One client for the window, so its socket stays open between back-to-back
 * dictations instead of reconnecting for each one.
 */
export function getDictationStreamClient(): DictationStreamClient {
  client ??= createDictationStreamClient({
    url: dictationStreamUrl(Config.DICTATION_URL),
    getToken: getDictationStreamToken,
  });
  return client;
}

/**
 * The server binds a socket to the first user who dictates on it, so the next
 * user starts from a new client.
 */
export function closeDictationStreamClient(): void {
  client?.close();
  client = null;
}
