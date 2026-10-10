"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const observer_session_1 = require("./observer-session");
(0, node_test_1.test)("an invalidated observer ignores its already-queued callback", () => {
    const session = new observer_session_1.ObserverSession();
    const received = [];
    const callback = session.begin((value) => received.push(value));
    callback(1);
    session.invalidate();
    callback(2);
    strict_1.default.deepEqual(received, [1]);
});
(0, node_test_1.test)("starting a new observer invalidates callbacks from the old one", () => {
    const session = new observer_session_1.ObserverSession();
    const received = [];
    const oldCallback = session.begin((value) => received.push(value));
    const newCallback = session.begin((value) => received.push(value));
    oldCallback(1);
    newCallback(2);
    strict_1.default.deepEqual(received, [2]);
});
//# sourceMappingURL=observer-session.test.js.map