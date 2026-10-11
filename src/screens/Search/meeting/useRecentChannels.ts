import { useRecentList } from "./useRecentList";

const STORAGE_KEY = "search:recent:channels";
const MAX_RECENT = 2;

/** Most-recently applied channel ids (excludes the built-in scopes). */
export const useRecentChannels = () => useRecentList(STORAGE_KEY, MAX_RECENT);
