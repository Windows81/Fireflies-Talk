"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialDictationHoldState = exports.LATCH_ECHO_MS = exports.ECHO_UP_MS = exports.NATIVE_DOUBLE_TAP_MIN_GAP_MS = exports.MIN_DOUBLE_TAP_GAP_MS = exports.DOUBLE_TAP_WINDOW_MS = exports.POST_STOP_COOLDOWN_MS = exports.CHORD_TAP_MAX_MS = exports.FN_TAP_MAX_MS = void 0;
exports.onHotkeyDown = onHotkeyDown;
exports.onHotkeyUp = onHotkeyUp;
exports.onDoubleTapDetected = onDoubleTapDetected;
exports.onDoubleTapTimeout = onDoubleTapTimeout;
exports.onHandsFreeStart = onHandsFreeStart;
exports.onHandsFreeToggle = onHandsFreeToggle;
exports.onForceStop = onForceStop;
exports.onForceCancel = onForceCancel;
exports.onHotkeyInterrupted = onHotkeyInterrupted;
exports.onHotkeyModifierUsed = onHotkeyModifierUsed;
exports.FN_TAP_MAX_MS = 400;
exports.CHORD_TAP_MAX_MS = 400;
exports.POST_STOP_COOLDOWN_MS = 300;
exports.DOUBLE_TAP_WINDOW_MS = 500;
// Bounce / leftover 0xB3 after release is typically <15ms. A real second tap
// can follow the first up in ~20ms.
exports.MIN_DOUBLE_TAP_GAP_MS = 20;
exports.NATIVE_DOUBLE_TAP_MIN_GAP_MS = 35;
// Globe often repeats FN_UP for one physical tap. Those must not re-arm the
// double-tap timer or they keep a single tap alive forever.
exports.ECHO_UP_MS = 300;
// Same-press 0xB3 after latch must not stop hands-free; a real stop tap is later.
exports.LATCH_ECHO_MS = 150;
const initialDictationHoldState = () => ({
    holdConsumed: false,
    keyDownAt: 0,
    lastStopAt: 0,
    lastTapUpAt: 0,
    latched: false,
    latchIgnoreNextUp: false,
    pendingDoubleTap: false,
    recording: false,
});
exports.initialDictationHoldState = initialDictationHoldState;
const tapMaxMs = (kind) => kind === "fn" ? exports.FN_TAP_MAX_MS : exports.CHORD_TAP_MAX_MS;
const resetActiveHold = (lastStopAt) => ({
    ...(0, exports.initialDictationHoldState)(),
    lastStopAt,
});
const latchState = (state, now, keyHeld) => ({
    ...state,
    keyDownAt: now,
    lastTapUpAt: now,
    latched: true,
    latchIgnoreNextUp: keyHeld,
    pendingDoubleTap: false,
    recording: true,
});
const isEchoUp = (state, now) => state.lastTapUpAt > 0 && now - state.lastTapUpAt < exports.ECHO_UP_MS;
function onHotkeyDown(state, kind, now) {
    if (state.holdConsumed) {
        return {
            effect: {
                reason: "Ignored hotkey down — hold used as modifier",
                type: "ignored",
            },
            state,
        };
    }
    if (state.latched) {
        if (state.keyDownAt > 0 && now - state.keyDownAt < exports.LATCH_ECHO_MS) {
            return { effect: { type: "none" }, state };
        }
        // Fn may still turn out to be a modifier (Fn+Delete), so hands-free
        // stops on its release instead. A chord hotkey has no such ambiguity.
        if (kind === "fn") {
            return {
                effect: { type: "none" },
                state: { ...state, keyDownAt: now, lastTapUpAt: 0 },
            };
        }
        return {
            effect: { reason: "Hotkey tap — hands-free stop", type: "stop" },
            state: resetActiveHold(now),
        };
    }
    if (state.pendingDoubleTap && state.lastTapUpAt) {
        const gap = now - state.lastTapUpAt;
        // Globe/Fn can bounce a down right after up. Chord listeners already
        // coalesce repeats, and a fast Ctrl+Win can land in the same JS tick.
        if (kind === "fn" && gap < exports.MIN_DOUBLE_TAP_GAP_MS) {
            return {
                effect: { type: "none" },
                state: { ...state, keyDownAt: now },
            };
        }
        if (gap <= exports.DOUBLE_TAP_WINDOW_MS) {
            return {
                effect: {
                    reason: "Double-tap hotkey — hands-free start",
                    type: "latch",
                },
                state: latchState(state, now, true),
            };
        }
    }
    if (state.recording && state.keyDownAt !== 0) {
        if (now - state.keyDownAt < exports.NATIVE_DOUBLE_TAP_MIN_GAP_MS) {
            return { effect: { type: "none" }, state };
        }
        return {
            effect: {
                reason: "Double-tap hotkey — hands-free start",
                type: "latch",
            },
            state: latchState(state, now, true),
        };
    }
    if (now - state.lastStopAt < exports.POST_STOP_COOLDOWN_MS) {
        return {
            effect: {
                reason: "Ignored hotkey down — cooldown active",
                type: "ignored",
            },
            state,
        };
    }
    return {
        effect: { reason: "Hotkey down — start recording", type: "start" },
        state: {
            ...state,
            keyDownAt: now,
            lastTapUpAt: 0,
            pendingDoubleTap: false,
            recording: true,
        },
    };
}
function onHotkeyUp(state, kind, now) {
    const holdDuration = state.keyDownAt ? now - state.keyDownAt : 0;
    const cleared = { ...state, keyDownAt: 0 };
    // Releasing a modifier hold is not a tap: nothing to stop, arm or latch.
    if (cleared.holdConsumed) {
        return {
            effect: { type: "none" },
            state: { ...cleared, holdConsumed: false },
        };
    }
    if (cleared.latched) {
        if (cleared.latchIgnoreNextUp || isEchoUp(cleared, now)) {
            return {
                effect: { type: "none" },
                state: { ...cleared, latchIgnoreNextUp: false },
            };
        }
        return {
            effect: { reason: "Hotkey tap — hands-free stop", type: "stop" },
            state: resetActiveHold(now),
        };
    }
    // Extra Globe FN_UPs must not re-arm the timer or a single tap never expires.
    if (cleared.pendingDoubleTap) {
        return { effect: { type: "none" }, state: cleared };
    }
    if (cleared.recording) {
        if (holdDuration >= tapMaxMs(kind)) {
            return {
                effect: { reason: "Hotkey released — stop recording", type: "stop" },
                state: resetActiveHold(now),
            };
        }
        return {
            effect: {
                reason: "Brief hotkey tap — waiting for double-tap",
                type: "arm-double-tap",
            },
            state: {
                ...cleared,
                lastTapUpAt: now,
                pendingDoubleTap: true,
                recording: true,
            },
        };
    }
    return { effect: { type: "none" }, state: { ...cleared, lastTapUpAt: now } };
}
function onDoubleTapDetected(state, now) {
    if (state.holdConsumed)
        return { effect: { type: "none" }, state };
    if (state.latched) {
        if (state.keyDownAt > 0 && now - state.keyDownAt < exports.LATCH_ECHO_MS) {
            return { effect: { type: "none" }, state };
        }
        return {
            effect: { reason: "Hotkey tap — hands-free stop", type: "stop" },
            state: resetActiveHold(now),
        };
    }
    if (!state.recording && !state.pendingDoubleTap) {
        return { effect: { type: "none" }, state };
    }
    if (state.keyDownAt > 0 &&
        now - state.keyDownAt < exports.NATIVE_DOUBLE_TAP_MIN_GAP_MS) {
        return { effect: { type: "none" }, state };
    }
    return {
        effect: {
            reason: "Double-tap hotkey — hands-free start",
            type: "latch",
        },
        state: latchState(state, now, true),
    };
}
function onDoubleTapTimeout(state, now) {
    if (!state.pendingDoubleTap || state.latched) {
        return { effect: { type: "none" }, state };
    }
    return {
        effect: {
            reason: "Double-tap window expired — discarded tap",
            type: "cancel",
        },
        state: resetActiveHold(now),
    };
}
function onHandsFreeStart(state) {
    if (state.recording || state.latched) {
        return { effect: { type: "none" }, state };
    }
    return {
        effect: {
            reason: "Mic button — hands-free start (dictate)",
            type: "start",
        },
        state: {
            ...state,
            keyDownAt: 0,
            lastTapUpAt: 0,
            latched: true,
            latchIgnoreNextUp: false,
            pendingDoubleTap: false,
            recording: true,
        },
    };
}
/** Dedicated hands-free shortcut pressed: toggles hands-free, or keeps a hold going. */
function onHandsFreeToggle(state, now, keyHeld = false) {
    if (state.latched)
        return {
            effect: { reason: "Hands-free shortcut — stop", type: "stop" },
            state: resetActiveHold(now),
        };
    if (state.recording) {
        return {
            effect: {
                reason: "Hands-free shortcut — keep going hands-free",
                type: "latch",
            },
            state: latchState(state, now, state.keyDownAt > 0),
        };
    }
    if (now - state.lastStopAt < exports.POST_STOP_COOLDOWN_MS)
        return {
            effect: {
                reason: "Ignored hands-free shortcut — cooldown active",
                type: "ignored",
            },
            state,
        };
    const started = onHandsFreeStart(state);
    return {
        effect: { reason: "Hands-free shortcut — start", type: "start" },
        state: { ...started.state, latchIgnoreNextUp: keyHeld },
    };
}
function onForceStop(state, now, reason) {
    if (!state.recording && !state.latched) {
        return { effect: { type: "none" }, state };
    }
    return {
        effect: { reason, type: "stop" },
        state: resetActiveHold(now),
    };
}
function onForceCancel(_state, now, reason) {
    return {
        effect: { reason, type: "cancel" },
        state: resetActiveHold(now),
    };
}
function onHotkeyInterrupted(state, now) {
    if (state.latched)
        return { effect: { type: "none" }, state };
    if (state.keyDownAt === 0 && !state.recording) {
        return { effect: { type: "none" }, state };
    }
    return onForceCancel(state, now, "Hotkey used as modifier — cancelling recording");
}
/**
 * The held hotkey turned out to be a modifier for another key (Fn+Delete).
 * A recording this hold started is cancelled; the rest of the hold is
 * consumed so repeats cannot restart it and the release is a no-op.
 * Hands-free that already survived a release keeps running.
 */
function onHotkeyModifierUsed(state, now) {
    if (state.latched && (!state.latchIgnoreNextUp || state.keyDownAt === 0)) {
        return {
            effect: { type: "none" },
            state: {
                ...state,
                holdConsumed: true,
                keyDownAt: 0,
                latchIgnoreNextUp: false,
            },
        };
    }
    if (state.recording) {
        return {
            effect: {
                reason: "Hotkey used as modifier — cancelling recording",
                type: "cancel",
            },
            state: { ...resetActiveHold(now), holdConsumed: true },
        };
    }
    return {
        effect: {
            reason: "Hotkey used as modifier — hold consumed",
            type: "ignored",
        },
        state: { ...state, holdConsumed: true, keyDownAt: 0 },
    };
}
//# sourceMappingURL=dictation-hold-machine.js.map