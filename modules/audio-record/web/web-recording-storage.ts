import { Logger } from "@/logger";
import {
  OpfsUtils,
  type StorageEstimate,
  type StorageInfo,
} from "@/utils/opfs-utils";
import { analyzeChunkIndices } from "./chunk-integrity";

// Electron fs API type (matches electron/src/types.ts)
interface ElectronFsAPI {
  getRecordingsDir: () => Promise<string>;
  mkdir: (path: string) => Promise<void>;
  writeFile: (path: string, data: ArrayBuffer) => Promise<void>;
  appendFile: (path: string, data: ArrayBuffer) => Promise<void>;
  readFile: (path: string) => Promise<ArrayBuffer>;
  readFileRange: (
    path: string,
    start: number,
    length: number,
  ) => Promise<ArrayBuffer>;
  stat: (
    path: string,
  ) => Promise<{ size: number; mtime: number; isFile: boolean } | null>;
  exists: (path: string) => Promise<boolean>;
  unlink: (path: string) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
}

// Check if running in Electron
const isElectron = (): boolean =>
  Boolean((window as unknown as { electron?: unknown }).electron);

// Get Electron fs API
const getElectronFs = (): ElectronFsAPI | null => {
  const win = window as unknown as { electron?: { fs?: ElectronFsAPI } };
  return win.electron?.fs ?? null;
};

export interface WebRecordingInfo {
  fileUri: string;
  size: number;
  mimeType: string;
  context: {
    fileUri: string;
    mimeType: string;
  };
  timestamp: number;
  exists: true;
  isDirectory: false;
  modificationTime: number;
}

interface RecordingChunk {
  id: string;
  uri: string;
  chunkIndex: number;
  data: Uint8Array;
  timestamp: number;
}

interface RecordingMetadata {
  uri: string;
  mimeType: string;
  timestamp: number;
  totalChunks: number;
  isComplete: boolean;
  totalSize: number;
  storageBackend?: "idb" | "opfs";
  opfsFileName?: string;
  lastChunkIndex?: number;
  expectedChunkSize?: number;
}

const RECORDINGS_ROOT_DIR = "recordings";
const LOW_DISK_KEEP_LAST_RECORDS = 30;

/**
 * Manages progressive audio recordings using either the Origin Private File System
 * (OPFS) or IndexedDB. OPFS is tested at runtime by creating a temporary file and
 * attempting to write to it, ensuring Safari and other modern browsers use it
 * when available. Writes are chunked and serialized to avoid race conditions.
 */
class WebRecordingStorageManager {
  // Database configuration
  private readonly dbName = "FirefliesRecordings";
  private readonly dbVersion = 1;
  private readonly metadataStore = "metadata";
  private readonly chunksStore = "chunks";

  // Track OPFS writers
  private opfsRecordWriters = new Map<
    string,
    {
      fileHandle: FileSystemFileHandle;
      writable: FileSystemWritableFileStream;
      position: number;
      mimeType: string;
      fileName: string;
      bytesWritten: number;
      lastCheckpointTs: number;
      consecutiveCheckpointFailures: number; // Track checkpoint health
    }
  >();

  // Logging
  private logger = new Logger("web-recording-storage");

  // OPFS checkpoint thresholds
  private readonly opfsCheckpointBytes = 256 * 1024;
  private readonly opfsCheckpointMs = 60_000;
  private readonly maxCheckpointFailures = 3; // Fail recording after 3 consecutive checkpoint failures

  // Serialize writes to OPFS per URI
  private opfsWriteChains = new Map<string, Promise<void>>();

  // Serialize writes to IDB per URI
  private idbWriteQueues = new Map<string, Promise<void>>();
  private pendingChunks = new Map<string, Map<number, Uint8Array>>();
  private lastProcessedChunk = new Map<string, number>();

  // Cache OPFS detection result
  private opfsAvailable: boolean | null = null;

  // Electron fs-based storage
  private electronRecordingsDir: string | null = null;
  private electronRecordings = new Map<
    string,
    {
      filePath: string;
      mimeType: string;
      timestamp: number;
      totalChunks: number;
      totalSize: number;
      isComplete: boolean;
    }
  >();
  private electronWriteChains = new Map<string, Promise<void>>();
  private electronHydrated = false;

  /**
   * Check if we should use Electron fs-based storage.
   */
  private useElectronFs(): boolean {
    return isElectron() && getElectronFs() !== null;
  }

  /**
   * Hydrate Electron recordings from filesystem on startup.
   * Scans the recordings directory and populates electronRecordings map.
   */
  private async hydrateElectronRecordings(): Promise<void> {
    if (this.electronHydrated || !this.useElectronFs()) {
      return;
    }

    const fs = getElectronFs();
    if (!fs) return;

    try {
      const dir = await this.getElectronRecordingsDir();
      const files = await fs.readdir(dir);

      for (const fileName of files) {
        const filePath = `${dir}/${fileName}`;
        const stat = await fs.stat(filePath);

        if (!stat || !stat.isFile) continue;

        // Derive URI from filename (reverse of deriveOpfsFileName)
        const uri = `fireflies://recordings/${fileName}`;

        // Skip if already in map (e.g., from current session)
        if (this.electronRecordings.has(uri)) continue;

        // Determine mimeType from extension
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        const mimeType =
          ext === "mp3"
            ? "audio/mpeg"
            : ext === "webm"
              ? "audio/webm"
              : ext === "wav"
                ? "audio/wav"
                : ext === "ogg"
                  ? "audio/ogg"
                  : ext === "m4a"
                    ? "audio/mp4"
                    : "audio/webm";

        this.electronRecordings.set(uri, {
          filePath,
          mimeType,
          timestamp: stat.mtime,
          totalChunks: 0,
          totalSize: stat.size,
          isComplete: true, // Assume complete since it exists on disk
        });
      }

      this.electronHydrated = true;
      this.logger.info("Hydrated Electron recordings from filesystem", {
        count: this.electronRecordings.size,
      });
    } catch (error) {
      this.logger.error("Failed to hydrate Electron recordings", {
        error: (error as Error)?.message,
      });
    }
  }

  /**
   * Get the Electron recordings directory, initializing it if needed.
   */
  private async getElectronRecordingsDir(): Promise<string> {
    if (this.electronRecordingsDir) {
      return this.electronRecordingsDir;
    }
    const fs = getElectronFs();
    if (!fs) throw new Error("Electron fs not available");
    this.electronRecordingsDir = await fs.getRecordingsDir();
    return this.electronRecordingsDir;
  }

