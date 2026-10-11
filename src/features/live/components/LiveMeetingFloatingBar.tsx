import { IconBot, IconChevronUp } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { getWebConfIcon } from "@/constants";
import type { MeetingStatusData } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { useAppState } from "@/utils/app-state";
import { format } from "date-fns";
import { Image } from "expo-image";
import { useEffect, type FC } from "react";
import { Linking, Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Collapsed bar for an in-progress bot meeting: web-conf icon · title +
 * LIVE badge + start time · chevron. Tapping it expands into the live UI.
 */
export const LiveMeetingFloatingBar: FC<{
  meeting: MeetingStatusData;
  onPress: () => void;
}> = ({ meeting, onPress }) => {
  const theme = useTheme();
  const webConfIcon = getWebConfIcon(meeting.url);
  const startedAt = meeting.startTime
    ? format(new Date(meeting.startTime), "h:mm a")
    : "";

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.barMain}
        onPress={onPress}
        aria-label="Open live meeting"
        role="button"
      >
        <View style={styles.confBadge(theme)}>
          {webConfIcon ? (
            <Image
              source={webConfIcon.src}
              alt={webConfIcon.name}
              style={styles.confIcon}
            />
          ) : (
            <IconBot width={24} height={24} color={theme.colors.textMuted} />
          )}
        </View>
        <View style={styles.barTexts}>
          <Text variant="body2Weight" color="textPrimary" numberOfLines={1}>
            {meeting.title || "Untitled Meeting"}
          </Text>
          <View style={styles.subtitleRow}>
            {!!startedAt && (
              <Text variant="body2Regular" color="textMuted" numberOfLines={1}>
                Started {startedAt}
              </Text>
            )}
            <LiveBadge />
          </View>
        </View>
      </Pressable>
      {meeting.url && (
        <Button
          variant="secondary"
          size="sm"
          style={styles.joinButton}
          onPress={() => {
            void Linking.openURL(meeting.url as string);
          }}
        >
          Join
        </Button>
      )}
      <Pressable
        style={styles.chevronArea}
        onPress={onPress}
        aria-hidden
        accessible={false}
      >
        <IconChevronUp width={20} height={20} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
};

const PULSE_TIMING = { duration: 700, easing: Easing.inOut(Easing.ease) };

/** LIVE pill with a softly pulsing dot while the app is in the foreground. */
const LiveBadge: FC = () => {
  const theme = useTheme();
  const appState = useAppState();
  const pulse = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(pulse);
    // Keep animations off in the background to avoid ANRs.
    pulse.value =
      appState === "active"
        ? withRepeat(withTiming(0.3, PULSE_TIMING), -1, true)
        : withTiming(1, { duration: 200 });
  }, [appState, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.liveBadge(theme)}>
      <Animated.View style={[styles.liveDot(theme), dotStyle]} />
      <Text variant="label2Weight" style={styles.liveText(theme)}>
        LIVE
      </Text>
    </View>
  );
};

const styles = createStyles({
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  barMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    paddingLeft: 16,
  },
  joinButton: {
    marginLeft: 12,
  },
  chevronArea: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingLeft: 12,
    paddingRight: 16,
  },
  confBadge: (theme) => ({
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  confIcon: {
    width: 24,
    height: 24,
  },
  barTexts: {
    flex: 1,
    gap: 2,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveBadge: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.rainbowStaticOrangeSubtle,
  }),
  liveDot: (theme) => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.rainbowStaticOrangeText,
  }),
  liveText: (theme) => ({
    color: theme.colors.rainbowStaticOrangeText,
  }),
});
