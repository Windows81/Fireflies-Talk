"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObserverSession = void 0;
class ObserverSession {
    constructor() {
        this.generation = 0;
    }
    begin(callback) {
        const generation = ++this.generation;
        return (value) => {
            if (generation !== this.generation)
                return;
            callback(value);
        };
    }
    invalidate() {
        this.generation++;
    }
}
exports.ObserverSession = ObserverSession;
//# sourceMappingURL=observer-session.js.map