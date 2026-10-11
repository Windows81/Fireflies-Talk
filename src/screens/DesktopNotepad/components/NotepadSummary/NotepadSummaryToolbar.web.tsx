import { Text } from "@/components/Typography";
import type { Theme } from "@/styles";
import { createStyles, useTheme } from "@/styles";
import { useEditorState } from "@tiptap/react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { type FC } from "react";
import { Pressable, View } from "react-native";
import type { NotepadSummaryToolbarProps } from "./NotepadSummaryToolbar.types";
import { IconListBullet, IconListOrdered } from "./summaryToolbarIcons";

// Class applied to the toolbar so the bubble menu keeps the editor selection
// when a button is pressed (see keepEditorFocus below).
export const TOOLBAR_CLASS = "notepad-summary-toolbar";

export const NotepadSummaryToolbar: FC<NotepadSummaryToolbarProps> = ({
  editor,
}) => {
  const theme = useTheme();

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
    }),
  });

  const glyphColor = theme.colors.commandNeutralDefault;

  const run = (fn: () => void) => () => fn();

  // Prevent the mousedown from stealing focus/selection from the editor so the
  // formatting commands apply to the current selection.
  const keepEditorFocus = (event: MouseEvent) => event.preventDefault();

  return (
    <div
      className={TOOLBAR_CLASS}
      style={barStyle(theme)}
      onMouseDown={keepEditorFocus}
    >
      <ToolButton
        active={active?.bold}
        onPress={run(() => editor.chain().focus().toggleBold().run())}
      >
        <Glyph color={glyphColor} style={styles.glyphBold}>
          B
        </Glyph>
      </ToolButton>
      <ToolButton
        active={active?.italic}
        onPress={run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Glyph color={glyphColor} style={styles.glyphItalic}>
          I
        </Glyph>
      </ToolButton>
      <ToolButton
        active={active?.strike}
        onPress={run(() => editor.chain().focus().toggleStrike().run())}
      >
        <Glyph color={glyphColor} style={styles.glyphStrike}>
          S
        </Glyph>
      </ToolButton>

      <Divider theme={theme} />

      <ToolButton
        active={active?.bullet}
        onPress={run(() => editor.chain().focus().toggleBulletList().run())}
      >
        <IconListBullet color={glyphColor} />
      </ToolButton>
      <ToolButton
        active={active?.ordered}
        onPress={run(() => editor.chain().focus().toggleOrderedList().run())}
      >
        <IconListOrdered color={glyphColor} />
      </ToolButton>
    </div>
  );
};

const ToolButton: FC<{
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}> = ({ active, disabled, onPress, children }) => {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        styles.button,
        active && styles.buttonActive(theme),
        disabled && styles.buttonDisabled,
      ]}
    >
      {children}
    </Pressable>
  );
};

const Glyph: FC<{
  color: string;
  style?: object;
  children: ReactNode;
}> = ({ color, style, children }) => (
  <Text style={[styles.glyph, { color }, style]}>{children}</Text>
);

const Divider: FC<{ theme: Theme }> = ({ theme }) => (
  <View style={styles.divider(theme)} />
);

const barStyle = (theme: Theme): CSSProperties => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 2,
  padding: 6,
  borderRadius: 12,
  backgroundColor: theme.colors.layerMuted,
  border: `1px solid ${theme.colors.borderStaticSubtle}`,
  boxShadow:
    "0px 8px 24px -6px rgba(0,0,0,0.6), 0px 2px 6px -4px rgba(0,0,0,0.6)",
});

const styles = createStyles({
  button: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  buttonActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  buttonDisabled: {
    opacity: 0.4,
  },
  glyph: {
    fontSize: 15,
    lineHeight: 20,
  },
  glyphBold: { fontWeight: "700" },
  glyphItalic: { fontStyle: "italic" },
  glyphStrike: { textDecorationLine: "line-through" },
  divider: (theme) => ({
    width: 1,
    height: 20,
    marginHorizontal: 4,
    backgroundColor: theme.colors.borderStaticDefault,
  }),
});
