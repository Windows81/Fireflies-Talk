import { IconAlignLeft, IconSlack, IconUser } from "@/assets/svg";
import { ConfirmationDialog } from "@/components/Dialog";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { type FC, useState } from "react";
import { View } from "react-native";
import {
  SettingField,
  SettingLabel,
  SettingRow,
  SettingsGroup,
} from "../components/SettingsForm";
import { useLocalSettings } from "@/features/settings";
import { useIsScreenContextDisabledByAdmin } from "@/hooks/useIsScreenContextDisabledByAdmin";
import { useBooleanState } from "@/utils/states";

const TURNED_OFF_BY_ADMIN_MESSAGE = "Turned off by your workspace admin";

type ImpactIcon = typeof IconUser;

const IMPACTS: { Icon: ImpactIcon; title: string; detail: string }[] = [
  {
    Icon: IconUser,
    title: "Names",
    detail:
      "Fred can't match spelling to what's on screen, so names are more likely to be spelled wrong.",
  },
  {
    Icon: IconAlignLeft,
    title: "Formatting",
    detail:
      "Fred won't know if you're in an email, Slack, or a messenger, so layout, punctuation, and tone may not fit.",
  },
  {
    Icon: IconSlack,
    title: "Slack @mentions",
    detail:
      "Fred can't copy @handles from your screen, so mentions may be wrong.",
  },
];

const ImpactRow: FC<(typeof IMPACTS)[number]> = ({ Icon, title, detail }) => {
  const theme = useTheme();
  return (
    <View style={styles.impactRow}>
      <View style={styles.impactIcon(theme)}>
        <Icon width={16} height={16} color={theme.colors.textBrand} />
      </View>
      <View style={styles.impactText}>
        <Text variant="body2Weight" color="textPrimary">
          {title}
        </Text>
        <Text variant="body2Regular" color="textSecondary">
          {detail}
        </Text>
      </View>
    </View>
  );
};

const DisableScreenContextWarning: FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.warning}>
      <Text variant="body2Regular" color="textSecondary">
        Screen context lets Fred see the app you&apos;re in and the text on
        screen. Turning it off can significantly reduce the quality of your
        dictations:
      </Text>
      <View style={styles.impactList(theme)}>
        {IMPACTS.map((impact) => (
          <ImpactRow key={impact.title} {...impact} />
        ))}
      </View>
      <Text variant="body3Regular" color="textHint">
        You can turn it back on anytime from Settings.
      </Text>
    </View>
  );
};

export const DictationSettingsUseScreenContext: FC = () => {
  const { useScreenContextForDictation, setUseScreenContextForDictation } =
    useLocalSettings();
  // The admin's off wins over the user's choice without overwriting it, so
  // lifting it brings back whatever the user had picked.
  const disabledByAdmin = useIsScreenContextDisabledByAdmin();
  const [isOpenDisableDialog, openDisableDialog, closeDisableDialog] =
    useBooleanState();
  // Switch animates its knob optimistically on press; remounting it snaps the
  // knob back to the still-enabled value while the user decides.
  const [switchKey, setSwitchKey] = useState(0);

  const onValueChange = (value: boolean) => {
    if (value) {
      setUseScreenContextForDictation(true);
      return;
    }
    setSwitchKey((key) => key + 1);
    openDisableDialog();
  };

  return (
    <SettingsGroup>
      <SettingField>
        <SettingRow>
          <SettingLabel
            title="Screen context"
            description="Fireflies looks at the app you're in, the window title, the page URL in a browser, and the text on screen so Fred can get names and emails right. That can include messages and other people's names, like in Slack or email."
            id="setting-label-dictation-screen-context"
          />
          <Switch
            key={switchKey}
            value={useScreenContextForDictation && !disabledByAdmin}
            onValueChange={onValueChange}
            disabled={disabledByAdmin}
            aria-labelledby="setting-label-dictation-screen-context"
          />
        </SettingRow>
        {disabledByAdmin && (
          <Text variant="body2Regular" color="textHint">
            {TURNED_OFF_BY_ADMIN_MESSAGE}
          </Text>
        )}
      </SettingField>
      <ConfirmationDialog
        title="Turn off screen context?"
        isOpen={isOpenDisableDialog}
        close={closeDisableDialog}
        confirmText="Turn off anyway"
        cancelText="Keep it on"
        highlightCancel
        onConfirm={() => setUseScreenContextForDictation(false)}
      >
        <DisableScreenContextWarning />
      </ConfirmationDialog>
    </SettingsGroup>
  );
};

const styles = createStyles({
  warning: {
    gap: 16,
  },
  impactList: (theme) => ({
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.layerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  impactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  impactIcon: (theme) => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerBrandLight1,
  }),
  impactText: {
    flex: 1,
    gap: 2,
  },
});
