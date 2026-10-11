import { LinkView } from "@/components/Link";
import { LoadingSpinner } from "@/components/Loading";
import { MeetingListItem } from "@/components/Meeting";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import type { Source } from "@/graphql";
import { createStyles } from "@/styles";
import { type FC, useMemo } from "react";
import { SectionList, View } from "react-native";
import { TranscriptResultCard } from "./TranscriptResultCard";

type SearchResult = Source & { parseId: string; rowKey: string };

const hasParseId = (meeting: Source): meeting is Source & { parseId: string } =>
  typeof meeting.parseId === "string" && meeting.parseId.length > 0;

interface Section {
  key: "titles" | "transcripts";
  title: string;
  data: SearchResult[];
}

export const SearchResults: FC<{
  meetings: Source[];
  loadingMore: boolean;
  onEndReached: () => void;
  onResultPress: (meeting: Source) => void;
}> = ({ meetings, loadingMore, onEndReached, onResultPress }) => {
  const sections = useMemo<Section[]>(() => {
    const titleMatches: SearchResult[] = [];
    const transcriptMatches: SearchResult[] = [];
    for (const meeting of meetings.filter(hasParseId)) {
      const hasTitleHit = Boolean(meeting._highlight?.title?.length);
      const hasCaptionHit = Boolean(meeting._highlight?.captions?.length);
      // Same meeting can appear in both sections: Titles is the name match,
      // In transcripts is the spoken snippet. They are different cards.
      if (hasTitleHit || !hasCaptionHit) {
        titleMatches.push({ ...meeting, rowKey: `titles:${meeting.parseId}` });
      }
      if (hasCaptionHit) {
        transcriptMatches.push({
          ...meeting,
          rowKey: `transcripts:${meeting.parseId}`,
        });
      }
    }
    const result: Section[] = [];
    if (titleMatches.length) {
      result.push({ key: "titles", title: "TITLES", data: titleMatches });
    }
    if (transcriptMatches.length) {
      result.push({
        key: "transcripts",
        title: "IN TRANSCRIPTS",
        data: transcriptMatches,
      });
    }
    return result;
  }, [meetings]);

  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.rowKey}
      stickySectionHeadersEnabled={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
      renderSectionHeader={({ section }) => (
        <Text variant="label3Regular" color="textHint" style={styles.heading}>
          {section.title}
        </Text>
      )}
      renderItem={({ item, section }) => (
        <LinkView
          onPress={() => onResultPress(item)}
          href={{
            pathname: RouteNames.Notepad,
            params: { id: item.parseId },
          }}
          animated="highlight"
        >
          {section.key === "transcripts" ? (
            <TranscriptResultCard meeting={item} />
          ) : (
            <MeetingListItem meeting={item} compact />
          )}
        </LinkView>
      )}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <LoadingSpinner />
          </View>
        ) : null
      }
    />
  );
};

const styles = createStyles({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  heading: {
    marginTop: 8,
  },
  footer: {
    paddingVertical: 16,
  },
});
