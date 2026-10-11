import { IconCheck, IconHash, IconLock, IconSearch } from "@/assets/svg";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/Input";
import { Text } from "@/components/Typography";
import type { Channel } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Fragment, type FC } from "react";
import { useEffect, useMemo, useState } from "react";
import type { TextInput as RNTextInput } from "react-native";
import { TouchableOpacity, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { DEFAULT_SCOPE, isPrivacyScope, PRIVACY_SCOPES } from "./constants";
import { useRecentChannels } from "./useRecentChannels";

const snapPoints = ["85%"] as `${number}%`[];

interface ScopeItem {
  id: string;
  label: string;
  Icon: FC<SvgProps>;
  boxed: boolean;
}

interface ScopeBlock {
  key: string;
  header?: string;
  rows: ScopeItem[];
}

const toChannelRow = (channel: Channel): ScopeItem => ({
  id: channel._id as string,
  label: channel.title || "Untitled",
  Icon: channel.isPrivate ? IconLock : IconHash,
  boxed: true,
});

const groupByLetter = (channels: Channel[]): ScopeBlock[] => {
  const groups = new Map<string, ScopeItem[]>();
  for (const channel of channels) {
    const first = (channel.title?.[0] || "#").toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    const rows = groups.get(letter) ?? [];
    rows.push(toChannelRow(channel));
    groups.set(letter, rows);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, rows]) => ({
      key: `letter-${letter}`,
      header: letter,
      rows: [...rows].sort((a, b) => a.label.localeCompare(b.label)),
    }));
};

const OptionRow: FC<{
  label: string;
  Icon: FC<SvgProps>;
  boxed: boolean;
  selected: boolean;
  onPress: () => void;
}> = ({ label, Icon, boxed, selected, onPress }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      role="option"
      aria-selected={selected}
    >
      <View style={styles.rowLeading}>
        <View style={[styles.iconSlot, boxed && styles.iconBox(theme)]}>
          <Icon
            width={boxed ? 18 : 20}
            height={boxed ? 18 : 20}
            color={theme.colors.textMuted}
          />
        </View>
        <Text
          variant="body2Weight"
          color={selected ? "textBrand" : "textSecondary"}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      {selected && (
        <IconCheck
          width={18}
          height={18}
          color={theme.colors.commandPrimaryDefault}
        />
      )}
    </TouchableOpacity>
  );
};

export const MoreFilterSheet: FC<{
  isOpen: boolean;
  close: () => void;
  scope: string;
  onSelect: (scope: string) => void;
  channels: Channel[];
}> = ({ isOpen, close, scope, onSelect, channels }) => {
  const theme = useTheme();
  const [filter, setFilter] = useState("");
  const [staged, setStaged] = useState(scope);
  const { recent, add: addRecentChannel } = useRecentChannels();

  // Reset staged selection and the find-a-channel field each time the sheet opens.
  useEffect(() => {
    if (!isOpen) return;
    setStaged(scope);
    setFilter("");
  }, [isOpen, scope]);

  const channelById = useMemo(() => {
    const map = new Map<string, Channel>();
    for (const channel of channels)
      if (channel?._id) map.set(channel._id, channel);
    return map;
  }, [channels]);

  const { blocks, isEmpty } = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    const valid = channels.filter(
      (channel): channel is Channel & { _id: string } => !!channel?._id,
    );

    // Searching: a single flat, alpha-sorted list of matching channels.
    if (normalized) {
      const rows = valid
        .filter((channel) => channel.title?.toLowerCase().includes(normalized))
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        .map(toChannelRow);
      return {
        blocks: [{ key: "results", rows }] as ScopeBlock[],
        isEmpty: rows.length === 0,
      };
    }

    // Browsing: built-in scopes, recent channels, then alphabetical sections.
    const recentRows = recent
      .map((id) => channelById.get(id))
      .filter((channel): channel is Channel => !!channel)
      .map(toChannelRow);

    const result: ScopeBlock[] = [
      {
        key: "scopes",
        rows: PRIVACY_SCOPES.map((option) => ({
          id: option.id,
          label: option.label,
          Icon: option.Icon,
          boxed: false,
        })),
      },
    ];
    if (recentRows.length) {
      result.push({ key: "recent", header: "RECENT", rows: recentRows });
    }
    // Recent channels still appear in their letter section too.
    result.push(...groupByLetter(valid));
    return { blocks: result, isEmpty: false };
  }, [channels, channelById, filter, recent]);

  const apply = () => {
    if (!isPrivacyScope(staged)) addRecentChannel(staged);
    onSelect(staged);
    close();
  };

  const clear = () => {
    onSelect(DEFAULT_SCOPE);
    close();
  };

  return (
    <BottomSheet.Root isOpen={isOpen} close={close} snapPoints={snapPoints}>
      <Text variant="body1Weight" style={styles.title}>
        Channel
      </Text>
      <TextInput
        variant="search"
        value={filter}
        onValueChange={setFilter}
        Icon={IconSearch}
        placeholder="Find a channel"
        clearable
        style={styles.channelSearch}
        InputComponent={BottomSheetTextInput as unknown as typeof RNTextInput}
      />
      <BottomSheet.ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {isEmpty ? (
          <Text variant="body2Regular" color="textHint" style={styles.empty}>
            No channels found
          </Text>
        ) : (
          blocks.map((block) => (
            <Fragment key={block.key}>
              {!!block.header && (
                <Text
                  variant="label3Regular"
                  color="textHint"
                  style={styles.heading}
                >
                  {block.header}
                </Text>
              )}
              {block.rows.map((row, index) => (
                <Fragment key={row.id}>
                  {index > 0 && <View style={styles.divider(theme)} />}
                  <OptionRow
                    label={row.label}
                    Icon={row.Icon}
                    boxed={row.boxed}
                    selected={staged === row.id}
                    onPress={() => setStaged(row.id)}
                  />
                </Fragment>
              ))}
            </Fragment>
          ))
        )}
      </BottomSheet.ScrollView>

      <View style={styles.footer(theme)}>
        <Button variant="outlined" onPress={clear} style={styles.clearButton}>
          Clear
        </Button>
        <Button variant="primary" onPress={apply} style={styles.applyButton}>
          Apply
        </Button>
      </View>
    </BottomSheet.Root>
  );
};

const styles = createStyles({
  title: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 12,
  },
  row: {
    minHeight: 48,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  // Fixed slot keeps the labels aligned whether the icon is boxed or not.
  iconSlot: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: (theme) => ({
    borderRadius: 8,
    backgroundColor: theme.colors.layerStrong,
  }),
  // Inset so it spans from the leading icon to the trailing icon, not edge-to-edge.
  divider: (theme) => ({
    height: 1,
    marginHorizontal: 20,
    backgroundColor: theme.colors.borderStaticDefault,
  }),
  heading: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  channelSearch: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  empty: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  footer: (theme) => ({
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStaticDefault,
  }),
  clearButton: {
    flex: 3,
    borderRadius: 12,
  },
  applyButton: {
    flex: 7,
    borderRadius: 12,
  },
});
