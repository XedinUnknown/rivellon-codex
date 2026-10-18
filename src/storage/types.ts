// The storage interface every backend implements: the shape of the claude.ai artifact database handle.
export interface DocSnapshot {
  id: string;
  data(): unknown;
}
export interface Snapshot {
  docs: DocSnapshot[];
}
export interface StoreError extends Error {
  code?: string;
}
export interface DbHandle {
  collection(c: string): {
    onSnapshot(cb: (snap: Snapshot) => void, err?: (e: StoreError) => void): (() => void) | undefined;
  };
  doc(path: string): {
    /** full replace (creates the document) */
    set(body: unknown): Promise<void>;
    /** merge: nested objects merge, arrays replace, null removes; rejects if the document doesn't exist */
    update(patch: Record<string, unknown>): Promise<void>;
    delete(): Promise<void>;
  };
}
export type BackendKind = 'claude' | 'browser' | 'file';
export interface Backend {
  kind: BackendKind;
  db: DbHandle;
  /** the JSON file's name (file backend) */
  name?: string;
  close?(): void;
}
/** Everything stored, and the export / JSON file format. */
export interface DataFile {
  party: Record<string, unknown>;
  items: Record<string, unknown>;
  ref?: Record<string, unknown>;
}

declare global {
  interface Window {
    /** injected by claude.ai when the page runs as an artifact */
    claude?: {
      use(name: 'db'): Promise<DbHandle | null>;
      use(name: 'user'): Promise<{ can(permission: string): Promise<boolean | null> } | null>;
    };
    showOpenFilePicker?(opts?: unknown): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?(opts?: unknown): Promise<FileSystemFileHandle>;
  }
  interface FileSystemHandle {
    queryPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  }
}
