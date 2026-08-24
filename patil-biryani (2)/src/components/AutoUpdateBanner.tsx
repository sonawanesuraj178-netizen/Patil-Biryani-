import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  initAutoUpdateMonitor,
  applyAppUpdate,
  triggerManualUpdateCheck,
  VersionInfo,
  getAppVersion,
} from '../utils/versionCheck';

export const AutoUpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [autoUpdateCountdown, setAutoUpdateCountdown] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = initAutoUpdateMonitor((hasUpdate, latestVer) => {
      if (hasUpdate) {
        setUpdateAvailable(true);
        setVersionInfo(latestVer);
        // Start a gentle 5-second countdown if user doesn't dismiss
        setAutoUpdateCountdown(5);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoUpdateCountdown === null || dismissed || isUpdating) return;

    if (autoUpdateCountdown <= 0) {
      handleApplyUpdate();
      return;
    }

    const timer = setTimeout(() => {
      setAutoUpdateCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoUpdateCountdown, dismissed, isUpdating]);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    await applyAppUpdate();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setAutoUpdateCountdown(null);
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/40 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-emerald-950/50 flex flex-col gap-3 text-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30">
              <Sparkles className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>New App Update Available!</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h4>
              <p className="text-xs text-slate-400">
                A newly republished version is ready to install.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss update notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {autoUpdateCountdown !== null && autoUpdateCountdown > 0
                ? `Auto-reloading in ${autoUpdateCountdown}s...`
                : 'All local data safely preserved'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleApplyUpdate}
              disabled={isUpdating}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
