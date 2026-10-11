/**
 * The click path, spelled out because the toggle is three levels down and the
 * tab it lives under is not the one that opens by default. The app never appears
 * under "By App": that list is PlugInKit app extensions, and a CMIO camera
 * extension is a system extension, so only the category row knows about it.
 */
export const CAMERA_STEPS: readonly string[] = [
  "In System Settings, scroll down to Extensions.",
  'Switch to the "By Category" tab.',
  'Click the ⓘ next to "Camera Extensions".',
  "Turn on Fireflies.app, then click Done.",
];
