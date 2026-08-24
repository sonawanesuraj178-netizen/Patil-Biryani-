import React from 'react';
import {
  Sparkles,
  Zap,
  Receipt,
  HardDrive,
  Cloud,
  CheckCircle2,
  X,
  Smartphone,
  ChefHat,
  Landmark,
  ShieldCheck,
  Check,
  TrendingUp,
  Layers,
  ArrowRight,
  Printer,
  Radio,
} from 'lucide-react';
import { getAppVersion } from '../utils/versionCheck';
import { NavTabId } from './Navbar';

interface UiVersionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: NavTabId) => void;
}

export const UiVersionUpgradeModal: React.FC<UiVersionUpgradeModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const version = getAppVersion();

  const features = [
    {
      icon: Zap,
      color: 'emerald',
      title: 'Ultra-Fast POS & Instant Keypad',
      desc: 'Sleek, touch-optimized billing grid with quick item quantity stepper, held orders, table selector, and instant thermal KOT print.',
      tab: 'invoices' as NavTabId,
    },
    {
      icon: Radio,
      color: 'cyan',
      title: 'Sub-Millisecond Multi-Device Sync',
      desc: 'Real-time WebSocket & SSE synchronization keeping your counter desktop, kitchen display, and waiter mobile phones instantly unified.',
      tab: 'settings' as NavTabId,
    },
    {
      icon: HardDrive,
      color: 'teal',
      title: 'Automated Local Folder Backup Engine',
      desc: 'Zero-effort automated daily backups written directly to your local device folder via the native File System Access API.',
      tab: 'settings' as NavTabId,
    },
    {
      icon: ChefHat,
      color: 'amber',
      title: 'Live Kitchen Display (KDS)',
      desc: 'Full-screen kitchen order management with elapsed timers, color-coded urgency badges, and quick one-tap order dispatching.',
      tab: 'kitchen' as NavTabId,
    },
    {
      icon: Landmark,
      color: 'blue',
      title: 'Real-Time Liquidity & Cash Telemetry',
      desc: 'Live Cash vs UPI vs Bank balance tracking, daily cash drawer reconciliations, and instant plate-wise profit analytics.',
      tab: 'money-position' as NavTabId,
    },
    {
      icon: Printer,
      color: 'purple',
      title: 'Precision Thermal & Laser Printing',
      desc: 'High-density 80mm & 58mm ESC/POS thermal receipt formatting with clean Marathi/English fonts and dynamic paper size auto-fitting.',
      tab: 'settings' as NavTabId,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel-elevated w-full max-w-2xl rounded-3xl p-6 sm:p-7 border border-emerald-500/30 shadow-2xl shadow-emerald-950/50 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/30 shrink-0 flex items-center justify-center text-slate-950">
              <Sparkles className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-xl text-slate-100">
                  UI Version Upgrade
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v{version.startsWith('4') ? version : '4.5.0 Ultra POS'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  2026 Enterprise Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Engineered for maximum speed, crystal-clear readability, and seamless restaurant operations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-4 border border-white/8 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-xl border flex items-center justify-center ${
                        feat.color === 'emerald'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : feat.color === 'cyan'
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : feat.color === 'teal'
                          ? 'bg-teal-500/15 border-teal-500/30 text-teal-400'
                          : feat.color === 'amber'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : feat.color === 'blue'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                      }`}
                    >
                      <Icon className="h-4 w-4 stroke-[2.5]" />
                    </div>

                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Upgraded
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                {onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate(feat.tab);
                      onClose();
                    }}
                    className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* System Summary Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>
              <strong>100% Offline Capable</strong> • All local transaction records, printer settings &amp; backups are safely stored on device.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            Got It, Launch POS
          </button>
        </div>
      </div>
    </div>
  );
};
