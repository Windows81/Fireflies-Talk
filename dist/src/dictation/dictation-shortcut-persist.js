"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSavedDictationShortcuts = parseSavedDictationShortcuts;
const action_binding_1 = require("./action-binding");
const hands_free_binding_1 = require("./hands-free-binding");
const dictation_binding_1 = require("./dictation-binding");
const polish_binding_1 = require("./polish-binding");
function parseSavedDictationShortcuts(file, platform) {
    const dictation = (0, dictation_binding_1.normalizeDictationBinding)(file.dictation, platform);
    const action = file.action === null
        ? null
        : (0, action_binding_1.resolvePersistedActionBinding)(file.action, dictation, platform);
    const polish = (0, polish_binding_1.normalizePolishBinding)(file.polish, platform);
    return {
        action,
        dictation,
        handsFree: (0, hands_free_binding_1.resolvePersistedHandsFreeBinding)(file.handsFree, dictation, action, polish, platform),
        polish,
    };
}
//# sourceMappingURL=dictation-shortcut-persist.js.map