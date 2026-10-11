/**
 * Normalize URL for comparison by removing query params, fragments, and trailing slashes
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Keep protocol, hostname, and pathname only
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
      .toLowerCase()
      .replace(/\/$/, "");
  } catch {
    // If URL parsing fails, just lowercase and remove trailing slash
    return url.toLowerCase().replace(/\/$/, "");
  }
}
