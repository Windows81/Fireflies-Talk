import { Text } from "@/components/Typography";
import { useGetCurrentUserQuery } from "@/graphql";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { type FC, type PropsWithChildren } from "react";
import { useWindowFocus } from "@/hooks/useWindowFocus";
import { Pressable, ScrollView, View } from "react-native";
import type { ParamList } from "../types";
import { MeetingSettingsAutoJoin } from "./meeting-settings/MeetingSettingsAutoJoin";
import { MeetingSettingsLanguage } from "./meeting-settings/MeetingSettingsLanguage";
import { MeetingSettingsPrivacy } from "./meeting-settings/MeetingSettingsPrivacy";
import { MeetingSettingsRecap } from "./meeting-settings/MeetingSettingsRecap";
import { IconArrowUpRight } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import { Avatar } from "@/components/Avatar";
import { Tag } from "@/components/Tag";
import { getPlanName } from "@firefliesai/payments-ff.utils";
import { Config } from "@/constants";
import { NotificationSettingsAutoDetect } from "./notification-settings/NotificationSettingsAutoDetect";
import { NotificationSettingsDailyBrief } from "./notification-settings/NotificationSettingsDailyBrief";
import { NotificationSettingsMeetingPrep } from "./notification-settings/NotificationSettingsMeetingPrep";
import { NotificationSettingsNotetakerJoined } from "./notification-settings/NotificationSettingsNotetakerJoined";
import { NotificationSettingsPersistence } from "./notification-settings/NotificationSettingsPersistence";
import { NotificationSettingsUpcomingMeeting } from "./notification-settings/NotificationSettingsUpcomingMeeting";
import { PreferenceSettingsAutoStartNotes } from "./preference-settings/PreferenceSettingsAutoStartNotes";
import { PreferenceSettingsLaunchAtStartup } from "./preference-settings/PreferenceSettingsLaunchAtStartup";
import { PreferenceSettingsGlobalShortcuts } from "./preference-settings/PreferenceSettingsGlobalShortcuts";
import { PreferenceSettingsHideFloatingDock } from "./preference-settings/PreferenceSettingsHideFloatingDock";
import { PreferenceSettingsMeetSpeakerNames } from "./preference-settings/PreferenceSettingsMeetSpeakerNames";

import { DictationSettingsActionMode } from "./dictation-settings/DictationSettingsActionMode";
import { DictationSettingsActionShortcut } from "./dictation-settings/DictationSettingsActionShortcut";
import { DictationSettingsClearHistory } from "./dictation-settings/DictationSettingsClearHistory";
import { DictationSettingsLanguage } from "./dictation-settings/DictationSettingsLanguage";
import { DictationSettingsMicrophone } from "./dictation-settings/DictationSettingsMicrophone";
import { DictationSettingsPauseMedia } from "./dictation-settings/DictationSettingsPauseMedia";
import { DictationSettingsPolishShortcut } from "./dictation-settings/DictationSettingsPolishShortcut";
import { DictationSettingsShortcut } from "./dictation-settings/DictationSettingsShortcut";
import { DictationSettingsHandsFreeShortcut } from "./dictation-settings/DictationSettingsHandsFreeShortcut";
import { DictationSettingsShowPill } from "./dictation-settings/DictationSettingsShowPill";
import { DictationSettingsPillPosition } from "./dictation-settings/DictationSettingsPillPosition";
import { DictationSettingsSoundEffects } from "./dictation-settings/DictationSettingsSoundEffects";
import { DictationSettingsUseScreenContext } from "./dictation-settings/DictationSettingsUseScreenContext";
import { DictationSettingsDisableTalk } from "./dictation-settings/DictationSettingsDisableTalk";
import { DictationSettingsEnableTalk } from "./dictation-settings/DictationSettingsEnableTalk";
import { DictationShortcutsReset } from "./dictation-settings/DictationShortcutsReset";
import { ShortcutRowsGroup } from "./dictation-settings/ShortcutRow";
import { UpdaterInfo } from "./components";
import {
  PermissionSettingsMicrophone,
  PermissionSettingsSystemAudio,
} from "./permission-settings";
import { openURL } from "@/features/navigation";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { DesktopPrivacyConsentSettings } from "./privacy-consent/PrivacyConsentSettings";
import { CameraConsentSettings } from "./privacy-consent/CameraConsentSettings";
import { TeamsConsentSettings } from "@/features/teams-consent";
import { AudioConsentSettings } from "@/features/audio-consent";
import { getActualPlatform } from "@/utils/device";
import {
  useIsTalkActionModeFlagOn,
  useIsTalkPolishActionFlagOn,
} from "@/features/settings";
import { resolveDesktopSettingsContent } from "./dictation-settings/dictationSettingsAvailability";
import { useIsDictationAvailable } from "@/hooks/useIsDictationAvailable";
import { useIsDictationOffered } from "@/hooks/useIsDictationOffered";

