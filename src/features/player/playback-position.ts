import { storage } from "@/features/storage";

const STORAGE_KEY = "ff-playback-positions";
const MAX_STORED_POSITIONS = 100;
const MINIMUM_POSITION_TO_STORE_SECONDS = 10;
const NEAR_END_THRESHOLD_SECONDS = 30;

interface StoredPlaybackPosition {
  position: number;
  updatedAt: number;
}

type StoredPlaybackPositions = Record<string, StoredPlaybackPosition>;

const readStoredPositions = (): StoredPlaybackPositions => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredPlaybackPositions;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredPositions = (positions: StoredPlaybackPositions) => {
  const entries = Object.entries(positions).slice(-MAX_STORED_POSITIONS);
  storage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
};

export const isPositionWorthStoring = (position: number, duration: number) => {
  if (!isFinite(position) || position < MINIMUM_POSITION_TO_STORE_SECONDS) {
    return false;
  }
  const hasKnownDuration = isFinite(duration) && duration > 0;
  return !hasKnownDuration || position < duration - NEAR_END_THRESHOLD_SECONDS;
};

export const getPlaybackPosition = (mediaKey: string): number | null => {
  const stored = readStoredPositions()[mediaKey];
  if (!stored || !isFinite(stored.position)) return null;
  return stored.position;
};

export const clearPlaybackPosition = (mediaKey: string) => {
  const positions = readStoredPositions();
  if (!(mediaKey in positions)) return;
  delete positions[mediaKey];
  writeStoredPositions(positions);
};

export const savePlaybackPosition = (
  mediaKey: string,
  position: number,
  duration: number,
) => {
  if (!isPositionWorthStoring(position, duration)) {
    clearPlaybackPosition(mediaKey);
    return;
  }
  const positions = readStoredPositions();
  delete positions[mediaKey];
  positions[mediaKey] = { position, updatedAt: Date.now() };
  writeStoredPositions(positions);
};
