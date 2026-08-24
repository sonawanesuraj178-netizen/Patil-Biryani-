import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  Check,
  Copy,
  ShieldCheck,
  Zap,
  Printer,
  WifiOff,
  Sparkles,
  HelpCircle,
  Chrome,
  Apple,
  FileCode,
  Info,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  triggerNativeInstallPrompt,
  downloadAndroidInstallerPackage,
  downloadStandaloneOfflineHtml,
} from '../utils/apkGenerator';
import {
  triggerManualUpdateCheck,
  applyAppUpdate,
  getAppVersion,
} from '../utils/versionCheck';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  businessName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'prompted' | 'manual'>('idle');
  const [activeTab, setActiveTab] = useState<'install' | 'pwa' | 'instructions'>('install');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<{ text: string; success: boolean } | null>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCheckUpdate = async () => {
    setIsCheckingUpdates(true);
    setUpdateCheckResult(null);
    try {
      const res = await triggerManualUpdateCheck();
      if (res.status === 'updated') {
        setUpdateCheckResult({ text: '🚀 New published version found! Updating app...', success: true });
        setTimeout(() => applyAppUpdate(), 1000);
      } else {
        setUpdateCheckResult({ text: '✓ Installed app is fully up-to-date with latest published build!', success: true });
        setTimeout(() => setUpdateCheckResult(null), 4000);
      }
    } catch {
      setUpdateCheckResult({ text: 'Offline / Could not reach update server.', success: false });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  useEffect(() => {
    if (isOpen && appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const res = await triggerNativeInstallPrompt();
    setInstallStatus(res);
  };

  const handleDownloadApk = () => {
    downloadAndroidInstallerPackage('PatilBiryani-POS-v4.5.apk');
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 4000);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-100 flex items-center gap-2">
                <span>Android App &amp; Package Installer</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v4.5.0 Ultra POS (Latest)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Install {businessName} on smartphones, tablets &amp; Sunmi/iMin POS billing machines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
          <button
            onClick={() => setActiveTab('install')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'install'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install on Device</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pwa'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'instructions'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Installation Guide</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {activeTab === 'install' && (
            <div className="space-y-4">
              {/* Primary 1-Click Install Card */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                      <Sparkles className="h-4 w-4" />
                      <span>Official WebAPK Native Installer</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Creates a genuine Android app package with home screen icon, fullscreen POS interface and offline persistence.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        Zero Parse Errors
                      </span>
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        Android 7.0 - 14+
                      </span>
                      <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                        Offline Ready
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleNativeInstall}
                    className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 hover:scale-[1.03] transition-all"
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    <span>Install App Now</span>
                  </button>
                </div>

                {installStatus === 'installed' && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>App installed to your device home screen!</span>
                  </div>
                )}
              </div>

              {/* Automatic App Update & Version Sync Hub */}
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-400" />
                      <h4 className="text-xs font-bold text-teal-200">
                        Automatic Background Version Updates
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Auto-Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Installed apps automatically detect republished versions in the background on launch. You can also force an immediate check &amp; update below:
                    </p>
                  </div>

                  <button
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdates}
                    className="shrink-0 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdates ? 'Checking Server...' : 'Check & Force Update'}</span>
                  </button>
                </div>

                {updateCheckResult && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                      updateCheckResult.success
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-200'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                    <span>{updateCheckResult.text}</span>
                  </div>
                )}
              </div>

              {/* Secondary Download Option */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Download APK Archive &amp; Offline Launcher</h4>
                  <p className="text-[11px] text-slate-400">
                    Standalone packages for local archival or manual browser launch
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadApk}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>.apk</span>
                  </button>
                  <button
                    onClick={() => downloadStandaloneOfflineHtml(businessName)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                    <span>.html</span>
                  </button>
                </div>
              </div>

              {/* POS Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Zap className="h-4 w-4" />
                    <span>No URL Address Bar</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Full-screen native view with maximum screen space for rapid counter billing.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <Printer className="h-4 w-4" />
                    <span>Thermal Printing</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Works directly with 58mm / 80mm ESC/POS Bluetooth &amp; USB thermal printers.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <WifiOff className="h-4 w-4" />
                    <span>Offline Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    All restaurant bills, expenses and staff records are stored safely in local database.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5 border border-white/10 text-center space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-100">
                  Scan QR Code with Android Phone / Billing Tablet
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Point your camera or QR scanner at the code below to open and install Patil Biryani directly on your mobile device.
                </p>

                {qrDataUrl && (
                  <div className="inline-block p-3 rounded-2xl bg-white shadow-2xl">
                    <img
                      src={qrDataUrl}
                      alt="Patil Biryani Mobile POS QR Code"
                      className="w-48 h-48 rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 glass-input px-3 py-1.5 text-xs text-slate-300 font-mono select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
                <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>How to Install via Google Chrome (Official WebAPK)</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-100 block">Open URL in Google Chrome</strong>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Open the POS link inside Google Chrome on your Android smartphone or tablet.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-100 block">Tap 3 Dots (⋮) in Chrome</strong>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Tap the 3 dots menu at the top-right corner of Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-100 block">Select "Install app" or "Add to Home screen"</strong>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Chrome will package and install the certified WebAPK with the Patil Biryani app icon on your home screen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <div className="text-[11px] text-slate-500">
            Compatible with Sunmi, iMin, Samsung, Xiaomi &amp; all Android POS terminals.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
