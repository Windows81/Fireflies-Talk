"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureRequire = secureRequire;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
/**
 * Loads a bundled native module by validating its exact file path first, to
 * prevent directory hijacking.
 *
 * Native modules ship via extraResources in production and live beside the
 * electron/ sources in development, so the expected directory differs by
 * environment. The resolved path is confined to that directory.
 */
function secureRequire(moduleName) {
    const expectedDir = electron_1.app.isPackaged
        ? path.join(process.resourcesPath, moduleName)
        : path.join(__dirname, `../../${moduleName}`);
    const fullPath = path.join(expectedDir, "index.js");
    const normalizedPath = path.resolve(fullPath);
    const normalizedDir = path.resolve(expectedDir);
    if (!normalizedPath.startsWith(normalizedDir + path.sep)) {
        throw new Error(`Security violation: Resolved path ${normalizedPath} is outside expected directory ${normalizedDir}`);
    }
    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`Module file not found: ${normalizedPath}`);
    }
    const stats = fs.statSync(normalizedPath);
    if (!stats.isFile()) {
        throw new Error(`Expected a regular file but found: ${normalizedPath}`);
    }
    electron_log_1.default.info(`[SecureRequire] Loading validated module from: ${normalizedPath}`);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(normalizedPath);
}
//# sourceMappingURL=secure-require.js.map