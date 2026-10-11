export class NetworkError extends Error {
  constructor() {
    super("Network error");
  }
}

export class CanceledError extends Error {
  constructor() {
    super("Canceled");
  }
}
