import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconX,
} from "@/assets/svg";
import { TextInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import type { TranscriptSearchState } from "../../hooks/useTranscriptSearch";

export const NotepadTranscriptSearch: FC<{ search: TranscriptSearchState }> = ({
  search,
}) => {
  const theme = useTheme();
  const hasQuery = search.query.trim().length > 0;
  const hasMatches = search.matchCount > 0;

  return (
    <View style={styles.wrapper}>
      <TextInput
        Icon={IconSearch}
        placeholder="Find in transcript"
        variant="filled"
        style={styles.field}
        value={search.query}
        onValueChange={search.setQuery}
        trailing={
          hasQuery ? (
            <View style={styles.trailing}>
              <Text variant="body2Regular" color="textHint">
                {`${search.activeMatchNumber}/${search.matchCount}`}
              </Text>
              <Pressable
                onPress={search.goPrev}
                disabled={!hasMatches}
                style={styles.navButton}
                aria-label="Previous match"
              >
                <IconChevronUp
                  width={16}
                  height={16}
                  color={
                    hasMatches
                      ? theme.colors.textSecondary
                      : theme.colors.textDisabled
                  }
                />
              </Pressable>
              <Pressable
                onPress={search.goNext}
                disabled={!hasMatches}
                style={styles.navButton}
                aria-label="Next match"
              >
                <IconChevronDown
                  width={16}
                  height={16}
                  color={
                    hasMatches
                      ? theme.colors.textSecondary
                      : theme.colors.textDisabled
                  }
                />
              </Pressable>
              <Pressable
                onPress={search.clear}
                style={styles.navButton}
                aria-label="Clear search"
              >
                <IconX width={16} height={16} color={theme.colors.textHint} />
              </Pressable>
            </View>
          ) : undefined
        }
      />
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  field: {
    height: 40,
    borderRadius: 4,
    borderWidth: 0,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
});
