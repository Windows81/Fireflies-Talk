"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const main_window_context_menu_1 = require("./main-window-context-menu");
const editFlags = {
    canUndo: false,
    canRedo: false,
    canCut: true,
    canCopy: true,
    canPaste: false,
    canDelete: false,
    canSelectAll: true,
    canEditRichly: false,
};
(0, node_test_1.test)("offers Copy over a text selection outside editable fields", () => {
    const menu = (0, main_window_context_menu_1.buildMainWindowContextMenu)({
        isEditable: false,
        selectionText: "part of a dictation",
        editFlags,
    });
    strict_1.default.deepEqual(menu, [{ role: "copy" }]);
});
(0, node_test_1.test)("shows nothing when right-clicking plain text with no selection", () => {
    strict_1.default.equal((0, main_window_context_menu_1.buildMainWindowContextMenu)({
        isEditable: false,
        selectionText: "  \n",
        editFlags,
    }), null);
});
(0, node_test_1.test)("keeps the full edit menu for editable fields", () => {
    const menu = (0, main_window_context_menu_1.buildMainWindowContextMenu)({
        isEditable: true,
        selectionText: "",
        editFlags,
    });
    strict_1.default.deepEqual(menu?.map((item) => item.role ?? item.type), ["cut", "copy", "paste", "separator", "selectAll"]);
    strict_1.default.equal(menu?.[2]?.enabled, false);
});
//# sourceMappingURL=main-window-context-menu.test.js.map