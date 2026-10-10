"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMainWindowContextMenu = buildMainWindowContextMenu;
/**
 * Right-click menu for the main window: cut/copy/paste in editable fields,
 * Copy over selected page text (e.g. a fragment of a dictation), nothing
 * otherwise.
 */
function buildMainWindowContextMenu(params) {
    if (params.isEditable) {
        return [
            { role: "cut", enabled: params.editFlags.canCut },
            { role: "copy", enabled: params.editFlags.canCopy },
            { role: "paste", enabled: params.editFlags.canPaste },
            { type: "separator" },
            { role: "selectAll", enabled: params.editFlags.canSelectAll },
        ];
    }
    if (params.selectionText.trim()) {
        return [{ role: "copy" }];
    }
    return null;
}
//# sourceMappingURL=main-window-context-menu.js.map