import type { Theme } from "@/styles";
import { createStyles } from "@/styles";
import type { PressableStateCallbackType } from "react-native";
import type { LinkViewProps } from "./types";

export const getStyles =
  (
    theme: Theme,
    {
      animated,
      style,
      hovered,
    }: Pick<LinkViewProps, "animated" | "style"> & { hovered?: boolean },
  ) =>
  ({ pressed }: PressableStateCallbackType) => [
    styles.linkWeb,
    (animated || hovered) &&
      pressed &&
      (animated === "highlight" || hovered
        ? styles.highlightActive(theme)
        : styles.opacityActive),
    style,
  ];

const styles = createStyles({
  linkWeb: {
    display: "flex",
    flexDirection: "column",
  },
  opacityActive: {
    opacity: 0.5,
  },
  highlightActive: (theme) => ({
    backgroundColor: theme.colors.layerMuted,
  }),
});
