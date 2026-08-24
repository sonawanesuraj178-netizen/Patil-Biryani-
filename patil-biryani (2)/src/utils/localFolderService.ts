/**
 * Local Device Folder Backup Service
 * Uses modern File System Access API (window.showDirectoryPicker) with persistent IndexedDB handle storage
 * and graceful fallback for browsers/environments without native directory picker support.
 */

import { LocalBackupFileInfo, LocalFolderBackupConfig } from '../types';
import { getTodayDateString, getCurrentTimeString } from './formatters';

const IDB_DB_NAME = 'patil_biryani_local_folder_db';
const IDB_STORE_NAME = 'handles';
const IDB_HANDLE_KEY = 'backup_dir_handle';
const LOCAL_STORAGE_CONFIG_KEY = 'patil_biryani_local_backup_config_v1';

export const DEFAULT_LOCAL_FOLDER_CONFIG: LocalFolderBackupConfig = {
  folderName: 'Patil_Biryani_Backups',
  folderCustomPath: 'C:\\Users\\User\\Documents\\Patil_Biryani_Backups',
  autoBackupEnabled: true,
  backupIntervalMinutes: 60, // Every 1 hour
  backupOnDayClosing: true,
  saveLatestSnapshotMirror: true,
  filenamePrefix: 'Patil_Biryani_Data_Backup',
};

/**
 * Check if the browser supports the File System Access API directory picker
 */
export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).showDirectoryPicker === 'function';
}

/**
 * Open IndexedDB database for persisting FileSystemDirectoryHandle
 */
function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser.'));
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store the directory handle in IndexedDB
 */
export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put(handle, IDB_HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to store directory handle in IndexedDB:', err);
  }
}

/**
 * Retrieve the stored directory handle from IndexedDB
 */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get stored directory handle from IndexedDB:', err);
    return null;
  }
}

/**
 * Remove stored directory handle from IndexedDB
 */
export async function clearStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.delete(IDB_HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear directory handle:', err);
  }
}

/**
 * Verify or request permission on a FileSystemDirectoryHandle
 */
export async function verifyDirectoryPermission(
  dirHandle: FileSystemDirectoryHandle,
  readWrite: boolean = true
): Promise<boolean> {
  try {
    const options = {
      mode: (readWrite ? 'readwrite' : 'read') as 'readwrite' | 'read',
    };
    if ((await (dirHandle as any).queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await (dirHandle as any).requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Could not verify directory permission:', err);
    return false;
  }
}

/**
 * Prompt user to select a folder on their device
 */
export async function pickLocalFolder(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  name: string;
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    return {
      handle: null,
      name: '',
      error: 'File System Access API is not supported in this browser. You can still set a custom folder path preference and download backups directly.',
    };
  }

  try {
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
      id: 'patil_biryani_backups_dir',
      mode: 'readwrite',
      startIn: 'documents',
    });

    const hasPermission = await verifyDirectoryPermission(handle, true);
    if (!hasPermission) {
      return {
        handle: null,
        name: handle.name,
        error: 'Read/write permission was not granted for the selected folder.',
      };
    }

    await storeDirectoryHandle(handle);

    return {
      handle,
      name: handle.name,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { handle: null, name: '', error: 'Folder selection was cancelled.' };
    }
    return {
      handle: null,
      name: '',
      error: err.message || 'Failed to select folder.',
    };
  }
}

/**
 * Load local folder backup configuration from LocalStorage
 */
export function loadLocalFolderConfig(): LocalFolderBackupConfig {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (item) {
      return { ...DEFAULT_LOCAL_FOLDER_CONFIG, ...JSON.parse(item) };
    }
  } catch (e) {
    console.warn('Failed to load local folder backup config:', e);
  }
  return DEFAULT_LOCAL_FOLDER_CONFIG;
}

/**
 * Save local folder backup configuration to LocalStorage
 */
export function saveLocalFolderConfig(config: Partial<LocalFolderBackupConfig>): LocalFolderBackupConfig {
  const current = loadLocalFolderConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save local folder backup config:', e);
  }
  return updated;
}

/**
 * Format timestamp into clean filename string (e.g. 2026-08-21_14-30-00)
 */
