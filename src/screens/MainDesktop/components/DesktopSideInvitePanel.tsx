import {
  IconGlobe,
  IconGoogleMeetLogo,
  IconLink2,
  IconMsTeamsLogo,
  IconZoomLogo,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Select } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useLanguageOptions } from "@/features/language";
import { useFindLanguageBest } from "@/features/remote-constants";
import { useGetCurrentUserQuery } from "@/graphql";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { isUrlSupportedSafe } from "@firefliesai/shared-libs.utils";
import { useInviteNotetaker } from "../hooks/useInviteNotetaker";
import { useEffect, useRef, useState, type FC } from "react";
import { TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const noFocusStyle = { outline: "none", boxShadow: "none" } as object;

interface DesktopSideInvitePanelProps {
  prefilledUrl?: string;
  onClose: () => void;
}

export const DesktopSideInvitePanel: FC<DesktopSideInvitePanelProps> = ({
  prefilledUrl = "",
  onClose,
}) => {
  const [url, setUrl] = useState(prefilledUrl);

  // Sync url when tray fires a new invite action while the panel is already open
  useEffect(() => {
    if (prefilledUrl) setUrl(prefilledUrl);
  }, [prefilledUrl]);
  const { data: dataUser } = useGetCurrentUserQuery();
  const languageOptions = useLanguageOptions();
  const findLanguageBest = useFindLanguageBest();

  const [language, setLanguage] = useState(
    () =>
      (dataUser?.user?.preferredLanguage &&
        findLanguageBest(dataUser.user.preferredLanguage)?.code) ||
      "en",
  );

  useEffect(() => {
    if (dataUser?.user?.preferredLanguage) {
      setLanguage(
        findLanguageBest(dataUser.user.preferredLanguage)?.code ?? "en",
      );
    }
  }, [dataUser?.user?.preferredLanguage, findLanguageBest]);

  const scaleY = useSharedValue(0.15);
  const opacity = useSharedValue(0);
  const panelRef = useRef<View>(null);

  useEffect(() => {
    scaleY.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
    // Shared values are stable refs — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const panelEl = panelRef.current as unknown as HTMLElement | null;
      if (panelEl && !panelEl.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // URL field sits ~136px from the modal's top — use that as the transform origin
  // so the modal visually grows out of the URL field area.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
    transformOrigin: "50% 136px",
    opacity: opacity.value,
  }));

  const { invite, loading } = useInviteNotetaker(
    "desktop-side-invite",
    onClose,
  );

  const handleSubmit = () => {
    let fixedUrl = url.trim();
    if (!fixedUrl.startsWith("http")) fixedUrl = `https://${fixedUrl}`;

    if (!isUrlSupportedSafe(fixedUrl)) {
      toast({
        title: "Invalid meeting link",
        message: "Enter a valid web conferencing URL.",
        type: "error",
      });
      return;
    }

    invite(fixedUrl, language);
  };

  return (
    <Animated.View ref={panelRef} style={[styles.panel, animatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <HoverTooltip
          label="Bot joins calls from Google Meet, Zoom, MS Teams, Webex, Jitsi, Dialpad, Lifesize and GoToMeeting"
          position="bottom"
          align="start"
        >
          <View style={styles.platformIcons}>
            <IconGoogleMeetLogo width={20} height={20} />
            <IconZoomLogo width={20} height={20} />
            <IconMsTeamsLogo width={20} height={20} />
          </View>
        </HoverTooltip>
        <View style={styles.headerText}>
          <Text variant="body2Weight" style={styles.titleText}>
            Add notetaker to live meeting
          </Text>
          <Text variant="body3Regular" style={styles.subtitleText}>
            Bot captures audio, video, and speaker names
          </Text>
        </View>
      </View>

      {/* URL Input */}
      <View style={styles.urlContainer}>
        <IconLink2 width={16} height={16} color={DESKTOP_THEME.grey700} />
        <View style={styles.urlInputWrapper}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            style={[styles.urlInput, noFocusStyle]}
            placeholderTextColor="transparent"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            autoFocus
          />
          {!url && (
            <View style={styles.urlPlaceholder}>
              <Text variant="body2Regular" style={styles.urlPlaceholderText}>
                Paste meeting URL
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Language dropdown */}
      <Select
        value={language}
        onValueChange={setLanguage}
        options={languageOptions}
        size="sm"
        showSearch
        Icon={IconGlobe}
        triggerIconColor={DESKTOP_THEME.grey700}
        textProps={{ style: { color: DESKTOP_THEME.grey700 } }}
        style={styles.languageSelect}
      />

      {/* Submit */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="sm"
          onPress={handleSubmit}
          disabled={!url.trim() || loading}
        >
          Invite Notetaker
        </Button>
      </View>
    </Animated.View>
  );
};

const styles = createStyles({
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 8,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
    padding: 20,
    gap: 12,
    zIndex: 10,
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  platformIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6.67,
  },
  headerText: {
    gap: 4,
  },
  titleText: {
    color: DESKTOP_THEME.grey500,
  },
  subtitleText: {
    color: DESKTOP_THEME.grey700,
  },
  urlContainer: {
    height: 40,
    backgroundColor: DESKTOP_THEME.grey900,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey870,
    paddingLeft: 12,
    paddingRight: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  urlInputWrapper: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  urlInput: {
    flex: 1,
    color: DESKTOP_THEME.grey500,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    height: "100%",
  },
  urlPlaceholder: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
  } as object,
  urlPlaceholderText: {
    color: DESKTOP_THEME.grey700,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  languageSelect: {
    backgroundColor: DESKTOP_THEME.grey900,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey870,
    borderRadius: 4,
    height: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