const openDashboardSettings = () => {
  tracker.track(TRACKING_EVENTS.OPEN_IN_DASHBOARD, { linkType: "settings" });
  openURL(`${Config.DASHBOARD_URL}/settings`);
};

const YouBanner: FC = () => {
  const { hidePaidFeatures } = usePaywallConfig();
  const { user } = useAuth();
  const theme = useTheme();

  if (!user) return null;

  return (
    <View style={styles.user(theme)}>
      <Avatar
        name={user.name}
        picture={user.photoUrl}
        size={32}
        shape="square"
      />
      <View style={styles.userInfo}>
        <Text variant="title2Weight" color="textPrimary">
          {user.name}
        </Text>
        <Text variant="body2Regular" color="textMuted">
          {user.email}
        </Text>
      </View>
      {!hidePaidFeatures && (
        <Tag>{getPlanName(user.paidUser).toUpperCase()}</Tag>
      )}
    </View>
  );
};

const SettingSection: FC<PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.section(theme)}>
      <Text variant="title2Regular" color="textPrimary">
        {title}
      </Text>
      <View style={styles.sectionHeaderDivider(theme)}></View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export const DesktopSettingsScreen: FC<
  NativeStackScreenProps<ParamList, "DesktopSettings">
> = ({ route }) => {
  const { data: dataUser, refetch: refetchCurrentUser } =
    useGetCurrentUserQuery({ fetchPolicy: "cache-and-network" });
  const theme = useTheme();
  const isActionModeAvailable = useIsTalkActionModeFlagOn();
  const isPolishActionAvailable = useIsTalkPolishActionFlagOn();
  const isDictationAvailable = useIsDictationAvailable();
  const isDictationOffered = useIsDictationOffered();

  const activeContent = resolveDesktopSettingsContent(
    route.params?.activeContent,
    isDictationOffered,
  );

  const user = dataUser?.user;

  useWindowFocus(refetchCurrentUser);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.page(theme)}>
      <View style={styles.root}>
        <ScrollView
          nativeID="no-drag"
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <YouBanner />
          {activeContent === "meeting-preference" && (
            <>
              <SettingSection title="Meeting">
                <MeetingSettingsLanguage user={user} />
                <MeetingSettingsAutoJoin user={user} />
                <MeetingSettingsRecap user={user} />
                <MeetingSettingsPrivacy user={user} />
              </SettingSection>

              <SettingSection title="Preference">
                <PreferenceSettingsLaunchAtStartup />
                <PreferenceSettingsHideFloatingDock />
                <PreferenceSettingsMeetSpeakerNames />
                <PreferenceSettingsAutoStartNotes />
                <PreferenceSettingsGlobalShortcuts />
              </SettingSection>
              <SettingSection title="Recording">
                <AudioConsentSettings />
                {/* Consent auto-send needs the macOS accessibility keyboard
                    module; the virtual camera ships on macOS and Windows. */}
                {getActualPlatform() === "darwin" && <TeamsConsentSettings />}
                {(getActualPlatform() === "darwin" ||
                  getActualPlatform() === "win32") && <CameraConsentSettings />}
              </SettingSection>

              <SettingSection title="Cookies & Privacy">
                <DesktopPrivacyConsentSettings />
              </SettingSection>

              <SettingSection title="About">
                <UpdaterInfo />
              </SettingSection>

              <Pressable
                style={styles.otherSettings}
                onPress={openDashboardSettings}
              >
                <Text>Other Settings</Text>
                <IconArrowUpRight
                  width={16}
                  height={16}
                  color={theme.colors.layerContrast}
                />
              </Pressable>
            </>
          )}
          {activeContent === "dictation" &&
            (isDictationAvailable ? (
              <>
                <SettingSection title="Shortcuts">
                  <ShortcutRowsGroup>
                    <DictationSettingsShortcut />
                    <DictationSettingsHandsFreeShortcut />
                    {isActionModeAvailable && (
                      <DictationSettingsActionShortcut />
                    )}
                    {isPolishActionAvailable &&
                      getActualPlatform() === "darwin" && (
                        <DictationSettingsPolishShortcut />
                      )}
                  </ShortcutRowsGroup>
                  <DictationShortcutsReset />
                </SettingSection>

                <SettingSection title="Preferences">
                  {isActionModeAvailable && <DictationSettingsActionMode />}
                  <DictationSettingsShowPill />
                  <DictationSettingsPillPosition />
                  <DictationSettingsSoundEffects />
                  <DictationSettingsMicrophone />
                  <DictationSettingsLanguage />
                  <DictationSettingsPauseMedia />
                  <DictationSettingsUseScreenContext />
                </SettingSection>

                <SettingSection title="Danger zone">
                  <DictationSettingsClearHistory />
                  <DictationSettingsDisableTalk />
                </SettingSection>
              </>
            ) : (
              <SettingSection title="Fireflies Talk">
                <DictationSettingsEnableTalk />
              </SettingSection>
            ))}
          {activeContent === "notifications" && (
            <>
              <SettingSection title="Notifications">
                <NotificationSettingsUpcomingMeeting />
                <NotificationSettingsAutoDetect />
                <NotificationSettingsNotetakerJoined />
                <NotificationSettingsPersistence />
              </SettingSection>

              <SettingSection title="Personal Assistant">
                <NotificationSettingsMeetingPrep />
                <NotificationSettingsDailyBrief />
              </SettingSection>
            </>
          )}
          {activeContent === "permissions" && (
            <>
              <SettingSection title="Record Permissions">
                <PermissionSettingsMicrophone />
                <PermissionSettingsSystemAudio />
              </SettingSection>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = createStyles({
  // Solid page backing so the translucent section cards composite into a
  // visible dark surface. The desktop window is opaque (vibrancy removed in
  // 6634c231), so without this the cards fall onto pure black and disappear.
  page: (theme) => ({
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: theme.colors.layerDefault,
  }),
  // Center with horizontal margin, not alignSelf: "center". On Windows Chromium,
  // align-self:center on a column flex child can size to content height so the
  // ScrollView never overflows and body { overflow: hidden } clips the page.
  root: {
    flex: 1,
    minHeight: 0,
    width: "80%",
    maxWidth: 900,
    marginHorizontal: "auto",
  },
  scroll: { flex: 1 },
  content: { paddingBottom: 64, paddingTop: 24, gap: 32 },
  section: (theme) => ({
    flexDirection: "column",
    gap: 24,
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 12,
    padding: 24,
  }),
  sectionContent: { flexDirection: "column", gap: 36 },
  otherSettings: {
    height: 40,
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  user: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 12,
    padding: 16,
  }),
  userInfo: { flex: 1 },
  sectionHeaderDivider: (theme) => ({
    width: "100%",
    height: 1,
    backgroundColor: theme.colors.borderInteractiveDefault,
  }),
});
