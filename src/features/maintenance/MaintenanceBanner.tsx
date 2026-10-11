import { IconClose, IconWarning } from "@/assets/svg";
import { Markdown } from "@/components/Markdown";
import { createStyles, useTheme, type Theme } from "@/styles";
import { GLOBAL } from "@/styles/color";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import {
  useHasActiveMaintenance,
  useMaintenanceMessage,
} from "./useMaintenanceMessage";

const MAX_MESSAGE_LINES = 4;
const LINE_HEIGHT = 18;
const FONT_SIZE = 13;

export function useShowMaintenanceBanner() {
  return useHasActiveMaintenance();
}

export const MaintenanceBanner: FC = () => {
  const theme = useTheme();
  const { visible, message, dismiss } = useMaintenanceMessage();

  if (!visible || !message) return null;

  return (
    <View style={styles.root(theme)}>
      <View style={styles.content}>
        <IconWarning
          width={16}
          height={16}
          color={GLOBAL.yellow600}
          style={styles.icon}
        />
        <View style={styles.messageContainer}>
          <Markdown color="textSecondary" style={markdownStyles}>
            {message}
          </Markdown>
        </View>
      </View>
      <Pressable onPress={dismiss} hitSlop={8} style={styles.closeButton}>
        <IconClose width={16} height={16} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
};

const markdownStyles = {
  body: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  },
  // `strong` carries its own (larger) typography size, and the Markdown
  // component renders with mergeStyle={false}, so the body size above doesn't
  // reach it — pin it here to keep bold the same size as the rest.
  strong: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  },
  paragraph: {
    marginBottom: 0,
    marginTop: 0,
  },
};

const styles = createStyles({
  root: (theme: Theme) => ({
    backgroundColor: theme.colors.layerStrong,
    borderRadius: 8,
    padding: 12,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
    width: "100%",
  }),
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  icon: {
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
    maxHeight: MAX_MESSAGE_LINES * LINE_HEIGHT,
    overflow: "hidden",
  },
  closeButton: {
    paddingLeft: 4,
    paddingTop: 2,
  },
});