export function generateBackupFileName(prefix: string = 'Patil_Biryani_Data_Backup'): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.json`;
}

/**
 * Write backup JSON directly to the selected local directory handle
 */
export async function writeBackupToDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  jsonString: string,
  config: LocalFolderBackupConfig
): Promise<{
  success: boolean;
  fileName: string;
  fileSize: number;
  error?: string;
}> {
  try {
    const hasPermission = await verifyDirectoryPermission(dirHandle, true);
    if (!hasPermission) {
      throw new Error('Permission denied. Please re-select the backup folder or grant write access.');
    }

    const fileName = generateBackupFileName(config.filenamePrefix || 'Patil_Biryani_Data_Backup');

    // 1. Write the timestamped backup file
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await (fileHandle as any).createWritable();
    await writable.write(jsonString);
    await writable.close();

    // 2. Optionally update the "Patil_Biryani_Latest_Snapshot.json" mirror
    if (config.saveLatestSnapshotMirror) {
      try {
        const mirrorHandle = await dirHandle.getFileHandle('Patil_Biryani_Latest_Snapshot.json', {
          create: true,
        });
        const mirrorWritable = await (mirrorHandle as any).createWritable();
        await mirrorWritable.write(jsonString);
        await mirrorWritable.close();
      } catch (mirrorErr) {
        console.warn('Could not update latest mirror snapshot:', mirrorErr);
      }
    }

    const fileSize = new Blob([jsonString]).size;

    // Update config metadata
    saveLocalFolderConfig({
      lastBackupAt: Date.now(),
      lastBackupFileName: fileName,
      lastBackupSize: fileSize,
    });

    return {
      success: true,
      fileName,
      fileSize,
    };
  } catch (err: any) {
    console.error('Failed to write backup to directory handle:', err);
    return {
      success: false,
      fileName: '',
      fileSize: 0,
      error: err.message || 'Failed to save file to local directory.',
    };
  }
}

/**
 * Fallback browser download when directory handle is unavailable
 */
export function downloadBackupDirectly(
  jsonString: string,
  config: LocalFolderBackupConfig
): { success: boolean; fileName: string; fileSize: number } {
  const fileName = generateBackupFileName(config.filenamePrefix || 'Patil_Biryani_Data_Backup');
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 500);

  const fileSize = blob.size;
  saveLocalFolderConfig({
    lastBackupAt: Date.now(),
    lastBackupFileName: fileName,
    lastBackupSize: fileSize,
  });

  return {
    success: true,
    fileName,
    fileSize,
  };
}

/**
 * List all backup files in the connected directory handle
 */
export async function listBackupsInDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle
): Promise<LocalBackupFileInfo[]> {
  try {
    const hasPermission = await verifyDirectoryPermission(dirHandle, false);
    if (!hasPermission) return [];

    const backups: LocalBackupFileInfo[] = [];

    for await (const entry of (dirHandle as any).values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        try {
          const file = await entry.getFile();
          backups.push({
            name: entry.name,
            size: file.size,
            lastModified: file.lastModified,
            isLatestSnapshot: entry.name === 'Patil_Biryani_Latest_Snapshot.json',
          });
        } catch (e) {
          console.warn('Error reading file metadata:', entry.name, e);
        }
      }
    }

    // Sort: Latest Snapshot mirror on top, then newest modified first
    backups.sort((a, b) => {
      if (a.isLatestSnapshot) return -1;
      if (b.isLatestSnapshot) return 1;
      return b.lastModified - a.lastModified;
    });

    return backups;
  } catch (err) {
    console.error('Failed to list backups in directory:', err);
    return [];
  }
}

/**
 * Read backup content from a specific file in the directory handle
 */
export async function readBackupFromDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<string | null> {
  try {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    console.error('Failed to read file from directory:', fileName, err);
    return null;
  }
}

/**
 * Delete a specific backup file from the directory handle
 */
export async function deleteBackupFromDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<boolean> {
  try {
    const hasPermission = await verifyDirectoryPermission(dirHandle, true);
    if (!hasPermission) return false;
    await (dirHandle as any).removeEntry(fileName);
    return true;
  } catch (err) {
    console.error('Failed to delete file from directory:', fileName, err);
    return false;
  }
}
