import { Avatar } from "@/components/Avatar";
import { HighlightedText } from "@/components/Meeting";
import { Text } from "@/components/Typography";
import type { Source } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { pluralize } from "@/utils/pluralize";
import { toHHMMSS } from "@/utils/time";
import { format, isValid } from "date-fns";
import type { FC } from "react";
import { View } from "react-native";

export const TranscriptResultCard: FC<{ meeting: Source }> = ({ meeting }) => {
  const theme = useTheme();

  const captions = meeting._highlight?.captions ?? [];
  const primary = captions[0];
  const extraMentions = Math.max(0, captions.length - 1);
  const organizer = meeting.creatorProfile?.name || meeting.creator_email || "";

  const date = meeting.date ? new Date(meeting.date) : null;

  return (
    <View style={styles.root(theme)}>
      <View style={styles.header}>
        <Avatar
          size={24}
          name={organizer}
          picture={meeting.creatorProfile?.picture}
          shape="square"
        />
        <Text variant="title3Weight" numberOfLines={1} style={styles.title}>
          {meeting.title}
        </Text>
        {!!date && isValid(date) && (
          <Text variant="body2Regular" color="textHint">
            {format(date, "MMM d")}
          </Text>
        )}
      </View>

      <View style={styles.snippet(theme)}>
        <HighlightedText
          sentence={primary?.sentence || ""}
          color="textSecondary"
          numberOfLines={2}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="label3Regular" color="textBrand">
          {toHHMMSS(Math.max(0, primary?.time ?? 0))}
        </Text>
        {extraMentions > 0 && (
          <Text variant="body2Regular" color="textHint" style={styles.mentions}>
            +{extraMentions} {pluralize("mention", extraMentions)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    backgroundColor: theme.colors.layerSubtle,
    padding: 12,
    gap: 10,
  }),
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
  },
  snippet: (theme) => ({
    backgroundColor: theme.colors.layerStrong,
    borderRadius: 8,
    padding: 10,
  }),
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mentions: {
    marginLeft: "auto",
  },
});
