import {
  RecordAudioView,
  RecordControls,
  RecordingWaveform,
  useRecordActionsContext,
} from "@/features/live-record";
import { AnnounceNewsCard } from "@/features/live-record/components/AnnounceNewsCard";
import { WidgetInstructionsSheet } from "@/features/live-record/components/WidgetInstructionsSheet";
import { createStyles, useTheme } from "@/styles";
import {
  type RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useLayoutEffect, useState, type FC } from "react";
import { Platform, View } from "react-native";
import type { ParamList } from "../types";
import { promptConfirmation } from "@/components/Dialog";
import { LinearGradient } from "expo-linear-gradient";
import { isDesktop } from "@/utils/device";
import { tracker, TRACKING_EVENTS } from "@/tracking";

export const RecordView: FC = () => {
  const { stopRecording, startRecording, setStartInputs } =
    useRecordActionsContext();
  const route = useRoute<RouteProp<ParamList, "Record">>();
  const navigation = useNavigation();
  const theme = useTheme();
  const [isWidgetSheetOpen, setIsWidgetSheetOpen] = useState(false);

  useLayoutEffect(() => {
    if (route.params?.title) {
      setStartInputs((prev) => ({ ...prev, title: route.params!.title! }));
    }
    if (!route.params?.action) return;
    const { action, source } = route.params;

    if (source) {
      tracker.track(TRACKING_EVENTS.WIDGET_RECORDING_ACTION, {
        action,
        source,
      });
    }

    if (action === "stop") {
      promptConfirmation({
        title: "Stop recording?",
        cancelText: "No, continue",
        confirmText: "Stop recording",
        onConfirm: stopRecording,
      });
    } else if (action === "start") {
      startRecording();
    }
    navigation.setParams({ action: undefined, title: undefined });
  }, [navigation, route.params, stopRecording, startRecording, setStartInputs]);

  return (
    <View style={styles.root}>
      {Platform.OS === "web" ? (
        <LinearGradient
          colors={[
            theme.colors.layerBrandLight2,
            theme.colors.borderStaticTransparent,
          ]}
          style={styles.gradientHeader}
        />
      ) : (
        <RecordingWaveform />
      )}
      <View style={styles.body}>
        <RecordAudioView />
        <RecordControls />
      </View>
      {Platform.OS !== "web" && (
        <AnnounceNewsCard onPress={() => setIsWidgetSheetOpen(true)} />
      )}
      <WidgetInstructionsSheet
        isOpen={isWidgetSheetOpen}
        close={() => setIsWidgetSheetOpen(false)}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
  },
  gradientHeader: {
    flex: 1,
    height: isDesktop ? 600 : 100,
    width: "100%",
    position: "absolute",
  },
});
