export interface PermissionsGrantedInput {
  micGranted: boolean;
  /** Null until the first accessibility check resolves. */
  accessibilityGranted: boolean | null;
  /** False off macOS, where accessibility is neither needed nor reported. */
  needsAccessibility: boolean;
}

/**
 * Whether the permissions step has nothing left to ask for. Drives both the
 * router's skip on entry and the step's auto-advance once granted, so the two
 * cannot disagree. An unresolved accessibility check never counts as granted.
 */
export function allPermissionsGranted({
  micGranted,
  accessibilityGranted,
  needsAccessibility,
}: PermissionsGrantedInput): boolean {
  return micGranted && (!needsAccessibility || accessibilityGranted === true);
}
