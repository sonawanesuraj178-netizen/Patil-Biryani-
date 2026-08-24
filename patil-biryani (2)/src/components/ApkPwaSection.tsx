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
  ExternalLink,
  CheckCircle2,
  Apple,
  Chrome,
  Monitor,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
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
} from '../utils/versionCheck';

interface ApkPwaSectionProps {
  businessName: string;
}

export const ApkPwaSection: React.FC<ApkPwaSectionProps> = ({ businessName }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [installPromptReady, setInstallPromptReady] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'prompted' | 'manual'>('idle');
  const [pwaPlatform, setPwaPlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [downloadStarted, setDownloadStarted] = useState(false);
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
        setUpdateCheckResult({ text: '✓ Installed app is running the latest published version!', success: true });
        setTimeout(() => setUpdateCheckResult(null), 4000);
      }
    } catch {
      setUpdateCheckResult({ text: 'Offline / Could not reach update server.', success: false });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  useEffect(() => {
    // Check if beforeinstallprompt is ready
    if ((window as any).deferredPrompt) {
      setInstallPromptReady(true);
    }

    const handleReady = () => setInstallPromptReady(true);
    window.addEventListener('pwa-install-ready', handleReady);

    if (appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }

    return () => {
      window.removeEventListener('pwa-install-ready', handleReady);
    };
  }, [appUrl]);

  const handleNativeInstall = async () => {
    const res = await triggerNativeInstallPrompt();
    setInstallStatus(res);
    if (res === 'installed') {
      setInstallPromptReady(false);
    }
  };

  const handleDownloadPackage = () => {
    downloadAndroidInstallerPackage('PatilBiryani-POS-v4.5.apk');
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 4500);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 space-y-6 shadow-xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-lg text-slate-100">
                Android App & PWA Package Installer
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official WebAPK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Install <strong>{businessName}</strong> on Android phones, billing tablets, Sunmi & iMin POS terminals with full offline and thermal print support.
            </p>
          </div>
        </div>

        {/* Quick 1-Click Install Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNativeInstall}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
          >
            <Download className="h-4 w-4 stroke-[3]" />
            <span>Install App on Device</span>
          </button>
        </div>
      </div>

      {/* Recommended Installation Callout for Android Users */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 md:mt-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-200">
              Why WebAPK / PWA is the Recommended Method for Modern Android:
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Google Android generates a certified <strong>signed WebAPK</strong> directly through Google Chrome. It installs with a genuine Android package name, creates a home screen icon, enables full-screen mode, supports Bluetooth ESC/POS printers, and avoids "Parse error / Unsupported APK" issues from untrusted APK side-loads.
            </p>
          </div>
        </div>

        <button
          onClick={handleNativeInstall}
          className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Launch 1-Click Installer</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Direct Android Package & QR Code (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: 1-Click Native Installer */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Option 1: 1-Click Android App Install</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Recommended
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tapping the button below will trigger Android's native package installer dialog to add <strong>{businessName}</strong> to your app drawer.
            </p>

            <button
              onClick={handleNativeInstall}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-[1.02]"
            >
              <Download className="h-4 w-4 stroke-[3]" />
              <span>Install Official Android App</span>
            </button>

            {installStatus === 'installed' && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Application installed successfully to your Android home screen!</span>
              </div>
            )}

            {installStatus === 'manual' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Chrome className="h-3.5 w-3.5" />
                  <span>Manual Installation Steps:</span>
                </div>
                <div>1. Open Chrome menu (⋮ top right)</div>
                <div>2. Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></div>
              </div>
            )}
          </div>

          {/* Auto-Update & Real-Time Version Synchronizer */}
          <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Installed App Auto-Update Sync</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                Auto Active
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              When a new version is republished, installed apps automatically detect it on launch and in the background. Tap below to force an immediate update check:
            </p>

            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdates}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdates ? 'Checking Update Server...' : 'Check & Force Update Now'}</span>
            </button>

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

          {/* Card 2: Download APK Manifest / Standalone Backup */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Option 2: Standalone APK / Offline Package</span>
              <span className="text-[10px] font-mono text-slate-400">v2.4.0</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Download the standalone package file or single-file offline HTML launcher for side-loading or archiving.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadPackage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Download .apk</span>
              </button>

              <button
                onClick={() => downloadStandaloneOfflineHtml(businessName)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download .html</span>
              </button>
            </div>

            {downloadStarted && (
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-400" />
                <span>File downloaded to your device storage.</span>
              </div>
            )}
          </div>

          {/* Card 3: QR Code for Phone/Tablet */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col sm:flex-row items-center gap-4">
            {qrDataUrl && (
              <div className="p-2 rounded-xl bg-white shrink-0 shadow-md">
                <img src={qrDataUrl} alt="Scan to Phone" className="w-24 h-24 rounded" />
              </div>
            )}
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <span className="text-xs font-bold text-slate-200 block">
                Scan with Android Phone Camera
              </span>
              <p className="text-[11px] text-slate-400 leading-snug">
                Open directly on your counter tablet or billing phone to install without cords.
              </p>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-white/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Copy App URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Native Installation Guide (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="font-display font-bold text-sm text-slate-100">
                  Step-by-Step Installation Instructions
                </h4>
              </div>

              {/* Platform Selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/5 shrink-0">
                <button
                  onClick={() => setPwaPlatform('android')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    pwaPlatform === 'android'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Chrome className="h-3.5 w-3.5" />
                  <span>Android</span>
                </button>
                <button
                  onClick={() => setPwaPlatform('ios')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    pwaPlatform === 'ios'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Apple className="h-3.5 w-3.5" />
                  <span>iOS (iPhone)</span>
                </button>
                <button
                  onClick={() => setPwaPlatform('desktop')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    pwaPlatform === 'desktop'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>PC / POS Box</span>
                </button>
              </div>
            </div>

            {/* Android Instructions */}
            {pwaPlatform === 'android' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    1
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-slate-100 block">Open this Link in Google Chrome</strong>
                    <span className="text-slate-400">
                      On your Android phone, tablet, or Sunmi device, open Google Chrome.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    2
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-slate-100 block">Tap 3-Dots Menu (⋮) &gt; "Install app"</strong>
                    <span className="text-slate-400">
                      Tap the three dots at the top right of Chrome and select <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    3
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-slate-100 block">Tap "Install" on Package Dialog</strong>
                    <span className="text-slate-400">
                      Android will generate and install the official WebAPK package. The <strong>PATIL BIRYANI</strong> app icon will appear in your device launcher.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    4
                  </span>
                  <div className="text-xs space-y-0.5">
                    <strong className="text-slate-100 block">Open &amp; Enjoy Fullscreen POS Experience</strong>
                    <span className="text-slate-400">
                      Launches in native fullscreen without any browser URL bars, complete with thermal printing and offline database persistence.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {pwaPlatform === 'ios' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    1
                  </span>
                  <div className="text-xs">
                    <strong className="text-slate-100 block">Open in Apple Safari</strong>
                    <span className="text-slate-400">
                      Open this URL in Safari on your iPhone or iPad.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    2
                  </span>
                  <div className="text-xs">
                    <strong className="text-slate-100 block">Tap Share Icon</strong>
                    <span className="text-slate-400">
                      Tap the <strong>Share</strong> icon (square with arrow) on Safari toolbar.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    3
                  </span>
                  <div className="text-xs">
                    <strong className="text-slate-100 block">Select "Add to Home Screen"</strong>
                    <span className="text-slate-400">
                      Scroll down and tap <strong>"Add to Home Screen"</strong> and tap <strong>"Add"</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {pwaPlatform === 'desktop' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    1
                  </span>
                  <div className="text-xs">
                    <strong className="text-slate-100 block">Look for Install Icon in Browser Address Bar</strong>
                    <span className="text-slate-400">
                      In Chrome or Edge, click the <strong>Install Patil Biryani (🖥️/⊕)</strong> icon on the right side of the address bar.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs shrink-0">
                    2
                  </span>
                  <div className="text-xs">
                    <strong className="text-slate-100 block">Launch in Dedicated Window</strong>
                    <span className="text-slate-400">
                      The POS opens in its own standalone desktop window with taskbar pinning and ESC/POS thermal printing support.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Native Capabilities Grid */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-300 font-medium text-left">No Address Bar / Native View</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
                <Printer className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-[11px] text-slate-300 font-medium text-left">58mm/80mm Thermal Printing</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-300 font-medium text-left">100% Offline Data Storage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
