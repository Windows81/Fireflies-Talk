/**
 * Web-compatible logger storage using OPFS (Origin Private File System)
 * Provides persistent log storage for web and Electron platforms without IndexedDB
 */

import { OpfsUtils } from "@/utils/opfs-utils";

export interface LogEntry {
  id?: string;
  timestamp: number;
  level: string;
  tag: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  maximumFileSize: number;
  maximumNumberOfFiles: number;
  captureConsole: boolean;
  dailyRolling: boolean;
}

export interface LogFileUrlMeta {
  filename: string;
  timestamp: number;
  size: number;
  format: "txt";
  isCurrent?: boolean;
}

interface StoredLogFile {
  filename: string;
  timestamp: number;
  content: string;
  size: number;
  format: "txt";
}

class WebLoggerStorage {
  private config: LoggerConfig = {
    maximumFileSize: 1024 * 1024 * 10, // 10MB
    maximumNumberOfFiles: 5,
    captureConsole: false,
    dailyRolling: false,
  };
  private currentLogSize = 0;
  private urlMetaRegistry: Map<string, LogFileUrlMeta> = new Map();
  private urlCleanupTimer: ReturnType<typeof setInterval> | null = null;

  // OPFS handles
  private opfsRoot: FileSystemDirectoryHandle | null = null;
  private logsDir: FileSystemDirectoryHandle | null = null;
  private currentFileHandle: FileSystemFileHandle | null = null;
  private currentWritable: FileSystemWritableFileStream | null = null;
  private writeChain: Promise<void> = Promise.resolve();
  private backend: "opfs" | "idb" | null = null;
  private currentCreatedAt: number | null = null;

  // Improved write management
  private lastCheckpointTime = Date.now();
  private readonly checkpointInterval = 5000; // 5 seconds
  private writeBuffer: Uint8Array[] = [];
  private bufferedSize = 0;
  private readonly maxBufferSize = 64 * 1024; // 64KB buffer

  // IndexedDB fallback
  private dbName = "FirefliesLogs";
  private dbVersion = 1;
  private storeName = "logs";
  private db: IDBDatabase | null = null;
  private idbWriteQueue: Promise<void> = Promise.resolve();

  private runWithLock(task: () => Promise<void>): Promise<void> {
    const next = this.writeChain.then(task, task);
    this.writeChain = next.catch(() => {});
    return next;
  }

  private runWithIdbLock(task: () => Promise<void>): Promise<void> {
    const next = this.idbWriteQueue.then(task, task);
    this.idbWriteQueue = next.catch(() => {});
    return next;
  }

  async initialize(config?: Partial<LoggerConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    await OpfsUtils.requestPersistentStorage();

    if (await OpfsUtils.ensureOpfsAvailable()) {
      // OPFS is fully functional - use it
      this.backend = "opfs";
      await this.ensureOpfs();
      await this.openCurrentLogFile();
      await this.loadOrInitCurrentCreatedAt();
      await this.cleanupOldLogFiles();
      this.startPeriodicCheckpoint();
      console.info("WebLoggerStorage initialized with OPFS backend");
    } else {
      // OPFS not available or functional - use IndexedDB
      this.backend = "idb";
      await this.openDB();
      await this.cleanupOldLogs();
      this.currentLogSize = await this.calculateCurrentSizeIdb();
      this.loadOrInitCurrentCreatedAtIdb();
      console.info("WebLoggerStorage initialized with IndexedDB backend");
    }

    // Setup cleanup for blob URLs
    this.setupUrlCleanup();
  }

  private setupUrlCleanup(): void {
    // Clean up URLs periodically to prevent memory leaks
    if (this.urlCleanupTimer) {
      clearInterval(this.urlCleanupTimer);
    }
    this.urlCleanupTimer = setInterval(() => {
      this.cleanupStaleUrls();
    }, 60000);
  }

