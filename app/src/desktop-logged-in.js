"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDesktopLoggedIn = isDesktopLoggedIn;
exports.onDesktopLoggedInChange = onDesktopLoggedInChange;
exports.setDesktopLoggedIn = setDesktopLoggedIn;
exports.isMainDesktopLoginSender = isMainDesktopLoginSender;
const state = {
    loggedIn: false,
    onChange: null,
};
function isDesktopLoggedIn() {
    return state.loggedIn;
}
function onDesktopLoggedInChange(listener) {
    state.onChange = listener;
}
function setDesktopLoggedIn(next) {
    if (state.loggedIn === next)
        return false;
    state.loggedIn = next;
    state.onChange?.();
    return true;
}
function isMainDesktopLoginSender(sender, window) {
    if (!window || window.isDestroyed())
        return true;
    return sender.id === window.webContents.id;
}
//# sourceMappingURL=desktop-logged-in.js.map