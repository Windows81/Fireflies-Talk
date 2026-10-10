"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldUseCoreAudioTap = exports.loopbackAudioTypes = exports.ipcEvents = exports.initAudioLoopback = void 0;
var audio_loopback_1 = require("./audio-loopback");
Object.defineProperty(exports, "initAudioLoopback", { enumerable: true, get: function () { return audio_loopback_1.initAudioLoopback; } });
var config_1 = require("./config");
Object.defineProperty(exports, "ipcEvents", { enumerable: true, get: function () { return config_1.ipcEvents; } });
Object.defineProperty(exports, "loopbackAudioTypes", { enumerable: true, get: function () { return config_1.loopbackAudioTypes; } });
Object.defineProperty(exports, "shouldUseCoreAudioTap", { enumerable: true, get: function () { return config_1.shouldUseCoreAudioTap; } });
//# sourceMappingURL=index.js.map