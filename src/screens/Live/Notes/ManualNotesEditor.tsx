import { createStyles, useTheme, vars } from "@/styles";
import { isDesktop } from "@/utils/device";
import { type FC, useCallback, useRef, useState } from "react";
import {
  type NativeSyntheticEvent,
  Platform,
  type StyleProp,
  TextInput,
  type TextInputKeyPressEventData,
  type TextInputSelectionChangeEventData,
  type TextStyle,
  View,
} from "react-native";

import { applyBulletEnter, BULLET, detectEnterInsert } from "./bulletEnter";

type Selection = { start: number; end: number };

interface ManualNotesEditorProps {
  notes: string;
  setNotes: (notes: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  minHeight?: number;
  /** Overrides the note text style (font, line height). Applied last. */
  inputStyle?: StyleProp<TextStyle>;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ManualNotesEditor: FC<ManualNotesEditorProps> = ({
  notes,
  setNotes,
  placeholder = "Type your notes here…",
  "aria-label": ariaLabel,
  minHeight = 120,
  inputStyle,
  onFocus,
  onBlur,
}) => {
  const theme = useTheme();

  // The caret is tracked in a ref for Enter handling, and forced via state only
  // for the brief moment after we rewrite the text ourselves. Leaving the
  // `selection` prop undefined the rest of the time keeps normal typing native
  // (no controlled-cursor jank).
  const caret = useRef<Selection>({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<Selection | undefined>(
    undefined,
  );

  // On native the rewritten text races the selection event of the newline the
  // input already inserted: that stale event would clear the forced caret
  // before it is applied. Ignore selection events until the forced one echoes
  // back.
  const pendingForced = useRef<Selection | undefined>(undefined);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const selection = e.nativeEvent.selection;
      const forced = pendingForced.current;
      if (
        forced &&
        (selection.start !== forced.start || selection.end !== forced.end)
      ) {
        return;
      }
      pendingForced.current = undefined;
      caret.current = selection;
      setForcedSelection(undefined);
    },
    [],
  );

  const writeWithCaret = useCallback(
    (text: string, position: number) => {
      setNotes(text);
      caret.current = { start: position, end: position };
      pendingForced.current = { start: position, end: position };
      setForcedSelection({ start: position, end: position });
    },
    [setNotes],
  );

  const handleChangeText = useCallback(
    (next: string) => {
      // A user edit means any pending forced caret has served its purpose;
      // clearing it here also unfreezes the input if the native echo never
      // matched (RN doesn't re-emit onChangeText for programmatic sets).
      pendingForced.current = undefined;
      setForcedSelection(undefined);

      if (Platform.OS !== "web") {
        // Native Enter can't be preventDefault'ed, so detect the newline the
        // input already inserted (validated by exact string match — anything
        // else, e.g. an autocorrect rewrite, falls through untouched) and
        // replace it with the bullet rewrite.
        const enter = detectEnterInsert(notes, next, caret.current);
        const rewrite = enter
          ? applyBulletEnter(notes, enter.start, enter.end)
          : null;
        if (rewrite) {
          writeWithCaret(rewrite.text, rewrite.caret);
          return;
        }
      }
      // Markdown-style shortcut: "- " or "* " at a line start becomes a bullet
      // glyph. Both forms are two characters wide, so the caret is unaffected.
      setNotes(next.replace(/(^|\n)[-*] /g, `$1${BULLET}`));
    },
    [notes, setNotes, writeWithCaret],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      // web/Electron only: preventDefault works here, so the newline is
      // intercepted before insertion. Native goes through handleChangeText.
      if (Platform.OS !== "web" || e.nativeEvent.key !== "Enter") return;

      const { start, end } = caret.current;
      const rewrite = applyBulletEnter(notes, start, end);
      if (!rewrite) return;

      e.preventDefault();
      writeWithCaret(rewrite.text, rewrite.caret);
    },
    [notes, writeWithCaret],
  );

  return (
    <View style={[styles.container, { minHeight }]}>
      <TextInput
        value={notes}
        onChangeText={handleChangeText}
        onKeyPress={handleKeyPress}
        selection={forcedSelection}
        onSelectionChange={handleSelectionChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        placeholderTextColor={theme.colors.textHint}
        cursorColor={theme.colors.layerContrast}
        multiline
        nativeID="no-drag"
        style={[styles.input(theme), inputStyle]}
      />
    </View>
  );
};

const styles = createStyles({
  container: {
    flex: 1,
  },
  input: (theme) => ({
    flex: 1,
    color: theme.colors.textSecondary,
    // Desktop keeps the pre-unification body1Regular; the roomier long-form
    // face is mobile/web only.
    ...(isDesktop
      ? vars.typography.body1Regular
      : vars.typography.body1LongRegular),
    padding: 0,
    textAlignVertical: "top",
    // iOS clips descenders when a TextInput carries an explicit lineHeight.
    ...(Platform.OS === "ios" && { lineHeight: undefined }),
    // web/Electron: suppress outline and set caret color
    // (cursorColor prop is Android-only and has no effect on web)
    ...(Platform.OS === "web" && {
      outline: "none",
      caretColor: theme.colors.layerContrast,
    }),
  }),
});