  /**
   * Derive a file path for an Electron recording.
   */
  private async deriveElectronFilePath(
    uri: string,
    mimeType: string,
  ): Promise<string> {
    const dir = await this.getElectronRecordingsDir();
    const fileName = this.deriveOpfsFileName(uri, mimeType);
    return `${dir}/${fileName}`;
  }

  /**
   * Get an estimate of used and available storage.
   */
  async getStorageEstimate(): Promise<StorageEstimate> {
    return OpfsUtils.getStorageEstimate();
  }

  /**
   * Check if there is enough space to write `requiredBytes`.
   */
  async checkStorageSpace(requiredBytes: number): Promise<boolean> {
    return OpfsUtils.checkStorageSpace(requiredBytes);
  }

  /**
   * Ask the user for persistent storage permission.
   */
  async requestPersistentStorage(): Promise<boolean> {
    const granted = await OpfsUtils.requestPersistentStorage();
    this.logger.info(`Persistent storage ${granted ? "granted" : "denied"}`);
    return granted;
  }

  /**
   * Returns detailed storage usage information.
   */
  async getStorageInfo(): Promise<StorageInfo> {
    return OpfsUtils.getStorageInfo();
  }

  /**
   * Initialize recording metadata and allocate either OPFS or IndexedDB as
   * the backend. If OPFS is supported, a writable stream is created.
   */
  async initializeRecording(uri: string, mimeType: string): Promise<void> {
    // Electron fs path - much simpler
    if (this.useElectronFs()) {
      try {
        const filePath = await this.deriveElectronFilePath(uri, mimeType);
        const fs = getElectronFs()!;

        // Create empty file
        await fs.writeFile(filePath, new ArrayBuffer(0));

        // Store metadata in memory
        this.electronRecordings.set(uri, {
          filePath,
          mimeType,
          timestamp: Date.now(),
          totalChunks: 0,
          totalSize: 0,
          isComplete: false,
        });

        this.logger.info("initializeRecording: using Electron fs backend", {
          uri,
          filePath,
          mimeType,
        });
        return;
      } catch (error) {
        // Log error and fall through to OPFS/IDB
        this.logger.error(
          "Electron fs initialization failed; falling back to OPFS/IDB",
          {
            uri,
            mimeType,
            error: (error as Error)?.message,
          },
        );
        // Clean up any partial state
        this.electronRecordings.delete(uri);
      }
    }

    const db = await this.openDB();

    // Reset IDB tracking for this URI
    this.lastProcessedChunk.set(uri, -1);
    this.pendingChunks.set(uri, new Map());

    // Determine backend
    const useOpfs = await this.ensureOpfsAvailable();
    let opfsFileName: string | undefined;

    if (useOpfs) {
      try {
        const recordingsDir =
          await OpfsUtils.getOpfsDirectory(RECORDINGS_ROOT_DIR);
        opfsFileName = this.deriveOpfsFileName(uri, mimeType);
        const fileHandle = await recordingsDir.getFileHandle(opfsFileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        this.opfsRecordWriters.set(uri, {
          fileHandle,
          writable,
          position: 0,
          mimeType,
          fileName: opfsFileName,
          bytesWritten: 0,
          lastCheckpointTs: Date.now(),
          consecutiveCheckpointFailures: 0,
        });
        this.logger.info("initializeRecording: using OPFS backend", {
          uri,
          opfsFileName,
          mimeType,
        });
      } catch (error) {
        // If OPFS fails, fall back to IDB
        this.logger.warn("Failed to initialize OPFS; using IndexedDB", {
          uri,
          error: (error as Error)?.message,
        });
      }
    } else {
      this.logger.info("initializeRecording: using IndexedDB backend", {
        uri,
        mimeType,
      });
    }

    // Store metadata
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.metadataStore], "readwrite");
      const store = tx.objectStore(this.metadataStore);

      const metadata: RecordingMetadata = {
        uri,
        mimeType,
        timestamp: Date.now(),
        totalChunks: 0,
        isComplete: false,
        totalSize: 0,
        storageBackend:
          useOpfs && opfsFileName ? "opfs" : ("idb" as "idb" | "opfs"),
        opfsFileName,
        lastChunkIndex: -1,
      };

      const req = store.put(metadata);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  /**
   * Save a chunk of data. Uses OPFS when possible; otherwise uses IndexedDB.
   */
  async saveRecordingChunk(
    uri: string,
    chunkIndex: number,
    data: Uint8Array,
    retryCount = 0,
  ): Promise<void> {
    // Electron fs path - simple append
    if (this.useElectronFs()) {
      const recording = this.electronRecordings.get(uri);
      if (!recording) {
        throw new Error(`Recording not initialized: ${uri}`);
      }

      const fs = getElectronFs()!;

      // Serialize writes per URI
      const prev = this.electronWriteChains.get(uri) || Promise.resolve();
      const next = prev.then(async () => {
        await fs.appendFile(
          recording.filePath,
          data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength,
          ) as ArrayBuffer,
        );
        recording.totalChunks = Math.max(recording.totalChunks, chunkIndex + 1);
        recording.totalSize += data.byteLength;
      });

      this.electronWriteChains.set(
        uri,
        next.catch(() => {}),
      );
      await next;
      return;
    }

    let writer = this.opfsRecordWriters.get(uri);

