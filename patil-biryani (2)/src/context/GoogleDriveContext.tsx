import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setCachedAccessToken,
} from '../services/googleAuth';
import {
  uploadBackupToDrive,
  listDriveBackups,
  downloadDriveBackupContent,
  deleteDriveBackupFile,
  DriveBackupFile,
} from '../services/googleDriveService';
import { useApp } from './AppContext';

interface GoogleDriveContextType {
  user: User | null;
  accessToken: string | null;
  isConnected: boolean;
  isSigningIn: boolean;
  autoBackupEnabled: boolean;
  backupIntervalMinutes: number;
  lastBackupTime: number | null;
  lastBackupFileName: string | null;
  nextBackupTime: number | null;
  backupStatus: 'idle' | 'in_progress' | 'success' | 'error';
  lastError: string | null;
  driveBackups: DriveBackupFile[];
  isLoadingDriveBackups: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  performDriveBackup: (isAutomatic?: boolean) => Promise<boolean>;
  restoreBackupFromDrive: (fileId: string) => Promise<boolean>;
  deleteBackupFromDrive: (fileId: string) => Promise<boolean>;
  refreshDriveBackups: () => Promise<void>;
  setAutoBackupEnabled: (enabled: boolean) => void;
  setBackupIntervalMinutes: (minutes: number) => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTO_BACKUP_ENABLED: 'patil_biryani_drive_auto_backup_enabled',
  BACKUP_INTERVAL_MINS: 'patil_biryani_drive_backup_interval_mins',
  LAST_BACKUP_TIME: 'patil_biryani_drive_last_backup_time',
  LAST_BACKUP_FILE_NAME: 'patil_biryani_drive_last_backup_file_name',
};

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    businessProfile,
    categories,
    products,
    priceHistory,
    tables,
    heldOrders,
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
    importDataJSON,
  } = useApp();

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Settings
  const [autoBackupEnabled, setAutoBackupEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const [backupIntervalMinutes, setBackupIntervalMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKUP_INTERVAL_MINS);
    return saved ? parseInt(saved, 10) : 60; // Default: 60 mins (Hourly)
  });

  const [lastBackupTime, setLastBackupTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_TIME);
    return saved ? parseInt(saved, 10) : null;
  });

  const [lastBackupFileName, setLastBackupFileName] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_FILE_NAME);
  });

  const [backupStatus, setBackupStatus] = useState<'idle' | 'in_progress' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingDriveBackups, setIsLoadingDriveBackups] = useState(false);

  // References to latest state to avoid stale closures in background timers
  const appDataRef = useRef({
    businessProfile,
    categories,
    products,
    priceHistory,
    tables,
    heldOrders,
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
  });

  useEffect(() => {
    appDataRef.current = {
      businessProfile,
      categories,
      products,
      priceHistory,
      tables,
      heldOrders,
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
    };
  }, [
    businessProfile,
    categories,
    products,
    priceHistory,
    tables,
    heldOrders,
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
  ]);

  // Next backup calculation
  const nextBackupTime =
    lastBackupTime && autoBackupEnabled && user && accessToken
      ? lastBackupTime + backupIntervalMinutes * 60 * 1000
      : null;

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch drive backups whenever connected
  const refreshDriveBackups = useCallback(async () => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;

    try {
      setIsLoadingDriveBackups(true);
      const files = await listDriveBackups(token);
      setDriveBackups(files);
      setLastError(null);
    } catch (err: any) {
      console.error('Failed to list backups from Google Drive:', err);
      // Don't set hard error if it's just initial query
    } finally {
      setIsLoadingDriveBackups(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      refreshDriveBackups();
    } else {
      setDriveBackups([]);
    }
  }, [accessToken, refreshDriveBackups]);

  // Login handler
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsSigningIn(true);
      setLastError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        await refreshDriveBackups();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Google login error:', err);
      setLastError(err.message || 'Failed to sign in with Google');
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setAccessToken(null);
      setDriveBackups([]);
      setBackupStatus('idle');
    } catch (err: any) {
      console.error('Google logout error:', err);
    }
  };

  // Perform Backup to Google Drive
  const performDriveBackup = useCallback(
    async (isAutomatic = false): Promise<boolean> => {
      const token = accessToken || (await getAccessToken());
      if (!token) {
        if (!isAutomatic) {
          setLastError('Google Drive is not connected. Please connect Google Drive first.');
        }
        return false;
      }

      try {
        setBackupStatus('in_progress');
        setLastError(null);

        const currentData = appDataRef.current;
        const backupPayload = {
          exportVersion: '2.4',
          exportType: isAutomatic ? 'hourly_automatic_cloud_backup' : 'manual_cloud_backup',
          exportedAt: new Date().toISOString(),
          appTitle: 'Patil Biryani Business Management & POS',
          ...currentData,
        };

        const uploadedFile = await uploadBackupToDrive(token, backupPayload, isAutomatic);

        const now = Date.now();
        setLastBackupTime(now);
        setLastBackupFileName(uploadedFile.name);
        localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_TIME, now.toString());
        localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_FILE_NAME, uploadedFile.name);

        setBackupStatus('success');

        // Update list
        setDriveBackups((prev) => [uploadedFile, ...prev.filter((f) => f.id !== uploadedFile.id)]);

        // Reset success badge after 6 seconds
        setTimeout(() => {
          setBackupStatus((prev) => (prev === 'success' ? 'idle' : prev));
        }, 6000);

        return true;
      } catch (err: any) {
        console.error('Google Drive backup error:', err);
        setBackupStatus('error');
        setLastError(err.message || 'Failed to upload backup to Google Drive');
        return false;
      }
    },
    [accessToken]
  );

  // Restore from Drive
  const restoreBackupFromDrive = async (fileId: string): Promise<boolean> => {
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setLastError('Google Drive is not connected');
      return false;
    }

    try {
      setBackupStatus('in_progress');
      const backupData = await downloadDriveBackupContent(token, fileId);
      const success = importDataJSON(JSON.stringify(backupData));
      if (success) {
        setBackupStatus('success');
        setTimeout(() => setBackupStatus('idle'), 4000);
        return true;
      } else {
        throw new Error('Invalid backup file structure');
      }
    } catch (err: any) {
      console.error('Failed to restore from Google Drive:', err);
      setBackupStatus('error');
      setLastError(err.message || 'Failed to restore backup from Google Drive');
      return false;
    }
  };

  // Delete Backup File from Drive
  const deleteBackupFromDrive = async (fileId: string): Promise<boolean> => {
    const token = accessToken || (await getAccessToken());
    if (!token) return false;

    try {
      await deleteDriveBackupFile(token, fileId);
      setDriveBackups((prev) => prev.filter((f) => f.id !== fileId));
      return true;
    } catch (err: any) {
      console.error('Failed to delete backup from Google Drive:', err);
      setLastError(err.message || 'Failed to delete file from Google Drive');
      return false;
    }
  };

  // Save settings
  const setAutoBackupEnabled = (enabled: boolean) => {
    setAutoBackupEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_ENABLED, enabled.toString());
  };

  const setBackupIntervalMinutes = (minutes: number) => {
    setBackupIntervalMinutesState(minutes);
    localStorage.setItem(STORAGE_KEYS.BACKUP_INTERVAL_MINS, minutes.toString());
  };

  // AUTOMATIC HOURLY BACKUP ENGINE:
  // Runs every 30 seconds to check if interval has elapsed, plus triggers on window focus
  useEffect(() => {
    if (!autoBackupEnabled || !accessToken || !user) return;

    const checkAndTriggerBackup = () => {
      const now = Date.now();
      const intervalMs = backupIntervalMinutes * 60 * 1000;
      const last = lastBackupTime || 0;

      if (now - last >= intervalMs) {
        console.log('[Auto-Backup Engine] Triggering automatic hourly backup to Google Drive...');
        performDriveBackup(true);
      }
    };

    // Initial check (with 3s debounce on first connect)
    const initialTimer = setTimeout(() => {
      const now = Date.now();
      const intervalMs = backupIntervalMinutes * 60 * 1000;
      const last = lastBackupTime || 0;
      if (now - last >= intervalMs) {
        checkAndTriggerBackup();
      }
    }, 3000);

    // Periodic interval
    const intervalTimer = setInterval(checkAndTriggerBackup, 30000);

    // Window focus listener
    const handleFocus = () => {
      checkAndTriggerBackup();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoBackupEnabled, accessToken, user, backupIntervalMinutes, lastBackupTime, performDriveBackup]);

  return (
    <GoogleDriveContext.Provider
      value={{
        user,
        accessToken,
        isConnected: Boolean(user && accessToken),
        isSigningIn,
        autoBackupEnabled,
        backupIntervalMinutes,
        lastBackupTime,
        lastBackupFileName,
        nextBackupTime,
        backupStatus,
        lastError,
        driveBackups,
        isLoadingDriveBackups,
        loginWithGoogle,
        logout,
        performDriveBackup,
        restoreBackupFromDrive,
        deleteBackupFromDrive,
        refreshDriveBackups,
        setAutoBackupEnabled,
        setBackupIntervalMinutes,
      }}
    >
      {children}
    </GoogleDriveContext.Provider>
  );
};

export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
