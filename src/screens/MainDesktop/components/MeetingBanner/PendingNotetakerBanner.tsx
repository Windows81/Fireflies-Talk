import { type FC } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import {
  getPlatformFromUrl,
  getPlatformName,
} from "@/features/desktop-meeting-detection";
import { MeetingBannerLogo } from "./MeetingBannerLogo";

interface PendingNotetakerBannerProps {
  /** Meeting URL of the in-flight add-to-live request. */
  url: string;
}

/** Last meaningful path segment of the meeting URL (e.g. "hkv-cvca-dqz"). */
const getMeetingCode = (url: string): string => {
  try {
    const parsed = url.startsWith("http")
      ? new URL(url)
      : new URL(`https://${url}`);
    const segment = parsed.pathname.split("/").filter(Boolean).pop();
    return segment || parsed.hostname;
  } catch {
    return url;
  }
};

const getPlatformLabel = (url: string): string => {
  const platform = getPlatformFromUrl(url);
  return platform ? getPlatformName(platform) : "Meeting";
};

/**
 * Transient banner shown right after an add-to-live invite, while the notetaker
 * is on its way in. Replaced by the live banner once the meeting goes live.
 */
export const PendingNotetakerBanner: FC<PendingNotetakerBannerProps> = ({
  url,
}) => {
  const title = getMeetingCode(url);
  const platform = getPlatformLabel(url);

  return (
    <View style={styles.card}>
      <View style={styles.leading}>
        <MeetingBannerLogo url={url} />
        <View style={styles.text}>
          <Text variant="body2Regular" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text
            variant="body3Regular"
            style={styles.platform}
            numberOfLines={1}
          >
            {platform}
          </Text>
        </View>
      </View>
      <View style={styles.status}>
        <ActivityIndicator size="small" color={DESKTOP_THEME.grey550} />
        <Text
          variant="body2Regular"
          style={styles.statusText}
          numberOfLines={1}
        >
          Notetaker will join shortly
        </Text>
      </View>
    </View>
  );
};

const styles = createStyles({
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 8,
    backgroundColor: DESKTOP_THEME.grey1010,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey950,
  },
  leading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  text: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  title: {
    color: DESKTOP_THEME.grey100,
    letterSpacing: -0.16,
    flexShrink: 1,
  },
  platform: {
    color: DESKTOP_THEME.grey550,
    letterSpacing: -0.1,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  statusText: {
    color: DESKTOP_THEME.grey550,
    letterSpacing: -0.16,
  },
});
