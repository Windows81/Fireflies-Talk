import * as NativeCode from "@/modules/native-code";
import { createDirectoryIfNotExist } from "@/utils/file";
import type { GetSoundbitesQuery } from "@firefliesai/bites-ff.graphql-client";
import type {
  GetMeetingQuery,
  GetMeetingSummaryQueryQuery,
} from "@firefliesai/mobile-ff.graphql-client";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export const DOWNLOADS_DIRECTORY = `${Platform.OS === "web" ? "fireflies://" : Paths.document.uri}downloads/`;

// Payloads are stored in <appDocumentDirectory>/downloads/<meetingId>/payload.json
export interface DownloadPayload {
  meeting: GetMeetingQuery["meeting"];
  summary: GetMeetingSummaryQueryQuery["meetingSummary"] | null;
  soundbites: GetSoundbitesQuery["soundbites"] | null;
  savedAt: number;
}

export const getMeetingDirectory = (meetingId: string) =>
  `${DOWNLOADS_DIRECTORY}${meetingId}/`;

export const getPayloadUri = (meetingId: string) =>
  `${getMeetingDirectory(meetingId)}payload.json`;

export const getMediaUri = (meetingId: string, mediaType: "video" | "audio") =>
  `${getMeetingDirectory(meetingId)}media.${mediaType === "video" ? "mp4" : "mp3"}`;

// One disk read + parse per meeting, shared across the hook instances that
// mount together (screen, summary, bites). Writes and deletes invalidate.
const payloadReads = new Map<string, Promise<DownloadPayload | null>>();

export async function writePayload(
  meetingId: string,
  payload: DownloadPayload,
) {
  await createDirectoryIfNotExist(getMeetingDirectory(meetingId));
  // Re-downloadable content must be excluded from iCloud backup per Apple's guidelines
  NativeCode.setExcludedFromBackup(DOWNLOADS_DIRECTORY);
  new File(getPayloadUri(meetingId)).write(JSON.stringify(payload));
  payloadReads.delete(meetingId);
}

// Online, apolloCacheConfig materializes these Meeting fields as Date objects;
// the JSON round-trip flattens them to ISO strings, so readers revive them to
// match the online shape (e.g. MeetingMetadata calls startTime.getFullYear()).
const MEETING_DATE_FIELDS = [
  "startTime",
  "endTime",
  "fredJoinedMeetingAt",
] as const;

export function readPayload(
  meetingId: string,
): Promise<DownloadPayload | null> {
  let read = payloadReads.get(meetingId);
  if (!read) {
    read = readPayloadFromDisk(meetingId);
    payloadReads.set(meetingId, read);
  }
  return read;
}

async function readPayloadFromDisk(
  meetingId: string,
): Promise<DownloadPayload | null> {
  try {
    const payload: DownloadPayload = JSON.parse(
      await new File(getPayloadUri(meetingId)).text(),
    );
    if (payload.meeting) {
      for (const field of MEETING_DATE_FIELDS) {
        const value = payload.meeting[field];
        if (value) payload.meeting[field] = new Date(value);
      }
    }
    return payload;
  } catch {
    return null;
  }
}

export function deleteMeetingDir(meetingId: string) {
  payloadReads.delete(meetingId);
  const dir = new Directory(getMeetingDirectory(meetingId));
  if (dir.exists) dir.delete();
}

export function deleteMediaFile(
  meetingId: string,
  mediaType: "video" | "audio",
) {
  const file = new File(getMediaUri(meetingId, mediaType));
  if (file.exists) file.delete();
}

export function dirSizeBytes(meetingId: string): number {
  try {
    return new Directory(getMeetingDirectory(meetingId)).size ?? 0;
  } catch {
    return 0;
  }
}
