export function isAiPinExperienceEnabled(
  platform: string,
  pilotEnabled: unknown,
  development: boolean,
) {
  const isMobile = platform === "android" || platform === "ios";
  return isMobile && (development || pilotEnabled === true);
}
