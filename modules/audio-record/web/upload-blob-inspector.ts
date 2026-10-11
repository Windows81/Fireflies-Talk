const EBML_MAGIC = [0x1a, 0x45, 0xdf, 0xa3];
const CLUSTER_ID = [0x1f, 0x43, 0xb6, 0x75];
const SCAN_LIMIT = 2 * 1024 * 1024;

export type UploadBlobInspection = {
  size: number;
  ebmlHeaderOffset: number;
  firstClusterOffset: number;
  headerState: "ok" | "displaced" | "missing" | "not-webm";
};

function findSequence(bytes: Uint8Array, sequence: number[]): number {
  const limit = Math.min(bytes.length, SCAN_LIMIT);
  for (let offset = 0; offset <= limit - sequence.length; offset += 1) {
    let matches = true;
    for (let index = 0; index < sequence.length; index += 1) {
      if (bytes[offset + index] !== sequence[index]) {
        matches = false;
        break;
      }
    }
    if (matches) return offset;
  }
  return -1;
}

export function inspectUploadBlob(
  bytes: Uint8Array,
  mimeType: string,
): UploadBlobInspection {
  if (!mimeType.toLowerCase().includes("webm")) {
    return {
      size: bytes.length,
      ebmlHeaderOffset: -1,
      firstClusterOffset: -1,
      headerState: "not-webm",
    };
  }

  const ebmlHeaderOffset = findSequence(bytes, EBML_MAGIC);
  const firstClusterOffset = findSequence(bytes, CLUSTER_ID);
  const headerState =
    ebmlHeaderOffset === 0
      ? "ok"
      : ebmlHeaderOffset > 0
        ? "displaced"
        : "missing";

  return {
    size: bytes.length,
    ebmlHeaderOffset,
    firstClusterOffset,
    headerState,
  };
}
