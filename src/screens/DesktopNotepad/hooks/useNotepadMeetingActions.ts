import { useMeetingCapabilities } from "@/features/meeting";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useMemo } from "react";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { getValidDownloadTabs } from "../components/DownloadMeeting/constants";

/**
 * Which meeting-scoped controls the nav bar can offer for the open meeting.
 * The bar needs this to decide whether the icon group and its divider are
 * worth rendering at all — a still-processing meeting you do not own has
 * neither control.
 */
export const useNotepadMeetingActions = (): {
  canDownload: boolean;
  canDelete: boolean;
} => {
  const { meeting } = useDesktopNotepadContext();
  const { canDelete } = useMeetingCapabilities(meeting as Meeting);

  const canDownload = useMemo(
    () => getValidDownloadTabs(meeting).length > 0,
    [meeting],
  );

  return { canDownload, canDelete };
};
