import {
  IconActivity,
  IconGlobe,
  IconHelpCircle,
  IconInfo,
  IconStar,
} from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { HELP_CENTER_URL, RouteNames, SHARE_FEEDBACK_URL } from "@/constants";
import { useBooleanState } from "@/utils/states";
import { RootNavigation } from "@/screens/RootNavigation";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { Linking, Platform, StyleSheet } from "react-native";
import { Switch } from "@/components/Switch";
import { useLocalSettings } from "../../settings/useLocalSettings";
import { isEdgeBrowserAvailable } from "../../settings/edgeBrowserUtils";

export const InfoButton: FC = () => {
  const [isOpen, open, close] = useBooleanState(false);
  const [isEdgeAvailable, setIsEdgeAvailable] = useState(false);

  const useEdgeBrowserForOutlookLogin = useLocalSettings(
    (state) => state.useEdgeBrowserForOutlookLogin,
  );
  const setUseEdgeBrowserForOutlookLogin = useLocalSettings(
    (state) => state.setUseEdgeBrowserForOutlookLogin,
  );

  useEffect(() => {
    isEdgeBrowserAvailable().then(setIsEdgeAvailable);
  }, []);

  return (
    <>
      <Button
        variant="transparentNeutral"
        size="sm"
        aria-label="More..."
        Icon={IconInfo}
        style={styles.button}
        onPress={open}
      />
      <BottomSheetMenuModal
        isOpen={isOpen}
        close={close}
        items={[
          {
            label: "Share feedback",
            Icon: IconStar,
            onPress() {
              Linking.openURL(SHARE_FEEDBACK_URL);
            },
          },
          {
            label: "Help center",
            Icon: IconHelpCircle,
            onPress() {
              Linking.openURL(HELP_CENTER_URL);
            },
          },
          {
            label: "Diagnostic",
            Icon: IconActivity,
            onPress() {
              RootNavigation.navigate(RouteNames.Diagnostic);
            },
          },
          // Only show Edge option on mobile platforms (iOS/Android)
          Platform.OS !== "web" &&
            isEdgeAvailable && {
              label: "Use Edge Browser for Login",
              Icon: IconGlobe,
              right: (
                <Switch
                  value={useEdgeBrowserForOutlookLogin}
                  onValueChange={setUseEdgeBrowserForOutlookLogin}
                />
              ),
              onPress() {
                setUseEdgeBrowserForOutlookLogin(
                  !useEdgeBrowserForOutlookLogin,
                );
              },
            },
        ].filter((option) => !!option)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 4,
    top: 4,
  },
});
