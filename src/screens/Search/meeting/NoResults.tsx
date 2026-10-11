import { IconGlobe, IconSearch } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { SearchIconCircle } from "../components/SearchIconCircle";

export const NoResults: FC<{
  query: string;
  matchTitleOnly: boolean;
  isScoped: boolean;
  onSearchTranscripts: () => void;
  onSearchAllMeetings: () => void;
}> = ({
  query,
  matchTitleOnly,
  isScoped,
  onSearchTranscripts,
  onSearchAllMeetings,
}) => {
  const hasFilters = matchTitleOnly || isScoped;

  return (
    <View style={styles.root}>
      <SearchIconCircle />
      <Text variant="title3Weight" color="textSecondary" style={styles.center}>
        No matches
      </Text>
      <Text variant="body2Regular" color="textMuted" style={styles.center}>
        {hasFilters
          ? `Nothing matches "${query}" with the current filters. Try widening the search:`
          : `Nothing matches "${query}". Try different keywords or check the spelling.`}
      </Text>
      {hasFilters && (
        <View style={styles.actions}>
          {matchTitleOnly && (
            <Button
              variant="outlined"
              size="md"
              Icon={IconSearch}
              onPress={onSearchTranscripts}
            >
              Search transcripts too
            </Button>
          )}
          {isScoped && (
            <Button
              variant="outlined"
              size="md"
              Icon={IconGlobe}
              onPress={onSearchAllMeetings}
            >
              Search all meetings
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  center: {
    textAlign: "center",
  },
  actions: {
    marginTop: 12,
    gap: 8,
    alignSelf: "stretch",
  },
});
