import { getActualPlatform } from "@/utils/device";
import { Linking } from "react-native";

interface OpenURLOptions {
  /** Open in new tab (web) or external browser (mobile). Desktop always opens externally. */
  newTab?: boolean;
}

export const openURL = (url: string, options?: OpenURLOptions) => {
  const { newTab = false } = options ?? {};
  const actualPlatform = getActualPlatform();

  if (actualPlatform === "web") {
    window.open(url, newTab ? "_blank" : "_self");
  } else {
    // desktop opens in default external browser
    // mobile uses Linking which opens in external browser
    void Linking.openURL(url);
  }
};
