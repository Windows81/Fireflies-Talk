import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import "./src/utils/setupBundleLoader";
import { initErrorHandling } from "./src/errors";

initErrorHandling();

export { App as default } from "./src/App";
