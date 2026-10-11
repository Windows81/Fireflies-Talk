import { Breakpoint, createStyles, useTheme } from "@/styles";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useMemo, type FC } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinkPressable } from "./LinkPressable";
import type { TabButtonProps } from "./utils";
import { getTabButtonProps } from "./utils";
import { IconRecord } from "@/assets/svg";
import { useRecordActionsContext, useRecorder } from "@/features/live-record";
import { Tooltip } from "@/features/tooltip";
import { Button } from "@/components/Button";
import { useAuth } from "@/features/auth";
import { NAVBAR_HEIGHT, RouteNames, useBottomInset } from "@/constants";
import { AnimatedAudioWave } from "@/components/AnimatedAudioWave";
import { Platform, View } from "react-native";
import { HomeScreenWalkthroughTarget } from "@/screens/Home/HomeScreenWalkthrough";

const BOTTOM_PADDING = Platform.select({
  android: 6,
  default: 0,
});

const TabBarButton: FC<TabButtonProps> = ({
  title,
  name,
  focused,
  Icon,
  onPress,
  onLongPress,
}) => {
  const theme = useTheme();

  return (
    <LinkPressable
      aria-selected={focused}
      aria-label={title}
      style={styles.button}
      onPress={onPress}
      onLongPress={onLongPress}
      href={name}
    >
      <View
        style={[styles.iconContainer, focused && styles.iconFocused(theme)]}
      >
        <Icon
          width={24}
          height={24}
          color={
            focused ? theme.colors.commandPrimaryDefault : theme.colors.textHint
          }
        />
      </View>
    </LinkPressable>
  );
};

const RecordButton: FC = () => {
  const theme = useTheme();
  const recordingState = useRecorder((state) => state.status.state);
  const { startRecording, expandFloatingCard } = useRecordActionsContext();
  const { user } = useAuth();

  const onRecordPress = useCallback(() => {
    if (recordingState !== "inactive") {
      expandFloatingCard();
    } else {
      startRecording();
    }
  }, [recordingState, startRecording, expandFloatingCard]);

  const OneTapRecordIcon = useMemo(() => {
    if (recordingState === "inactive") {
      return (
        <IconRecord width={20} color={theme.colors.commandContrastDefault} />
      );
    } else {
      return <AnimatedAudioWave recordingState={recordingState} />;
    }
  }, [recordingState, theme.colors.commandContrastDefault]);

  return (
    <HomeScreenWalkthroughTarget stepKey="record">
      <Tooltip
        tooltipKey="record-button-intro"
        title="One-Tap Record"
        description="Now easily record your conversations in just a tap."
        placement="top"
        disabled={!user}
        delay={1000}
      >
        <Button
          style={[
            styles.recordButton,
            recordingState !== "inactive" && styles.ongoingRecordButton(theme),
          ]}
          onPress={onRecordPress}
          aria-label="Start recording"
        >
          {OneTapRecordIcon}
        </Button>
      </Tooltip>
    </HomeScreenWalkthroughTarget>
  );
};

export const TabBar: FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useTheme();
  const bottomInset = useBottomInset();

  if (theme.breakpoint >= Breakpoint.Medium) return null;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[
        styles.root(theme),
        { height: NAVBAR_HEIGHT + bottomInset + BOTTOM_PADDING },
      ]}
      aria-label="Bottom tab navigator"
    >
      {state.routes.map((route, index) => {
        const button = (
          <TabBarButton
            key={route.key}
            {...getTabButtonProps(state, navigation, descriptors, route, index)}
          />
        );

        const wrappedButton =
          route.name === RouteNames.Calendar ? (
            <HomeScreenWalkthroughTarget key={route.key} stepKey="calendar">
              {button}
            </HomeScreenWalkthroughTarget>
          ) : (
            button
          );

        // Insert record button to the middle
        if (index === 2) {
          return (
            <React.Fragment key={`fragment-${index}`}>
              <RecordButton />
              {wrappedButton}
            </React.Fragment>
          );
        }

        return wrappedButton;
      })}
    </SafeAreaView>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    backgroundColor: theme.colors.pageBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStaticSubtle,
  }),
  button: {
    paddingVertical: 10,
    height: NAVBAR_HEIGHT,
    justifyContent: "center",
  },
  ongoingRecordButton: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  recordButton: {
    height: 44,
    width: 56,
    marginTop: 10,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  iconContainer: {
    height: 44,
    width: 44,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  iconFocused: (theme) => ({
    backgroundColor: theme.colors.layerBrandLight2,
    borderRadius: 8,
  }),
});
