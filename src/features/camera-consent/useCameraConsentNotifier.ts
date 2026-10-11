import { useRecorder } from "@/features/live-record/record.store";
import { reportConsentNotice } from "@/features/recording-consent";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import {
  ClientConsentChannel,
  ClientConsentOutcome,
} from "@firefliesai/mobile-ff.graphql-client";
import { useEffect } from "react";
import { isCameraBadgeLive } from "./cameraBadgeLive";
import { useVirtualCameraStatus } from "./useVirtualCameraStatus";

/**
 * The wording on the badge composited into the outgoing feed, from
 * `electron/assets/camera-badge/chip-full.svg`. Kept alongside the report
 * because the record has to say what participants read, and the artwork itself
 * carries the text as outlined paths.
 */
const CAMERA_NOTICE_BODY = "AI Taking Notes";

/**
 * Records that the camera badge was live during a recording — the one moment
 * that proves participants were being shown the notice.
 *
 * Only a consumer count can establish this: the badge is composited by the
 * relay into a feed some other app opened, so nothing server-side can observe
 * it.
 */
export const useCameraConsentNotifier = () => {
  const { status } = useVirtualCameraStatus();
  const recordingState = useRecorder((state) => state.status.state);
  const meetingId = useRecorder((state) => state.context?.meetingId);

  const badgeLive = isCameraBadgeLive(status, recordingState);

  useEffect(() => {
    // Every window renders this screen; only one of them should file the row.
    if (!isDesktop || !isMainDesktopWindow()) return;
    if (!badgeLive || !meetingId) return;

    void reportConsentNotice({
      meetingId,
      channel: ClientConsentChannel.Camera,
      outcome: ClientConsentOutcome.Sent,
      noticeBody: CAMERA_NOTICE_BODY,
    });
  }, [badgeLive, meetingId]);
};
