import { create } from "zustand";

interface CameraNoticeGuidanceState {
  visible: boolean;
}

/**
 * Whether the camera-notice guidance card is up. Module state for the same
 * reason as the consent setup prompt: the home screen is mounted several
 * times and only the focused copy renders overlays, while the refusal that
 * opens the card can come from any of them.
 */
export const useCameraNoticeGuidanceStore = create<CameraNoticeGuidanceState>(
  () => ({ visible: false }),
);

export function openCameraNoticeGuidance(): void {
  useCameraNoticeGuidanceStore.setState({ visible: true });
}

export function closeCameraNoticeGuidance(): void {
  useCameraNoticeGuidanceStore.setState({ visible: false });
}
