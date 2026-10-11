import { ErrorScreen, NotFoundScreen } from "@/components/Error";
import { LoadingScreen } from "@/components/Loading";
import { shouldRetryError } from "@/errors";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, type FC } from "react";
import type { ParamList } from "../types";
import { NOTEPAD_FROM_RECORDING_REF } from "./constants";
import { DesktopNotepadContent } from "./DesktopNotepadContent";
import { useDesktopNotepadMeeting } from "./hooks/useDesktopNotepadMeeting";
import { useIsDesktopNotepadEnabled } from "./hooks/useIsDesktopNotepadEnabled";

export const DesktopNotepadScreen: FC<
  NativeStackScreenProps<ParamList, "DesktopNotepad">
> = ({ route, navigation }) => {
  const isEnabled = useIsDesktopNotepadEnabled();

  const { meeting, loading, error, refetch } = useDesktopNotepadMeeting(
    route.params.id,
  );

  // Latch the recording ref before it is stripped so rename mode survives the
  // post-load param clear and screen-instance reuse across navigations.
  const fromRecordingLatch = useRef(
    route.params.ref === NOTEPAD_FROM_RECORDING_REF,
  );
  const prevMeetingIdRef = useRef(route.params.id);
  if (route.params.ref === NOTEPAD_FROM_RECORDING_REF) {
    fromRecordingLatch.current = true;
    prevMeetingIdRef.current = route.params.id;
  } else if (prevMeetingIdRef.current !== route.params.id) {
    fromRecordingLatch.current =
      route.params.ref === NOTEPAD_FROM_RECORDING_REF;
    prevMeetingIdRef.current = route.params.id;
  }
  const fromRecording = fromRecordingLatch.current;

  const prevRefParam = useRef(route.params.ref);
  const contentSessionRef = useRef(0);
  if (
    route.params.ref === NOTEPAD_FROM_RECORDING_REF &&
    prevRefParam.current !== NOTEPAD_FROM_RECORDING_REF
  ) {
    contentSessionRef.current += 1;
  }
  prevRefParam.current = route.params.ref;

  useEffect(() => {
    if (meeting && route.params.ref !== undefined) {
      navigation.setParams({ ref: undefined });
    }
  }, [meeting, navigation, route.params.ref]);

  useEffect(() => {
    if (!isEnabled && navigation.canGoBack()) navigation.goBack();
  }, [isEnabled, navigation]);

  if (!isEnabled) {
    return null;
  }

  if (!meeting && loading) {
    return <LoadingScreen />;
  }

  if (!meeting && error) {
    return (
      <ErrorScreen
        description={error.message}
        retry={shouldRetryError(error) ? refetch : undefined}
      />
    );
  }

  if (!meeting) {
    return (
      <NotFoundScreen
        title="Meeting not found"
        description="It does not exist or you do not have access"
      />
    );
  }

  return (
    <DesktopNotepadContent
      key={`${meeting.id}-${contentSessionRef.current}`}
      meeting={meeting}
      fromRecording={fromRecording}
    />
  );
};
