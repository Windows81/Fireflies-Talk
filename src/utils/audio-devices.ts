/**
 * Chromium lists the OS default input twice: once as itself and once as a
 * `default` (and on Windows `communications`) pseudo-device labelled
 * "Default - <name>". Those entries follow whatever the OS makes the default,
 * so they are never a real device choice.
 */
const PSEUDO_DEVICE_IDS = new Set(["default", "communications"]);

export const isPseudoDeviceId = (deviceId: string): boolean =>
  PSEUDO_DEVICE_IDS.has(deviceId);

/** Strip Chromium's "Default - " / "Communications - " pseudo-device prefix. */
export const stripPseudoPrefix = (label: string): string =>
  label.replace(/^(Default|Communications)\s*-\s*/i, "").trim();
