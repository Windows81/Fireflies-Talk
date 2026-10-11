import { Text } from "@/components/Typography";
import { Pressable, View } from "react-native";
import { createStyles, useTheme } from "@/styles";
import { getActualPlatform } from "@/utils/device";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ParamList } from "../../types";
import { resolveDesktopSettingsContent } from "../dictation-settings/dictationSettingsAvailability";
import { useIsDictationOffered } from "@/hooks/useIsDictationOffered";

type ActiveContent =
  | "meeting-preference"
  | "dictation"
  | "notifications"
  | "permissions";

type Props = {
  activeContent: ActiveContent;
  navigation?: NativeStackNavigationProp<ParamList, "DesktopSettings">;
};

const WINDOW_CONTROLS_SPACING = 70;

export const DesktopSettingsHeaderTitle: React.FC<Props> = ({
  activeContent: requestedContent,
  navigation,
}) => {
  const theme = useTheme();
  const isDictationOffered = useIsDictationOffered();

  const activeContent = resolveDesktopSettingsContent(
    requestedContent,
    isDictationOffered,
  );

  return (
    <View style={styles.toggleContainer} nativeID="no-drag">
      <Pressable
        style={[
          styles.toggleButton(theme),
          activeContent === "meeting-preference" &&
            styles.toggleButtonActive(theme),
        ]}
        onPress={() => {
          navigation?.setParams({ activeContent: "meeting-preference" });
        }}
      >
        <Text
          variant="body3Weight"
          color={
            activeContent === "meeting-preference" ? "textPrimary" : "textMuted"
          }
        >
          Notetaker
        </Text>
      </Pressable>
      {isDictationOffered && (
        <Pressable
          style={[
            styles.toggleButton(theme),
            activeContent === "dictation" && styles.toggleButtonActive(theme),
          ]}
          onPress={() => {
            navigation?.setParams({ activeContent: "dictation" });
          }}
        >
          <Text
            variant="body3Weight"
            color={activeContent === "dictation" ? "textPrimary" : "textMuted"}
          >
            Dictation
          </Text>
        </Pressable>
      )}
      <Pressable
        style={[
          styles.toggleButton(theme),
          activeContent === "notifications" && styles.toggleButtonActive(theme),
        ]}
        onPress={() => {
          navigation?.setParams({ activeContent: "notifications" });
        }}
      >
        <Text
          variant="body3Weight"
          color={
            activeContent === "notifications" ? "textPrimary" : "textMuted"
          }
        >
          Notifications
        </Text>
      </Pressable>
      {(getActualPlatform() === "darwin" ||
        getActualPlatform() === "win32") && (
        <Pressable
          style={[
            styles.toggleButton(theme),
            activeContent === "permissions" && styles.toggleButtonActive(theme),
          ]}
          onPress={() => {
            navigation?.setParams({ activeContent: "permissions" });
          }}
        >
          <Text
            variant="body3Weight"
            color={
              activeContent === "permissions" ? "textPrimary" : "textMuted"
            }
          >
            Permissions
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = createStyles({
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
    marginRight: getActualPlatform() === "darwin" ? WINDOW_CONTROLS_SPACING : 0,
    marginLeft: getActualPlatform() === "win32" ? WINDOW_CONTROLS_SPACING : 0,
    justifyContent: "center",
  },
  toggleButton: (theme) => ({
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.layerMuted,
  }),
  toggleButtonActive: (theme) => ({
    backgroundColor: theme.colors.layerBrand,
  }),
});
