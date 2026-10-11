import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { IconRecord } from "@/assets/svg";

const ICON_SIZE = 16;
const TEXT_LINE_HEIGHT = 20;

export const SystemAudioBanner: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <View style={styles.icon}>
        <IconRecord
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={theme.colors.textMuted}
        />
      </View>
      <Text variant="body2Regular" color="textMuted" style={styles.label}>
        System audio doesn&apos;t support speaker labels, audio & video
        recording.
      </Text>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    backgroundColor: theme.colors.borderStaticTransparent,
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: "auto",
    flexShrink: 0,
  }),
  icon: {
    height: TEXT_LINE_HEIGHT,
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    flexShrink: 1,
  },
});
