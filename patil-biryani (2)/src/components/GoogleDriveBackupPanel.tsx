import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudOff,
  RefreshCw,
  Clock,
  HardDrive,
  ExternalLink,
  Trash2,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  Zap,
  FolderArchive,
} from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { CustomSelect } from './ui/CustomSelect';

interface GoogleDriveBackupPanelProps {
  onConfirmAction: (title: string, message: string, onConfirm: () => void) => void;
}

export const GoogleDriveBackupPanel: React.FC<GoogleDriveBackupPanelProps> = ({
  onConfirmAction,
}) => {
  const {
    user,
    isConnected,
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
  } = useGoogleDrive();

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return 'JSON Snapshot';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'JSON Snapshot';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day(s) ago`;
  };

  const formatCountdown = (targetTime: number) => {
    const diffMs = targetTime - Date.now();
    if (diffMs <= 0) return 'Due now';
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    if (diffMins < 60) return `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `in ${hours}h ${mins}m`;
  };

  const handleManualBackup = async () => {
    const success = await performDriveBackup(false);
    if (success) {
      setActionSuccessMsg('Snapshot backed up to Google Drive successfully!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleRestore = (fileId: string, fileName: string) => {
    onConfirmAction(
      'Restore Database from Google Drive',
      `Are you sure you want to restore the snapshot "${fileName}"? This will overwrite existing local data with the cloud snapshot.`,
      async () => {
        setRestoringId(fileId);
        const success = await restoreBackupFromDrive(fileId);
        setRestoringId(null);
        if (success) {
          setActionSuccessMsg('Database restored successfully from Google Drive snapshot!');
          setTimeout(() => setActionSuccessMsg(null), 5000);
        }
      }
    );
  };

  const handleDelete = (fileId: string, fileName: string) => {
    onConfirmAction(
      'Delete Google Drive Snapshot',
      `Are you sure you want to delete "${fileName}" from Google Drive? This cannot be undone.`,
      async () => {
        setDeletingId(fileId);
        await deleteBackupFromDrive(fileId);
        setDeletingId(null);
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Primary Google Drive Auto-Backup Card */}
      <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 space-y-6">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Cloud className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
                  <span>Automatic Google Drive Cloud Backup</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Hourly Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated background snapshots of Patil Biryani POS sales, invoices, raw materials & staff data directly to your personal Google Drive
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status Badge / Login Button */}
          <div className="flex items-center gap-3">
            {isConnected && user ? (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/30 rounded-2xl px-3 py-1.5 shadow-sm">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="h-7 w-7 rounded-full border border-emerald-400/40 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {user.displayName?.[0] || 'G'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">
                    {user.displayName || 'Google Account'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium line-clamp-1">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors ml-1"
                  title="Disconnect Google Drive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                disabled={isSigningIn}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {/* Official Google G SVG */}
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Drive...' : 'Connect Google Drive'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications & Alerts */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {lastError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{lastError}</span>
            </div>
            {isConnected && (
              <button
                onClick={loginWithGoogle}
                className="px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold text-[11px]"
              >
                Re-authenticate
              </button>
            )}
          </div>
        )}

        {/* Control Center & Status Metrics */}
        {isConnected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Toggle Automatic Hourly Backup */}
              <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Auto-Backup Engine</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      autoBackupEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  ></span>
                  <span className="text-xs font-semibold text-slate-200">
                    {autoBackupEnabled ? 'Enabled & Running' : 'Paused by User'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Takes continuous snapshots automatically without interrupting ongoing orders or billing.
                </p>
              </div>

              {/* Backup Frequency Config */}
              <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-950/40">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>Backup Frequency</span>
                </span>
                <CustomSelect
                  value={backupIntervalMinutes}
                  onChange={(val) => setBackupIntervalMinutes(typeof val === 'number' ? val : parseInt(val, 10))}
                  disabled={!autoBackupEnabled}
                  options={[
                    { value: 60, label: 'Every 1 Hour (Recommended)' },
                    { value: 120, label: 'Every 2 Hours' },
                    { value: 360, label: 'Every 6 Hours' },
                    { value: 720, label: 'Every 12 Hours' },
                    { value: 1440, label: 'Once a Day (24 Hours)' },
                  ]}
                  size="sm"
                />
                <div className="text-[11px] text-cyan-400 font-medium">
                  {nextBackupTime ? `Next trigger ${formatCountdown(nextBackupTime)}` : 'Waiting for next cycle'}
                </div>
              </div>

              {/* Status & Last Backup Info */}
              <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-950/40">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Cloud Storage Folder</span>
                </span>
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <FolderArchive className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Patil Biryani Cloud Backups</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {lastBackupTime ? (
                    <span>Last backup: <strong className="text-slate-200">{formatTimeAgo(lastBackupTime)}</strong></span>
                  ) : (
                    <span>No backups created yet today</span>
                  )}
                </div>
              </div>
            </div>

            {/* Instant Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualBackup}
                  disabled={backupStatus === 'in_progress'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <CloudUpload className={`h-4 w-4 stroke-[2.5] ${backupStatus === 'in_progress' ? 'animate-bounce' : ''}`} />
                  <span>
                    {backupStatus === 'in_progress' ? 'Uploading Snapshot to Drive...' : 'Back Up Now to Google Drive'}
                  </span>
                </button>

                <button
                  onClick={() => refreshDriveBackups()}
                  disabled={isLoadingDriveBackups}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-colors"
                  title="Refresh Drive Files"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDriveBackups ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {lastBackupFileName && (
                <div className="text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
                  Latest: <span className="font-mono text-emerald-400 font-semibold">{lastBackupFileName}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Not Connected Prompt */
          <div className="rounded-2xl p-6 border border-emerald-500/20 bg-slate-950/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <CloudOff className="h-4 w-4 text-amber-400" />
                <span>Connect Google Drive to Enable Automatic Hourly Backups</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your Google account to automatically store hourly encrypted snapshots of all your sales receipts, dish inventory, daily closings, customer ledgers, and staff payroll to your Google Drive. Protects 100% of your data even if you change laptops or clear browser caches.
              </p>
              <ul className="text-[11px] text-emerald-400 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Automatic background upload every 1 hour (configurable)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Creates a dedicated "Patil Biryani Cloud Backups" folder in your Drive</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>One-click cloud restore to any device, mobile phone or tablet</span>
                </li>
              </ul>
            </div>

            <button
              onClick={loginWithGoogle}
              disabled={isSigningIn}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting to Drive...' : 'Connect Google Drive'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Google Drive Saved Snapshots History */}
      {isConnected && (
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-3">
            <div>
              <h4 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <FolderArchive className="h-5 w-5 text-emerald-400" />
                <span>Google Drive Cloud Snapshots ({driveBackups.length})</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved in Google Drive folder: <em>Patil Biryani Cloud Backups</em>
              </p>
            </div>

            <button
              onClick={() => refreshDriveBackups()}
              disabled={isLoadingDriveBackups}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDriveBackups ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>

          {isLoadingDriveBackups && driveBackups.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Scanning Google Drive folder for backups...</span>
            </div>
          ) : driveBackups.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/30 rounded-2xl border border-white/5">
              No cloud backups found yet. Click <strong>"Back Up Now to Google Drive"</strong> above or wait for the automatic hourly cycle to trigger.
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-1">
              {driveBackups.map((file) => {
                const isAuto = file.name.includes('AutoBackup');
                return (
                  <div
                    key={file.id}
                    className="py-3 px-3.5 rounded-2xl hover:bg-slate-900/60 transition-colors flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isAuto
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        <HardDrive className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            {file.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isAuto
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {isAuto ? 'Hourly Auto' : 'Manual'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{new Date(file.createdTime).toLocaleString()}</span>
                          <span>•</span>
                          <span className="font-mono">{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(file.id, file.name)}
                        disabled={restoringId === file.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs border border-amber-500/30 transition-all disabled:opacity-50"
                        title="Restore this cloud snapshot to the application"
                      >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        <span>{restoringId === file.id ? 'Restoring...' : 'Restore'}</span>
                      </button>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Open in Google Drive"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(file.id, file.name)}
                        disabled={deletingId === file.id}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                        title="Delete from Google Drive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
