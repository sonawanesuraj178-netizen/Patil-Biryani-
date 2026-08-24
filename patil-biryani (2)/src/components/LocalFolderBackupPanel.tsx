import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  FolderCheck,
  FolderSync,
  HardDrive,
  Save,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Settings,
  Sparkles,
  Zap,
  FileJson,
  Laptop,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useLocalFolder } from '../context/LocalFolderContext';
import { useAppNotification } from '../context/AppNotificationContext';
import { CustomSelect } from './ui/CustomSelect';
import { formatINR } from '../utils/formatters';

interface LocalFolderBackupPanelProps {
  onConfirmAction: (title: string, message: string, onConfirm: () => void) => void;
}

export const LocalFolderBackupPanel: React.FC<LocalFolderBackupPanelProps> = ({
  onConfirmAction,
}) => {
  const {
    isSupported,
    isConnected,
    folderName,
    folderCustomPath,
    config,
    backupFiles,
    isLoadingFiles,
    isSaving,
    lastBackupAt,
    lastBackupFileName,
    lastBackupSize,
    lastError,
    selectFolder,
    disconnectFolder,
    updateConfig,
    saveBackupToFolder,
    restoreBackupFromFile,
    deleteBackupFile,
    refreshFolderFiles,
  } = useLocalFolder();
  const { showToast } = useAppNotification();

  // Local editing states for path & config
  const [editingPath, setEditingPath] = useState(folderCustomPath || '');
  const [isPathSaved, setIsPathSaved] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Sync editingPath when folderCustomPath updates
  React.useEffect(() => {
    setEditingPath(folderCustomPath || '');
  }, [folderCustomPath]);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTimeAgo = (timestamp?: number | null) => {
    if (!timestamp) return 'Never';
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

  const handleSavePathSetting = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      folderCustomPath: editingPath.trim(),
    });
    setIsPathSaved(true);
    setTimeout(() => setIsPathSaved(false), 3000);
  };

  const handleManualSave = async () => {
    const res = await saveBackupToFolder(false);
    if (res.success) {
      setActionSuccessMsg(`Backup saved successfully! File: ${res.fileName}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleRestore = (fileName: string) => {
    onConfirmAction(
      'Restore Database from Local Folder',
      `Are you sure you want to restore "${fileName}"? This will replace your current menu, invoices, staff records and sales data with the snapshot contents.`,
      async () => {
        setRestoringFile(fileName);
        const res = await restoreBackupFromFile(fileName);
        setRestoringFile(null);
        if (res.success) {
          showToast(`Database restored successfully from "${fileName}"!`, 'success');
          setActionSuccessMsg(`Database restored successfully from "${fileName}"!`);
          setTimeout(() => setActionSuccessMsg(null), 5000);
        } else {
          showToast(res.error || 'Failed to restore database from selected file.', 'error');
        }
      }
    );
  };

  const handleDelete = (fileName: string) => {
    onConfirmAction(
      'Delete Local Backup File',
      `Are you sure you want to permanently delete "${fileName}" from your device's backup folder?`,
      async () => {
        setDeletingFile(fileName);
        await deleteBackupFile(fileName);
        setDeletingFile(null);
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FolderSync className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-100">
                  Save Data to Local Device Folder
                </h3>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Folder Linked
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Ready to Link
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically backup and store complete Patil Biryani restaurant database directly to your chosen local folder or PC drive.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSupported && (
              <button
                type="button"
                onClick={selectFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <FolderPlus className="h-4 w-4 stroke-[2.5]" />
                <span>{isConnected ? 'Change Local Folder' : 'Select Folder on Device'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50"
            >
              <Save className={`h-4 w-4 stroke-[2.5] ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving to Folder...' : 'Save Backup to Folder Now'}</span>
            </button>

            {isConnected && (
              <button
                type="button"
                onClick={disconnectFolder}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                title="Disconnect Folder"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Success Message */}
        {actionSuccessMsg && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {lastError && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{lastError}</span>
          </div>
        )}

        {/* Status & KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-card rounded-2xl p-4 border border-white/10 bg-slate-950/40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Target Local Directory</span>
              <Folder className="h-4 w-4 text-amber-400" />
            </div>
            <div className="font-mono text-sm font-bold text-slate-100 mt-1 truncate" title={folderCustomPath}>
              {folderName || 'Patil_Biryani_Backups'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{folderCustomPath}</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 bg-slate-950/40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Last Saved</span>
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="font-mono text-sm font-bold text-slate-100 mt-1">
              {formatTimeAgo(lastBackupAt)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {lastBackupFileName || 'No backup created yet'}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 bg-slate-950/40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Snapshot Size</span>
              <HardDrive className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="font-mono text-sm font-bold text-emerald-400 mt-1">
              {formatFileSize(lastBackupSize)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Encrypted JSON Structure</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 bg-slate-950/40">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Auto-Backup Schedule</span>
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <div className="font-mono text-sm font-bold text-purple-400 mt-1">
              {config.autoBackupEnabled ? `Every ${config.backupIntervalMinutes} mins` : 'Disabled'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {config.backupOnDayClosing ? 'Auto-saves on Daily Close' : 'Manual / Interval'}
            </div>
          </div>
        </div>

        {/* SETTINGS: FOLDER PATH & AUTO-SAVE CONFIGURATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Path Settings Box */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-400" />
                <span>Configure Local Folder Path & Name</span>
              </h4>
              {isPathSaved && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Path Saved
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Set the exact folder location on your device or PC where all database backups and snapshots should be organized and stored.
            </p>

            <form onSubmit={handleSavePathSetting} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Local Folder Path on Device / PC
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingPath}
                    onChange={(e) => setEditingPath(e.target.value)}
                    placeholder="e.g. C:\Users\Admin\Documents\Patil_Biryani_Backups"
                    className="flex-1 glass-input px-3 py-2 text-xs font-mono text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0"
                  >
                    Save Path
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Example paths: <code className="text-slate-400">D:\Restaurant_Backups</code> (Windows), <code className="text-slate-400">~/Documents/PatilBiryani</code> (Mac/Linux), or <code className="text-slate-400">/sdcard/Download/PatilBiryani</code> (Android)
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Backup Filename Prefix
                </label>
                <input
                  type="text"
                  value={config.filenamePrefix || 'Patil_Biryani_Data_Backup'}
                  onChange={(e) => updateConfig({ filenamePrefix: e.target.value })}
                  placeholder="Patil_Biryani_Data_Backup"
                  className="w-full glass-input px-3 py-2 text-xs font-mono text-slate-200"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Generated file: <span className="font-mono text-cyan-400">{config.filenamePrefix || 'Patil_Biryani_Data_Backup'}_YYYY-MM-DD_HH-mm-ss.json</span>
                </span>
              </div>
            </form>
          </div>

          {/* Auto-Save & Mirror Options Box */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>Automated Schedule & Mirror Options</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <div>
                  <span className="font-semibold text-slate-200 block">Enable Auto-Backup to Folder</span>
                  <span className="text-[11px] text-slate-400">Automatically write periodic snapshots to the chosen folder</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoBackupEnabled}
                  onChange={(e) => updateConfig({ autoBackupEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <div>
                  <span className="font-semibold text-slate-200 block">Auto-Backup Frequency</span>
                  <span className="text-[11px] text-slate-400">Interval between automated background backups</span>
                </div>
                <CustomSelect
                  value={config.backupIntervalMinutes.toString()}
                  onChange={(val) => updateConfig({ backupIntervalMinutes: parseInt(val, 10) || 60 })}
                  options={[
                    { value: '15', label: 'Every 15 Minutes' },
                    { value: '30', label: 'Every 30 Minutes' },
                    { value: '60', label: 'Every 1 Hour (Recommended)' },
                    { value: '120', label: 'Every 2 Hours' },
                    { value: '240', label: 'Every 4 Hours' },
                    { value: '720', label: 'Every 12 Hours' },
                    { value: '1440', label: 'Every 24 Hours (Daily)' },
                  ]}
                  className="w-44"
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <div>
                  <span className="font-semibold text-slate-200 block">Save on Daily Day Closing</span>
                  <span className="text-[11px] text-slate-400">Auto-save full snapshot whenever daily accounts are closed</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.backupOnDayClosing}
                  onChange={(e) => updateConfig({ backupOnDayClosing: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <div>
                  <span className="font-semibold text-slate-200 block">Always update Latest Snapshot Mirror</span>
                  <span className="text-[11px] text-slate-400">Keeps `Patil_Biryani_Latest_Snapshot.json` updated</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.saveLatestSnapshotMirror}
                  onChange={(e) => updateConfig({ saveLatestSnapshotMirror: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOLDER FILE EXPLORER / BACKUP HISTORY */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <FileJson className="h-4 w-4 text-cyan-400" />
                <span>Snapshots & Backups in Local Folder ({backupFiles.length})</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnected
                  ? `Showing backup files found in "${folderName}" on this device`
                  : 'Link your folder to view, restore and manage stored snapshot files directly'}
              </p>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={refreshFolderFiles}
                disabled={isLoadingFiles}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Refresh Folder</span>
              </button>
            )}
          </div>

          {isConnected ? (
            backupFiles.length === 0 ? (
              <div className="text-center py-8 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
                <Folder className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No backup files found yet in this folder.</p>
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 mt-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Create First Backup Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {backupFiles.map((file) => (
                  <div
                    key={file.name}
                    className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                      file.isLatestSnapshot
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[200px] flex-1">
                      <div
                        className={`p-2 rounded-xl ${
                          file.isLatestSnapshot
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-cyan-400'
                        }`}
                      >
                        <FileJson className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-100">{file.name}</span>
                          {file.isLatestSnapshot && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              Latest Mirror
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{new Date(file.lastModified).toLocaleString()}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(file.lastModified)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(file.name)}
                        disabled={restoringFile === file.name}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{restoringFile === file.name ? 'Restoring...' : 'Restore This File'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(file.name)}
                        disabled={deletingFile === file.name}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete this backup file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/10 border border-amber-500/20 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Info className="h-4 w-4" />
                <span>How Local Device Folder Backup Works</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click <strong>"Select Folder on Device"</strong> to pick any folder on your computer, POS terminal or mobile device (e.g. in your Documents or a USB flash drive). The app will remember your folder and automatically save timestamped JSON snapshots without uploading your data to any external server.
              </p>
              {!isSupported && (
                <div className="pt-2 text-[11px] text-slate-400">
                  <em>Note: In browsers without direct folder handle support (such as Safari), clicking "Save Backup to Folder Now" will download the JSON file with your custom path metadata into your device's default Downloads folder.</em>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
