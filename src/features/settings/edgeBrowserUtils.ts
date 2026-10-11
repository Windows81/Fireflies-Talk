import { Platform, Linking } from "react-native";

/**
 * Checks if Microsoft Edge browser is available on the device
 * @returns Promise<boolean> - true if Edge is available, false otherwise
 */
export const isEdgeBrowserAvailable = async (): Promise<boolean> => {
  try {
    if (Platform.OS === "web") {
      return false;
    } else {
      return await Linking.canOpenURL("microsoft-edge://home");
    }
  } catch {
    return false;
  }
};

/**
 * Opens a URL in Microsoft Edge browser
 * @param url - The URL to open
 * @returns Promise<void>
 */
export const openInEdgeBrowser = async (url: string): Promise<void> => {
  try {
    if (Platform.OS === "web") {
      await void Linking.openURL(url);
    } else {
      // iOS Edge URL scheme: microsoft-edge-https://www.example.com
      // Replace http:// or https:// with microsoft-edge-http:// or microsoft-edge-https://
      let edgeUrl: string;
      if (url.startsWith("https://")) {
        edgeUrl = url.replace("https://", "microsoft-edge-https://");
      } else if (url.startsWith("http://")) {
        edgeUrl = url.replace("http://", "microsoft-edge-http://");
      } else {
        edgeUrl = `microsoft-edge-https://${url}`;
      }
      await Linking.openURL(edgeUrl);
    }
  } catch {
    // Fallback to default browser if Edge is not available
    await Linking.openURL(url);
  }
};
