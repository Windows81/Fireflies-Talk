export class AudioInputUnavailableError extends Error {
  constructor() {
    super("The microphone is being used by another app");
  }
}
