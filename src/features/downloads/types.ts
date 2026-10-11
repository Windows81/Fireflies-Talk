import type { Source } from "@/graphql";

// String-valued so MMKV round-trips them as-is (no mapping code); in code we
// always work with the enum members.
export enum MediaDownloadMode {
  VIDEO = "video",
  AUDIO = "audio",
  OFF = "off",
}

export interface DownloadSettings {
  autoDownloadEnabled: boolean;
  wifiMode: MediaDownloadMode;
  cellularMode: MediaDownloadMode;

  //Caps the automatic download cache only — saved downloads are uncapped
  maxCacheBytes: number;
}

export type SourceSnapshot = Omit<Source, "audio_url">;

export enum DownloadStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETE = "complete",
  FAILED = "failed",
}

export type DownloadEntryStatus =
  | { state: DownloadStatus.PENDING }
  | { state: DownloadStatus.IN_PROGRESS; progress: number }
  | { state: DownloadStatus.FAILED }
  | {
      state: DownloadStatus.COMPLETE;
      downloadedAt: number;
      sizeBytes: number;
      fileType: "video" | "audio" | "json";
    };

export type DownloadEntry = {
  // Meeting id from server
  meetingId: string;

  // Owner scoping: downloads survive logout but are only visible to (and
  // refreshed by) the account that downloaded them.
  userId: string;

  // Defines whether this download was done automatically by the app or
  // manually by ther user.
  isManual: boolean;

  // Defines where's this cached element will live - feed or notebook.
  target: "feed" | "notebook";

  snapshot: SourceSnapshot;
  status: DownloadEntryStatus;

  // Retention clock: refreshed on every scan while the meeting still appears
  // among the user's recents. Absent on manual saves and pre-existing entries
  // (expiry falls back to downloadedAt).
  lastSeenAt?: number;
};
