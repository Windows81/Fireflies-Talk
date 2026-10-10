"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMergedTrustedCAs = getMergedTrustedCAs;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const os_1 = require("os");
const tls_1 = __importDefault(require("tls"));
const CERTIFICATE_BLOCK_REGEX = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
const MACOS_SECURITY_BIN = "/usr/bin/security";
const USER_HOME = (0, os_1.homedir)();
const MACOS_KEYCHAINS = [
    "/Library/Keychains/System.keychain",
    "/System/Library/Keychains/SystemRootCertificates.keychain",
    `${USER_HOME}/Library/Keychains/login.keychain-db`,
    `${USER_HOME}/Library/Keychains/login.keychain`,
];
const SECURITY_CMD_MAX_BUFFER_BYTES = 64 * 1024 * 1024;
let cachedDarwinKeychainCAs = null;
function loadTlsCertificates(type) {
    try {
        const getCACerts = tls_1.default.getCACertificates;
        if (typeof getCACerts === "function") {
            return getCACerts(type);
        }
    }
    catch {
        // Older runtimes may not support tls.getCACertificates.
    }
    return [];
}
function loadDarwinKeychainCAs() {
    if (process.platform !== "darwin")
        return [];
    if (cachedDarwinKeychainCAs)
        return cachedDarwinKeychainCAs;
    try {
        const output = (0, child_process_1.execFileSync)(MACOS_SECURITY_BIN, ["find-certificate", "-a", "-p", ...MACOS_KEYCHAINS], {
            encoding: "utf8",
            maxBuffer: SECURITY_CMD_MAX_BUFFER_BYTES,
        });
        const certificates = output.match(CERTIFICATE_BLOCK_REGEX) ?? [];
        const caCertificates = certificates.filter((certificatePem) => {
            try {
                return new crypto_1.X509Certificate(certificatePem).ca;
            }
            catch {
                return false;
            }
        });
        cachedDarwinKeychainCAs = [...new Set(caCertificates)];
        return cachedDarwinKeychainCAs;
    }
    catch {
        cachedDarwinKeychainCAs = [];
        return cachedDarwinKeychainCAs;
    }
}
function getMergedTrustedCAs() {
    const defaultCAs = loadTlsCertificates("default");
    const systemCAs = loadTlsCertificates("system");
    const extraCAs = loadTlsCertificates("extra");
    const darwinKeychainCAs = loadDarwinKeychainCAs();
    const mergedCAs = [
        ...new Set([
            ...defaultCAs,
            ...systemCAs,
            ...extraCAs,
            ...darwinKeychainCAs,
        ]),
    ];
    return {
        certs: mergedCAs,
        counts: {
            default: defaultCAs.length,
            system: systemCAs.length,
            extra: extraCAs.length,
            darwinKeychain: darwinKeychainCAs.length,
            total: mergedCAs.length,
        },
    };
}
//# sourceMappingURL=ca-trust.js.map