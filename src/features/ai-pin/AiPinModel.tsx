import { createStyles } from "@/styles";
import type { DOMProps } from "expo/dom";
import { memo } from "react";
import { View } from "react-native";
import PinModel from "./PinModel.dom";

const styles = createStyles({
  root: {
    alignSelf: "center",
    height: 174,
    marginBottom: 16,
    maxWidth: 300,
    width: "100%",
  },
  dom: { backgroundColor: "transparent", flex: 1 },
});

// Deliberately not `useExpoDOMWebView`. @expo/dom-webview has no SDK 55
// release; the only copy here is one transitively nested under @expo/log-box,
// so depending on it means depending on log-box's dependency tree. Installing
// it directly resolves to an SDK 57 build whose prebuilt AAR crashes Android at
// startup against expo-modules-core 55. react-native-webview is a first-class
// dependency, already linked on both platforms.
//
// Expo re-marshals a DOM component's props into the WebView on every render of
// its wrapper, not just when they change, so this config object and the
// memoized boundary below both stay stable — otherwise an unrelated re-render
// (sync progress ticks once per downloaded chunk) re-injects for nothing.
const DOM_PROPS: DOMProps = {
  scrollEnabled: false,
  style: styles.dom,
};

export const AiPinModel = memo(function AiPinModel({
  active,
}: {
  active: boolean;
}) {
  return (
    <View style={styles.root} pointerEvents="none">
      <PinModel active={active} dom={DOM_PROPS} />
    </View>
  );
});
