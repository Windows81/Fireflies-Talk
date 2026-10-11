/**
 * Shared OPFS (Origin Private File System) utilities for web storage implementations.
 * Provides consistent OPFS availability checks, root access, and storage management.
 */

export interface StorageEstimate {
  quota?: number;
  usage?: number;
}

export interface StorageInfo {
  quota: number;
  usage: number;
  available: number;
  usagePercentage: number;
  isPersistent: boolean;
}

/**
 * Local type alias for FileSystemCreateWritableOptions to ensure compatibility
 * across different TypeScript lib.dom versions that may not include this type.
 */
type LocalFileSystemCreateWritableOptions =
  | {
      keepExistingData?: boolean;
    }
  | Record<string, unknown>;

export class OpfsUtils {
  private static opfsRootDir: FileSystemDirectoryHandle | null = null;
  private static opfsAvailabilityCache: boolean | null = null;
  private static opfsTestPromise: Promise<boolean> | null = null;

  /**
   * Check if OPFS is fully available including createWritable support.
   * This prevents Safari issues where OPFS exists but createWritable requires WebWorker.
   * Uses caching to avoid repeated expensive tests.
   */
  static async ensureOpfsAvailable(): Promise<boolean> {
    // Return cached result if available
    if (this.opfsAvailabilityCache !== null) {
      return this.opfsAvailabilityCache;
    }

    // If test is already running, wait for it
    if (this.opfsTestPromise) {
      return this.opfsTestPromise;
    }

    // Start new test
    this.opfsTestPromise = this.performOpfsAvailabilityTest();
    this.opfsAvailabilityCache = await this.opfsTestPromise;
    this.opfsTestPromise = null;

    return this.opfsAvailabilityCache;
  }

  /**
   * Performs comprehensive OPFS availability testing without relying on catch blocks for control flow.
   */
  private static async performOpfsAvailabilityTest(): Promise<boolean> {
    // Step 1: Check basic OPFS API availability
    if (typeof navigator === "undefined" || !("storage" in navigator)) {
      console.info("OPFS not available: navigator.storage missing");
      return false;
    }

    if (typeof navigator.storage.getDirectory !== "function") {
      console.info("OPFS not available: getDirectory method missing");
      return false;
    }

    // Step 2: Check FileSystemFileHandle availability
    const FileSystemFileHandle = (
      globalThis as unknown as {
        FileSystemFileHandle?: {
          prototype?: {
            createWritable?: unknown;
            getFile?: unknown;
          };
        };
      }
    ).FileSystemFileHandle;

    if (typeof FileSystemFileHandle === "undefined") {
      console.info("OPFS not available: FileSystemFileHandle missing");
      return false;
    }

    if (typeof FileSystemFileHandle.prototype?.createWritable !== "function") {
      console.info("OPFS not available: createWritable method missing");
      return false;
    }

    if (typeof FileSystemFileHandle.prototype?.getFile !== "function") {
      console.info("OPFS not available: getFile method missing");
      return false;
    }

    // Step 3: Test actual OPFS functionality (this is where Safari may fail)
    console.info("OPFS API detected, testing actual functionality...");

    let root: FileSystemDirectoryHandle;
    try {
      root = await navigator.storage.getDirectory();
    } catch (error) {
      console.info("OPFS not available: Failed to get root directory", error);
      return false;
    }

    let testDir: FileSystemDirectoryHandle;
    try {
      testDir = await root.getDirectoryHandle("opfs-availability-test", {
        create: true,
      });
    } catch (error) {
      console.info(
        "OPFS not available: Failed to create test directory",
        error,
      );
      return false;
    }

    let testFile: FileSystemFileHandle;
    try {
      testFile = await testDir.getFileHandle("test.txt", {
        create: true,
      });
    } catch (error) {
      console.info("OPFS not available: Failed to create test file", error);
      return false;
    }

    // Critical test: createWritable (this is where Safari fails)
    let writable: FileSystemWritableFileStream;
    try {
      writable = await testFile.createWritable({
        keepExistingData: false,
      });
    } catch (error) {
      console.info(
        "OPFS not available: createWritable failed (likely Safari main thread)",
        error,
      );
      // Clean up test directory
      await root
        .removeEntry("opfs-availability-test", { recursive: true })
        .catch(() => {});
      return false;
    }

    // Test write and close
    try {
      await writable.write("test");
      await writable.close();
    } catch (error) {
      console.info("OPFS not available: Write/close failed", error);
      await root
        .removeEntry("opfs-availability-test", { recursive: true })
        .catch(() => {});
      return false;
    }

    // Verify file was written
    try {
      const file = await testFile.getFile();
      if (file.size === 0) {
        console.info("OPFS not available: File was not written correctly");
        await root
          .removeEntry("opfs-availability-test", { recursive: true })
          .catch(() => {});
        return false;
      }
    } catch (error) {
      console.info("OPFS not available: Failed to verify written file", error);
      await root
        .removeEntry("opfs-availability-test", { recursive: true })
        .catch(() => {});
      return false;
    }

    // Clean up test directory
    await root
      .removeEntry("opfs-availability-test", { recursive: true })
      .catch(() => {});

    console.info("OPFS fully available and functional");
    return true;
  }