    // OPFS path
    if (writer) {
      await this.runWithOpfsLock(uri, async () => {
        try {
          await writer!.writable.write({
            type: "write",
            position: writer!.position,
            data: data.buffer.slice(
              data.byteOffset,
              data.byteOffset + data.byteLength,
            ) as ArrayBuffer,
          });
          writer!.position += data.length;
          writer!.bytesWritten += data.length;

          // Checkpoint to flush OS buffers
          const now = Date.now();
          if (
            writer!.bytesWritten >= this.opfsCheckpointBytes ||
            now - writer!.lastCheckpointTs >= this.opfsCheckpointMs
          ) {
            try {
              await writer!.writable.close();
              const newWritable = await writer!.fileHandle.createWritable({
                keepExistingData: true,
              });
              writer!.writable = newWritable;
              writer!.bytesWritten = 0;
              writer!.lastCheckpointTs = now;
              writer!.consecutiveCheckpointFailures = 0; // Reset on success

              this.logger.info("OPFS checkpoint successful", {
                uri,
                position: writer!.position,
              });
            } catch (e) {
              writer!.consecutiveCheckpointFailures++;

              this.logger.error("OPFS checkpoint failed", {
                uri,
                error: (e as Error)?.message,
                consecutiveFailures: writer!.consecutiveCheckpointFailures,
              });

              // CRITICAL: If too many consecutive checkpoint failures, fail the recording
              // This prevents data loss - better to fail early than record silently without persistence
              if (
                writer!.consecutiveCheckpointFailures >=
                this.maxCheckpointFailures
              ) {
                this.logger.error(
                  "Too many consecutive checkpoint failures - recording may be unreliable",
                  {
                    uri,
                    failures: writer!.consecutiveCheckpointFailures,
                  },
                );
                throw new Error(
                  `OPFS checkpoint failed ${writer!.consecutiveCheckpointFailures} times. Recording may not be persisted to disk. Stop and restart recording.`,
                );
              }
            }
          }
        } catch (error) {
          // Try to reopen if writer was closed
          const domErr =
            error instanceof DOMException &&
            (error.name === "InvalidStateError" ||
              error.name === "NotReadableError");
          if (domErr) {
            try {
              const reopened = await writer!.fileHandle.createWritable({
                keepExistingData: true,
              });
              writer!.writable = reopened;
              await writer!.writable.write({
                type: "write",
                position: writer!.position,
                data: data.buffer.slice(
                  data.byteOffset,
                  data.byteOffset + data.byteLength,
                ) as ArrayBuffer,
              });
              writer!.position += data.length;
              writer!.bytesWritten += data.length;
            } catch (retryErr) {
              this.logger.warn("OPFS reopen+write failed", {
                uri,
                chunkIndex,
                error: (retryErr as Error)?.message,
              });
              throw retryErr;
            }
          } else {
            this.logger.warn("OPFS write failed", {
              uri,
              chunkIndex,
              error: (error as Error)?.message,
            });
            throw error;
          }
        }
      });

      // Update metadata
      await this.updateLastChunkIndex(uri, chunkIndex);
      return;
    }

    // Attempt to rehydrate writer if OPFS metadata exists
    try {
      const hydrated = await this.tryRehydrateOpfsWriter(uri);
      if (hydrated) {
        writer = hydrated;
        await this.saveRecordingChunk(uri, chunkIndex, data, retryCount);
        return;
      }
    } catch (e) {
      this.logger.warn("Rehydrate OPFS writer failed", {
        uri,
        error: (e as Error)?.message,
      });
    }

