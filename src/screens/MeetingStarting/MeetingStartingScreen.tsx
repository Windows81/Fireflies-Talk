import { Button, IconButton } from "@/components/Button";
import { LoadingSpinner } from "@/components/Loading";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { useToggleUpcomingEventMutation } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import {
  IconClock,
  IconClose,
  IconMic,
  IconSparkle,
  IconVideo,
} from "@/assets/svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState, type FC } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ParamList } from "../types";

type Props = NativeStackScreenProps<ParamList, "MeetingStarting">;

export const MeetingStartingScreen: FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { meetingId, meetingTitle, meetingUrl } = route.params ?? {};

  const displayTitle = meetingTitle?.trim() || "Your meeting";

  const [isInviting, setIsInviting] = useState(false);
  const [toggleUpcomingEvent] = useToggleUpcomingEventMutation({
    errorPolicy: "none",
  });

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: RouteNames.Main }],
    });
  };

  const onStartRecording = () => {
    tracker.track(
      TRACKING_EVENTS.MEETING_START_REMINDER_START_RECORDING_TAPPED,
      {
        meetingId,
      },
    );
    navigation.reset({
      index: 1,
      routes: [
        { name: RouteNames.Main },
        {
          name: RouteNames.Record,
          params: { action: "start", title: meetingTitle },
        },
      ],
    });
  };

  const onInviteBot = async () => {
    if (!meetingId) {
      toast({
        type: "error",
        title: "Could not invite Fireflies",
        message: "Missing meeting reference",
      });
      return;
    }

    tracker.track(TRACKING_EVENTS.MEETING_START_REMINDER_INVITE_BOT_TAPPED, {
      meetingId,
    });
    setIsInviting(true);
    try {
      await toggleUpcomingEvent({
        variables: {
          meetingId,
          fredAdded: true,
          scheduleType: "mobile",
        },
      });
      toast({
        type: "success",
        message: "Fireflies invited — it will join shortly",
      });
      goHome();
    } catch (err) {
      toast({
        type: "error",
        title: "Could not invite Fireflies",
        message: (err as Error).message,
      });
    } finally {
      setIsInviting(false);
    }
  };

  const canInvite = Boolean(meetingUrl) && Boolean(meetingId);

  return (
    <SafeAreaView style={styles.root(theme)} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <IconButton
          Icon={IconClose}
          label="Close"
          variant="neutralTransparent"
          size="md"
          onPress={goHome}
          disabled={isInviting}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.iconBadge(theme)}>
          <IconClock
            width={36}
            height={36}
            color={theme.colors.commandPrimaryDefault}
          />
          <View style={styles.sparkle}>
            <IconSparkle
              width={20}
              height={20}
              color={theme.colors.commandPrimaryDefault}
            />
          </View>
        </View>

        <View style={styles.text}>
          <Text variant="heading3Weight" color="textPrimary" textAlign="center">
            {displayTitle} is starting now
          </Text>
          <Text variant="body1Regular" color="textSecondary" textAlign="center">
            What do you want to do?
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {canInvite && (
          <Button
            variant="primary"
            size="lg"
            Icon={isInviting ? undefined : IconVideo}
            onPress={onInviteBot}
            disabled={isInviting}
            style={styles.button}
          >
            {isInviting ? (
              <View style={styles.loadingContent}>
                <LoadingSpinner color={theme.colors.commandContrastDefault} />
                <Text color="commandContrastDefault" variant="body1Weight">
                  Inviting…
                </Text>
              </View>
            ) : (
              "Invite Fireflies"
            )}
          </Button>
        )}
        <Button
          variant={canInvite ? "outlined" : "primary"}
          size="lg"
          Icon={IconMic}
          onPress={onStartRecording}
          disabled={isInviting}
          style={styles.button}
        >
          Start recording
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  }),
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  iconBadge: (theme) => ({
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.layerBrandLight2,
    alignItems: "center",
    justifyContent: "center",
  }),
  sparkle: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  text: {
    gap: 8,
    maxWidth: 360,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    width: "100%",
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
