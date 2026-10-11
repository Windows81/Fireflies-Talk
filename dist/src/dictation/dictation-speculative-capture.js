"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpeculativeCapture = createSpeculativeCapture;
function createSpeculativeCapture(send) {
    let active = false;
    return {
        begin: () => {
            if (active)
                return;
            active = true;
            send("dictation:capture");
        },
        adopt: () => {
            // The recording took the capture over, so nothing needs to be sent.
            active = false;
        },
        discard: () => {
            if (!active)
                return;
            active = false;
            send("dictation:cancel");
        },
        isActive: () => active,
    };
}
//# sourceMappingURL=dictation-speculative-capture.js.map