import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useApp } from './AppContext';
import { LocalFolderBackupConfig, LocalBackupFileInfo } from '../types';
import {
  isFileSystemAccessSupported,
  getStoredDirectoryHandle,
  storeDirectoryHandle,
  clearStoredDirectoryHandle,
  verifyDirectoryPermission,
  pickLocalFolder,
  loadLocalFolderConfig,
  saveLocalFolderConfig,
  writeBackupToDirectoryHandle,
  downloadBackupDirectly,
  listBackupsInDirectoryHandle,
  readBackupFromDirectoryHandle,
  deleteBackupFromDirectoryHandle,
} from '../utils/localFolderService';

interface LocalFolderContextType {
  isSupported: boolean;
  isConnected: boolean;
  folderName: string;
  folderCustomPath: string;
  config: LocalFolderBackupConfig;
  backupFiles: LocalBackupFileInfo[];
  isLoadingFiles: boolean;
  isSaving: boolean;
  lastBackupAt: number | null;
  lastBackupFileName: string | null;
  lastBackupSize: number | null;
  lastError: string | null;
  selectFolder: () => Promise<boolean>;
  disconnectFolder: () => Promise<void>;
  updateConfig: (newConfig: Partial<LocalFolderBackupConfig>) => void;
  saveBackupToFolder: (isAutomated?: boolean) => Promise<{ success: boolean; fileName?: string; error?: string }>;
  restoreBackupFromFile: (fileName: string) => Promise<{ success: boolean; error?: string }>;
  deleteBackupFile: (fileName: string) => Promise<boolean>;
  refreshFolderFiles: () => Promise<void>;
}

const LocalFolderContext = createContext<LocalFolderContextType | undefined>(undefined);

