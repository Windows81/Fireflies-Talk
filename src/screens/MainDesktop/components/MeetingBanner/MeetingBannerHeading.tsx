import { type FC } from "react";
import { View } from "react-native";
import { format } from "date-fns";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { MeetingStateTag } from "./MeetingStateTag";
import { MeetingBannerLogo } from "./MeetingBannerLogo";

interface MeetingBannerHeadingProps {
  title?: string | null;
  url?: string | null;
  startMs?: number | null;
  endMs?: number | null;
  isLive: boolean;
  /** Whether to render the LIVE/UPCOMING tag (hidden on very narrow cards). */
  showStateTag?: boolean;
}

const formatTimeRange = (startMs?: number | null, endMs?: number | null) => {
  if (!startMs) return "";
  const startLabel = format(new Date(startMs), "h:mm a");
  if (!endMs || endMs === startMs) return startLabel;
  return `${startLabel} - ${format(new Date(endMs), "h:mm a")}`;
};

/** Leading block (conf logo, title, state tag, time) shared by banner cards. */
export const MeetingBannerHeading: FC<MeetingBannerHeadingProps> = ({
  title,
  url,
  startMs,
  endMs,
  isLive,
  showStateTag = true,
}) => {
  const timeRange = formatTimeRange(startMs, endMs);

  return (
    <View style={styles.leading}>
      <MeetingBannerLogo url={url} />
      <View style={styles.textContent}>
        <View style={styles.titleRow}>
          <Text variant="body2Regular" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {showStateTag && <MeetingStateTag isLive={isLive} />}
        </View>
        {!!timeRange && (
          <Text variant="body3Regular" style={styles.time}>
            {timeRange}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  leading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  textContent: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: DESKTOP_THEME.grey100,
    letterSpacing: -0.16,
    flexShrink: 1,
  },
  time: {
    color: DESKTOP_THEME.grey550,
    letterSpacing: -0.1,
  },
});
