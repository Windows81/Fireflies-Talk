import AsyncStorage from "@react-native-async-storage/async-storage";
import { captureException } from "@/errors";
import { useAuth } from "@/features/auth";
import {
  createMeetingForUpload,
  uploadApi,
  UPLOAD_CLIENT_KEYS,
  useUpload,
} from "@/features/upload";
import * as AiPin from "@/modules/ai-pin";
import type { AiPinDownloadedFile, AiPinFile } from "@/modules/ai-pin";

const SYNC_KEY_PREFIX = "@fireflies/ai-pin/sync";
const MP3_BIT_RATE = 32_000;
const MAX_FILE_SIZE = 512 * 1024 * 1024;
const MAX_FILES_PER_SYNC = 20;
const MAX_BYTES_PER_SYNC = 1024 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 2 * 60 * 60 * 1000;

interface SyncRecord {
  meetingId?: string;
  status: "downloaded" | "meeting-created" | "uploading" | "uploaded";
  sha256?: string;
}

export interface AiPinSyncProgress {
  phase: "listing" | "downloading" | "uploading" | "complete";
  completed: number;
  total: number;
  filename?: string;
  progress?: number;
}

const storageKey = (userId: string, serial: string, file: AiPinFile) =>
  `${SYNC_KEY_PREFIX}/${encodeURIComponent(userId)}/${serial}/${file.filename}:${file.size}`;

function isSyncRecord(value: unknown): value is SyncRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<SyncRecord>;
  return (
    ["downloaded", "meeting-created", "uploading", "uploaded"].includes(
      record.status ?? "",
    ) &&
    (!record.meetingId || typeof record.meetingId === "string") &&
    (!record.sha256 || /^[a-f0-9]{64}$/.test(record.sha256))
  );
}

async function readRecord(userId: string, serial: string, file: AiPinFile) {
  const key = storageKey(userId, serial, file);
  const value = await AsyncStorage.getItem(key);
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (isSyncRecord(parsed)) return parsed;
  } catch {
    // Corrupt local state must not permanently block recorder discovery.
  }
  await AsyncStorage.removeItem(key);
  return undefined;
}

async function writeRecord(
  userId: string,
  serial: string,
  file: AiPinFile,
  record: SyncRecord,
) {
  await AsyncStorage.setItem(
    storageKey(userId, serial, file),
    JSON.stringify(record),
  );
}

function assertActiveUser(userId: string) {
  if (useAuth.getState().user?.id !== userId) {
    throw new Error(
      "AI Pin sync stopped because the signed-in account changed.",
    );
  }
}

function validateFile(value: unknown): AiPinFile {
  const file = value as Partial<AiPinFile>;
  if (
    !file ||
    typeof file.filename !== "string" ||
    !/^\d{14}$/.test(file.filename) ||
    typeof file.size !== "number" ||
    !Number.isSafeInteger(file.size) ||
    file.size < 1 ||
    file.size > MAX_FILE_SIZE
  ) {
    throw new Error("The AI Pin returned invalid recording metadata.");
  }
  return { filename: file.filename, size: file.size };
}

function validateDownload(value: AiPinDownloadedFile, expected: AiPinFile) {
  if (
    value.filename !== expected.filename ||
    value.size !== expected.size ||
    value.mimeType !== "audio/mpeg" ||
    !value.uri.startsWith("file:") ||
    !/^[a-f0-9]{64}$/.test(value.sha256)
  ) {
    throw new Error("The downloaded recording did not match its BLE metadata.");
  }
  return value;
}

export function parseRecordingTime(filename: string) {
  if (!/^\d{14}$/.test(filename)) return undefined;
  const values = [
    Number(filename.slice(0, 4)),
    Number(filename.slice(4, 6)),
    Number(filename.slice(6, 8)),
    Number(filename.slice(8, 10)),
    Number(filename.slice(10, 12)),
    Number(filename.slice(12, 14)),
  ] as const;
  const [year, month, day, hour, minute, second] = values;
  const date = new Date(year, month - 1, day, hour, minute, second);
  const matches =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;
  return matches ? date : undefined;
}

function recordingTitle(filename: string) {
  const date = parseRecordingTime(filename);
  if (!date) return "AI Pin recording";
  const formatted = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `AI Pin - ${formatted}`;
}

