import {
  IconBot,
  IconChrome,
  IconDesktop,
  IconMic,
  IconUpload,
} from "@/assets/svg";
import { IconButton } from "@/components/Button";
import type { FC } from "react";

export const MEETING_SOURCE = {
  CHROME_EXTENSION_V2: "chrome-extension-v2",
  CHROME_EXTENSION_V3: "chrome-extension-v3",
  MEDIA_STORAGE: "media-storage",
  MEDIA_STORAGE_V2: "media-storage-an-v2",
  MOBILE_RECORD: "mobile-record",
  MOBILE_UPLOAD: "mobile-upload",
  DESKTOP_RECORD: "desktop-record",
  DESKTOP_UPLOAD: "desktop-upload",
  AUTOPILOT_AGENT: "autopilot-agent",
} as const;

interface AddedByInfoProps {
  addedBy: string | null | undefined;
}

export const AddedByInfo: FC<AddedByInfoProps> = ({ addedBy }) => {
  const isChromeExtensionMeeting = (
    [
      MEETING_SOURCE.CHROME_EXTENSION_V2,
      MEETING_SOURCE.CHROME_EXTENSION_V3,
      MEETING_SOURCE.MEDIA_STORAGE,
    ] as string[]
  ).includes(addedBy ?? "");
  const isAutopilotMeeting = addedBy === MEETING_SOURCE.AUTOPILOT_AGENT;
  const isMobileRecordMeeting = addedBy === MEETING_SOURCE.MOBILE_RECORD;
  const isDesktopRecordMeeting = addedBy === MEETING_SOURCE.DESKTOP_RECORD;
  const isUpload =
    addedBy === MEETING_SOURCE.MEDIA_STORAGE_V2 ||
    addedBy === MEETING_SOURCE.MOBILE_UPLOAD ||
    addedBy === MEETING_SOURCE.DESKTOP_UPLOAD;

  const iconProps = {
    width: 14,
    height: 14,
    color: "rgba(255, 255, 255, 0.6)",
  };

  if (isChromeExtensionMeeting) {
    return (
      <IconButton
        label="Recorded with browser extension"
        Icon={() => <IconChrome {...iconProps} />}
        variant="neutralTransparent"
        hoverLabel="Recorded with browser extension"
        size="xs"
      />
    );
  }

  if (isAutopilotMeeting) {
    return (
      <IconButton
        label="AI Teammate meeting"
        Icon={() => <IconBot {...iconProps} />}
        variant="neutralTransparent"
        hoverLabel="AI Teammate meeting"
        size="xs"
      />
    );
  }

  if (isMobileRecordMeeting) {
    return (
      <IconButton
        label="Recorded with mobile app"
        Icon={() => <IconMic {...iconProps} />}
        variant="neutralTransparent"
        hoverLabel="Recorded with mobile app"
        size="xs"
      />
    );
  }

  if (isDesktopRecordMeeting) {
    return (
      <IconButton
        label="Recorded with desktop app"
        Icon={() => <IconDesktop {...iconProps} />}
        variant="neutralTransparent"
        hoverLabel="Recorded with desktop app"
        size="xs"
      />
    );
  }

  if (isUpload) {
    return (
      <IconButton
        label="File uploaded"
        Icon={() => <IconUpload {...iconProps} />}
        variant="neutralTransparent"
        hoverLabel="File uploaded"
        size="xs"
      />
    );
  }

  return null;
};
