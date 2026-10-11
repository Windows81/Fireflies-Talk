import {
  IconAiAgent,
  IconChrome,
  IconDesktop,
  IconMic2,
  IconUpload,
} from "@/assets/svg";
import type { Source } from "@/graphql";
import { createStyles, useTheme, vars } from "@/styles";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useMemo, type FC } from "react";
import { View } from "react-native";

const ADDED_BY_ICON_MAP = {
  "chrome-extension-v2": IconChrome,
  "chrome-extension-v3": IconChrome,
  "mobile-record": IconMic2,
  "desktop-record": IconDesktop,
  "media-storage": IconUpload,
  "autopilot-agent": IconAiAgent,
  "internal-autopilot-agent": IconAiAgent,
} as const;

export const MeetingAddedByIcon: FC<{
  meeting: Pick<Meeting | Source, "addedBy">;
  iconOnly?: boolean;
}> = ({ meeting, iconOnly }) => {
  const theme = useTheme();

  const info = useMemo(() => {
    if (!meeting.addedBy) return null;
    const Icon =
      ADDED_BY_ICON_MAP[meeting.addedBy as keyof typeof ADDED_BY_ICON_MAP];
    if (!Icon) return null;
    return { Icon, label: meeting.addedBy };
  }, [meeting.addedBy]);

  if (!info) return null;

  const iconNode = (
    <info.Icon
      width={16}
      height={16}
      color={vars.colors.grey500}
      accessibilityLabel={`Added by ${info.label}`}
    />
  );

  if (iconOnly) return iconNode;

  return <View style={styles.addedByIcon(theme)}>{iconNode}</View>;
};

const styles = createStyles({
  addedByIcon: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
    height: 26,
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  }),
});
