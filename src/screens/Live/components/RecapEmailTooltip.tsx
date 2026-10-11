import { IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { Config, SendNotesTo } from "@/constants";
import { openURL } from "@/features/navigation";
import { useUpdateOptionsSendNotesTo } from "@/features/settings";
import type { User } from "@/graphql";
import { useGetCurrentUserQuery } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { GLOBAL } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import { Platform, Pressable, View } from "react-native";
import WalkthroughTooltip from "react-native-walkthrough-tooltip";
import { CoordinatedModal } from "@/components/Dialog";

const DISPLAY_INSETS = { top: 24, left: 16, right: 16, bottom: 24 };

interface TooltipContentProps {
  user: User;
  onDismiss: () => void;
}

const RecapEmailTooltipContent: FC<TooltipContentProps> = ({
  user,
  onDismiss,
}) => {
  const theme = useTheme();
  const { updateSendNotesTo, sendNotesToSettingsLocked } =
    useUpdateOptionsSendNotesTo({ user });

  const handleEnable = () => {
    updateSendNotesTo(SendNotesTo.All);
    onDismiss();
  };

  const handleSettings = () => {
    openURL(`${Config.DASHBOARD_URL}/settings`, { newTab: true });
    onDismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.textContent}>
          <Text variant="title3Weight" color="textContrast">
            Get meeting recaps
          </Text>
          <Text
            variant="body2Regular"
            color="textContrast"
            style={styles.description}
          >
            Attendees were detected. Enable recap emails to keep everyone
            aligned after each meeting.
          </Text>
        </View>
        <Pressable onPress={onDismiss} style={styles.closeButton} hitSlop={8}>
          <IconX width={20} height={20} color={GLOBAL.whiteAlpha60} />
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.settingsButton} onPress={handleSettings}>
          <Text variant="label2Weight" style={styles.settingsText}>
            Settings
          </Text>
        </Pressable>
        {!sendNotesToSettingsLocked && (
          <Pressable style={styles.enableButton(theme)} onPress={handleEnable}>
            <Text variant="label2Weight" style={styles.enableText(theme)}>
              Enable
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

interface RecapEmailTooltipProps {
  isVisible: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

export const RecapEmailTooltip: FC<RecapEmailTooltipProps> = ({
  isVisible,
  onDismiss,
  children,
}) => {
  const { data } = useGetCurrentUserQuery({ skip: !isVisible });
  const user = data?.user;

  // Suppress the nudge if the user already has recap emails enabled.
  // Treat null/undefined as Me (same default as useUpdateOptionsSendNotesTo).
  useEffect(() => {
    const effectiveSetting = user?.sendNotesTo || SendNotesTo.Me;
    if (isVisible && user && effectiveSetting !== SendNotesTo.Me) {
      onDismiss();
    }
  }, [isVisible, user, onDismiss]);

  const shouldShow =
    isVisible &&
    !!user &&
    (user.sendNotesTo || SendNotesTo.Me) === SendNotesTo.Me;

  return (
    <WalkthroughTooltip
      modalComponent={CoordinatedModal}
      isVisible={shouldShow}
      content={
        user ? (
          <RecapEmailTooltipContent user={user} onDismiss={onDismiss} />
        ) : undefined
      }
      placement="bottom"
      onClose={onDismiss}
      backgroundColor="transparent"
      arrowStyle={styles.arrow}
      arrowSize={styles.arrowSize}
      allowChildInteraction={false}
      closeOnChildInteraction={false}
      closeOnContentInteraction={false}
      contentStyle={styles.content}
      tooltipStyle={styles.tooltip}
      childContentSpacing={8}
      displayInsets={DISPLAY_INSETS}
      useInteractionManager
      topAdjustment={0}
    >
      {children}
    </WalkthroughTooltip>
  );
};

const styles = createStyles({
  content: {
    padding: 16,
    // On web (including Electron desktop), the tooltip library sizes the bubble
    // to the screen width; cap it to a readable width. On native it fills the
    // tooltip container, which is already bounded by displayInsets.
    width: Platform.OS === "web" ? 280 : "100%",
    backgroundColor: GLOBAL.purple900,
    borderRadius: 8,
    shadowColor: GLOBAL.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: "auto",
  },
  tooltip: {
    width: "auto",
  },
  arrowSize: { width: 16, height: 8 },
  arrow: { borderTopColor: GLOBAL.purple900 },
  container: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  description: {
    opacity: 0.85,
  },
  closeButton: {
    padding: 2,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  settingsButton: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: "center",
  },
  settingsText: {
    color: GLOBAL.whiteAlpha70,
  },
  enableButton: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: "center",
  }),
  enableText: (theme) => ({
    color: theme.colors.textBrand,
  }),
});