export const LocalFolderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    businessProfile,
    categories,
    products,
    priceHistory,
    tables,
    customers,
    vendors,
    expenseCategories,
    expenses,
    purchases,
    invoices,
    plateWiseSales,
    receivables,
    receivablePayments,
    payables,
    payablePayments,
    staffEmployees,
    staffAttendance,
    staffAdvances,
    salaryCalculations,
    dailyClosings,
    moneyTransfers,
    importDataJSON,
    updateBusinessProfile,
  } = useApp();

  const [isSupported] = useState<boolean>(() => isFileSystemAccessSupported());
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [config, setConfig] = useState<LocalFolderBackupConfig>(() => loadLocalFolderConfig());
  const [backupFiles, setBackupFiles] = useState<LocalBackupFileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const configRef = useRef(config);
  configRef.current = config;

  const dirHandleRef = useRef(dirHandle);
  dirHandleRef.current = dirHandle;

  // Build the complete database JSON string
  const generateBackupPayload = useCallback((): string => {
    const fullBackup = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      source: 'Patil Biryani Local Folder Engine',
      businessProfile,
      categories,
      products,
      priceHistory,
      tables,
      customers,
      vendors,
      expenseCategories,
      expenses,
      purchases,
      invoices,
      plateWiseSales,
      receivables,
      receivablePayments,
      payables,
      payablePayments,
      staffEmployees,
      staffAttendance,
      staffAdvances,
      salaryCalculations,
      dailyClosings,
      moneyTransfers,
    };
    return JSON.stringify(fullBackup, null, 2);
  }, [
    businessProfile,
    categories,
    products,
    priceHistory,
    tables,
    customers,
    vendors,
    expenseCategories,
    expenses,
    purchases,
    invoices,
    plateWiseSales,
    receivables,
    receivablePayments,
    payables,
    payablePayments,
    staffEmployees,
    staffAttendance,
    staffAdvances,
    salaryCalculations,
    dailyClosings,
    moneyTransfers,
  ]);

  // Refresh backup files in the connected folder
  const refreshFolderFiles = useCallback(async () => {
    if (!dirHandleRef.current) return;
    setIsLoadingFiles(true);
    try {
      const files = await listBackupsInDirectoryHandle(dirHandleRef.current);
      setBackupFiles(files);
    } catch (e: any) {
      console.warn('Could not refresh local folder files:', e);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  // Try to rehydrate stored directory handle on load
  useEffect(() => {
    let isMounted = true;
    async function initHandle() {
      if (!isFileSystemAccessSupported()) return;
      try {
        const storedHandle = await getStoredDirectoryHandle();
        if (storedHandle && isMounted) {
          const hasPerm = await verifyDirectoryPermission(storedHandle, false);
          if (hasPerm) {
            setDirHandle(storedHandle);
            setIsConnected(true);
            const files = await listBackupsInDirectoryHandle(storedHandle);
            if (isMounted) setBackupFiles(files);
          } else {
            // Permission needs user gesture to re-grant, but we keep handle ready
            setDirHandle(storedHandle);
            setIsConnected(false);
          }
        }
      } catch (err) {
        console.warn('Initial folder handle retrieval error:', err);
      }
    }
    initHandle();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<LocalFolderBackupConfig>) => {
    const updated = saveLocalFolderConfig(newConfig);
    setConfig(updated);
    if (newConfig.folderCustomPath || newConfig.folderName) {
      updateBusinessProfile({
        localBackupFolderPath: updated.folderCustomPath,
        localBackupFolderName: updated.folderName,
        autoLocalBackupEnabled: updated.autoBackupEnabled,
        localBackupIntervalMinutes: updated.backupIntervalMinutes,
        backupOnDayClosing: updated.backupOnDayClosing,
      });
    }
  }, [updateBusinessProfile]);

  // Select folder via native directory picker
  const selectFolder = useCallback(async (): Promise<boolean> => {
    setLastError(null);
    const res = await pickLocalFolder();
    if (res.handle) {
      setDirHandle(res.handle);
      setIsConnected(true);
      const updatedConfig = saveLocalFolderConfig({
        folderName: res.name,
        folderCustomPath: config.folderCustomPath || `~/Documents/${res.name}`,
      });
      setConfig(updatedConfig);
      updateBusinessProfile({
        localBackupFolderName: res.name,
        localBackupFolderPath: updatedConfig.folderCustomPath,
      });

      // Load files
      const files = await listBackupsInDirectoryHandle(res.handle);
      setBackupFiles(files);
      return true;
    } else {
      if (res.error) setLastError(res.error);
      return false;
    }
  }, [config.folderCustomPath, updateBusinessProfile]);

  // Disconnect folder
  const disconnectFolder = useCallback(async () => {
    await clearStoredDirectoryHandle();
    setDirHandle(null);
    setIsConnected(false);
    setBackupFiles([]);
  }, []);

  // Save backup to folder (or direct download fallback)
  const saveBackupToFolder = useCallback(
    async (isAutomated: boolean = false): Promise<{ success: boolean; fileName?: string; error?: string }> => {
      setIsSaving(true);
      setLastError(null);
      try {
        const payload = generateBackupPayload();
        const currentConfig = configRef.current;
        const currentHandle = dirHandleRef.current;

        if (currentHandle) {
          // Native file system access write
          const result = await writeBackupToDirectoryHandle(currentHandle, payload, currentConfig);
          if (result.success) {
            setConfig((prev) => ({
              ...prev,
              lastBackupAt: Date.now(),
              lastBackupFileName: result.fileName,
              lastBackupSize: result.fileSize,
            }));
            await refreshFolderFiles();
            setIsSaving(false);
            return { success: true, fileName: result.fileName };
          } else {
            // If handle write fails (e.g. permission expired), try fallback if manual
            setLastError(result.error || 'Failed to save to local folder handle');
            if (!isAutomated) {
              const fallback = downloadBackupDirectly(payload, currentConfig);
              setConfig((prev) => ({
                ...prev,
                lastBackupAt: Date.now(),
                lastBackupFileName: fallback.fileName,
                lastBackupSize: fallback.fileSize,
              }));
              setIsSaving(false);
              return { success: true, fileName: fallback.fileName };
            }
            setIsSaving(false);
            return { success: false, error: result.error };
          }
        } else {
          // No handle selected - if manual, trigger direct browser download to default downloads / custom path
          const fallback = downloadBackupDirectly(payload, currentConfig);
          setConfig((prev) => ({
            ...prev,
            lastBackupAt: Date.now(),
            lastBackupFileName: fallback.fileName,
            lastBackupSize: fallback.fileSize,
          }));
          setIsSaving(false);
          return { success: true, fileName: fallback.fileName };
        }
      } catch (err: any) {
        console.error('Error during local folder save:', err);
        setLastError(err.message || 'Backup failed');
        setIsSaving(false);
        return { success: false, error: err.message || 'Backup failed' };
      }
    },
    [generateBackupPayload, refreshFolderFiles]
  );

  // Restore backup from a selected file in the folder
  const restoreBackupFromFile = useCallback(
    async (fileName: string): Promise<{ success: boolean; error?: string }> => {
      if (!dirHandleRef.current) {
        return { success: false, error: 'No local folder connected' };
      }
      try {
        const content = await readBackupFromDirectoryHandle(dirHandleRef.current, fileName);
        if (!content) {
          return { success: false, error: `Could not read file "${fileName}"` };
        }
        const success = importDataJSON(content);
        if (success) {
          return { success: true };
        } else {
          return { success: false, error: 'Invalid or corrupted backup JSON file format' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to restore snapshot' };
      }
    },
    [importDataJSON]
  );

  // Delete backup file from connected directory
  const deleteBackupFile = useCallback(
    async (fileName: string): Promise<boolean> => {
      if (!dirHandleRef.current) return false;
      const success = await deleteBackupFromDirectoryHandle(dirHandleRef.current, fileName);
      if (success) {
        await refreshFolderFiles();
      }
      return success;
    },
    [refreshFolderFiles]
  );

  // Auto-backup interval timer
  useEffect(() => {
    if (!config.autoBackupEnabled || config.backupIntervalMinutes <= 0) return;

    const intervalMs = config.backupIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      // Only auto-save if folder handle is connected
      if (dirHandleRef.current) {
        saveBackupToFolder(true);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [config.autoBackupEnabled, config.backupIntervalMinutes, saveBackupToFolder]);

  return (
    <LocalFolderContext.Provider
      value={{
        isSupported,
        isConnected,
        folderName: config.folderName || 'Patil_Biryani_Backups',
        folderCustomPath: config.folderCustomPath || 'C:\\Users\\User\\Documents\\Patil_Biryani_Backups',
        config,
        backupFiles,
        isLoadingFiles,
        isSaving,
        lastBackupAt: config.lastBackupAt || null,
        lastBackupFileName: config.lastBackupFileName || null,
        lastBackupSize: config.lastBackupSize || null,
        lastError,
        selectFolder,
        disconnectFolder,
        updateConfig,
        saveBackupToFolder,
        restoreBackupFromFile,
        deleteBackupFile,
        refreshFolderFiles,
      }}
    >
      {children}
    </LocalFolderContext.Provider>
  );
};

export const useLocalFolder = () => {
  const context = useContext(LocalFolderContext);
  if (!context) {
    throw new Error('useLocalFolder must be used within a LocalFolderProvider');
  }
  return context;
};