  /**
   * Reset the OPFS availability cache (useful for testing or when conditions might change)
   */
  static resetAvailabilityCache(): void {
    this.opfsAvailabilityCache = null;
    this.opfsTestPromise = null;
  }

  /**
   * Get the OPFS root directory handle, caching for subsequent calls.
   */
  static async getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    if (this.opfsRootDir) return this.opfsRootDir;
    const dir = await navigator.storage.getDirectory();
    this.opfsRootDir = dir;
    return dir;
  }

  /**
   * Request persistent storage permission.
   * Returns true if granted, false otherwise.
   */
  static async requestPersistentStorage(): Promise<boolean> {
    if ("storage" in navigator && "persist" in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        return granted;
      } catch (error) {
        console.warn("Failed to request persistent storage:", error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get current storage quota and usage estimates.
   */
  static async getStorageEstimate(): Promise<StorageEstimate> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
        };
      } catch (error) {
        console.warn("Failed to get storage estimate:", error);
      }
    }
    return {};
  }

  /**
   * Check if there's enough storage space for the required bytes.
   */
  static async checkStorageSpace(requiredBytes: number): Promise<boolean> {
    const estimate = await this.getStorageEstimate();

    if (estimate.quota == null || estimate.usage == null) {
      // Can't determine space, assume it's available
      return true;
    }

    const availableBytes = estimate.quota - estimate.usage;
    const hasSpace = availableBytes >= requiredBytes;

    if (!hasSpace) {
      console.warn(
        `Insufficient storage space. Required: ${(requiredBytes / 1024 / 1024).toFixed(2)}MB, Available: ${(availableBytes / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    return hasSpace;
  }

  /**
   * Get comprehensive storage information including persistence status.
   */
  static async getStorageInfo(): Promise<StorageInfo> {
    const estimate = await this.getStorageEstimate();
    const quota = estimate.quota ?? 0;
    const usage = estimate.usage ?? 0;
    const available = quota - usage;
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

    let isPersistent = false;
    if ("storage" in navigator && "persisted" in navigator.storage) {
      try {
        isPersistent = await navigator.storage.persisted();
      } catch (error) {
        console.warn("Failed to check persistent storage status:", error);
      }
    }

    return {
      quota,
      usage,
      available,
      usagePercentage,
      isPersistent,
    };
  }

  /**
   * Opens an OPFS writer for a given relative path under the OPFS root.
   * Ensures intermediate directories exist, returns file handle, writable stream (append mode), and current file size.
   * @param relativePath - Path to the file, must include a filename (cannot end with "/")
   */
  static async openOpfsWriterFor(relativePath: string): Promise<{
    fileHandle: FileSystemFileHandle;
    writable: FileSystemWritableFileStream;
    size: number;
  }> {
    // Validate and clean the path
    if (!relativePath || typeof relativePath !== "string") {
      throw new Error("OPFS path must be a non-empty string");
    }

    // Check if path ends with slash (indicating directory, not file)
    if (relativePath.endsWith("/")) {
      throw new Error(
        "OPFS path cannot end with '/' - must specify a filename",
      );
    }

    // Trim any accidental trailing slashes and validate
    const cleanPath = relativePath.replace(/\/+$/, "");
    if (!cleanPath) {
      throw new Error("OPFS path cannot be empty or consist only of slashes");
    }

    const root = await this.getOpfsRoot();
    const parts = cleanPath.split("/").filter(Boolean);

    // Ensure we have at least a filename
    if (parts.length === 0) {
      throw new Error("OPFS path must contain at least a filename");
    }

    const fileName = parts.pop();

    // Double-check filename is valid
    if (!fileName || fileName.trim() === "") {
      throw new Error(
        "OPFS path must end with a valid filename, not a directory",
      );
    }
    let dirHandle: FileSystemDirectoryHandle = root;
    for (const part of parts) {
      dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
    }
    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: true,
    });
    const file = await fileHandle.getFile();
    const size = file.size;
    const writable = await fileHandle.createWritable({
      keepExistingData: true,
    } as LocalFileSystemCreateWritableOptions);
    return { fileHandle, writable, size };
  }

  /**
   * Get or create a directory handle under the OPFS root.
   */
  static async getOpfsDirectory(
    dirName: string,
  ): Promise<FileSystemDirectoryHandle> {
    const root = await this.getOpfsRoot();
    return root.getDirectoryHandle(dirName, { create: true });
  }

  /**
   * Reset the cached OPFS root (useful for testing or error recovery).
   */
  static resetOpfsRoot(): void {
    this.opfsRootDir = null;
  }
}
