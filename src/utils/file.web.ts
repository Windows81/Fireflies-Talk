import { Logger } from "@/logger";
import { WebRecordingStorage } from "@/modules/audio-record";

// Define recording directory locally to avoid circular dependency
const RECORDING_DIRECTORY = "fireflies://recordings/";

const logger = new Logger("file.web");

// Export the same interface as the native file.ts
export function uploadFile(
  url: string,
  fileUrl: string,
  options: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    onProgress?: (progress: { totalBytesSent: number }) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  },
) {
  logger.info(`uploading file`, {
    url,
    fileUrl,
  });

  const xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", (e) => {
    options.onProgress?.({
      totalBytesSent: e.loaded,
    });
  });
  xhr.addEventListener("load", () => {
    // Check if the response status indicates success (2xx)
    if (xhr.status >= 200 && xhr.status < 300) {
      options.onComplete?.();
    } else {
      options.onError?.(
        new Error(
          `Upload failed with status ${xhr.status}: ${xhr.responseText}`,
        ),
      );
    }
  });
  xhr.addEventListener("error", () => {
    options.onError?.(new Error(`Upload failed with status ${xhr.status}`));
  });

  // Check if it's a web recording from IndexedDB
  if (fileUrl.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    let blobUrl: string;
    WebRecordingStorage.createBlobUrl(fileUrl)
      .then((url: string | null) => {
        if (!url) {
          throw new Error("Recording not found or could not create blob URL");
        }
        blobUrl = url;
        return fetch(url);
      })
      .then((response: Response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        return response.blob();
      })
      .then((blob: Blob) => {
        xhr.open(options.method, url, true);
        if (options.headers) {
          for (const [key, value] of Object.entries(options.headers)) {
            xhr.setRequestHeader(key, value);
          }
        }
        xhr.send(blob);

        if (blobUrl) {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }
      })
      .catch((error: Error) => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        options.onError?.(error);
      });
  } else {
    fetch(fileUrl)
      .then((r) => r.blob())
      .then((blob) => {
        xhr.open(options.method, url, true);
        if (options.headers) {
          for (const [key, value] of Object.entries(options.headers)) {
            xhr.setRequestHeader(key, value);
          }
        }
        xhr.send(blob);
      })
      .catch((error: Error) => {
        options.onError?.(error);
      });
  }

  return {
    cancel: async () => xhr.abort(),
  };
}

export async function copyFile() {
  throw new Error("Copy not implemented for web");
}

export async function deleteFile(fileUrl: string) {
  // Check if it's a web recording from IndexedDB
  if (fileUrl.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    await WebRecordingStorage.deleteRecording(fileUrl);
  } else {
    // on the web, we use blob urls, so we just need to revoke them
    // there is no real file to delete
    URL.revokeObjectURL(fileUrl);
  }
}

export async function getFileInfo(
  uri: string,
  // the second argument is used as a hint
  // to resolve the correct file and mime type
  // this is because sometimes the uri is a content:// url
  // that does not represent the actual file name
  {
    name,
    mimeType: defaultMimeType,
  }: {
    name?: string;
    mimeType?: string;
  } = {},
) {
  let mimeType: string;
  let size: number;

  logger.info(`getFileInfo`, {
    uri,
    name,
    mimeType: defaultMimeType,
  });

  // Check if it's a web recording from IndexedDB
  if (uri.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    const recordingInfo = await WebRecordingStorage.getRecordingInfo(uri);
    if (!recordingInfo) {
      throw new Error("Recording not found");
    }
    mimeType = recordingInfo.mimeType;
    size = recordingInfo.size;
  } else {
    // Try HEAD request first for metadata
    let res = await fetch(uri, { method: "HEAD" });
    if (!res.ok || !res.headers.get("content-length")) {
      // Fallback to GET if HEAD doesn't provide needed info
      res = await fetch(uri);
    }
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    mimeType = res.headers.get("content-type") || "";
    size = Number.parseInt(res.headers.get("content-length") || "0", 10);
    if (size === 0 && res.body) {
      // If no content-length, need to read the body
      const blob = await res.blob();
      mimeType = blob.type;
      size = blob.size;
    }
  }

  return {
    mimeType,
    size,
  };
}

