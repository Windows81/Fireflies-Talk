"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCurrentRegistration = hasCurrentRegistration;
exports.needsReplacement = needsReplacement;
exports.allowsForcedDeactivation = allowsForcedDeactivation;
function versionsMatch(candidate, registration) {
    return (candidate.bundleVersion === registration.bundleVersion &&
        candidate.bundleShortVersion === registration.bundleShortVersion);
}
function numericVersionComponents(value) {
    if (!/^\d+(?:\.\d+){0,2}$/.test(value))
        return null;
    return value
        .split(".")
        .map((component) => component.replace(/^0+(?=\d)/, ""));
}
function compareNumericVersions(installed, embedded) {
    const installedParts = numericVersionComponents(installed);
    const embeddedParts = numericVersionComponents(embedded);
    if (!installedParts || !embeddedParts)
        return null;
    const componentCount = Math.max(installedParts.length, embeddedParts.length);
    for (let index = 0; index < componentCount; index++) {
        const installedPart = installedParts[index] ?? "0";
        const embeddedPart = embeddedParts[index] ?? "0";
        if (installedPart.length !== embeddedPart.length) {
            return installedPart.length < embeddedPart.length ? -1 : 1;
        }
        if (installedPart !== embeddedPart) {
            return installedPart < embeddedPart ? -1 : 1;
        }
    }
    return 0;
}
function compareRegistrationVersion(registration, embedded) {
    const bundleOrder = compareNumericVersions(registration.bundleVersion, embedded.bundleVersion);
    if (bundleOrder === null || bundleOrder !== 0)
        return bundleOrder;
    return compareNumericVersions(registration.bundleShortVersion, embedded.bundleShortVersion);
}
function isCurrentRegistration(embedded, registration) {
    return !registration.isUninstalling && versionsMatch(embedded, registration);
}
function hasEnabledCurrentRegistration(status) {
    const metadata = status.macosSystemExtension;
    const embedded = metadata?.embedded;
    if (!embedded)
        return false;
    return metadata.registrations.some((registration) => isCurrentRegistration(embedded, registration) && registration.enabled);
}
function hasCurrentRegistration(status) {
    const metadata = status.macosSystemExtension;
    const embedded = metadata?.embedded;
    if (!embedded)
        return false;
    return metadata.registrations.some((registration) => isCurrentRegistration(embedded, registration));
}
function hasPendingCurrentRegistration(status) {
    const metadata = status.macosSystemExtension;
    const embedded = metadata?.embedded;
    if (!embedded)
        return false;
    return metadata.registrations.some((registration) => isCurrentRegistration(embedded, registration) &&
        registration.awaitingApproval);
}
function needsReplacement(status) {
    const metadata = status.macosSystemExtension;
    const embedded = metadata?.embedded;
    if (!embedded)
        return false;
    if (hasEnabledCurrentRegistration(status) ||
        hasPendingCurrentRegistration(status)) {
        return false;
    }
    const nonCurrent = metadata.registrations.filter((registration) => !registration.isUninstalling &&
        !isCurrentRegistration(embedded, registration));
    return (nonCurrent.some((registration) => registration.enabled &&
        compareRegistrationVersion(registration, embedded) === -1) &&
        nonCurrent.every((registration) => compareRegistrationVersion(registration, embedded) === -1));
}
function allowsForcedDeactivation(status) {
    const metadata = status.macosSystemExtension;
    const embedded = metadata?.embedded;
    if (!embedded)
        return false;
    return metadata.registrations
        .filter((registration) => !registration.isUninstalling)
        .every((registration) => compareRegistrationVersion(registration, embedded) === -1);
}
//# sourceMappingURL=installation-version.js.map