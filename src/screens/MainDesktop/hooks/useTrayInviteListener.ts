import { useEffect, useState } from "react";
import { useInviteNotetaker } from "./useInviteNotetaker";

interface UseTrayInviteListenerResult {
  isInvitePanelOpen: boolean;
  invitePrefilledUrl: string | undefined;
  setIsInvitePanelOpen: (open: boolean) => void;
  setInvitePrefilledUrl: (url: string | undefined) => void;
}

/**
 * Wires up tray IPC invite events:
 * - onOpenInviteModal: opens the invite panel (URL unknown — user enters manually)
 * - onInviteBotDirectly: invites immediately without showing the panel
 */
export function useTrayInviteListener(): UseTrayInviteListenerResult {
  const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);
  const [invitePrefilledUrl, setInvitePrefilledUrl] = useState<
    string | undefined
  >();

  const { invite } = useInviteNotetaker("tray-invite");

  useEffect(() => {
    const cleanupModal = window.electron?.tray?.onOpenInviteModal?.((url) => {
      setInvitePrefilledUrl(url);
      setIsInvitePanelOpen(true);
    });
    const cleanupBot = window.electron?.tray?.onInviteBotDirectly?.((url) => {
      invite(url);
    });
    return () => {
      cleanupModal?.();
      cleanupBot?.();
    };
  }, [invite]);

  return {
    isInvitePanelOpen,
    invitePrefilledUrl,
    setIsInvitePanelOpen,
    setInvitePrefilledUrl,
  };
}
