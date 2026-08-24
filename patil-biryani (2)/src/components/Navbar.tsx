import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  UtensilsCrossed,
  Receipt,
  Wallet,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  BarChart3,
  MoreHorizontal,
  Plus,
  Search,
  BookOpen,
  Store,
  UserCheck,
  CalendarCheck,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Radio,
  RefreshCw,
  Download,
  Landmark,
  Coins,
  ArrowRight,
  ChefHat,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { formatINR } from '../utils/formatters';
import { subscribeSyncStatus, SyncStatus } from '../utils/syncEngine';
import { triggerManualUpdateCheck, applyAppUpdate, getAppVersion } from '../utils/versionCheck';
import { UiVersionUpgradeModal } from './UiVersionUpgradeModal';

export type NavTabId =
  | 'dashboard'
  | 'sales'
  | 'plate-sales'
  | 'invoices'
  | 'kitchen'
  | 'expenses'
  | 'purchases'
  | 'receivables'
  | 'payables'
  | 'money-position'
  | 'staff'
  | 'reports'
  | 'menu'
  | 'vendors'
  | 'customers'
  | 'closing'
  | 'settings';

interface NavbarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenQuickAdd: () => void;
  onOpenSearch: () => void;
  onOpenSyncModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenSearch,
  onOpenSyncModal,
}) => {
  const { businessProfile, moneyPosition, heldOrders } = useApp();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncStatus>({
    isConnected: true,
    isCloudConnected: true,
    cloudSyncStatus: 'connected',
    connectedTabsCount: 1,
    lastSyncTimestamp: Date.now(),
    lastCloudSyncTimestamp: Date.now(),
    recentEvents: [],
    clientId: '',
  });

  useEffect(() => {
    return subscribeSyncStatus((status) => {
      setSyncState(status);
    });
  }, []);

  const handleManualUpdateCheck = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMsg(null);
    try {
      const res = await triggerManualUpdateCheck();
      if (res.status === 'updated') {
        setUpdateStatusMsg('⚡ New version found! Updating...');
        setTimeout(() => applyAppUpdate(), 1000);
      } else {
        setUpdateStatusMsg('✓ Latest version installed');
        setTimeout(() => setUpdateStatusMsg(null), 3000);
      }
    } catch {
      setUpdateStatusMsg('Offline check');
      setTimeout(() => setUpdateStatusMsg(null), 3000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const mainDesktopTabs: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'plate-sales', label: 'Plate Sales', icon: UtensilsCrossed },
    { id: 'invoices', label: 'POS', icon: Receipt },
    { id: 'kitchen', label: 'Kitchen (KDS)', icon: ChefHat },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { id: 'receivables', label: 'Receivables', icon: ArrowDownLeft },
    { id: 'payables', label: 'Payables', icon: ArrowUpRight },
    { id: 'money-position', label: 'Money Position', icon: Landmark },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const moreDropdownItems: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { id: 'kitchen', label: 'Kitchen Display (KDS)', icon: ChefHat, desc: 'Live kitchen orders & prep queue' },
    { id: 'menu', label: 'Menu & Products', icon: BookOpen, desc: 'Pricing, categories & dish list' },
    { id: 'vendors', label: 'Vendors', icon: Store, desc: 'Suppliers & purchase accounts' },
    { id: 'customers', label: 'Customers', icon: UserCheck, desc: 'Ledger & credit accounts' },
    { id: 'closing', label: 'Daily Closing', icon: CalendarCheck, desc: 'Day end cash reconciliation' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, desc: 'Profile, tables & system backup' },
  ];

  const mobileBottomTabs: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'plate-sales', label: 'Plates', icon: UtensilsCrossed },
    { id: 'invoices', label: 'POS', icon: Receipt },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const allUniqueTabs = useMemo(() => {
    const map = new Map<NavTabId, { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }>();
    [...mainDesktopTabs, ...moreDropdownItems].forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [mainDesktopTabs, moreDropdownItems]);

  const isMoreActive = moreDropdownItems.some((item) => item.id === currentTab);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVersionModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-display text-xl font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Click to view UI Version Upgrade details"
            >
              PB
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-extrabold tracking-wider text-slate-100 sm:text-lg">
                  {businessProfile.name || 'PATIL BIRYANI'}
                </span>
                <button
                  onClick={() => setShowVersionModal(true)}
                  className="hidden rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all md:inline-flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10"
                  title="UI v4.5 Enterprise Upgrade. Click to view release notes."
                >
                  <Sparkles className="h-2.5 w-2.5 text-emerald-300 animate-spin" />
                  <span>v4.5 PRO</span>
                </button>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                {businessProfile.subtitle || 'Business Management & Financial Tracker'}
              </p>
            </div>
          </div>

          {/* Money Balance Pill & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Status Pill */}
            <button
              onClick={onOpenSyncModal}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 text-xs transition-all hover:scale-105 ${
                syncState.isServerConnected || syncState.isCloudConnected
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                  : syncState.serverSyncStatus === 'syncing'
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50'
                  : 'border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
              }`}
              title="Real-Time Multi-Device Sync (Desktop & Mobile APK Live). Click to inspect."
            >
              <span className="relative flex h-2 w-2">
                {syncState.isServerConnected || syncState.isCloudConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : syncState.serverSyncStatus === 'syncing' ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 animate-spin"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                )}
              </span>
              <span className="text-[11px] font-semibold hidden md:inline">
                {syncState.isServerConnected || syncState.isCloudConnected
                  ? 'Real-Time Sync Live'
                  : syncState.serverSyncStatus === 'syncing'
                  ? 'Connecting Sync...'
                  : 'Offline (Local)'}
              </span>
              <Radio className="h-3 w-3 text-emerald-400 md:hidden" />
            </button>

            {/* Check for App Updates Button */}
            <button
              onClick={handleManualUpdateCheck}
              disabled={isCheckingUpdate}
              className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 px-2.5 sm:px-3 py-1 text-xs transition-all hover:scale-105"
              title="Check for published updates on installed app / PWA"
            >
              <RefreshCw className={`h-3 w-3 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-semibold hidden xl:inline">
                {updateStatusMsg || (isCheckingUpdate ? 'Checking...' : 'Check Updates')}
              </span>
            </button>

            {/* Balance Badge (Clickable quick link to Money Position View) */}
            <button
              onClick={() => onSelectTab('money-position')}
              className={`hidden sm:flex items-center gap-2 rounded-full px-3.5 py-1 text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                currentTab === 'money-position'
                  ? 'border border-emerald-400 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/30'
                  : moneyPosition.totalAvailableBalance < 0
                  ? 'border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50'
                  : 'border border-emerald-500/25 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title="Click to open Available Money Position & Liquidity Center"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  moneyPosition.totalAvailableBalance < 0
                    ? 'bg-rose-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              ></span>
              <span className="text-slate-400">Balance:</span>
              <span
                className={`font-mono-num font-bold ${
                  moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                {formatINR(moneyPosition.totalAvailableBalance)}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-400 opacity-60 ml-0.5" />
            </button>

            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
              title="Search transactions (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 lg:inline">
                ⌘K
              </kbd>
            </button>

            {/* Floating Quick Add Trigger */}
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="font-semibold">Quick Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Floating Glass Navigation Bar */}
      <nav className="hidden lg:block sticky top-16 z-30 w-full py-2 pointer-events-none">
        <div className="mx-auto max-w-7xl px-4 pointer-events-auto">
          <div className="glass-nav rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-2xl">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {mainDesktopTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                const isKitchenTab = tab.id === 'kitchen';
                const showBadge = isKitchenTab && heldOrders.length > 0;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'text-emerald-300 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 rounded-xl bg-emerald-500/20 border border-emerald-500/40"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="relative z-10">{tab.label}</span>
                    {showBadge && (
                      <span className="relative z-10 ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                        {heldOrders.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* More Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isMoreActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>More</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl z-50"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                      <span>Additional Modules</span>
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onOpenSyncModal();
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 normal-case"
                      >
                        <Radio className="h-3 w-3" />
                        <span>Sync Hub</span>
                      </button>
                    </div>
                    <div className="mt-1 space-y-1">
                      {moreDropdownItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onSelectTab(item.id);
                              setShowMoreMenu(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                            }`}
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold">{item.label}</div>
                              <div className="text-[10px] text-slate-400">{item.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onOpenSyncModal();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Radio className="h-4 w-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">Live Web & App Sync</div>
                          <div className="text-[10px] text-emerald-400/80">Cross-device real-time sync hub</div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Bottom Bar */}
      <div className="fixed bottom-3 inset-x-3 z-40 lg:hidden">
        <div className="glass-nav rounded-2xl p-1.5 flex items-center justify-around shadow-2xl">
          {mobileBottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileTabPill"
                    className="absolute inset-0 rounded-xl bg-emerald-500/15 border border-emerald-500/30"
                  />
                )}
                <Icon className="h-5 w-5 relative z-10" />
                <span className="text-[10px] font-semibold mt-0.5 relative z-10">{tab.label}</span>
              </button>
            );
          })}

          {/* Mobile More Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              isMoreActive ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-400'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-semibold mt-0.5">More</span>
          </button>
        </div>
      </div>

      {/* Mobile More Sheet */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center bg-black/70 backdrop-blur-sm p-3">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-3xl border border-slate-700/80 bg-slate-900 p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="font-display font-bold text-base text-slate-100">All Modules & Settings</div>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {allUniqueTabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setShowMoreMenu(false);
                      }}
                      className={`flex items-center gap-2.5 rounded-2xl p-3 text-left transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSyncModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-bold transition-all"
                >
                  <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                  <span>Open Live Web & App Synchronisation Hub</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* UI Version Upgrade Modal */}
      <UiVersionUpgradeModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onNavigate={onSelectTab}
      />
    </>
  );
};
