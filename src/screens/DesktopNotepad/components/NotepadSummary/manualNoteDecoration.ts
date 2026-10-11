import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// The summary backend appends "(manual note)" to sentences merged from the
// owner's notes. Underline those lines with a dotted rule and hide the marker,
// mirroring the read-only <mn> styling (see Markdown.tsx / manual-notes.ts).
const MANUAL_NOTE_PRESENCE = /\(manual note\)/i;
const MANUAL_NOTE_MARKER = /\s*\(manual note\)/gi;
const MANUAL_NOTE_TOOLTIP = "Merged from your manual notes";
const manualNotePluginKey = new PluginKey("notepadManualNoteDecoration");

// View-only decorations so the editor's markdown round-trip keeps the marker.
const buildDecorations = (doc: ProseMirrorNode): DecorationSet => {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (MANUAL_NOTE_PRESENCE.test(node.textContent)) {
        decorations.push(
          Decoration.inline(pos + 1, pos + node.nodeSize - 1, {
            class: "notepad-manual-note",
            title: MANUAL_NOTE_TOOLTIP,
          }),
        );
      }
      return;
    }
    if (!node.isText || !node.text) return;
    MANUAL_NOTE_MARKER.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MANUAL_NOTE_MARKER.exec(node.text)) !== null) {
      const from = pos + match.index;
      decorations.push(
        Decoration.inline(from, from + match[0].length, {
          class: "notepad-manual-note-marker",
        }),
      );
    }
  });

  return DecorationSet.create(doc, decorations);
};

export const ManualNoteDecoration = Extension.create({
  name: "notepadManualNoteDecoration",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: manualNotePluginKey,
        state: {
          init: (_config, { doc }) => buildDecorations(doc),
          apply: (tr, decorations) =>
            tr.docChanged ? buildDecorations(tr.doc) : decorations,
        },
        props: {
          decorations(state) {
            return manualNotePluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
