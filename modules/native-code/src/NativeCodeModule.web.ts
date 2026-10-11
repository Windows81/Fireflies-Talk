import { NativeModule } from "expo";
import { Linking } from "react-native";
import type { NativeCodeModule } from "./types";

class NativeCodeModuleWeb extends NativeModule implements NativeCodeModule {
  openInBrowser(url: string): void {
    Linking.openURL(url);
  }

  setExcludedFromBackup(): void {
    // no-op: iCloud backup is an iOS concept
  }
}

export default new NativeCodeModuleWeb();
