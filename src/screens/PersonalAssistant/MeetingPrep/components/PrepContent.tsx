import { IconActionItem } from "@/assets/svg";
import { Markdown } from "@/components/Markdown";
import { Text } from "@/components/Typography";
import { type BulletGistItem } from "@/graphql";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { getMarkdownStyle, styles } from "../MeetingPrepScreen.styles";
import { MeetingPrepTasks, type MeetingPrepTask } from "./MeetingPrepTasks";

export const PrepContent: FC<{
  bulletGist?: BulletGistItem[] | null;
  overview?: string | null;
  tasks: MeetingPrepTask[];
}> = ({ bulletGist, overview, tasks }) => {
  const theme = useTheme();

  return (
    <>
      {bulletGist?.length ? (
        <View style={styles.bulletList}>
          {bulletGist.map((bullet) => (
            <View key={bullet.title} style={styles.bulletItem}>
              <Text style={styles.bulletEmoji}>{bullet.emoji}</Text>
              <View style={styles.bulletText}>
                <Text variant="body2LongWeight" color="textSecondary">
                  {bullet.title}
                </Text>
                <Text variant="body2LongRegular" color="textMuted">
                  {bullet.sentence}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : overview ? (
        <Markdown style={getMarkdownStyle(theme)}>{overview}</Markdown>
      ) : null}
      {tasks.length > 0 && (
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <IconActionItem
              width={20}
              height={20}
              color={theme.colors.textHint}
            />
            <Text variant="title3Weight" color="textMuted">
              {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
            </Text>
          </View>
          <MeetingPrepTasks tasks={tasks} />
        </View>
      )}
    </>
  );
};
