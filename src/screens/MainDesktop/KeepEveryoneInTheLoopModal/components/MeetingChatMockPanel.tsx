import {
  IconGoogleMeetLogo,
  IconMsTeamsLogo,
  IconZoomLogo,
} from "@/assets/svg";
import { Text } from "@/components/Typography";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

/** Decorative, static mock of a meeting-chat window — illustrates the auto-sent consent message. */
export const MeetingChatMockPanel: FC = () => (
  <View style={styles.root}>
    <View style={styles.mock}>
      <View style={styles.header}>
        <Text
          variant="title3Weight"
          color="textHint"
          style={styles.headerLabel}
        >
          Meeting Chat
        </Text>
        <View style={styles.logos}>
          <IconGoogleMeetLogo width={13} height={13} />
          <IconZoomLogo width={13} height={13} />
          <IconMsTeamsLogo width={13} height={13} />
        </View>
      </View>

      <View style={styles.incomingBubble}>
        <View style={styles.skeletonBar} />
        <View style={[styles.skeletonBar, styles.skeletonBarShort]} />
      </View>

      <Text variant="body2Regular" color="textMuted" style={styles.timestamp}>
        11:30 AM
      </Text>
      <View style={styles.outgoingBubble}>
        <Text variant="body2Regular" style={styles.outgoingText}>
          Hi! I&rsquo;m using Fireflies.ai desktop app to capture and take
          notes.
        </Text>
      </View>

      <View style={styles.inputField}>
        <View style={styles.inputSkeleton} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DESKTOP_THEME.grey950,
  },
  mock: {
    position: "absolute",
    width: 335,
    height: 362,
    right: 33,
    top: 33,
    backgroundColor: DESKTOP_THEME.grey1100,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: DESKTOP_THEME.grey1010,
  },
  headerLabel: {
    flex: 1,
  },
  logos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  incomingBubble: {
    marginTop: 16,
    marginLeft: 20,
    width: 243,
    padding: 16,
    gap: 8,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderRadius: 16,
  },
  skeletonBar: {
    height: 8,
    borderRadius: 40,
    backgroundColor: DESKTOP_THEME.grey950,
  },
  skeletonBarShort: {
    width: "66%",
  },
  timestamp: {
    marginTop: 20,
    marginRight: 20,
    textAlign: "right",
  },
  outgoingBubble: {
    marginTop: 7,
    marginRight: 20,
    alignSelf: "flex-end",
    maxWidth: 243,
    padding: 16,
    backgroundColor: DESKTOP_THEME.blue900,
    borderRadius: 16,
  },
  outgoingText: {
    color: DESKTOP_THEME.grey400,
  },
  inputField: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderRadius: 20,
  },
  inputSkeleton: {
    width: 79,
    height: 8,
    borderRadius: 40,
    backgroundColor: DESKTOP_THEME.grey950,
  },
});
