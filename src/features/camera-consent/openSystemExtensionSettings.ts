/**
 * Opens the pane holding the pending approval for the Fireflies camera.
 * macOS only — Windows registers its filter without asking.
 */
export const openSystemExtensionSettings = () => {
  // Camera extensions live under Login Items & Extensions in System Settings.
  window.open(
    "x-apple.systempreferences:com.apple.ExtensionsPreferences" +
      "?extensionPointIdentifier=com.apple.system_extension.cmio.extension-point" +
      "&extensionIdentifier=ai.fireflies.desktop.camera",
  );
};
