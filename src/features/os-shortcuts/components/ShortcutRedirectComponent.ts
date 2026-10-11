import * as QuickActions from "expo-quick-actions";
import { useEffect, type FC } from "react";
import { RouteNames } from "@/constants";
import { RootNavigation } from "@/screens/RootNavigation";
import { useRecorder } from "@/features/live-record";

const startRecordingActionId = "ai.fireflies.mobile.StartRecording";
const stopRecordingActionId = "ai.fireflies.mobile.StopRecording";

function handleShortcutAction(actionId: string | undefined) {
  if (actionId === startRecordingActionId) {
    RootNavigation.navigate(RouteNames.Record, {
      action: "start",
    });
  } else if (actionId === stopRecordingActionId) {
    RootNavigation.navigate(RouteNames.Record, {
      action: "stop",
    });
  }
}

export const ShortcutRedirectComponent: FC = () => {
  const recordingState = useRecorder((state) => state.status.state);

  useEffect(() => {
    if (recordingState === "inactive") {
      QuickActions.setItems([
        {
          id: startRecordingActionId,
          title: "Start Recording",
          subtitle: "Record a new meeting",
          icon: "symbol:mic.fill",
        },
      ]);
    } else {
      QuickActions.setItems([
        {
          id: stopRecordingActionId,
          title: "Stop Recording",
          icon: "symbol:stop.fill",
        },
      ]);
    }

    // initial action from cold-start
    const initialAction = QuickActions.initial;
    if (initialAction) {
      handleShortcutAction(initialAction.id);
    }

    const quickActionSubscription = QuickActions.addListener((action) => {
      handleShortcutAction(action.id);
    });

    return () => {
      quickActionSubscription.remove();
    };
  }, [recordingState]);

  return null;
};
