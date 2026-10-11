export class AudioInputUnavailableError extends Error {
  constructor() {
    super("The microphone is being used by another app");
  }
}

export class SystemAudioPermissionDeniedError extends Error {
  /** The permission type that was denied */
  readonly permissionType: "systemAudio" | "screen";

  constructor(permissionType: "systemAudio" | "screen") {
    const message =
      permissionType === "systemAudio"
        ? "System audio capture permission denied. Please enable it in System Settings."
        : "Screen recording permission denied. Please enable it in System Settings.";
    super(message);
    this.permissionType = permissionType;
  }
}
