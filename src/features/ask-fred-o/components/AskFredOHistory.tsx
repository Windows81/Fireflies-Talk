import { Text } from "@/components/Typography";
import { Logger } from "@/logger";
import { createStyles, useTheme } from "@/styles";
import { useThread, useThreads } from "@firefliesai/fred-react";
import type { FC } from "react";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { groupThreadsByDate } from "../helpers/groupThreadsByDate";

const logger = new Logger("AskFredOHistory");

export const AskFredOHistory: FC<{ onSelected: () => void }> = ({
  onSelected,
}) => {
  const theme = useTheme();
  const { threads, isLoading, hasMore, fetchMore } = useThreads();
  const { loadThread, thread: activeThread } = useThread();

  const groups = useMemo(
    () => groupThreadsByDate(threads, new Date()),
    [threads],
  );

  const select = (threadId: string) => {
    loadThread(threadId)
      .then(onSelected)
      .catch((error) => {
        logger.error("Failed to load conversation:", { error });
      });
  };

  const loadMore = () => {
    fetchMore().catch((error) => {
      logger.error("Failed to load more conversations:", { error });
    });
  };

  if (isLoading && !threads?.length) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={theme.colors.textBrand} />
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View style={styles.empty}>
        <Text color="textHint" variant="body2Regular" textAlign="center">
          Your past conversations will show up here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text color="textHint" variant="label3Regular">
            {group.title}
          </Text>
          {group.threads.map((item) => (
            <Pressable
              key={item.id}
              style={styles.item(theme)}
              onPress={() => select(item.id)}
              accessibilityRole="button"
            >
              <Text
                color={
                  item.id === activeThread?.id ? "textBrand" : "textPrimary"
                }
                variant="body2Regular"
                numberOfLines={1}
              >
                {item.title || "Untitled conversation"}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      {hasMore && (
        <Pressable
          style={styles.more}
          onPress={loadMore}
          accessibilityRole="button"
        >
          <Text color="textBrand" variant="body2Weight">
            {isLoading ? "Loading…" : "Load more"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    gap: 16,
  },
  group: {
    gap: 4,
  },
  item: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  }),
  more: {
    alignItems: "center",
    paddingVertical: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
