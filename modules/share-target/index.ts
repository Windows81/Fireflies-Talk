import * as ExpoLinking from "expo-linking";

// Import the native module. On web, it will be resolved to ShareTarget.web.ts
// and on native platforms to ShareTarget.ts
import type { LinkingOptions, ParamListBase } from "@react-navigation/native";
import { Linking, Platform } from "react-native";
import ShareTargetModule from "./src/ShareTargetModule";
import type { ShareData, ShareFile } from "./src/types";

const iosShareHostname = "share-target";

function parseIosShareData(url: string): ShareData | null {
  const { hostname, queryParams } = ExpoLinking.parse(url);
  if (hostname === iosShareHostname) {
    return {
      text: queryParams?.text as string | undefined,
      url: queryParams?.url as string | undefined,
      files: queryParams?.files
        ? JSON.parse(queryParams.files as string)
        : undefined,
    };
  }
  return null;
}

export async function getInitialShare(): Promise<ShareData | null> {
  if (Platform.OS === "ios") {
    const initialUrl = await Linking.getInitialURL();
    if (!initialUrl) return null;
    return parseIosShareData(initialUrl);
  }
  return ShareTargetModule.getInitialShare();
}

export function addShareListener(listener: (event: ShareData) => void) {
  if (Platform.OS === "ios") {
    return Linking.addEventListener("url", async ({ url }) => {
      const { hostname } = ExpoLinking.parse(url);
      if (hostname === iosShareHostname) {
        const payload = parseIosShareData(url);
        if (payload) listener(payload);
      }
    });
  }
  return ShareTargetModule.addListener("onDataReceived", listener);
}

export const cleanup = ShareTargetModule.cleanup.bind(ShareTargetModule);

// make sure react-navigation does not handle share url
export function withLinkingOptions<T extends ParamListBase>(
  linking: LinkingOptions<T>,
): LinkingOptions<T> {
  if (Platform.OS !== "ios") return linking;
  const getInitialURL = linking.getInitialURL || Linking.getInitialURL;
  const subscribe =
    linking.subscribe ||
    ((listener) => {
      const subscription = Linking.addEventListener("url", ({ url }) => {
        listener(url);
      });
      return () => subscription.remove();
    });
  return {
    ...linking,
    async getInitialURL() {
      const initialUrl = await getInitialURL();
      if (!initialUrl) return initialUrl;
      const { hostname } = ExpoLinking.parse(initialUrl);
      if (hostname === iosShareHostname) return null;
      return initialUrl;
    },
    subscribe(listener) {
      const _listener = (url: string) => {
        const { hostname } = ExpoLinking.parse(url);
        if (hostname === iosShareHostname) return;
        listener(url);
      };
      return subscribe(_listener);
    },
  };
}

export type { ShareData, ShareFile };