    // IndexedDB fallback
    await this.saveChunkToIdb(uri, chunkIndex, data, retryCount);
  }

  /**
   * Write a chunk to IndexedDB and ensure sequential order.
   */
  private async saveChunkToIdb(
    uri: string,
    chunkIndex: number,
    data: Uint8Array,
    retryCount = 0,
  ): Promise<void> {
    // Register chunk for sequential processing
    let map = this.pendingChunks.get(uri);
    if (!map) {
      map = new Map();
      this.pendingChunks.set(uri, map);
    }
    map.set(chunkIndex, data);

    // Process queue under lock
    await this.runWithIdbLock(uri, async () => {
      await this.processPendingChunks(uri, retryCount);
    });
  }

  /**
   * Process pending chunks in ascending order.
   */
  private async processPendingChunks(
    uri: string,
    retryCount = 0,
  ): Promise<void> {
    const pendingMap = this.pendingChunks.get(uri);
    if (!pendingMap || pendingMap.size === 0) return;

    const lastProcessed = this.lastProcessedChunk.get(uri) ?? -1;
    let current = lastProcessed + 1;

    while (pendingMap.has(current)) {
      const data = pendingMap.get(current)!;

      // Check quota; attempt cleanup if needed
      const hasSpace = await this.checkStorageSpace(data.length);
      if (!hasSpace) {
        const persistent = await this.requestPersistentStorage();
        if (!persistent) {
          const info = await this.getStorageInfo();
          if (info.usagePercentage > 90) {
            this.logger.warn("Storage critically low; cleaning old recordings");
            await this.cleanupOldRecordings();
          }
        }
        const afterCleanup = await this.checkStorageSpace(data.length);
        if (!afterCleanup) {
          throw new Error("Insufficient storage space for recording chunk");
        }
      }

      // Write chunk
      await this.writeChunkToIdb(uri, current, data, retryCount);

      pendingMap.delete(current);
      this.lastProcessedChunk.set(uri, current);
      await this.updateLastChunkIndex(uri, current);

      current++;
    }

    if (pendingMap.size > 0) {
      const waiting = Array.from(pendingMap.keys()).sort((a, b) => a - b);
      this.logger.debug("Chunks waiting for sequential processing:", {
        uri,
        lastProcessed: this.lastProcessedChunk.get(uri),
        waiting,
      });
    }
  }

  /**
   * Write a chunk to IndexedDB, retrying on quota errors.
   */
  private async writeChunkToIdb(
    uri: string,
    chunkIndex: number,
    data: Uint8Array,
    retryCount: number,
  ): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.chunksStore], "readwrite");
      const store = tx.objectStore(this.chunksStore);

      const dataCopy = new Uint8Array(data);

      const chunk: RecordingChunk = {
        id: `${uri}_${chunkIndex}`,
        uri,
        chunkIndex,
        data: dataCopy,
        timestamp: Date.now(),
      };

      const req = store.put(chunk);

      let settled = false;
      const cleanup = () => {
        try {
          req.onerror = null as unknown as (this: IDBRequest) => unknown;
          req.onsuccess = null as unknown as (
            this: IDBRequest,
            ev: Event,
          ) => unknown;
        } catch (e) {
          console.error("Failed to cleanup IDB request", e);
        }
        try {
          tx.onabort = null;
          tx.oncomplete = null;
          // Note: do not null tx.onerror as some browsers may throw; not set anyway
        } catch (e) {
          console.error("Failed to cleanup IDB transaction", e);
        }
      };

      req.onerror = async () => {
        if (settled) return;
        if (req.error?.name === "QuotaExceededError") {
          if (retryCount < 2) {
            this.logger.warn(
              `Quota exceeded; cleanup and retry (${retryCount + 1}/2)`,
            );
            try {
              await this.cleanupOldRecordings();
              await this.writeChunkToIdb(uri, chunkIndex, data, retryCount + 1);
              settled = true;
              cleanup();
              resolve();
            } catch {
              settled = true;
              cleanup();
              reject(
                new Error(
                  "Storage quota exceeded; free up space or request persistent storage.",
                ),
              );
            }
          } else {
            settled = true;
            cleanup();
            reject(
              new Error("Storage quota exceeded after retries; free up space."),
            );
          }
        } else {
          settled = true;
          cleanup();
          reject(req.error);
        }
      };

      req.onsuccess = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      tx.onabort = async () => {
        if (settled) return;
        const name = tx.error?.name;
        if (name === "QuotaExceededError") {
          if (retryCount < 2) {
            this.logger.warn(
              `Quota exceeded (tx abort); cleanup and retry (${retryCount + 1}/2)`,
            );
            try {
              await this.cleanupOldRecordings();
              await this.writeChunkToIdb(uri, chunkIndex, data, retryCount + 1);
              settled = true;
              cleanup();
              resolve();
            } catch {
              settled = true;
              cleanup();
              reject(
                new Error(
                  "Storage quota exceeded; free up space or request persistent storage.",
                ),
              );
            }
          } else {
            settled = true;
            cleanup();
            reject(
              new Error("Storage quota exceeded after retries; free up space."),
            );
          }
        } else {
          settled = true;
          cleanup();
          reject(tx.error ?? new Error("Transaction aborted"));
        }
      };
    });
  }

  /**
   * Update the lastChunkIndex in metadata for a recording.
   */
  private async updateLastChunkIndex(
    uri: string,
    chunkIndex: number,
  ): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.metadataStore], "readwrite");
      const store = tx.objectStore(this.metadataStore);
      const getReq = store.get(uri);

      getReq.onsuccess = () => {
        const metadata = getReq.result as RecordingMetadata | null;
        if (metadata) {
          metadata.lastChunkIndex = Math.max(
            metadata.lastChunkIndex ?? -1,
            chunkIndex,
          );
          const putReq = store.put(metadata);
          putReq.onerror = () => reject(putReq.error);
          putReq.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Finalize a recording by flushing pending writes, closing writers, and
   * marking metadata as complete.
   */
  async finalizeRecording(
    uri: string,
    totalChunks: number,
    totalSize: number,
  ): Promise<void> {
    // Electron fs path
    if (this.useElectronFs()) {
      // Wait for any in-flight writes
      const writePromise = this.electronWriteChains.get(uri);
      if (writePromise) {
        try {
          await writePromise;
        } catch (error) {
          this.logger.warn(
            "In-flight Electron fs write failed during finalize",
            {
              uri,
              error,
            },
          );
        }
      }

      const recording = this.electronRecordings.get(uri);
      if (recording) {
        recording.totalChunks = totalChunks;
        recording.totalSize = totalSize;
        recording.isComplete = true;
      }

      this.electronWriteChains.delete(uri);
      this.logger.info("finalizeRecording (Electron fs)", {
        uri,
        totalChunks,
        totalSize,
      });
      return;
    }

    // CRITICAL: Wait for any in-flight writes to complete before finalizing
    // This prevents race condition where finalize closes writer while write is in progress
    const opfsWritePromise = this.opfsWriteChains.get(uri);
    const idbWritePromise = this.idbWriteQueues.get(uri);

    if (opfsWritePromise) {
      this.logger.info("Waiting for in-flight OPFS writes to complete", {
        uri,
      });
      try {
        await opfsWritePromise;
      } catch (error) {
        this.logger.warn("In-flight OPFS write failed during finalize", {
          uri,
          error,
        });
      }
    }

    if (idbWritePromise) {
      this.logger.info("Waiting for in-flight IDB writes to complete", { uri });
      try {
        await idbWritePromise;
      } catch (error) {
        this.logger.warn("In-flight IDB write failed during finalize", {
          uri,
          error,
        });
      }
    }

    // Flush IDB pending writes
    const pending = this.pendingChunks.get(uri);
    if (pending && pending.size > 0) {
      this.logger.warn(
        "Finalizing with pending chunks; processing them first",
        { uri, pendingCount: pending.size },
      );

      await this.runWithIdbLock(uri, async () => {
        const list = Array.from(pending.entries()).sort((a, b) => a[0] - b[0]);
        for (const [idx, data] of list) {
          await this.writeChunkToIdb(uri, idx, data, 0);
          pending.delete(idx);
          this.lastProcessedChunk.set(uri, idx);
        }
      });
    }

    // Close OPFS writer
    const writer = this.opfsRecordWriters.get(uri);
    if (writer) {
      try {
        await this.runWithOpfsLock(uri, async () => {
          try {
            await writer.writable.close();
            this.logger.info("OPFS writer closed successfully", { uri });
          } catch (closeError) {
            // If already closed or invalid state, that's okay during finalize
            this.logger.warn(
              "OPFS writer close error (may be already closed)",
              {
                uri,
                error: (closeError as Error)?.message,
              },
            );
          }
        });
      } finally {
        this.opfsRecordWriters.delete(uri);
        this.opfsWriteChains.delete(uri);
      }
    }

    // Remove per-file queues
    this.pendingChunks.delete(uri);
    this.lastProcessedChunk.delete(uri);
    this.idbWriteQueues.delete(uri);

    this.logger.info("finalizeRecording", { uri, totalChunks, totalSize });

    // Mark metadata as complete
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.metadataStore], "readwrite");
      const store = tx.objectStore(this.metadataStore);
      const getReq = store.get(uri);
      getReq.onsuccess = () => {
        const metadata = getReq.result as RecordingMetadata | null;
        if (metadata) {
          metadata.totalChunks = totalChunks;
          metadata.totalSize = totalSize;
          metadata.isComplete = true;
          const putReq = store.put(metadata);
          putReq.onerror = () => reject(putReq.error);
          putReq.onsuccess = () => resolve();
        } else {
          reject(new Error("Recording metadata not found"));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Returns a list of all recording URIs sorted by timestamp (newest first).
   */
  async getAllRecordingUris(): Promise<string[]> {
    // Electron fs path
    if (this.useElectronFs()) {
      // Ensure recordings are hydrated from filesystem
      await this.hydrateElectronRecordings();

      const all = Array.from(this.electronRecordings.entries()).map(
        ([uri, meta]) => ({
          uri,
          timestamp: meta.timestamp,
        }),
      );
      all.sort((a, b) => b.timestamp - a.timestamp);
      return all.map((r) => r.uri);
    }

    try {
      const db = await this.openDB();
      const tx = db.transaction([this.metadataStore], "readonly");
      const store = tx.objectStore(this.metadataStore);
      const req = store.getAll();

      const progressive = await new Promise<RecordingMetadata[]>((res, rej) => {
        req.onerror = () => rej(req.error);
        req.onsuccess = () => res(req.result || []);
      });

      const all = progressive.map((r) => ({
        uri: r.uri,
        timestamp: r.timestamp,
      }));
      all.sort((a, b) => b.timestamp - a.timestamp);
      return all.map((r) => r.uri);
    } catch (error) {
      this.logger.error("Failed to get recording URIs:", {
        message: error instanceof Error ? error.message : "Unknown error",
        name: error instanceof Error ? error.name : "Unknown",
        error,
      });
      return [];
    }
  }

  /**
   * Delete a recording and all associated data (OPFS or IDB).
   */
  async deleteRecording(fileUri: string): Promise<void> {
    // Electron fs path
    if (this.useElectronFs()) {
      const recording = this.electronRecordings.get(fileUri);
      if (recording) {
        const fs = getElectronFs()!;

        // Chain unlink onto any in-flight writes to prevent races
        const prev = this.electronWriteChains.get(fileUri) || Promise.resolve();
        const unlinkPromise = prev.then(async () => {
          try {
            await fs.unlink(recording.filePath);
          } catch (error) {
            this.logger.warn("Failed to unlink Electron recording file", {
              fileUri,
              filePath: recording.filePath,
              error: (error as Error)?.message,
            });
          }
        });

        // Wait for the chained operation
        await unlinkPromise;

        this.electronRecordings.delete(fileUri);
        this.electronWriteChains.delete(fileUri);
      }
      return;
    }

    // Remove internal queues and writers
    this.pendingChunks.delete(fileUri);
    this.lastProcessedChunk.delete(fileUri);
    this.idbWriteQueues.delete(fileUri);
    this.opfsWriteChains.delete(fileUri);
    this.opfsRecordWriters.delete(fileUri);

    const db = await this.openDB();

    // Attempt to remove OPFS file if applicable
    try {
      const meta = await new Promise<RecordingMetadata | null>(
        (resolve, reject) => {
          const tx = db.transaction([this.metadataStore], "readonly");
          const store = tx.objectStore(this.metadataStore);
          const req = store.get(fileUri);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        },
      );
      if (meta?.storageBackend === "opfs" && meta.opfsFileName) {
        const recordingsDir =
          await OpfsUtils.getOpfsDirectory(RECORDINGS_ROOT_DIR);
        await recordingsDir.removeEntry(meta.opfsFileName).catch(() => {});
      }
    } catch (e) {
      this.logger.warn("Failed OPFS delete; continuing cleanup:", e);
    }

    // Remove metadata and chunks from IndexedDB
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [this.metadataStore, this.chunksStore],
        "readwrite",
      );
      const metaStore = tx.objectStore(this.metadataStore);
      const chunkStore = tx.objectStore(this.chunksStore);

      metaStore.delete(fileUri);

      const index = chunkStore.index("uri");
      const chunksReq = index.getAll(fileUri);
      chunksReq.onsuccess = () => {
        const chunks = chunksReq.result || [];
        chunks.forEach((chunk) => {
          chunkStore.delete(chunk.id);
        });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieve recording information (size, modification time, etc.).
   * This method checks in-flight OPFS writes to provide up-to-date size.
   */
  async getRecordingInfo(fileUri: string): Promise<WebRecordingInfo | null> {
    // Electron fs path
    if (this.useElectronFs()) {
      // Ensure recordings are hydrated from filesystem
      await this.hydrateElectronRecordings();

      const recording = this.electronRecordings.get(fileUri);
      if (!recording) return null;

      const fs = getElectronFs()!;
      const stat = await fs.stat(recording.filePath);
      if (!stat) return null;

      return {
        fileUri,
        size: stat.size,
        mimeType: recording.mimeType,
        context: {
          fileUri,
          mimeType: recording.mimeType,
        },
        timestamp: recording.timestamp,
        exists: true,
        isDirectory: false,
        modificationTime: Math.floor(stat.mtime / 1000),
      };
    }

    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.metadataStore], "readonly");
      const store = tx.objectStore(this.metadataStore);
      const metaReq = store.get(fileUri);

      metaReq.onsuccess = async () => {
        const metadata = metaReq.result as RecordingMetadata | null;
        if (!metadata) {
          resolve(null);
          return;
        }

        // OPFS path
        if (metadata.storageBackend === "opfs" && metadata.opfsFileName) {
          try {
            const inFlight = this.opfsRecordWriters.get(fileUri);
            if (inFlight) {
              resolve({
                fileUri: metadata.uri,
                size: inFlight.position,
                mimeType: metadata.mimeType,
                context: {
                  fileUri: metadata.uri,
                  mimeType: metadata.mimeType,
                },
                timestamp: metadata.timestamp,
                exists: true,
                isDirectory: false,
                modificationTime: Math.floor(Date.now() / 1000),
              });
              return;
            }
            const recordingsDir =
              await OpfsUtils.getOpfsDirectory(RECORDINGS_ROOT_DIR);
            const fileHandle = await recordingsDir.getFileHandle(
              metadata.opfsFileName,
              { create: false },
            );
            const file = await fileHandle.getFile();
            resolve({
              fileUri: metadata.uri,
              size: file.size,
              context: {
                fileUri: metadata.uri,
                mimeType: metadata.mimeType,
              },
              mimeType: metadata.mimeType,
              timestamp: metadata.timestamp,
              exists: true,
              isDirectory: false,
              modificationTime: Math.floor(file.lastModified / 1000),
            });
            return;
          } catch (error) {
            this.logger.error("Failed to get OPFS file info:", error);
            // Fall back to IDB size estimation
          }
        }

        // IDB fallback path
        let size = metadata.totalSize;
        if (size === 0 || !metadata.isComplete) {
          try {
            size = await this.getTotalSizeFromChunks(fileUri);
          } catch (error) {
            this.logger.error("Failed to calculate size from chunks:", error);
          }
        }
        resolve({
          fileUri: metadata.uri,
          size,
          mimeType: metadata.mimeType,
          context: {
            fileUri: metadata.uri,
            mimeType: metadata.mimeType,
          },
          timestamp: metadata.timestamp,
          exists: true,
          isDirectory: false,
          modificationTime: Math.floor(metadata.timestamp / 1000),
        });
      };

      metaReq.onerror = () => reject(metaReq.error);
    });
  }

  /**
   * Creates a Blob URL for the recording. If OPFS is used, it reads the file
   * directly; otherwise it assembles all IndexedDB chunks into a Blob.
   */
  async createBlobUrl(fileUri: string): Promise<string | null> {
    // Electron fs path
    if (this.useElectronFs()) {
      const recording = this.electronRecordings.get(fileUri);
      if (!recording) return null;

      // Wait for pending writes
      const writePromise = this.electronWriteChains.get(fileUri);
      if (writePromise) {
        await writePromise;
      }

      const fs = getElectronFs()!;
      const buffer = await fs.readFile(recording.filePath);
      const blob = new Blob([buffer], { type: recording.mimeType });
      this.logger.info("createBlobUrl: Electron fs file", {
        uri: fileUri,
        filePath: recording.filePath,
        size: buffer.byteLength,
      });
      return URL.createObjectURL(blob);
    }

    try {
      // Ensure pending writes are completed
      const pending = this.idbWriteQueues.get(fileUri);
      if (pending) {
        await pending;
      }

      // Determine backend from metadata
      const db = await this.openDB();
      const meta = await new Promise<RecordingMetadata | null>(
        (resolve, reject) => {
          const tx = db.transaction([this.metadataStore], "readonly");
          const store = tx.objectStore(this.metadataStore);
          const req = store.get(fileUri);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        },
      );

      // OPFS path
      if (meta?.storageBackend === "opfs" && meta.opfsFileName) {
        const recordingsDir =
          await OpfsUtils.getOpfsDirectory(RECORDINGS_ROOT_DIR);
        const fileHandle = await recordingsDir.getFileHandle(
          meta.opfsFileName,
          { create: false },
        );
        const file = await fileHandle.getFile();
        this.logger.info("createBlobUrl: OPFS file", {
          uri: fileUri,
          opfsFileName: meta.opfsFileName,
        });
        return URL.createObjectURL(file);
      }

      // IndexedDB assembly path
      const chunks = await this.getRecordingChunks(fileUri);
      if (chunks.length > 0) {
        const info = await this.getRecordingInfo(fileUri);
        if (!info) return null;

        // Detect any gaps
        for (let i = 0; i < chunks.length; i++) {
          if (chunks[i].chunkIndex !== i) {
            this.logger.warn("Missing chunk detected", {
              uri: fileUri,
              expected: i,
              found: chunks[i].chunkIndex,
            });
          }
        }

        const parts = chunks.map(
          (c) =>
            new Uint8Array(
              c.data.buffer.slice(
                c.data.byteOffset,
                c.data.byteOffset + c.data.byteLength,
              ),
            ) as BlobPart,
        );
        const blob = new Blob(parts, { type: info.mimeType });
        this.logger.info("createBlobUrl: assembled from IndexedDB chunks", {
          uri: fileUri,
          chunks: chunks.length,
        });
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      this.logger.error("Failed to create blob URL:", error);
      return null;
    }
  }

  /**
   * Revoke a previously created Blob URL.
   */
  async revokeBlobUrl(blobUrl: string): Promise<void> {
    URL.revokeObjectURL(blobUrl);
  }

  /**
   * Read a byte range from the recording. If OPFS is used, reads directly;
   * otherwise reads from IndexedDB chunks.
   */
  async readByteRange(
    uri: string,
    startByte: number,
    length: number,
  ): Promise<Uint8Array> {
    // Electron fs path
    if (this.useElectronFs()) {
      const recording = this.electronRecordings.get(uri);
      if (!recording) {
        throw new Error(`Recording not found: ${uri}`);
      }

      // Wait for pending writes
      const writePromise = this.electronWriteChains.get(uri);
      if (writePromise) {
        await writePromise;
      }

      const fs = getElectronFs()!;
      const buffer = await fs.readFileRange(
        recording.filePath,
        startByte,
        length,
      );
      return new Uint8Array(buffer);
    }

    // Wait for pending IDB writes to finish
    const pending = this.idbWriteQueues.get(uri);
    if (pending) {
      await pending;
    }

    // OPFS direct read
    try {
      const db = await this.openDB();
      const meta = await new Promise<RecordingMetadata | null>(
        (resolve, reject) => {
          const tx = db.transaction([this.metadataStore], "readonly");
          const store = tx.objectStore(this.metadataStore);
          const req = store.get(uri);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        },
      );
      if (meta?.storageBackend === "opfs" && meta.opfsFileName) {
        const recordingsDir =
          await OpfsUtils.getOpfsDirectory(RECORDINGS_ROOT_DIR);
        const fileHandle = await recordingsDir.getFileHandle(
          meta.opfsFileName,
          { create: false },
        );
        const file = await fileHandle.getFile();
        const blob = file.slice(startByte, startByte + length);
        const buf = await blob.arrayBuffer();
        return new Uint8Array(buf);
      }
    } catch (e) {
      this.logger.warn("OPFS read range failed; falling back to IDB:", e);
    }

    // IndexedDB fallback
    const chunks = await this.getRecordingChunks(uri);
    if (chunks.length === 0) {
      throw new Error("No chunks found for recording");
    }

    let currentOffset = 0;
    const result = new Uint8Array(length);
    let resultOffset = 0;

    for (const chunk of chunks) {
      const chunkSize = chunk.data.length;
      const chunkEnd = currentOffset + chunkSize;

      if (currentOffset < startByte + length && chunkEnd > startByte) {
        const chunkStart = Math.max(0, startByte - currentOffset);
        const chunkEndInRange = Math.min(
          chunkSize,
          startByte + length - currentOffset,
        );
        const bytesToCopy = chunkEndInRange - chunkStart;

        if (bytesToCopy > 0) {
          result.set(
            chunk.data.slice(chunkStart, chunkEndInRange),
            resultOffset,
          );
          resultOffset += bytesToCopy;
        }
      }

      currentOffset += chunkSize;
      if (resultOffset >= length) {
        break;
      }
    }

    return result.slice(0, resultOffset);
  }

  /**
   * Retrieve all chunks associated with a recording from IndexedDB.
   */
  private async getRecordingChunks(uri: string): Promise<RecordingChunk[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.chunksStore], "readonly");
      const store = tx.objectStore(this.chunksStore);
      const index = store.index("uri");
      const req = index.getAll(uri);

      req.onsuccess = () => {
        const chunks = req.result || [];
        chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
        resolve(chunks);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Attempt to rehydrate an OPFS writer after a reload. Returns the hydrated
   * writer if successful, or null on failure.
   */
  private async tryRehydrateOpfsWriter(uri: string): Promise<{
    fileHandle: FileSystemFileHandle;
    writable: FileSystemWritableFileStream;
    position: number;
    mimeType: string;
    fileName: string;
    bytesWritten: number;
    lastCheckpointTs: number;
    consecutiveCheckpointFailures: number;
  } | null> {
    // Basic info ensures metadata exists
    const info = await this.getRecordingInfo(uri);
    if (!info) return null;

    // Confirm OPFS support
    if (!(await this.ensureOpfsAvailable())) return null;

    // Read metadata
    const db = await this.openDB();
    const opfsMeta = await new Promise<RecordingMetadata | null>(
      (resolve, reject) => {
        const tx = db.transaction([this.metadataStore], "readonly");
        const store = tx.objectStore(this.metadataStore);
        const req = store.get(uri);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      },
    );

    if (
      !opfsMeta ||
      opfsMeta.storageBackend !== "opfs" ||
      !opfsMeta.opfsFileName
    ) {
      return null;
    }

    // Re-open writer
    const reopened = await OpfsUtils.openOpfsWriterFor(
      `${RECORDINGS_ROOT_DIR}/${opfsMeta.opfsFileName}`,
    );
    const hydrated = {
      fileHandle: reopened.fileHandle,
      writable: reopened.writable,
      position: reopened.size,
      mimeType: opfsMeta.mimeType,
      fileName: opfsMeta.opfsFileName,
      bytesWritten: 0,
      lastCheckpointTs: Date.now(),
      consecutiveCheckpointFailures: 0,
    };
    this.opfsRecordWriters.set(uri, hydrated);
    return hydrated;
  }

  /**
   * Derive an OPFS filename from the URI and mime type.
   */
  private deriveOpfsFileName(uri: string, mimeType: string): string {
    const last = uri.split("/").pop() || "recording";
    const base = last.replace(/[^a-zA-Z0-9 _.-]/g, "_");
    const baseMime = (mimeType || "").split(";")[0].toLowerCase();
    const ext =
      baseMime === "audio/mpeg"
        ? ".mp3"
        : baseMime === "audio/webm" || baseMime === "video/webm"
          ? ".webm"
          : baseMime === "audio/wav"
            ? ".wav"
            : baseMime === "audio/ogg"
              ? ".ogg"
              : baseMime === "audio/mp4"
                ? ".m4a"
                : "";
    return base.endsWith(ext) || !ext ? base : `${base}${ext}`;
  }

  /**
   * Compute total size of all chunks for a recording in IndexedDB.
   */
  private async getTotalSizeFromChunks(uri: string): Promise<number> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.chunksStore], "readonly");
      const store = tx.objectStore(this.chunksStore);
      const index = store.index("uri");
      // Iterate via cursor to avoid loading all chunks into memory
      const request = index.openCursor(IDBKeyRange.only(uri));
      let total = 0;

      request.onsuccess = () => {
        const cursor = request.result as IDBCursorWithValue | null;
        if (cursor) {
          const chunk = cursor.value as { data?: Uint8Array };
          total += chunk?.data?.length ?? 0;
          cursor.continue();
        } else {
          resolve(total);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup old recordings to free up space, keeping only the most recent ones.
   */
  async cleanupOldRecordings(): Promise<void> {
    try {
      const allUris = await this.getAllRecordingUris();

      if (allUris.length <= LOW_DISK_KEEP_LAST_RECORDS) {
        this.logger.info(
          `Only ${allUris.length} recordings exist; no cleanup needed`,
        );
        return;
      }

      // URIs are sorted by timestamp (newest first)
      const urisToDelete = allUris.slice(LOW_DISK_KEEP_LAST_RECORDS);

      this.logger.info(
        `Cleaning up ${urisToDelete.length} old recordings to free space`,
      );

      for (const uri of urisToDelete) {
        try {
          await this.deleteRecording(uri);
          this.logger.info(`Deleted old recording: ${uri}`);
        } catch (error) {
          this.logger.error(`Failed to delete recording ${uri}:`, error);
        }
      }

      // Log new storage status
      const storageInfo = await this.getStorageInfo();
      this.logger.info(
        `Storage after cleanup: ${(storageInfo.available / 1024 / 1024).toFixed(2)}MB available, ${storageInfo.usagePercentage.toFixed(1)}% used`,
      );
    } catch (error) {
      this.logger.error("Failed to cleanup old recordings:", error);
      throw error;
    }
  }

  /**
   * Verify recording integrity by checking all chunks are present.
   */
  async verifyRecordingIntegrity(uri: string): Promise<{
    isComplete: boolean;
    missingChunks: number[];
    totalChunks: number;
    outOfOrderChunks: number[];
  }> {
    // Electron fs path - verify file exists and has size
    if (this.useElectronFs()) {
      const recording = this.electronRecordings.get(uri);
      if (!recording) {
        return {
          isComplete: false,
          missingChunks: [],
          totalChunks: 0,
          outOfOrderChunks: [],
        };
      }

      const fs = getElectronFs()!;
      const stat = await fs.stat(recording.filePath);
      const sizeOk =
        stat && stat.isFile
          ? recording.totalSize > 0
            ? stat.size === recording.totalSize
            : stat.size > 0
          : false;

      return {
        isComplete: sizeOk && recording.isComplete,
        missingChunks: [],
        totalChunks: recording.totalChunks,
        outOfOrderChunks: [],
      };
    }

    // Wait for any pending writes
    const pendingWrite = this.idbWriteQueues.get(uri);
    if (pendingWrite) {
      await pendingWrite;
    }

    const db = await this.openDB();

    const metadata = await new Promise<RecordingMetadata | null>(
      (resolve, reject) => {
        const tx = db.transaction([this.metadataStore], "readonly");
        const store = tx.objectStore(this.metadataStore);
        const request = store.get(uri);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );

    if (!metadata) {
      return {
        isComplete: false,
        missingChunks: [],
        totalChunks: 0,
        outOfOrderChunks: [],
      };
    }

    // OPFS path: verify by file existence and size
    if (metadata.storageBackend === "opfs" && metadata.opfsFileName) {
      try {
        const dir = await OpfsUtils.getOpfsDirectory(RECORDINGS_ROOT_DIR);
        const fh = await dir.getFileHandle(metadata.opfsFileName, {
          create: false,
        });
        const file = await fh.getFile();
        const sizeOk =
          metadata.totalSize > 0
            ? file.size === metadata.totalSize
            : file.size > 0;
        return {
          isComplete: sizeOk && metadata.isComplete,
          missingChunks: [],
          totalChunks: metadata.totalChunks,
          outOfOrderChunks: [],
        };
      } catch {
        return {
          isComplete: false,
          missingChunks: [],
          totalChunks: metadata.totalChunks,
          outOfOrderChunks: [],
        };
      }
    }

    // IDB path: check chunk integrity
    const chunks = await this.getRecordingChunks(uri);
    const { missingChunks, outOfOrderChunks } = analyzeChunkIndices(
      chunks.map((chunk) => chunk.chunkIndex),
      metadata.totalChunks,
    );

    return {
      isComplete:
        missingChunks.length === 0 &&
        outOfOrderChunks.length === 0 &&
        metadata.isComplete,
      missingChunks,
      totalChunks: metadata.totalChunks,
      outOfOrderChunks,
    };
  }

  /**
   * Opens or upgrades the IndexedDB database, creating stores if needed.
   */
  private async openDB(): Promise<IDBDatabase> {
    const createStores = (db: IDBDatabase) => {
      // Create metadata store for progressive recordings
      if (!db.objectStoreNames.contains(this.metadataStore)) {
        const metadataStore = db.createObjectStore(this.metadataStore, {
          keyPath: "uri",
        });
        metadataStore.createIndex("timestamp", "timestamp", {
          unique: false,
        });
      }

      // Create chunks store for progressive recordings
      if (!db.objectStoreNames.contains(this.chunksStore)) {
        const chunksStore = db.createObjectStore(this.chunksStore, {
          keyPath: "id",
        });
        chunksStore.createIndex("uri", "uri", { unique: false });
        chunksStore.createIndex("chunkIndex", ["uri", "chunkIndex"], {
          unique: true,
        });
      }
    };

    return new Promise((resolve, reject) => {
      // First, check what version the database is at and if it has the required stores
      const versionCheckRequest = indexedDB.open(this.dbName);

      versionCheckRequest.onsuccess = () => {
        const db = versionCheckRequest.result;
        const currentVersion = db.version;

        // Check if all required object stores exist
        const hasMetadataStore = db.objectStoreNames.contains(
          this.metadataStore,
        );
        const hasChunksStore = db.objectStoreNames.contains(this.chunksStore);
        const hasAllStores = hasMetadataStore && hasChunksStore;

        db.close();

        // If stores are missing, force an upgrade by incrementing version
        const targetVersion = hasAllStores
          ? Math.max(this.dbVersion, currentVersion)
          : Math.max(this.dbVersion, currentVersion + 1);

        const request = indexedDB.open(this.dbName, targetVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          createStores(db);
        };

        request.onblocked = () => {
          this.logger.warn(
            "IndexedDB upgrade blocked; close other tabs and refresh.",
          );
        };
      };

      versionCheckRequest.onerror = () => {
        // Database doesn't exist, create it with our version
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          createStores(db);
        };

        request.onblocked = () => {
          this.logger.warn(
            "IndexedDB upgrade blocked; close other tabs and refresh.",
          );
        };
      };
    });
  }

  /**
   * Ensure OPFS support is detected once and cached.
   */
  private async ensureOpfsAvailable(): Promise<boolean> {
    if (this.opfsAvailable !== null) {
      return this.opfsAvailable;
    }
    this.opfsAvailable = await this.detectOpfsSupport();
    return this.opfsAvailable;
  }

  /**
   * Detect OPFS support by creating a test file and writing to it. This uses
   * `navigator.storage.getDirectory()` and `FileSystemFileHandle.createWritable()`
   * from the File System Access API.
   */
  private async detectOpfsSupport(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.storage) {
      return false;
    }
    try {
      const root = await navigator.storage.getDirectory();
      const testName = `opfs_test_${Date.now()}_${Math.random()}`;
      const fileHandle = await root.getFileHandle(testName, { create: true });
      if (fileHandle.createWritable) {
        const writable = await fileHandle.createWritable();
        await writable.write(new Uint8Array([0]));
        await writable.close();
      } else {
        return false;
      }
      try {
        await root.removeEntry(testName);
      } catch {
        // ignore
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run a function under an OPFS write lock for a URI.
   */
  private runWithOpfsLock(uri: string, fn: () => Promise<void>): Promise<void> {
    const prev = this.opfsWriteChains.get(uri) || Promise.resolve();
    const next = prev.then(fn, fn);
    const tracked = next.catch(() => {});
    this.opfsWriteChains.set(uri, tracked);
    return next.finally(() => {
      if (this.opfsWriteChains.get(uri) === tracked) {
        this.opfsWriteChains.delete(uri);
      }
    });
  }

  /**
   * Run a function under an IndexedDB write lock for a URI.
   */
  private runWithIdbLock(uri: string, fn: () => Promise<void>): Promise<void> {
    const prev = this.idbWriteQueues.get(uri) || Promise.resolve();
    const next = prev.then(fn).catch((error) => {
      this.logger.error("IDB write queue error:", error);
      throw error;
    });
    this.idbWriteQueues.set(uri, next);

    // Cleanup queue when done
    next.finally(() => {
      if (this.idbWriteQueues.get(uri) === next) {
        setTimeout(() => {
          if (this.idbWriteQueues.get(uri) === next) {
            this.idbWriteQueues.delete(uri);
          }
        }, 100);
      }
    });

    return next;
  }
}

export const WebRecordingStorage = new WebRecordingStorageManager();
