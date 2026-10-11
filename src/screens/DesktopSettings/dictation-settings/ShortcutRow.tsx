import { Text } from "@/components/Typography";
import type { ShortcutKeycap } from "electron/src/dictation/shortcut-keys";
import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import {
  Children,
  createContext,
  Fragment,
  type FC,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { ShortcutKeycaps } from "./ShortcutKeycaps";

export type ShortcutLayout = "inline" | "column";

export const ShortcutLayoutContext = createContext<ShortcutLayout>("inline");

const COLUMN_BREAKPOINT = 560;
const ICON_BUTTON_SIZE = 28;

export const ShortcutRow: FC<{
  icon: ReactNode;
  title: string;
  description: string;
  id?: string;
  isLocked?: boolean;
  layout?: ShortcutLayout;
  children: ReactNode;
}> = ({
  children,
  description,
  icon,
  id,
  isLocked,
  layout: layoutProp,
  title,
}) => {
  const contextLayout = useContext(ShortcutLayoutContext);
  const layout = layoutProp ?? contextLayout;
  const header = (
    <View style={[styles.header, layout === "inline" && styles.inlineHeader]}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowText} id={id}>
        <Text variant="body2Weight" color="textPrimary">
          {title}
        </Text>
        <Text variant="body2Regular" color="textMuted">
          {description}
        </Text>
      </View>
    </View>
  );

  if (layout === "column") {
    return (
      <View style={[styles.column, isLocked && styles.locked]}>
        {header}
        <View style={styles.items}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isLocked && styles.locked]}>
      {header}
      <View style={styles.inlineItems}>{children}</View>
    </View>
  );
};

export const ShortcutPill: FC<{
  prefix: string;
  keycaps: ShortcutKeycap[];
}> = ({ prefix, keycaps }) => {
  const theme = useTheme();
  return (
    <View style={styles.pill(theme)}>
      <Text variant="body2Regular" color="textSecondary">
        {prefix}
      </Text>
      <ShortcutKeycaps keycaps={keycaps} />
    </View>
  );
};

export const ShortcutItem: FC<PropsWithChildren<{ actions?: ReactNode }>> = ({
  actions,
  children,
}) => {
  const layout = useContext(ShortcutLayoutContext);
  if (layout === "column") {
    return (
      <View style={styles.item}>
        {children}
        {actions}
      </View>
    );
  }

  // Fixed-width slot keeps the edit/remove buttons in the same columns on
  // every row, so pills share one right edge regardless of button count.
  return (
    <View style={styles.item}>
      {children}
      <View style={styles.inlineActions}>{actions}</View>
    </View>
  );
};

/** Wrapping helper text (hints, errors) that must not push the header off
 * the row when the layout is inline. */
export const ShortcutItemText: FC<{
  color: "informationStaticRedText" | "textMuted";
  children: string | undefined;
}> = ({ children, color }) => {
  const layout = useContext(ShortcutLayoutContext);
  return (
    <ShortcutItem>
      <Text
        variant="body2Regular"
        color={color}
        style={[styles.itemText, layout === "inline" && styles.inlineItemText]}
      >
        {children}
      </Text>
    </ShortcutItem>
  );
};

export const ShortcutRowsGroup: FC<
  PropsWithChildren<{ layout?: ShortcutLayout | "auto" }>
> = ({ children, layout = "auto" }) => {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const rows = Children.toArray(children);
  const resolvedLayout =
    layout === "auto"
      ? width === 0 || width < COLUMN_BREAKPOINT
        ? "column"
        : "inline"
      : layout;
  const measureProps =
    layout === "auto"
      ? {
          onLayout: (event: LayoutChangeEvent) =>
            setWidth(event.nativeEvent.layout.width),
        }
      : {};

  return (
    <ShortcutLayoutContext.Provider value={resolvedLayout}>
      <View {...measureProps} style={styles.group(theme)}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider(theme)} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </ShortcutLayoutContext.Provider>
  );
};

const styles = createStyles({
  column: {
    gap: 12,
    paddingVertical: 16,
  },
  divider: (theme) => ({
    height: 1,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.07),
  }),
  group: (theme) => ({
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.04),
    borderRadius: 12,
    paddingHorizontal: 16,
  }),
  header: {
    alignItems: "flex-start" as const,
    flexDirection: "row" as const,
    gap: 12,
  },
  inlineHeader: {
    flex: 1,
    minWidth: 200,
  },
  inlineActions: {
    flexDirection: "row" as const,
    gap: 8,
    width: ICON_BUTTON_SIZE * 2 + 8,
  },
  inlineItemText: {
    textAlign: "right" as const,
  },
  // Only helper text shrinks and wraps beside the unshrunk pills.
  inlineItems: {
    alignItems: "flex-end" as const,
    flexShrink: 1,
    gap: 8,
  },
  item: {
    alignItems: "center" as const,
    flexDirection: "row" as const,
    flexShrink: 1,
    gap: 8,
  },
  itemText: {
    flexShrink: 1,
  },
  items: {
    alignItems: "flex-start" as const,
    flexDirection: "column" as const,
    gap: 8,
    // Lines up with the title text, past the 24px icon column and its gap.
    paddingLeft: 36,
  },
  locked: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    paddingVertical: 16,
  },
  rowIcon: {
    width: 24,
    alignItems: "center" as const,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  pill: (theme) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.08),
  }),
});
