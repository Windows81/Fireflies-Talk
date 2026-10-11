// Import the native module. On web, it will be resolved to NativeCode.web.ts
// and on native platforms to NativeCode.ts
import { Linking, Platform } from "react-native";
import NativeCodeModule from "./src/NativeCodeModule";

export function openInBrowser(url: string) {
  try {
    NativeCodeModule.openInBrowser(url);
  } catch {
    Linking.openURL(url);
  }
}

export function setExcludedFromBackup(uri: string) {
  // iOS-only: iCloud must not back up re-downloadable content (App Review guideline)
  if (Platform.OS !== "ios") return;
  try {
    NativeCodeModule.setExcludedFromBackup(uri);
  } catch {
    // best-effort: a native build without this function must not break callers
  }
}
