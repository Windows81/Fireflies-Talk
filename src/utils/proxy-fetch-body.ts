function isBodylessMethod(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
}

/**
 * Hey-api passes a Request with a stream body. Re-fetching that stream needs
 * duplex, which Electron fetch often rejects — copy the payload first.
 */
export async function materializeRequestBody(
  originalRequest: Request | undefined,
  requestInit: RequestInit | undefined,
  method: string,
): Promise<BodyInit | undefined> {
  if (requestInit?.body != null) {
    return requestInit.body;
  }

  if (!originalRequest || isBodylessMethod(method)) {
    return undefined;
  }

  try {
    return await originalRequest.clone().arrayBuffer();
  } catch {
    return undefined;
  }
}
