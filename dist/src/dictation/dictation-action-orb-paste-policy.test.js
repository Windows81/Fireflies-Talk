"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dictation_action_orb_paste_policy_1 = require("./dictation-action-orb-paste-policy");
(0, node_test_1.test)("the owner renderer may paste a completed detached run", () => {
    strict_1.default.equal((0, dictation_action_orb_paste_policy_1.canPasteFromSender)({ isOwner: true, isOrb: false, textLength: 12 }), true);
});
(0, node_test_1.test)("the overlay may paste from the orb card", () => {
    strict_1.default.equal((0, dictation_action_orb_paste_policy_1.canPasteFromSender)({ isOwner: false, isOrb: true, textLength: 12 }), true);
});
(0, node_test_1.test)("any other window is refused", () => {
    strict_1.default.equal((0, dictation_action_orb_paste_policy_1.canPasteFromSender)({ isOwner: false, isOrb: false, textLength: 12 }), false);
});
(0, node_test_1.test)("empty and oversized text are refused from either surface", () => {
    strict_1.default.equal((0, dictation_action_orb_paste_policy_1.canPasteFromSender)({ isOwner: true, isOrb: false, textLength: 0 }), false);
    strict_1.default.equal((0, dictation_action_orb_paste_policy_1.canPasteFromSender)({
        isOwner: false,
        isOrb: true,
        textLength: dictation_action_orb_paste_policy_1.MAX_ORB_PASTE_CHARS + 1,
    }), false);
    strict_1.default.equal((0, dictation_action_orb_paste_policy_1.canPasteFromSender)({
        isOwner: true,
        isOrb: false,
        textLength: dictation_action_orb_paste_policy_1.MAX_ORB_PASTE_CHARS,
    }), true);
});
//# sourceMappingURL=dictation-action-orb-paste-policy.test.js.map