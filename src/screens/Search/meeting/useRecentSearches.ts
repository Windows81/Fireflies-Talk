import { useRecentList } from "./useRecentList";

const STORAGE_KEY = "search:recent:meetings";
const MAX_RECENT = 3;

export const useRecentSearches = () => useRecentList(STORAGE_KEY, MAX_RECENT);
