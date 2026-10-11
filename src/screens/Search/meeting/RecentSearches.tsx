import { IconClock, IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { TouchableOpacity, View } from "react-native";

export const RecentSearches: FC<{
  recent: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
}> = ({ recent, onSelect, onRemove }) => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <Text variant="label3Regular" color="textMuted" style={styles.heading}>
        RECENT SEARCHES
      </Text>
      {recent.map((term, index) => (
        <View
          key={term}
          style={[styles.row, index > 0 && styles.divider(theme)]}
        >
          <TouchableOpacity
            style={styles.term}
            onPress={() => onSelect(term)}
            role="button"
          >
            <IconClock width={18} height={18} color={theme.colors.textMuted} />
            <Text variant="body2Regular" numberOfLines={1} style={styles.label}>
              {term}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRemove(term)}
            hitSlop={13}
            role="button"
            aria-label={`Remove ${term}`}
          >
            <IconX width={18} height={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = createStyles({
  root: {
    paddingTop: 8,
  },
  heading: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  row: {
    minHeight: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  divider: (theme) => ({
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStaticDefault,
  }),
  term: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    flexShrink: 1,
  },
});
