import type { VirtualCameraStatus } from "electron/src/types";
import { useEffect } from "react";
import { create } from "zustand";
import {
  evaluateCameraRecordingPolicy,
  type CameraRecordingPolicy,
} from "./camera-recording-policy";

/**
 * Nothing is known yet, so nothing is enforced. Desktop replaces this as soon
 * as the first camera status arrives; mobile and web never do, and the policy
 * stays inert there — the recording notice is a desktop feature.
 */
const UNKNOWN: CameraRecordingPolicy = {
  noticeMissing: false,
  silenceAudio: false,
  reason: "notice-disabled",
  camerasInUse: [],
};

interface CameraPolicyState {
  policy: CameraRecordingPolicy;
  bannerDismissed: boolean;
}

export const useCameraPolicyStore = create<CameraPolicyState>(() => ({
  policy: UNKNOWN,
  bannerDismissed: false,
}));

function apply(status: VirtualCameraStatus): void {
  const policy = evaluateCameraRecordingPolicy({
    noticeEnabled: status.installed,
    firefliesCameraConsumers: status.consumers,
    // A dev reload can leave the renderer talking to a main process built
    // before this field existed, and a missing list must not throw.
    camerasInUse: status.camerasInUse ?? [],
  });

  // Camera status is pushed for reasons that never move the verdict — a relay
  // restart, a consumer arriving. Replacing an equal policy would re-render
  // both Live views and re-run enforcement for nothing.
  const prev = useCameraPolicyStore.getState();
  if (samePolicy(policy, prev.policy)) return;

  // When the notice is no longer missing, clear any prior dismissal so the
  // banner reappears if the notice goes missing again in a subsequent recording.
  const resetDismiss = prev.bannerDismissed && !policy.noticeMissing;
  useCameraPolicyStore.setState({
    policy,
    ...(resetDismiss && { bannerDismissed: false }),
  });
}

function samePolicy(
  left: CameraRecordingPolicy,
  right: CameraRecordingPolicy,
): boolean {
  return (
    left.noticeMissing === right.noticeMissing &&
    left.silenceAudio === right.silenceAudio &&
    left.reason === right.reason &&
    left.camerasInUse.length === right.camerasInUse.length &&
    left.camerasInUse.every((label, i) => label === right.camerasInUse[i])
  );
}

// One IPC subscription serves every consumer in the window: the banner in each
// Live view and the enforcement hook all read the same store.
let listeners = 0;
let unsubscribe: (() => void) | null = null;

function acquire(): () => void {
  listeners += 1;

  if (listeners === 1) {
    const bridge = window.electron?.virtualCamera;
    unsubscribe = bridge?.onStatusChanged(apply) ?? null;
    bridge?.getStatus().then(apply);
  }

  return () => {
    listeners -= 1;
    if (listeners > 0) return;
    unsubscribe?.();
    unsubscribe = null;
    useCameraPolicyStore.setState({ policy: UNKNOWN, bannerDismissed: false });
  };
}

/**
 * Whether the camera in use permits this recording to carry audio.
 *
 * Read-only: applying the verdict is `useCameraRecordingEnforcement`, which
 * runs only in the window that owns the recorder.
 */
export function useCameraRecordingPolicy(): CameraRecordingPolicy {
  useEffect(acquire, []);
  return useCameraPolicyStore((state) => state.policy);
}

export function useCameraNoticeBannerDismissed(): boolean {
  return useCameraPolicyStore((state) => state.bannerDismissed);
}

export function dismissCameraNoticeBanner(): void {
  useCameraPolicyStore.setState({ bannerDismissed: true });
}
