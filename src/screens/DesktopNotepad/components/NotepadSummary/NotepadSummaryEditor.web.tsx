import { useTheme } from "@/styles";
import { BubbleMenuPlugin } from "@tiptap/extension-bubble-menu";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from "react";
import { createPortal } from "react-dom";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useNotepadTimestampNavigation } from "../../hooks/useNotepadTimestampLink";
import { ManualNoteDecoration } from "./manualNoteDecoration";
import type { NotepadSummaryEditorProps } from "./NotepadSummaryEditor.types";
import { NotepadSummaryToolbar } from "./NotepadSummaryToolbar";
import { TimestampDecoration } from "./timestampDecoration";

// tiptap-markdown augments editor storage at runtime but ships no types for it.
type MarkdownStorage = { markdown: { getMarkdown: () => string } };
const getMarkdown = (editor: Editor): string =>
  (editor.storage as unknown as MarkdownStorage).markdown.getMarkdown();

// Notion-style free-flow editor (desktop/web only): the section is always
// editable and edits autosave after a short idle — there is no edit or save
// button. StarterKit provides the markdown input rules ("- " -> bullet,
// "**" -> bold, "## " -> heading) and keyboard shortcuts (Cmd/Ctrl+B/I/…);
// tiptap-markdown round-trips the section markdown.
const AUTOSAVE_DELAY_MS = 1500;
const BUBBLE_MENU_KEY = "notepadSummaryBubble";

export const NotepadSummaryEditor: FC<NotepadSummaryEditorProps> = ({
  initialMarkdown,
  onChange,
}) => {
  const theme = useTheme();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Navigation lives behind a ref because useEditor builds its extensions once,
  // but the callback (player instance, context) can change afterwards.
  const navigate = useNotepadTimestampNavigation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const initialMarkdownRef = useRef(initialMarkdown);
  initialMarkdownRef.current = initialMarkdown;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const persistMarkdown = useCallback(
    async (editor: Editor, markdown: string) => {
      try {
        await onChangeRef.current(markdown);
      } catch {
        editor.commands.setContent(initialMarkdownRef.current, {
          emitUpdate: false,
        });
      }
    },
    [],
  );

  // Detached container owned by the bubble menu plugin (it appends/removes and
  // positions this node against the selection). React renders the toolbar into
  // it via a portal, so React never fights the plugin over DOM placement.
  const [menuEl] = useState<HTMLDivElement | null>(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.zIndex = "1000";
    return el;
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        // html mode lets the underline mark round-trip as <u>…</u>, which the
        // read-only renderer understands (see components/Markdown/instance.ts).
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      TimestampDecoration.configure({
        onSelect: (seconds) => navigateRef.current(seconds),
      }),
      ManualNoteDecoration,
    ],
    content: initialMarkdown,
    autofocus: false,
    onUpdate: ({ editor: current }) => {
      const markdown = getMarkdown(current);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void persistMarkdown(current, markdown);
      }, AUTOSAVE_DELAY_MS);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentMarkdown = getMarkdown(editor);
    if (initialMarkdown === currentMarkdown) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }

    editor.commands.setContent(initialMarkdown, { emitUpdate: false });
  }, [editor, initialMarkdown]);

  // Register the bubble menu: it shows above the current selection (the plugin's
  // default shouldShow only triggers on a non-empty text selection) and hides
  // otherwise, so the toolbar follows the cursor instead of sitting on screen.
  useEffect(() => {
    if (!editor || !menuEl) return;
    editor.registerPlugin(
      BubbleMenuPlugin({
        pluginKey: BUBBLE_MENU_KEY,
        editor,
        element: menuEl,
        updateDelay: 0,
      }),
    );
    return () => {
      editor.unregisterPlugin(BUBBLE_MENU_KEY);
      menuEl.remove();
    };
  }, [editor, menuEl]);

  // Flush a pending autosave on unmount (tab switch / navigation) so the last
  // keystrokes are never dropped.
  useEffect(() => {
    return () => {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
      if (editor) {
        void persistMarkdown(editor, getMarkdown(editor));
      }
    };
  }, [editor, persistMarkdown]);

  if (!editor) return null;

  // Custom properties feed the ::selection rule in App.css from theme tokens.
  const containerStyle = {
    color: theme.colors.textSecondary,
    "--summary-selection-bg": theme.colors.interactivePrimaryDefault,
    "--summary-selection-fg": theme.colors.textPrimary,
    "--summary-timestamp-color": theme.colors.commandPrimaryDefault,
    "--summary-manual-note-color": theme.colors.commandHintHover,
  } as CSSProperties;

  return (
    <div className="notepad-summary-editor" style={containerStyle}>
      <EditorContent editor={editor} />
      {menuEl &&
        createPortal(<NotepadSummaryToolbar editor={editor} />, menuEl)}
    </div>
  );
};