function awaitUpload(
  meetingId: string,
  start: (onCompleted: () => void, onError: (error: Error) => void) => void,
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      if (error) reject(error);
      else resolve();
    };
    const inspect = () => {
      const task = useUpload
        .getState()
        .uploads.find((upload) => upload.id === meetingId);
      if (task?.status === "completed") finish();
      if (task?.status === "failed") finish(new Error("AI Pin upload failed."));
    };
    const unsubscribe = useUpload.subscribe(inspect);
    const timeout = setTimeout(
      () => finish(new Error("AI Pin upload timed out.")),
      UPLOAD_TIMEOUT_MS,
    );
    start(
      () => finish(),
      (error) => finish(error),
    );
    inspect();
  });
}

async function uploadFile(
  userId: string,
  serial: string,
  file: AiPinDownloadedFile,
) {
  assertActiveUser(userId);
  const stored = await readRecord(userId, serial, file);
  if (stored?.sha256 && stored.sha256 !== file.sha256) {
    throw new Error("The recorder returned different bytes for the same file.");
  }
  // Native validation pins the stream to the captured 32 kbps, 16 kHz mono contract.
  const durationMillis = Math.round((file.size * 8 * 1000) / MP3_BIT_RATE);
  const startTime = parseRecordingTime(file.filename);
  const endTime = startTime
    ? new Date(startTime.getTime() + durationMillis)
    : undefined;
  const title = recordingTitle(file.filename);
  let meetingId = stored?.meetingId;

  if (!meetingId) {
    const meeting = await createMeetingForUpload({
      title,
      startTime,
      endTime,
      client: UPLOAD_CLIENT_KEYS.MOBILE_RECORD,
    });
    if (!meeting?.id) throw new Error("Could not create the AI Pin meeting.");
    meetingId = meeting.id;
    await writeRecord(userId, serial, file, {
      meetingId,
      sha256: file.sha256,
      status: "meeting-created",
    });
  }

  assertActiveUser(userId);
  await writeRecord(userId, serial, file, {
    meetingId,
    sha256: file.sha256,
    status: "uploading",
  });
  await awaitUpload(meetingId, (onCompleted, onError) => {
    void uploadApi
      .create(
        { uri: file.uri, mimeType: file.mimeType, size: file.size },
        {
          meetingId,
          title,
          uploadType: "recording",
          durationMillis,
          audioSamplingRate: 16_000,
          onCompleted,
          onError,
        },
      )
      .catch(onError);
  });
  assertActiveUser(userId);
  await writeRecord(userId, serial, file, {
    meetingId,
    sha256: file.sha256,
    status: "uploaded",
  });
  if (!(await AiPin.removeDownload(file.filename))) {
    captureException(new Error("AI Pin recording cleanup failed"), {
      tags: { section: "ai-pin-sync" },
    });
  }
}

export async function syncAiPinRecordings(
  userId: string,
  serial: string,
  onProgress: (progress: AiPinSyncProgress) => void,
) {
  assertActiveUser(userId);
  onProgress({ phase: "listing", completed: 0, total: 0 });
  const rawFiles: unknown = await AiPin.listFiles();
  if (!Array.isArray(rawFiles)) throw new Error("Invalid AI Pin file list.");
  const files = rawFiles.map(validateFile);
  const pending: AiPinFile[] = [];
  let selectedBytes = 0;

  for (const file of files) {
    const record = await readRecord(userId, serial, file);
    if (
      record?.status !== "uploaded" &&
      pending.length < MAX_FILES_PER_SYNC &&
      selectedBytes + file.size <= MAX_BYTES_PER_SYNC
    ) {
      pending.push(file);
      selectedBytes += file.size;
    }
  }

  for (const [index, file] of pending.entries()) {
    assertActiveUser(userId);
    onProgress({
      phase: "downloading",
      completed: index,
      total: pending.length,
      filename: file.filename,
      progress: 0,
    });
    const downloaded = validateDownload(
      await AiPin.download(file.filename, file.size),
      file,
    );
    const previous = await readRecord(userId, serial, file);
    await writeRecord(userId, serial, file, {
      status: "downloaded",
      sha256: downloaded.sha256,
      meetingId: previous?.meetingId,
    });
    onProgress({
      phase: "uploading",
      completed: index,
      total: pending.length,
      filename: file.filename,
      progress: 0,
    });
    await uploadFile(userId, serial, downloaded);
  }

  onProgress({
    phase: "complete",
    completed: pending.length,
    total: pending.length,
  });
  return pending.length;
}
