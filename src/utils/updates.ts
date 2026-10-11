import { APP_STORE_URL, Config, PLAY_STORE_URL } from "@/constants";
import { getLocales } from "expo-localization";
import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";

export const compareVersions = (v1: string, v2: string) => {
  const v1parts = v1.split(".");
  const v2parts = v2.split(".");

  const minLength = Math.min(v1parts.length, v2parts.length);

  let p1: number;
  let p2: number;

  for (let i = 0; i < minLength; i++) {
    p1 = parseInt(v1parts[i], 10);
    p2 = parseInt(v2parts[i], 10);

    if (p1 === p2) {
      continue;
    }

    return p1 > p2 ? 1 : -1;
  }

  if (v1parts.length === v2parts.length) {
    return 0;
  }

  return v1parts.length > v2parts.length ? 1 : -1;
};

const getIOSVersion = async (storeURL: string, country: string) => {
  const appID = storeURL.match(/.+id([0-9]+)\??/);

  if (!appID) {
    throw new Error("iosStoreURL is invalid.");
  }

  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${
      appID[1]
    }&country=${country}&${new Date().getTime()}`,
    {
      headers: {
        "cache-control": "no-cache",
      },
    },
  )
    .then((r) => r.text())
    .then((r) => JSON.parse(r));

  if (!response || !response.results || response.results.length === 0) {
    throw new Error(`appID(${appID[1]}) is not released.`);
  }

  return response.results[0].version as string;
};

const getAndroidVersion = async (storeURL: string) => {
  if (
    !storeURL.match(
      /^https?:\/\/play\.google\.com\/store\/apps\/details\?id=[0-9a-zA-Z.]+/,
    )
  ) {
    throw new Error("androidStoreURL is invalid.");
  }

  const response = await fetch(storeURL).then((r) => {
    if (r.status === 200) {
      return r.text();
    }

    throw new Error("androidStoreURL is invalid.");
  });

  const matches = response.match(/\[\[\[['"]((\d+\.)+\d+)['"]\]\],/);

  if (!matches) {
    throw new Error("can't get android app version.");
  }

  return matches[1];
};

export async function checkHasNewUpdates() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return false;
  }

  const currVersion = Config.VERSION;

  const country = getLocales()[0]?.regionCode || "us";

  const remoteVersion =
    Platform.OS === "ios"
      ? await getIOSVersion(APP_STORE_URL, country.toLowerCase())
      : await getAndroidVersion(PLAY_STORE_URL);

  return compareVersions(currVersion, remoteVersion) < 0;
}

let useHasNewUpdatesCached: boolean | null = null;

export const useHasNewUpdates = () => {
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  useEffect(() => {
    if (useHasNewUpdatesCached !== null) {
      setHasNewUpdate(useHasNewUpdatesCached);
      return;
    }
    checkHasNewUpdates()
      .then((result) => {
        setHasNewUpdate(result);
        useHasNewUpdatesCached = result;
      })
      .catch(() => {});
  }, []);
  return hasNewUpdate;
};

export const openStoreUrl = () => {
  if (Platform.OS === "android") {
    Linking.openURL(PLAY_STORE_URL);
  } else {
    Linking.openURL(APP_STORE_URL);
  }
};
