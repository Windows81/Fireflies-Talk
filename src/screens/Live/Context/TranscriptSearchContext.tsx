import { createContext, useCallback, useContext, useState } from "react";
import type { Caption } from "@/features/transcript";
import type { TranscriptMarks } from "@/components/Transcript";
import { computeTextSearchFilter } from "@/components/Transcript";
import { tracker, TRACKING_EVENTS } from "@/tracking";

interface TranscriptSearchContextType {
  searchText: string;
  setSearchText: (text: string, captions?: Caption[]) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  searchResults: {
    marks: TranscriptMarks;
    includedIndexes: number[];
  };
}

const TranscriptSearchContext = createContext<TranscriptSearchContextType>({
  searchText: "",
  setSearchText: () => {},
  clearSearch: () => {},
  isSearchActive: false,
  setIsSearchActive: () => {},
  searchResults: { marks: {}, includedIndexes: [] },
});

export const useTranscriptSearch = () => useContext(TranscriptSearchContext);

export const TranscriptSearchProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [searchText, setSearchText] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    marks: TranscriptMarks;
    includedIndexes: number[];
  }>({ marks: {}, includedIndexes: [] });

  const handleSetSearchText = useCallback(
    (text: string, captions?: Caption[]) => {
      setSearchText(text);

      if (text.trim() && captions?.length) {
        const results = computeTextSearchFilter(captions, text);
        setSearchResults(results);
        tracker.track(TRACKING_EVENTS.LIVE_TRANSCRIPT_SEARCHED);
      } else {
        setSearchResults({ marks: {}, includedIndexes: [] });
      }
    },
    [setSearchText, setSearchResults],
  );

  const clearSearch = useCallback(() => {
    setSearchText("");
    setIsSearchActive(false);
    setSearchResults({ marks: {}, includedIndexes: [] });
  }, []);

  return (
    <TranscriptSearchContext.Provider
      value={{
        searchText,
        setSearchText: handleSetSearchText,
        clearSearch,
        isSearchActive,
        setIsSearchActive,
        searchResults,
      }}
    >
      {children}
    </TranscriptSearchContext.Provider>
  );
};