export async function getFileUrisInDirectory(
  directory: string,
): Promise<string[]> {
  logger.info(`getFileUrisInDirectory`, {
    directory,
  });

  // For web, return recordings from IndexedDB
  if (WebRecordingStorage) {
    try {
      const webRecordingUris = await WebRecordingStorage.getAllRecordingUris();
      return webRecordingUris;
    } catch (error) {
      logger.error(`Failed to get web recordings:`, error);
      return [];
    }
  } else {
    return [];
  }
}

export async function fileExists(uri: string) {
  if (uri.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    const recordingInfo = await WebRecordingStorage.getRecordingInfo(uri);
    return recordingInfo !== null;
  } else {
    throw new Error(
      "File exists check not implemented for non-IndexedDB files",
    );
  }
}

export async function createDirectoryIfNotExist() {
  // No-op for web, IndexedDB doesn't need directories
}

export function triggerDownloadFile(url: string, fileName?: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || url.split("/").pop() || "file";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function shareFile(url: string, fileName?: string) {
  // For web recordings, create a blob URL and trigger download
  if (url.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    const [blobUrl, info] = await Promise.all([
      WebRecordingStorage.createBlobUrl(url),
      WebRecordingStorage.getRecordingInfo(url),
    ]);
    if (blobUrl) {
      // Determine extension from mimeType
      const mime = info?.mimeType || "";
      const ext =
        mime === "audio/mpeg"
          ? ".mp3"
          : mime === "audio/webm"
            ? ".webm"
            : mime === "audio/wav"
              ? ".wav"
              : mime === "audio/ogg"
                ? ".ogg"
                : mime === "audio/mp4"
                  ? ".m4a"
                  : "";

      const base =
        (fileName || info?.context?.fileUri || "recording").split("/").pop() ||
        "recording";
      const sanitized = base.replace(/[^a-zA-Z0-9 _.-]/g, "_");
      const finalName =
        sanitized.endsWith(ext) || ext === ""
          ? sanitized
          : `${sanitized}${ext}`;

      // Create a temporary download link with desired filename
      triggerDownloadFile(blobUrl, finalName);
      // Clean up blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }
  } else {
    triggerDownloadFile(url, fileName);
  }
}

export async function downloadWithName(url: string, fileName?: string) {
  if (url.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    await shareFile(url, fileName);
    return;
  }
  // Otherwise, trigger a normal download with optional fileName
  triggerDownloadFile(url, fileName);
}

export async function downloadFile(
  _url: string,
  _destinationFileUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: {
    onProgress?: (progress: {
      totalBytesWritten: number;
      totalBytes: number | null;
    }) => void;
    signal?: AbortSignal;
  } = {},
) {
  // Offline downloads are native-only (the downloads feature is gated on native)
  throw new Error("downloadFile is not supported on web");
}

export async function createPlayableUrl(uri: string): Promise<string | null> {
  if (uri.startsWith(RECORDING_DIRECTORY) && WebRecordingStorage) {
    try {
      const blobUrl = await WebRecordingStorage.createBlobUrl(uri);
      return blobUrl;
    } catch (error) {
      logger.error(`Failed to create blob URL:`, error);
      return null;
    }
  } else {
    // For other URIs, return as-is
    return uri;
  }
}

export function revokePlayableUrl(blobUrl: string) {
  if (blobUrl.startsWith("blob:")) {
    URL.revokeObjectURL(blobUrl);
  }
}

// Utility function for LocalRecordings - returns file info in the expected format
export async function getRecordingFileInfo(uri: string): Promise<{
  exists: true;
  isDirectory: boolean;
  size: number;
  modificationTime: number;
  uri: string;
} | null> {
  if (!uri.startsWith(RECORDING_DIRECTORY) || !WebRecordingStorage) {
    return null;
  }

  try {
    const recordingInfo = await WebRecordingStorage.getRecordingInfo(uri);
    if (!recordingInfo) {
      return null;
    }

    return {
      exists: true,
      isDirectory: false,
      size: recordingInfo.size,
      modificationTime: recordingInfo.modificationTime,
      uri: uri,
    };
  } catch (error) {
    logger.error("Error getting web recording info for", { error, uri });
    return null;
  }
}

export function isWebRecording(uri: string): boolean {
  return uri.startsWith(RECORDING_DIRECTORY);
}

/**
 * Checks if there's enough free disk storage for any action that requires storage
 * @param minRequiredBytes - Minimum required storage in bytes (default: 300MB)
 * @returns Promise<boolean> - True if there's enough storage
 */
export async function hasMinimumDiskSpace(): Promise<boolean> {
  return true; // Web does not have a concept of disk space like native
}
