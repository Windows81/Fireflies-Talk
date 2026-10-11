import { toSecFromHHMMSS } from "@/utils/time";
import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Matches "3:04", "03:04" and "1:02:03" — mirrors the read-only markdown
// timestamp transform so both summary views highlight the same spans.
const TIMESTAMP_REGEX = /\d{1,2}:\d{1,2}(?::\d{1,2})?/g;
const TIMESTAMP_ATTR = "data-timestamp";
const timestampPluginKey = new PluginKey("notepadTimestampDecoration");

export interface TimestampDecorationOptions {
  onSelect: (seconds: number) => void;
}

// View-only inline decorations that never touch the document, so the editor's
// markdown round-trip (and autosave) is unaffected by the highlighting.
const buildDecorations = (doc: ProseMirrorNode): DecorationSet => {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    TIMESTAMP_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TIMESTAMP_REGEX.exec(text)) !== null) {
      const from = pos + match.index;
      const to = from + match[0].length;
      decorations.push(
        Decoration.inline(from, to, {
          class: "notepad-timestamp",
          [TIMESTAMP_ATTR]: String(toSecFromHHMMSS(match[0])),
        }),
      );
    }
  });

  return DecorationSet.create(doc, decorations);
};

export const TimestampDecoration = Extension.create<TimestampDecorationOptions>(
  {
    name: "notepadTimestampDecoration",

    addOptions() {
      return { onSelect: () => {} };
    },

    addProseMirrorPlugins() {
      const { onSelect } = this.options;

      return [
        new Plugin({
          key: timestampPluginKey,
          state: {
            init: (_config, { doc }) => buildDecorations(doc),
            apply: (tr, decorations) =>
              tr.docChanged ? buildDecorations(tr.doc) : decorations,
          },
          props: {
            decorations(state) {
              return timestampPluginKey.getState(state);
            },
            // Handle on mousedown (not click) and preventDefault so the editor
            // isn't focused and no caret is dropped into the summary — the
            // timestamp acts as a pure link instead of starting an edit.
            handleDOMEvents: {
              mousedown(_view, event) {
                const value = (event.target as HTMLElement | null)
                  ?.closest?.(`[${TIMESTAMP_ATTR}]`)
                  ?.getAttribute(TIMESTAMP_ATTR);
                if (value == null) return false;
                event.preventDefault();
                onSelect(Number(value));
                return true;
              },
            },
          },
        }),
      ];
    },
  },
);
