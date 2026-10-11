import { IconCalendar, IconHash } from "@/assets/svg";
import { Select } from "@/components/Input";
import { createStyles, useTheme } from "@/styles";
import { useGetChannelsListQuery } from "@/graphql";
import { useThread } from "@firefliesai/fred-react";
import type { FC } from "react";
import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";
import type { AskFredORange, AskFredOScope } from "../helpers/toMeetingFilters";
import {
  ALL_CHANNELS,
  ANY_TIME,
  toMeetingFilters,
} from "../helpers/toMeetingFilters";
import { useAskFredOScope } from "../providers/AskFredOScopeProvider";

const RANGE_OPTIONS: { label: string; value: AskFredORange }[] = [
  { label: "Any time", value: ANY_TIME },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

export const AskFredOScopeBar: FC<{
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}> = ({ style, disabled = false }) => {
  const theme = useTheme();
  const { setMeetingFilters, isLoading } = useThread();
  const { scope, setScope } = useAskFredOScope();
  const { data } = useGetChannelsListQuery();

  const channelOptions = useMemo(
    () => [
      { label: "All channels", value: ALL_CHANNELS },
      ...(data?.getChannelsList ?? []).map((channel) => ({
        label: channel?.title ?? "Untitled",
        value: channel?._id ?? ALL_CHANNELS,
      })),
    ],
    [data],
  );

  const apply = (next: AskFredOScope) => {
    setScope(next);
    setMeetingFilters(toMeetingFilters(next, new Date()));
  };

  return (
    <View style={[styles.root, style]}>
      <Select
        style={styles.select(theme)}
        Icon={IconCalendar}
        size="sm"
        inline
        disabled={isLoading || disabled}
        options={RANGE_OPTIONS}
        value={scope.range}
        onValueChange={(range) => apply({ ...scope, range })}
      />
      <Select
        style={styles.select(theme)}
        Icon={IconHash}
        size="sm"
        inline
        showSearch
        disabled={isLoading || disabled}
        options={channelOptions}
        value={scope.channelId}
        onValueChange={(channelId) => apply({ ...scope, channelId })}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  select: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 0,
    borderRadius: 9999,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  }),
});
