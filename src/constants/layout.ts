import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const NAVBAR_HEIGHT = 64;
export const LIVE_RECORDER_HEIGHT = 86;
export const STATUSBAR_HEIGHT =
  Platform.OS === "android" &&
  typeof Platform.Version === "number" &&
  Platform.Version >= 35
    ? (StatusBar.currentHeight ?? 0) + 20
    : 0; // android-15 forces fullscreen, so we need to use this

export const useBottomInset = () => {
  const insets = useSafeAreaInsets();
  // navigation bar and gesture handlebars rendered with different heights on android and ios,
  // and reducing the bottom inset helps our bottom-nav-bar looks way better and leave more space for the content
  if (Platform.OS === "ios") {
    return insets.bottom / 2;
  } else if (Platform.OS === "android") {
    return insets.bottom / 1.3;
  }
  return insets.bottom;
};