  private cleanupStaleUrls(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [url, meta] of this.urlMetaRegistry.entries()) {
      if (!meta.isCurrent && now - meta.timestamp > staleThreshold) {
        try {
          URL.revokeObjectURL(url);
          this.urlMetaRegistry.delete(url);
        } catch (err) {
          console.error("Failed to revoke stale URL:", err);
        }
      }
    }
  }

  private startPeriodicCheckpoint(): void {
    setInterval(async () => {
      if (this.backend === "opfs" && this.bufferedSize > 0) {
        await this.runWithLock(async () => {
          await this.flushBuffer();
        });
      }
    }, this.checkpointInterval);
  }

  // OPFS helpers
  private async ensureOpfs(): Promise<void> {
    if (this.opfsRoot && this.logsDir) return;
    this.opfsRoot = await OpfsUtils.getOpfsRoot();
    this.logsDir = await OpfsUtils.getOpfsDirectory("logs");
  }

  private async openCurrentLogFile(): Promise<void> {
    if (!this.logsDir) await this.ensureOpfs();

    const fileName = "logs_current.log";
    this.currentFileHandle = await this.logsDir!.getFileHandle(fileName, {
      create: true,
    });

    // Get actual file size
    const file = await this.currentFileHandle.getFile();
    this.currentLogSize = file.size;

    // Open stream in append mode
    this.currentWritable = await this.currentFileHandle.createWritable({
      keepExistingData: true,
    });

    // Reset buffers
    this.writeBuffer = [];
    this.bufferedSize = 0;
  }

  private async flushBuffer(): Promise<void> {
    if (this.writeBuffer.length === 0 || !this.currentWritable) return;

    // Combine all buffered writes into a single write operation
    const totalSize = this.writeBuffer.reduce(
      (sum, buf) => sum + buf.length,
      0,
    );
    const combined = new Uint8Array(totalSize);
    let offset = 0;

    for (const buf of this.writeBuffer) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    try {
      // Write at the current position
      await this.currentWritable.write({
        type: "write",
        position: this.currentLogSize,
        data: combined.buffer,
      });

      this.currentLogSize += totalSize;
      this.writeBuffer = [];
      this.bufferedSize = 0;

      // Close and reopen to ensure data is persisted
      const now = Date.now();
      if (now - this.lastCheckpointTime >= this.checkpointInterval) {
        await this.currentWritable.close();
        this.currentWritable = await this.currentFileHandle!.createWritable({
          keepExistingData: true,
        });
        this.lastCheckpointTime = now;
      }
    } catch (err) {
      console.error("Failed to flush buffer:", err);

      // Try to recover
      try {
        await this.currentWritable.close();
      } catch (err) {
        console.error(
          "Failed to close current writable during flush buffer:",
          err,
        );
      }

      this.currentWritable = await this.currentFileHandle!.createWritable({
        keepExistingData: true,
      });

      // Update size from actual file
      const file = await this.currentFileHandle!.getFile();
      this.currentLogSize = file.size;

      // Retry write
      await this.currentWritable.write({
        type: "write",
        position: this.currentLogSize,
        data: combined.buffer,
      });

      this.currentLogSize += totalSize;
      this.writeBuffer = [];
      this.bufferedSize = 0;
    }
  }

  async write(entry: LogEntry): Promise<void> {
    if (this.backend === "idb") {
      await this.writeIdb(entry);
      return;
    }

    // Format the log entry
    const formatted = this.formatLogsAsText([entry]) + "\n";
    const bytes = new TextEncoder().encode(formatted);

    await this.runWithLock(async () => {
      // Check if rotation is needed
      if (
        this.currentLogSize + this.bufferedSize + bytes.length >
        this.config.maximumFileSize
      ) {
        await this.flushBuffer();
        await this.rotateLogs();
      }

      // Add to buffer
      this.writeBuffer.push(bytes);
      this.bufferedSize += bytes.length;

      // Flush if buffer is full
      if (this.bufferedSize >= this.maxBufferSize) {
        await this.flushBuffer();
      }
    });
  }

  private async rotateLogs(): Promise<void> {
    if (this.backend === "idb") {
      await this.rotateLogsIdb();
      return;
    }

    await this.ensureOpfs();
    if (!this.logsDir || !this.currentFileHandle) return;

    // Flush any pending writes
    await this.flushBuffer();

    // Close current writer
    if (this.currentWritable) {
      try {
        await this.currentWritable.close();
      } catch (err) {
        console.error("Failed to close current writable during rotation:", err);
      }
      this.currentWritable = null;
    }

    // Read current content
    const currentFile = await this.currentFileHandle.getFile();
    const content = await currentFile.arrayBuffer();

    // Create archive file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveName = `logs_${timestamp}.log`;
    const archiveHandle = await this.logsDir.getFileHandle(archiveName, {
      create: true,
    });

    // Write content to archive
    const archiveWritable = await archiveHandle.createWritable();
    try {
      await archiveWritable.write(content);
    } finally {
      await archiveWritable.close();
    }

    // Clear current file
    this.currentWritable = await this.currentFileHandle.createWritable({
      keepExistingData: false,
    });
    this.currentLogSize = 0;
    this.bufferedSize = 0;
    this.writeBuffer = [];

    // Reset timestamps
    this.currentCreatedAt = Date.now();
    this.lastCheckpointTime = Date.now();
    await this.saveCurrentCreatedAt();

    // Cleanup old files
    await this.cleanupOldLogFiles();
  }

  private async loadOrInitCurrentCreatedAt(): Promise<void> {
    try {
      const metaName = "logs_current.meta";
      const handle = await this.logsDir!.getFileHandle(metaName, {
        create: true,
      });
      const file = await handle.getFile();

      if (file.size > 0) {
        const text = await file.text();
        const parsed = Number.parseInt(text.trim());
        if (Number.isFinite(parsed) && parsed > 0) {
          this.currentCreatedAt = parsed;
        } else {
          this.currentCreatedAt = Date.now();
          await this.saveCurrentCreatedAt();
        }
      } else {
        this.currentCreatedAt = Date.now();
        await this.saveCurrentCreatedAt();
      }
    } catch (err) {
      console.error("Failed to load metadata:", err);
      this.currentCreatedAt = Date.now();
    }
  }

  private async saveCurrentCreatedAt(): Promise<void> {
    try {
      if (!this.logsDir || this.currentCreatedAt == null) return;

      const metaName = "logs_current.meta";
      const handle = await this.logsDir.getFileHandle(metaName, {
        create: true,
      });
      const writable = await handle.createWritable({ keepExistingData: false });
      try {
        await writable.write(String(this.currentCreatedAt));
      } finally {
        await writable.close();
      }
    } catch (err) {
      console.error("Failed to save current created at:", err);
    }
  }

  private async cleanupOldLogFiles(): Promise<void> {
    if (this.backend === "idb") {
      await this.cleanupOldLogFilesIdb();
      return;
    }

    await this.ensureOpfs();
    if (!this.logsDir) return;

    const entries: {
      name: string;
      handle: FileSystemFileHandle;
      time: number;
    }[] = [];

    // Collect all log files
    for await (const [name, handle] of this.logsDir as unknown as AsyncIterable<
      [string, FileSystemFileHandle]
    >) {
      if (
        typeof name === "string" &&
        name.startsWith("logs_") &&
        name.endsWith(".log") &&
        name !== "logs_current.log"
      ) {
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          entries.push({
            name,
            handle: handle as FileSystemFileHandle,
            time: file.lastModified,
          });
        } catch (err) {
          console.error(`Failed to get file info for ${name}:`, err);
        }
      }
    }

    // Delete old files if over limit
    if (entries.length >= this.config.maximumNumberOfFiles) {
      entries.sort((a, b) => b.time - a.time); // Sort newest first
      const toDelete = entries.slice(this.config.maximumNumberOfFiles - 1); // Keep room for current

      for (const entry of toDelete) {
        try {
          await this.logsDir.removeEntry(entry.name);
        } catch (err) {
          console.error(`Failed to delete old log ${entry.name}:`, err);
        }
      }
    }
  }

  async getAllLogs(): Promise<LogEntry[]> {
    if (this.backend === "idb") {
      return this.getAllLogsIdb();
    }

    await this.ensureOpfs();
    if (!this.currentFileHandle) return [];

    try {
      // Flush buffer first to ensure all logs are in the file
      await this.runWithLock(async () => {
        await this.flushBuffer();
      });

      const file = await this.currentFileHandle.getFile();
      const text = await file.text();
      return this.parseTextLogs(text);
    } catch (e) {
      console.error("Failed to read logs:", e);
      return [];
    }
  }

  async getLogFilePaths(): Promise<string[]> {
    try {
      if (this.backend === "idb") {
        return this.getLogFilePathsIdb();
      }

      await this.ensureOpfs();

      // Clean up old URLs first
      for (const url of this.urlMetaRegistry.keys()) {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error("Failed to revoke object URL:", err);
        }
      }
      this.urlMetaRegistry.clear();

      const urls: string[] = [];

      // Ensure current file is flushed
      if (this.currentWritable) {
        await this.runWithLock(async () => {
          await this.flushBuffer();
        });
      }

      // Current log file
      if (this.currentFileHandle) {
        const currentFile = await this.currentFileHandle.getFile();
        if (currentFile.size > 0) {
          const url = URL.createObjectURL(currentFile);
          const displayName = this.currentCreatedAt
            ? `logs_current_${new Date(this.currentCreatedAt).toISOString().replace(/[:.]/g, "-")}.log`
            : `logs_current_${new Date().toISOString().replace(/[:.]/g, "-")}.log`;

          this.urlMetaRegistry.set(url, {
            filename: displayName,
            timestamp: currentFile.lastModified,
            size: currentFile.size,
            isCurrent: true,
            format: "txt",
          });
          urls.push(url);
        }
      }

      // Archived log files
      const archivedFiles: { url: string; time: number }[] = [];

      for await (const [name, handle] of this
        .logsDir as unknown as AsyncIterable<[string, FileSystemFileHandle]>) {
        if (
          typeof name === "string" &&
          name.startsWith("logs_") &&
          name.endsWith(".log") &&
          name !== "logs_current.log"
        ) {
          try {
            const file = await (handle as FileSystemFileHandle).getFile();
            if (file.size > 0) {
              const url = URL.createObjectURL(file);
              this.urlMetaRegistry.set(url, {
                filename: name,
                timestamp: file.lastModified,
                size: file.size,
                format: "txt",
              });
              archivedFiles.push({ url, time: file.lastModified });
            }
          } catch (err) {
            console.error(`Failed to process archived file ${name}:`, err);
          }
        }
      }

      // Sort archived files by time (newest first)
      archivedFiles.sort((a, b) => b.time - a.time);
      urls.push(...archivedFiles.map((f) => f.url));

      return urls;
    } catch (error) {
      console.error("Failed to get log file paths:", error);
      return [];
    }
  }

  getUrlMeta(url: string): LogFileUrlMeta | undefined {
    return this.urlMetaRegistry.get(url);
  }

  private formatLogsAsText(logs: LogEntry[]): string {
    const sanitize = (value: string) => String(value).replace(/[\r\n]+/g, " ");
    return logs
      .map((log) => {
        const ts = new Date(log.timestamp).toISOString();
        const level = (log.level || "").toUpperCase().padEnd(5);
        const tag = (log.tag || "").padEnd(15);
        const message = sanitize(log.message || "");
        const meta =
          log.metadata && Object.keys(log.metadata).length > 0
            ? ` ${JSON.stringify(log.metadata)}`
            : "";
        // Improved formatting for better readability
        return `[${ts}] [${level}] [${tag}] ${message}${meta}`;
      })
      .join("\n");
  }

  private parseTextLogs(text: string): LogEntry[] {
    const lines = text.split(/\n+/).filter(Boolean);
    const entries: LogEntry[] = [];

    for (const line of lines) {
      // Parse log line format: [ISO] [LEVEL] [TAG] MESSAGE {meta?}
      const match = line.match(/^\[(.*?)\]\s*\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/);
      if (!match) continue;

      const [, iso, level, tag, rest] = match;
      let message = rest;
      let metadata: Record<string, unknown> | undefined;

      // Try to extract JSON metadata from end of line
      const lastBrace = rest.lastIndexOf(" {");
      if (lastBrace > -1) {
        const possibleJson = rest.slice(lastBrace + 1);
        try {
          metadata = JSON.parse(possibleJson);
          message = rest.slice(0, lastBrace).trimEnd();
        } catch {
          // Not valid JSON, treat as part of message
        }
      }

      const timestamp = Date.parse(iso);
      entries.push({
        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        level: (level || "").toLowerCase().trim(),
        tag: tag.trim(),
        message,
        metadata,
      });
    }

    return entries;
  }

  // IndexedDB implementations
  private async openDB(): Promise<void> {
    if (this.db) return;

    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: false,
          });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("level", "level", { unique: false });
          store.createIndex("tag", "tag", { unique: false });
        }

        if (!db.objectStoreNames.contains("logFiles")) {
          const files = db.createObjectStore("logFiles", {
            keyPath: "filename",
          });
          files.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  private async writeIdb(entry: LogEntry): Promise<void> {
    await this.runWithIdbLock(async () => {
      if (!this.db) await this.openDB();
      if (!this.db) return;

      const id = `${entry.timestamp}_${Math.random().toString(36).slice(2, 9)}`;
      const record = { ...entry, id } as LogEntry & { id: string };
      const entrySize = JSON.stringify(record).length;

      // Check if rotation is needed
      if (this.currentLogSize + entrySize > this.config.maximumFileSize) {
        await this.rotateLogsIdb();
      }

      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction([this.storeName], "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.add(record);

        req.onsuccess = () => {
          this.currentLogSize += entrySize;
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  }

  private async rotateLogsIdb(): Promise<void> {
    if (!this.db) await this.openDB();
    if (!this.db) return;

    const logs = await this.getAllLogsIdb();
    if (logs.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `logs_${timestamp}.log`;

    await this.storeLogFileIdb(filename, logs);

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const req = store.clear();

      req.onsuccess = () => {
        this.currentLogSize = 0;
        this.currentCreatedAt = Date.now();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });

    await this.cleanupOldLogFilesIdb();
  }

  private loadOrInitCurrentCreatedAtIdb(): void {
    if (this.currentCreatedAt == null) {
      this.currentCreatedAt = Date.now();
    }
  }

  private async getAllLogsIdb(): Promise<LogEntry[]> {
    if (!this.db) await this.openDB();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index("timestamp");
      const req = index.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private async storeLogFileIdb(
    filename: string,
    logs: LogEntry[],
  ): Promise<void> {
    if (!this.db) await this.openDB();
    if (!this.db) return;

    const content = this.formatLogsAsText(logs);

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(["logFiles"], "readwrite");
      const store = tx.objectStore("logFiles");
      const req = store.put({
        filename,
        timestamp: Date.now(),
        content,
        size: content.length,
        format: "txt",
      });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async cleanupOldLogs(): Promise<void> {
    if (!this.db) return;
    if (!this.config.dailyRolling) return;

    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([this.storeName], "readwrite");
      const store = tx.objectStore(this.storeName);
      const index = store.index("timestamp");
      const range = IDBKeyRange.upperBound(oneMonthAgo);
      const cursorReq = index.openCursor(range);

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  private async cleanupOldLogFilesIdb(): Promise<void> {
    if (!this.db) return;

    const files = await new Promise<StoredLogFile[]>((resolve, reject) => {
      const tx = this.db!.transaction(["logFiles"], "readonly");
      const store = tx.objectStore("logFiles");
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (files.length >= this.config.maximumNumberOfFiles) {
      const sorted = files.sort((a, b) => b.timestamp - a.timestamp);
      const toDelete = sorted.slice(this.config.maximumNumberOfFiles - 1);

      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction(["logFiles"], "readwrite");
        const store = tx.objectStore("logFiles");

        let deleteCount = 0;
        for (const file of toDelete) {
          const req = store.delete(file.filename);
          req.onsuccess = () => {
            deleteCount++;
            if (deleteCount === toDelete.length) {
              resolve();
            }
          };
          req.onerror = () => reject(req.error);
        }

        if (toDelete.length === 0) {
          resolve();
        }
      });
    }
  }

  private async calculateCurrentSizeIdb(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      let totalSize = 0;
      const tx = this.db!.transaction([this.storeName], "readonly");
      const store = tx.objectStore(this.storeName);
      const cursorReq = store.openCursor();

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          totalSize += JSON.stringify(cursor.value).length;
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  private async getLogFilePathsIdb(): Promise<string[]> {
    if (!this.db) await this.openDB();
    if (!this.db) return [];

    // Clean up old URLs
    for (const url of this.urlMetaRegistry.keys()) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to revoke object URL:", err);
      }
    }
    this.urlMetaRegistry.clear();

    const urls: string[] = [];

    // Current logs
    const live = await this.getAllLogsIdb();
    if (live.length > 0) {
      const text = this.formatLogsAsText(live);
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const displayName = this.currentCreatedAt
        ? `logs_current_${new Date(this.currentCreatedAt).toISOString().replace(/[:.]/g, "-")}.log`
        : `logs_current_${new Date().toISOString().replace(/[:.]/g, "-")}.log`;

      this.urlMetaRegistry.set(url, {
        filename: displayName,
        timestamp: Date.now(),
        size: text.length,
        isCurrent: true,
        format: "txt",
      });
      urls.push(url);
    }

    // Archived files
    const files = await new Promise<StoredLogFile[]>((resolve, reject) => {
      const tx = this.db!.transaction(["logFiles"], "readonly");
      const store = tx.objectStore("logFiles");
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // Sort by timestamp (newest first)
    files.sort((a, b) => b.timestamp - a.timestamp);

    for (const file of files) {
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      this.urlMetaRegistry.set(url, {
        filename: file.filename,
        timestamp: file.timestamp,
        size: file.size,
        format: "txt",
      });
      urls.push(url);
    }

    return urls;
  }

  async destroy(): Promise<void> {
    // Clean up timers
    if (this.urlCleanupTimer) {
      clearInterval(this.urlCleanupTimer);
      this.urlCleanupTimer = null;
    }

    // Flush any pending writes
    if (this.backend === "opfs" && this.currentWritable) {
      await this.runWithLock(async () => {
        await this.flushBuffer();
        try {
          await this.currentWritable!.close();
        } catch (err) {
          console.error(
            "Failed to close current writable during destroy:",
            err,
          );
        }
      });
    }

    // Clean up blob URLs
    for (const url of this.urlMetaRegistry.keys()) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Failed to revoke object URL:", url, err);
      }
    }
    this.urlMetaRegistry.clear();

    // Close database
    if (this.db) {
      // Wait for queued writes to settle
      await this.idbWriteQueue.catch(() => {});
      this.db.close();
      this.db = null;
    }
  }
}

export const webLoggerStorage = new WebLoggerStorage();
