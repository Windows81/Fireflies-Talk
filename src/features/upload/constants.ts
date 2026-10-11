export const audioFileSizeLimit = 204800000 * 2; // 400 MB max
export const freeVideoFileSizeLimit = 100000000 * 2; // 200 MB free
export const paidVideoFileSizeLimit = 2000000000; // 2GB paid
export const supportedMimeType = ["audio/*", "video/*"];

export const MAX_RETRY_COUNT = 5;

export const UPLOAD_CLIENT_KEYS = {
  MOBILE_UPLOAD: "mobile-upload",
  MOBILE_RECORD: "mobile-record",
  MOBILE_SHARED: "mobile-shared",
  DESKTOP_UPLOAD: "desktop-upload",
  DESKTOP_RECORD: "desktop-record",
  DESKTOP_SHARED: "desktop-shared",
};
