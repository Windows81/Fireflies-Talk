import { IconPlus } from "@/assets/svg";
import { Button } from "@/components/Button";
import {
  LIVE_RECORDER_HEIGHT,
  NAVBAR_HEIGHT,
  RouteNames,
  useBottomInset,
} from "@/constants";
import { useOpenAddModal } from "@/features/global-modals";
import { useRecorder } from "@/features/live-record";
import { navigationRef } from "@/screens/RootNavigation";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { useMemo, useEffect, useState, type FC } from "react";

const FLOATING_MARGIN = 12;

export const FloatingAddButton: FC = () => {
  const recordingState = useRecorder((state) => state.status.state);
  const streamingState = useRecorder((state) => state.status.streamingState);
  const theme = useTheme();
  const showBottomNavBar = theme.breakpoint === Breakpoint.Small;
  const defaultBottomInset = useBottomInset();

  const openAddModal = useOpenAddModal();

  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>(
    navigationRef.current?.getCurrentRoute()?.name,
  );

  useEffect(() => {
    const unsubscribe = navigationRef.current?.addListener("state", () => {
      setCurrentRouteName(navigationRef.current?.getCurrentRoute()?.name);
    });

    return unsubscribe;
  }, []);

  const bottomInset = useMemo(() => {
    return (
      defaultBottomInset +
      FLOATING_MARGIN +
      (showBottomNavBar ? NAVBAR_HEIGHT : 0) +
      (currentRouteName === RouteNames.Notebook && showBottomNavBar ? 54 : 0) +
      (recordingState !== "inactive" || streamingState !== "inactive"
        ? LIVE_RECORDER_HEIGHT
        : 0)
    );
  }, [
    defaultBottomInset,
    recordingState,
    streamingState,
    currentRouteName,
    showBottomNavBar,
  ]);

  if (!openAddModal) {
    return null;
  }

  return (
    <Button
      Icon={IconPlus}
      style={[
        styles.button(theme),
        {
          bottom: bottomInset,
        },
      ]}
      onPress={() => {
        openAddModal("home/add-button");
      }}
    />
  );
};

export const SolidAddButton: FC = () => {
  const recordingState = useRecorder((s) => s.status.state);

  const openAddModal = useOpenAddModal();

  if (recordingState !== "inactive" || !openAddModal) {
    return null;
  }

  return (
    <Button
      Icon={IconPlus}
      onPress={() => {
        openAddModal("home/add-button");
      }}
    >
      Capture
    </Button>
  );
};

const styles = createStyles({
  button: (theme) => ({
    backgroundColor: theme.colors.commandNeutralHover,
    position: "absolute",
    right: FLOATING_MARGIN,
    width: 56,
    height: 56,
    borderRadius: 12,
  }),
});
