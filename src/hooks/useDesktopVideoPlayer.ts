import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "react-native";

function cleanupVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.onended = null;
  video.onerror = null;
  video.removeAttribute("src");
  video.srcObject = null;
  video.load();
  try {
    video.remove();
  } catch {
    /* already removed */
  }
}

export interface UseDesktopVideoPlayerOptions {
  /** Video source URL */
  url: string;
  /** Called when the player closes (video ended or explicit close) */
  onClose: () => void;
  /** Called on first play. Return a cleanup function for teardown. */
  onFirstPlay?: (video: HTMLVideoElement) => (() => void) | void;
  /** Show native browser controls. Default: true */
  controls?: boolean;
}

export function useDesktopVideoPlayer({
  url,
  onClose,
  onFirstPlay,
  controls = true,
}: UseDesktopVideoPlayerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const closingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const firstPlayCleanupRef = useRef<(() => void) | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onFirstPlayRef = useRef(onFirstPlay);
  onFirstPlayRef.current = onFirstPlay;

  // Pause video when window is minimized/hidden; resume when restored
  useEffect(() => {
    const pause = () => videoRef.current?.pause();
    const resume = () => {
      const v = videoRef.current;
      if (v && v.paused && v.currentTime > 0 && !closingRef.current) {
        void v.play();
      }
    };
    const cleanups = [
      window.electron?.onWindowMinimize?.(pause),
      window.electron?.onStopGlassSync?.(pause),
      window.electron?.onWindowRestore?.(resume),
      window.electron?.onResumeGlassSync?.(resume),
    ];
    return () => cleanups.forEach((c) => c?.());
  }, []);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const video = videoRef.current;
    videoRef.current = null;

    onCloseRef.current();
    firstPlayCleanupRef.current?.();
    firstPlayCleanupRef.current = null;
    cleanupVideo(video);
  }, []);

  useEffect(() => {
    if (!containerReady) return;
    const container = containerRef.current;
    if (!container || typeof container.appendChild !== "function") return;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = url;
    video.autoplay = false;
    video.playsInline = true;
    video.preload = "auto";
    if (controls) {
      video.controls = true;
      video.setAttribute("controlsList", "nodownload");
    }
    video.style.cssText =
      "width:100%;height:100%;object-fit:contain;border-radius:8px";
    video.onended = () => handleClose();

    videoRef.current = video;
    container.appendChild(video);

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      if (!video.ended && !closingRef.current) setIsPlaying(false);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    const handleFirstPlay = () => {
      video.removeEventListener("play", handleFirstPlay);
      const cleanup = onFirstPlayRef.current?.(video);
      if (typeof cleanup === "function") {
        firstPlayCleanupRef.current = cleanup;
      }
    };
    video.addEventListener("play", handleFirstPlay);

    return () => {
      video.removeEventListener("play", handleFirstPlay);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      firstPlayCleanupRef.current?.();
      firstPlayCleanupRef.current = null;
      cleanupVideo(video);
      videoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerReady]);

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const setContainerRef = useCallback((node: View | null) => {
    containerRef.current = node ? (node as unknown as HTMLDivElement) : null;
    setContainerReady(!!node);
  }, []);

  return {
    videoRef,
    setContainerRef,
    isPlaying,
    handlePlayPause,
    handleClose,
  };
}
