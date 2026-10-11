import { CodedError } from "expo-modules-core";

export async function getResponseErrorMessage(res: Response) {
  let message: string | undefined;
  try {
    const json = await res.json();
    message =
      json.message ||
      json.errorMessage ||
      (typeof json.error === "string" && json.error);
  } catch {
    // ignore
  }
  return message || `Request failed with status ${res.status}`;
}

export function getErrorMessage(
  err: Error | CodedError | { message: string },
  prefix?: string,
) {
  if (err instanceof CodedError) {
    return `${prefix ? `${prefix}: ` : ""}${err.message} (${err.code})`;
  }
  return `${prefix ? `${prefix}: ` : ""}${err.message}`;
}
