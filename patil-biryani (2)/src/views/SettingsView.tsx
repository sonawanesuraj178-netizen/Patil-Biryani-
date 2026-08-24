import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Building,
  Printer,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Save,
  ShieldCheck,
  Percent,
  Smartphone,
  QrCode,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Plus,
  LayoutGrid,
  Check,
  X,
  Eye,
  Sliders,
  Radio,
  Copy,
  Laptop,
  Clock,
  HardDrive,
  Cloud,
  Wallet,
  Folder,
  FolderSync,
  FolderPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import { BusinessProfile, RestaurantTable, DateFormatPattern, TimeFormatPattern, PdfPaperSize, PdfTemplateVersion, PdfColorTheme, Invoice } from '../types';
import { CustomSelect, SelectOption } from '../components/ui/CustomSelect';
import { AddressInputGroup } from '../components/ui/AddressInputGroup';
import { ApkDownloadModal } from '../components/ApkDownloadModal';
import { GoogleDriveBackupPanel } from '../components/GoogleDriveBackupPanel';
import { LocalFolderBackupPanel } from '../components/LocalFolderBackupPanel';
import { downloadAndroidInstallerPackage } from '../utils/apkGenerator';
import {
  formatDateWithPattern,
  formatTimeWithPattern,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';
import { generateInvoicePDF, downloadInvoicePDF } from '../utils/pdfService';
import {
  SyncStatus,
  subscribeSyncStatus,
  forceResyncAllTabs,
  pullAllFromCloud,
  syncAllToCloud,
  sendLiveSyncPing,
  generateCrossDeviceSyncBundle,
  CLIENT_ID,
} from '../utils/syncEngine';

interface SettingsViewProps {
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onConfirmDelete }) => {
  const {
    businessProfile,
    updateBusinessProfile,
    tables,
    addTable,
    updateTable,
    deleteTable,
    setTableStatus,
    invoices,
    expenses,
    purchases,
    plateWiseSales,
    products,
    staffEmployees,
    resetToDefaultData,
    exportAllDataJSON,
    importDataJSON,
  } = useApp();
  const { showToast } = useAppNotification();

  // Settings sub tabs
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'profile' | 'tables' | 'formats' | 'sync' | 'local-folder' | 'backup' | 'mobile'
  >('profile');

  // Local state for profile form
  const [profile, setProfile] = useState<BusinessProfile>(businessProfile || {} as BusinessProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [apkDownloaded, setApkDownloaded] = useState(false);

  // Sync profile form whenever businessProfile updates from storage/sync
  useEffect(() => {
    if (businessProfile) {
      setProfile(businessProfile);
    }
  }, [businessProfile]);

  // Sync state
  const [syncState, setSyncState] = useState<SyncStatus>({
    isConnected: true,
    connectedTabsCount: 1,
    lastSyncTimestamp: Date.now(),
    recentEvents: [],
  });
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);
  const [syncImportText, setSyncImportText] = useState('');
  const [syncImportMsg, setSyncImportMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isResyncing, setIsResyncing] = useState(false);

  useEffect(() => {
    return subscribeSyncStatus((s) => setSyncState(s));
  }, []);

  // Logo file upload ref
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Table Modal states
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [tableSection, setTableSection] = useState('Ground Floor');
  const [tableStatusState, setTableStatusState] = useState<RestaurantTable['status']>('Available');
  const [tableActive, setTableActive] = useState(true);

  // File upload ref for restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Logo Upload (converts image to base64 data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'warning');
      return;
    }

    // Limit to 2MB to keep local storage lightweight
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size should be less than 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setProfile((prev) => ({ ...prev, logoUrl: base64Url }));
      updateBusinessProfile({ ...profile, logoUrl: base64Url });
      setSavedSuccess(true);
      showToast('Logo uploaded and saved successfully!', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoUrl: undefined }));
    updateBusinessProfile({ ...profile, logoUrl: undefined });
    showToast('Restaurant logo removed.', 'info');
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(profile);
    setSavedSuccess(true);
    showToast('Restaurant profile settings saved!', 'success');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleQuickDownloadApk = () => {
    downloadAndroidInstallerPackage('PatilBiryani-POS-v4.5.apk');
    setApkDownloaded(true);
    showToast('Generating and downloading Android APK bundle...', 'info');
    setTimeout(() => setApkDownloaded(false), 4000);
  };

  // Import JSON Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const ok = importDataJSON(jsonStr);
        if (ok) {
          showToast('Data backup imported successfully!', 'success');
        } else {
          showToast('Invalid backup JSON structure.', 'error');
        }
      } catch (err) {
        showToast('Invalid backup JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Table Handlers
  const handleOpenAddTable = () => {
    setEditingTableId(null);
    setTableName(`Table ${tables.length + 1}`);
    setTableCapacity('4');
    setTableSection('Ground Floor');
    setTableStatusState('Available');
    setTableActive(true);
    setShowTableModal(true);
  };

  const handleOpenEditTable = (tbl: RestaurantTable) => {
    setEditingTableId(tbl.id);
    setTableName(tbl.name);
    setTableCapacity(tbl.capacity ? tbl.capacity.toString() : '4');
    setTableSection(tbl.section || 'Ground Floor');
    setTableStatusState(tbl.status);
    setTableActive(tbl.active);
    setShowTableModal(true);
  };

  const handleSubmitTable = (e: React.FormEvent) => {
    e.preventDefault();
    const cap = parseInt(tableCapacity, 10) || 4;

    if (editingTableId) {
      updateTable(editingTableId, {
        name: tableName.trim(),
        capacity: cap,
        section: tableSection.trim(),
        status: tableStatusState,
        active: tableActive,
      });
    } else {
      addTable({
        name: tableName.trim(),
        tableNumber: tableName.replace(/\D/g, '') || String(tables.length + 1),
        capacity: cap,
        section: tableSection.trim(),
        status: tableStatusState,
        active: tableActive,
      });
    }

    setShowTableModal(false);
  };

  const handleToggleTableActive = (tbl: RestaurantTable) => {
    updateTable(tbl.id, { active: !tbl.active });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-cyan-400" />
            <span>Settings & Configurations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Business brand identity, logo, dining tables, database backup & mobile installation
          </p>
        </div>

        {/* Action Status */}
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-pulse">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved Successfully!</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="glass rounded-2xl p-1.5 flex items-center flex-wrap gap-1.5">
        <button
          onClick={() => setActiveSettingsTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'profile'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Business Profile & Logo</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('tables')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'tables'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Tables Management ({tables.length})</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('formats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'formats'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Printer className="h-4 w-4 text-cyan-400" />
          <span>Date & PDF Formats</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('sync')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'sync'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Live Synchronisation Hub</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('local-folder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'local-folder'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FolderSync className="h-4 w-4 text-amber-400" />
          <span>Save to Local Folder</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'backup'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Cloud className="h-4 w-4 text-emerald-400" />
          <span>Google Drive & Auto-Backup</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('mobile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSettingsTab === 'mobile'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Mobile App (APK & PWA)</span>
        </button>
      </div>

      {/* TAB 1: BUSINESS PROFILE & LOGO */}
      {activeSettingsTab === 'profile' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <Building className="h-5 w-5 text-amber-400" />
                  <span>Restaurant Identity, Logo & Licenses</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Appears on thermal bills, salary slips, invoices & official report PDF exports
                </p>
              </div>

              {/* Logo Management Box */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
                <div className="h-16 w-16 rounded-xl border border-white/20 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt="Restaurant Logo"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <div className="text-center p-1">
                      <ImageIcon className="h-6 w-6 text-slate-500 mx-auto" />
                      <span className="text-[9px] text-slate-500 block mt-0.5">No Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-200">Business Logo</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{profile.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    </button>

                    {profile.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 transition-all"
                        title="Remove Logo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Maintains aspect ratio on receipts & salary slips
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Restaurant Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.name ?? ''}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={profile.subtitle ?? ''}
                    onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Owner / Proprietor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.ownerName ?? ''}
                    onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Owner Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.ownerMobile ?? ''}
                    onChange={(e) => setProfile({ ...profile, ownerMobile: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Store Phone / Hotline *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.mobile ?? ''}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Store Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email ?? ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Alternate Contact / Landline
                  </label>
                  <input
                    type="text"
                    value={profile.altMobile ?? ''}
                    onChange={(e) => setProfile({ ...profile, altMobile: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Structured Address Details with Dependent Country, State & District Selection */}
              <AddressInputGroup
                values={{
                  addressLine1: profile.addressLine1 ?? '',
                  addressLine2: profile.addressLine2 ?? '',
                  landmark: profile.landmark ?? profile.area ?? '',
                  area: profile.area ?? '',
                  district: profile.district ?? '',
                  city: profile.city ?? '',
                  state: profile.state ?? 'Maharashtra',
                  country: profile.country ?? 'India',
                  pinCode: profile.pinCode ?? '',
                }}
                onChange={(field, value) => {
                  setProfile((prev) => ({
                    ...prev,
                    [field]: value,
                    ...(field === 'landmark' ? { area: value } : {}),
                  }));
                }}
                title="Restaurant & Outlet Address Details"
                subtitle="Country-wise, State-wise & District-wise interlinked address formatted for thermal bills, salary slips, & invoices"
                required={true}
                showPreview={true}
              />

              {/* Tax & Legal */}
              <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.gstNumber ?? ''}
                    onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs uppercase font-mono text-slate-200"
                    placeholder="27ABCDE1234F1Z5"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    FSSAI License # (Food Safety)
                  </label>
                  <input
                    type="text"
                    value={profile.fssaiNumber ?? ''}
                    onChange={(e) => setProfile({ ...profile, fssaiNumber: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs font-mono text-slate-200"
                    placeholder="11521000000000"
                  />
                </div>
              </div>

              {/* Opening Balances / Starting Liquid Capital for Money Position */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-emerald-400" />
                      <span>Opening Balances / Base Capital (Available Money Position)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Set starting balances in your drawer, bank account, and UPI to calibrate your live Available Money Position accurately.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Opening Cash in Hand (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.openingBalanceCash ?? 0}
                      onChange={(e) => setProfile({ ...profile, openingBalanceCash: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input px-3 py-2 text-xs font-mono font-bold text-slate-100"
                      placeholder="5000"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Counter Drawer Base</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Opening Bank Balance (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.openingBalanceBank ?? 0}
                      onChange={(e) => setProfile({ ...profile, openingBalanceBank: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input px-3 py-2 text-xs font-mono font-bold text-slate-100"
                      placeholder="25000"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Current Account Base</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Opening UPI Balance (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.openingBalanceUPI ?? 0}
                      onChange={(e) => setProfile({ ...profile, openingBalanceUPI: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input px-3 py-2 text-xs font-mono font-bold text-slate-100"
                      placeholder="5000"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">UPI / QR Base</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Opening Card Balance (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.openingBalanceCard ?? 0}
                      onChange={(e) => setProfile({ ...profile, openingBalanceCard: parseFloat(e.target.value) || 0 })}
                      className="w-full glass-input px-3 py-2 text-xs font-mono font-bold text-slate-100"
                      placeholder="0"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Card EDC Machine Base</span>
                  </div>
                </div>
              </div>

              {/* Local Backup Folder Path on Device */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <FolderSync className="h-4 w-4 text-amber-400" />
                      <span>Local Device Backup Folder Path</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure the default directory path on your device or computer where database backups are stored.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsTab('local-folder')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                  >
                    <span>Manage Folder & Snapshots</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Local Folder Path / Directory
                    </label>
                    <input
                      type="text"
                      value={profile.localBackupFolderPath ?? ''}
                      onChange={(e) => setProfile({ ...profile, localBackupFolderPath: e.target.value })}
                      className="w-full glass-input px-3 py-2 text-xs font-mono text-slate-200"
                      placeholder="e.g. C:\Users\Admin\Documents\Patil_Biryani_Backups"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Device folder location</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Folder Label / Name
                    </label>
                    <input
                      type="text"
                      value={profile.localBackupFolderName ?? ''}
                      onChange={(e) => setProfile({ ...profile, localBackupFolderName: e.target.value })}
                      className="w-full glass-input px-3 py-2 text-xs font-mono text-slate-200"
                      placeholder="Patil_Biryani_Backups"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">Backup directory name</span>
                  </div>
                </div>
              </div>

              {/* Thermal Receipt Footer Note */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Thermal Bill & Receipt Footer Note
                </label>
                <input
                  type="text"
                  value={profile.footerNote ?? ''}
                  onChange={(e) => setProfile({ ...profile, footerNote: e.target.value })}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  placeholder="Thank you for dining at Patil Biryani! Visit Again."
                />
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  <Save className="h-4 w-4 stroke-[2.5]" />
                  <span>Save Restaurant Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: DATE & PDF FORMAT SETTINGS */}
      {activeSettingsTab === 'formats' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <Printer className="h-5 w-5 text-cyan-400" />
                  <span>Date Format & PDF Printer Settings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure global date patterns, thermal receipt paper size, layout toggles & UPI payment QR
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const sampleInvoice: Invoice = {
                    id: 'sample-inv',
                    invoiceNumber: 'PB-2026-0001',
                    date: getTodayDateString(),
                    time: getCurrentTimeString(),
                    tableNumber: 'Table 4 (Ground)',
                    customerName: 'Rahul Sharma',
                    customerMobile: '+91 98220 12345',
                    orderType: 'Dine In',
                    paymentMode: 'UPI',
                    paymentStatus: 'Paid',
                    items: [
                      { productId: 'p1', productName: 'Special Chicken Dum Biryani', quantity: 2, rate: 180, amount: 360, discount: 0, tax: 18 },
                      { productId: 'p2', productName: 'Chicken Suka', quantity: 1, rate: 180, amount: 180, discount: 0, tax: 9 },
                      { productId: 'p3', productName: 'Tambda Rassa Bowl', quantity: 2, rate: 50, amount: 100, discount: 0, tax: 5 },
                      { productId: 'p4', productName: 'Cold Drink 250ml', quantity: 2, rate: 25, amount: 50, discount: 0, tax: 2.5 },
                    ],
                    subtotal: 690,
                    discount: 0,
                    tax: 34.5,
                    grandTotal: 724.5,
                    amountPaid: 724.5,
                    balanceDue: 0,
                    createdAt: new Date().toISOString(),
                  };
                  downloadInvoicePDF(sampleInvoice, profile);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Test Print Sample Bill PDF</span>
              </button>
            </div>

            {/* SECTION 1: DATE FORMAT SELECTION */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>Global Date Display Format</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Applies across Daily Sales, POS Invoices, Reports, Staff Records, and Exports
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono-num font-bold">
                  Today: {formatDateWithPattern(getTodayDateString(), profile.dateFormat || 'DD/MM/YYYY')}
                </div>
              </div>

              {/* Date Format Radio Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', desc: 'Standard Indian Format', eg: '17/08/2026' },
                  { id: 'DD-MM-YYYY', label: 'DD-MM-YYYY', desc: 'Hyphenated Indian', eg: '17-08-2026' },
                  { id: 'DD MMM YYYY', label: 'DD MMM YYYY', desc: 'Alphanumeric Short', eg: '17 Aug 2026' },
                  { id: 'DD MMMM YYYY', label: 'DD MMMM YYYY', desc: 'Full Month Name', eg: '17 August 2026' },
                  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD', desc: 'ISO Standard Format', eg: '2026-08-17' },
                  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', desc: 'US Standard Format', eg: '08/17/2026' },
                ].map((fmt) => {
                  const isSelected = (profile.dateFormat || 'DD/MM/YYYY') === fmt.id;
                  const liveFormatted = formatDateWithPattern(getTodayDateString(), fmt.id as DateFormatPattern);
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...profile, dateFormat: fmt.id as DateFormatPattern };
                        setProfile(updated);
                        updateBusinessProfile(updated);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-white/10 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{fmt.label}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{fmt.desc}</div>
                        </div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Sample:</span>
                        <span className="font-mono-num font-bold text-emerald-300">{liveFormatted}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Time Format */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                <div>
                  <div className="text-xs font-bold text-slate-200">Time Display Format</div>
                  <div className="text-[11px] text-slate-400">Choose between standard 12-hour AM/PM and 24-hour railway time</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, timeFormat: '12-hour' as TimeFormatPattern };
                      setProfile(updated);
                      updateBusinessProfile(updated);
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      (profile.timeFormat || '12-hour') === '12-hour'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    12-Hour (02:30 PM)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...profile, timeFormat: '24-hour' as TimeFormatPattern };
                      setProfile(updated);
                      updateBusinessProfile(updated);
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 2500);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      profile.timeFormat === '24-hour'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    24-Hour (14:30)
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: PDF PAPER SIZE & LAYOUT */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Printer className="h-4 w-4 text-cyan-400" />
                  <span>PDF Print Paper Size & Printer Layout</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Select your physical receipt printer type or invoice paper dimension
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'thermal-80mm',
                    title: '80mm (3-Inch)',
                    sub: 'POS Thermal Printer',
                    badge: 'Recommended',
                    badgeColor: 'emerald',
                    desc: 'Standard desktop USB / Bluetooth restaurant bill printer',
                  },
                  {
                    id: 'thermal-58mm',
                    title: '58mm (2-Inch)',
                    sub: 'Mini Bluetooth POS',
                    badge: 'Mobile APK',
                    badgeColor: 'cyan',
                    desc: 'Compact handheld mobile printer for waiter billing',
                  },
                  {
                    id: 'a4',
                    title: 'A4 Full Page',
                    sub: 'Official Tax Invoice',
                    badge: 'Corporate',
                    badgeColor: 'amber',
                    desc: 'Full-sheet invoice for bulk orders & catering',
                  },
                  {
                    id: 'a5',
                    title: 'A5 Half Sheet',
                    sub: 'Compact Invoice',
                    badge: 'Standard',
                    badgeColor: 'slate',
                    desc: 'Half-page printable estimate & table summary',
                  },
                ].map((paper) => {
                  const isSelected = (profile.pdfPaperSize || 'thermal-80mm') === paper.id;
                  return (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...profile, pdfPaperSize: paper.id as PdfPaperSize };
                        setProfile(updated);
                        updateBusinessProfile(updated);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-white/10 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              paper.badgeColor === 'emerald'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : paper.badgeColor === 'cyan'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : paper.badgeColor === 'amber'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {paper.badge}
                          </span>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="text-sm font-bold text-slate-100">{paper.title}</div>
                        <div className="text-xs text-cyan-400 font-semibold mt-0.5">{paper.sub}</div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{paper.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono-num">
                        {paper.id.startsWith('thermal') ? 'Thermal ESC/POS Compatible' : 'Laser / Inkjet Document'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2.5: PDF TEMPLATE VERSION & DESIGN THEME */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>PDF Template Version & Design Layout</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Choose your preferred PDF visual layout style for invoices and receipts
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'modern',
                    version: 'v2.0 Modern Gourmet',
                    badge: 'Default',
                    badgeColor: 'emerald',
                    desc: 'Emerald accents, QR scan card, bold totals, itemized tax calculation and currency in words.',
                    features: ['Emerald Theme', 'UPI QR Card', 'Words in Rupee'],
                  },
                  {
                    id: 'classic-thermal',
                    version: 'v2.0 Classic Thermal POS',
                    badge: 'High-Contrast',
                    badgeColor: 'cyan',
                    desc: 'Crisp pure monochrome black & white, dashed lines, optimized for 58mm & 80mm ESC/POS roll printers.',
                    features: ['Monochrome Black', 'Ink Saver', 'Dashed Borders'],
                  },
                  {
                    id: 'gst-tax',
                    version: 'v2.0 Official GST Tax',
                    badge: 'Government Ready',
                    badgeColor: 'amber',
                    desc: 'Full GSTIN compliance table with HSN/SAC, Taxable Value, CGST/SGST rate breakdown, and formal signature.',
                    features: ['HSN/SAC Codes', 'CGST + SGST', 'Signatory Box'],
                  },
                  {
                    id: 'minimal',
                    version: 'v2.0 Minimalist Executive',
                    badge: 'Clean UI',
                    badgeColor: 'slate',
                    desc: 'Refined slate tones, generous spacing, hairline dividers, and elegant clean typography.',
                    features: ['Slate Neutral', 'Hairline Dividers', 'Spacious Layout'],
                  },
                ].map((tmpl) => {
                  const isSelected = (profile.pdfTemplateVersion || 'modern') === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        const updated = { ...profile, pdfTemplateVersion: tmpl.id as PdfTemplateVersion };
                        setProfile(updated);
                        updateBusinessProfile(updated);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-white/10 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              tmpl.badgeColor === 'emerald'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : tmpl.badgeColor === 'cyan'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : tmpl.badgeColor === 'amber'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {tmpl.badge}
                          </span>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="text-sm font-bold text-slate-100">{tmpl.version}</div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{tmpl.desc}</p>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {tmpl.features.map((f, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono-num">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-amber-400 font-bold flex items-center justify-between">
                        <span>{isSelected ? 'Active PDF Version' : 'Click to Activate'}</span>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: PDF CONTENT TOGGLES & UPI QR CODE */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-400" />
                  <span>Receipt Content & Header Options</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Toggle elements to display on your thermal bills & invoice PDFs
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    key: 'pdfShowLogo',
                    label: 'Restaurant Logo Header',
                    desc: 'Prints business logo at the top of receipts',
                    checked: profile.pdfShowLogo !== false,
                  },
                  {
                    key: 'pdfShowGst',
                    label: 'GSTIN & FSSAI Numbers',
                    desc: 'Prints license numbers under header',
                    checked: profile.pdfShowGst !== false,
                  },
                  {
                    key: 'pdfShowAddress',
                    label: 'Address & Mobile Number',
                    desc: 'Prints street location & shop contact',
                    checked: profile.pdfShowAddress !== false,
                  },
                  {
                    key: 'pdfShowTableWaiter',
                    label: 'Table Number & Time',
                    desc: 'Displays dine-in table & bill timestamp',
                    checked: profile.pdfShowTableWaiter !== false,
                  },
                  {
                    key: 'pdfShowCustomer',
                    label: 'Customer Name & Mobile',
                    desc: 'Prints customer info when provided',
                    checked: profile.pdfShowCustomer !== false,
                  },
                  {
                    key: 'pdfShowUpiQr',
                    label: 'UPI QR Payment Details',
                    desc: 'Prints Scan & Pay instructions with UPI ID',
                    checked: profile.pdfShowUpiQr !== false,
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        const updated = { ...profile, [item.key]: e.target.checked };
                        setProfile(updated);
                        updateBusinessProfile(updated);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2000);
                      }}
                      className="mt-0.5 h-4 w-4 rounded bg-slate-950 border-white/20 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* UPI ID Input if UPI QR is enabled */}
              {profile.pdfShowUpiQr !== false && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 space-y-2">
                  <label className="text-xs font-bold text-emerald-400 block flex items-center gap-1.5">
                    <QrCode className="h-4 w-4" />
                    <span>Business UPI ID for Scan & Pay on Bills</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={profile.pdfUpiId ?? 'patilbiryani@okaxis'}
                      onChange={(e) => setProfile({ ...profile, pdfUpiId: e.target.value })}
                      placeholder="e.g. patilbiryani@okaxis, 9876543210@paytm"
                      className="flex-1 glass-input px-3.5 py-2 text-xs text-slate-100 font-mono-num"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateBusinessProfile(profile);
                        setSavedSuccess(true);
                        setTimeout(() => setSavedSuccess(false), 2500);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-md hover:bg-emerald-400"
                    >
                      Save UPI ID
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Customers can quickly scan or type this UPI ID to pay bills via Google Pay, PhonePe, Paytm, or BHIM.
                  </p>
                </div>
              )}

              {/* Custom Footer & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Custom Bill Footer Message
                  </label>
                  <input
                    type="text"
                    value={profile.pdfFooterText ?? profile.footerNote ?? ''}
                    onChange={(e) => setProfile({ ...profile, pdfFooterText: e.target.value })}
                    placeholder="Thank you! Visit Patil Biryani Again!"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Terms & Conditions Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.pdfTermsNote ?? ''}
                    onChange={(e) => setProfile({ ...profile, pdfTermsNote: e.target.value })}
                    placeholder="Goods once sold will not be returned. Subject to Kolhapur Jurisdiction."
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Save Button Bar */}
              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    updateBusinessProfile(profile);
                    setSavedSuccess(true);
                    setTimeout(() => setSavedSuccess(false), 3000);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  <Save className="h-4 w-4 stroke-[2.5]" />
                  <span>Save All Date & PDF Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABLES MANAGEMENT */}
      {activeSettingsTab === 'tables' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-emerald-400" />
                  <span>Dine-In Tables & Floor Management</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure seating capacity, floor sections, active status & live counter tables
                </p>
              </div>

              <button
                onClick={handleOpenAddTable}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Add New Table</span>
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((tbl) => (
                <div
                  key={tbl.id}
                  className={`glass-card rounded-2xl p-4 border transition-all ${
                    tbl.active
                      ? 'border-white/10 hover:border-emerald-500/30'
                      : 'border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display font-bold text-base text-slate-100">
                        {tbl.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {tbl.section || 'General Hall'} • {tbl.capacity || 4} Seats
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tbl.status === 'Available'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : tbl.status === 'Occupied'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : tbl.status === 'Held'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : tbl.status === 'Billing'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {tbl.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs">
                    <button
                      onClick={() => handleToggleTableActive(tbl)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                        tbl.active
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tbl.active ? 'Active' : 'Inactive'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditTable(tbl)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Edit Table"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                      </button>

                      <button
                        onClick={() =>
                          onConfirmDelete(
                            'Delete Restaurant Table',
                            `Are you sure you want to delete ${tbl.name}?`,
                            () => deleteTable(tbl.id)
                          )
                        }
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                        title="Delete Table"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: LIVE SYNCHRONISATION & MULTI-DEVICE */}
      {activeSettingsTab === 'sync' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
                  <span>Real-Time Web & Multi-Device Synchronisation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seamless live replication between Billing Counter PC, Waiter Mobile Phones, Kitchen Displays & Tablet APKs
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    await sendLiveSyncPing();
                    setSyncImportMsg({ text: '⚡ Live test ping broadcasted to all connected Mobile APK & Desktop instances!', success: true });
                    setTimeout(() => setSyncImportMsg(null), 3500);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span>Test Real-Time Ping</span>
                </button>

                <button
                  onClick={async () => {
                    setIsResyncing(true);
                    await syncAllToCloud();
                    setIsResyncing(false);
                    setSyncImportMsg({ text: 'All local database records successfully pushed to Cloud & Peers!', success: true });
                    setTimeout(() => setSyncImportMsg(null), 3500);
                  }}
                  disabled={isResyncing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
                >
                  <Cloud className="h-4 w-4 text-emerald-400" />
                  <span>Push All State</span>
                </button>

                <button
                  onClick={async () => {
                    setIsResyncing(true);
                    await pullAllFromCloud();
                    forceResyncAllTabs();
                    setTimeout(() => setIsResyncing(false), 600);
                  }}
                  disabled={isResyncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isResyncing ? 'animate-spin' : ''}`} />
                  <span>{isResyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
                </button>
              </div>
            </div>

            {/* Sync Diagnostics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300">Live Channel</span>
                  <Radio className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-lg font-black text-emerald-300 mt-2">Active & Online</div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">Zero-latency Server & Cloud Bus</div>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-cyan-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300">Connected Instances</span>
                  <Laptop className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-lg font-black text-cyan-300 mt-2">{syncState.connectedDevicesCount || syncState.connectedTabsCount} Active Device(s)</div>
                <div className="text-[10px] text-cyan-400/80 mt-0.5">Desktop & Mobile APK linked</div>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300">Debounced Storage</span>
                  <HardDrive className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-lg font-black text-amber-300 mt-2">60ms Idle Buffer</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Zero UI Lag / 60 FPS Flow</div>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-purple-500/30 bg-purple-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300">Last Synced</span>
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-lg font-black text-purple-300 mt-2">
                  {new Date(syncState.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[10px] text-purple-400/80 mt-0.5">Continuous instant updates</div>
              </div>
            </div>

            {/* Cross Device Instant Pair / Copy Bundle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Copy className="h-4 w-4 text-cyan-400" />
                  <span>Generate Multi-Device Instant Pair Bundle</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export complete encrypted state payload to sync with another device, laptop or new tablet without requiring internet cloud setup.
                </p>
                <button
                  onClick={() => {
                    const bundle = generateCrossDeviceSyncBundle();
                    navigator.clipboard.writeText(bundle);
                    setCopiedSyncCode(true);
                    setTimeout(() => setCopiedSyncCode(false), 2500);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-white/10 transition-all"
                >
                  <Copy className="h-4 w-4 text-emerald-400" />
                  <span>{copiedSyncCode ? 'Copied Bundle to Clipboard!' : 'Copy Multi-Device Sync Token'}</span>
                </button>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Import State on This Device</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={syncImportText}
                    onChange={(e) => setSyncImportText(e.target.value)}
                    placeholder="Paste sync token here..."
                    className="flex-1 glass-input px-3 py-2 text-xs text-slate-100"
                  />
                  <button
                    onClick={() => {
                      if (!syncImportText.trim()) return;
                      const res = importDataJSON(syncImportText.trim());
                      if (res) {
                        setSyncImportMsg({ text: 'Sync token applied successfully!', success: true });
                        setSyncImportText('');
                        forceResyncAllTabs();
                      } else {
                        setSyncImportMsg({ text: 'Invalid sync token format', success: false });
                      }
                      setTimeout(() => setSyncImportMsg(null), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 shrink-0"
                  >
                    Apply Sync
                  </button>
                </div>
                {syncImportMsg && (
                  <div className={`text-xs font-semibold ${syncImportMsg.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {syncImportMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LOCAL DEVICE FOLDER BACKUP */}
      {activeSettingsTab === 'local-folder' && (
        <LocalFolderBackupPanel onConfirmAction={onConfirmDelete} />
      )}

      {/* TAB 3: DATA BACKUP & RESTORE */}
      {activeSettingsTab === 'backup' && (
        <div className="space-y-6">
          {/* Local Device Folder Backup Panel */}
          <LocalFolderBackupPanel onConfirmAction={onConfirmDelete} />

          {/* Google Drive Automatic Hourly Backup Panel */}
          <GoogleDriveBackupPanel onConfirmAction={onConfirmDelete} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-400" />
                  <span>Database Snapshot & JSON Backup</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Offline Capable</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                All Patil Biryani customer transactions, plate sales, invoices, raw materials purchases, staff attendance, advances and table records are saved persistently. You can download an offline JSON backup or restore from a previous file.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Invoices:</span>
                  <span className="font-mono-num font-bold text-slate-100 text-sm">{invoices.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Plate Sales:</span>
                  <span className="font-mono-num font-bold text-slate-100 text-sm">{plateWiseSales.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Expenses:</span>
                  <span className="font-mono-num font-bold text-slate-100 text-sm">{expenses.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Purchases:</span>
                  <span className="font-mono-num font-bold text-slate-100 text-sm">{purchases.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Menu Dishes:</span>
                  <span className="font-mono-num font-bold text-slate-100 text-sm">{products.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Staff Employees:</span>
                  <span className="font-mono-num font-bold text-slate-100 text-sm">{staffEmployees.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={exportAllDataJSON}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all"
                >
                  <Download className="h-4 w-4 stroke-[2.5]" />
                  <span>Download Complete Backup JSON</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-colors"
                >
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span>Restore from JSON File</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-3xl p-6 border border-rose-500/20 bg-rose-950/10 space-y-4">
              <h3 className="font-display font-bold text-base text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span>Reset & Demo Dataset</span>
              </h3>
              <p className="text-xs text-slate-400">
                Reload fresh initial data for Patil Biryani with sample menu, kitchen items, staff and billing.
              </p>

              <button
                onClick={() =>
                  onConfirmDelete(
                    'Reload Default Dataset',
                    'Reset system to default Patil Biryani transactions, stock items, staff and sales figures?',
                    () => resetToDefaultData()
                  )
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Default Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MOBILE APK & PWA */}
      {activeSettingsTab === 'mobile' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div>
                <h3 className="font-display font-bold text-lg text-emerald-400 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                  <span>Patil Biryani Android POS & PWA Installation</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Optimized for Android smartphones, tablets & Sunmi/iMin handheld POS devices
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Release v4.5.0 Ultra APK
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-display font-bold text-sm text-slate-200">
                  Android APK Direct Download
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Download the standalone Android APK installer package to install on mobile devices without Google Play Store.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleQuickDownloadApk}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                  >
                    <Download className="h-4 w-4 stroke-[3]" />
                    <span>Download PatilBiryani-POS-v4.5.apk</span>
                  </button>

                  <button
                    onClick={() => setIsApkModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-colors"
                  >
                    <QrCode className="h-4 w-4 text-cyan-400" />
                    <span>Scan QR Code on Phone</span>
                  </button>
                </div>

                {apkDownloaded && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>PatilBiryani-POS-v2.4.apk downloaded to your device!</span>
                  </div>
                )}
              </div>

              {/* PWA / Chrome Quick Add */}
              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3 bg-slate-950/40">
                <h4 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Instant Progressive Web App (PWA)</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Open this link in Google Chrome on your Android or iPad, tap <strong className="text-slate-200">Three Dots Menu (⋮) → "Add to Home screen"</strong> or <strong className="text-slate-200">"Install App"</strong> for instant full-screen app experience.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span>Works 100% Offline & Automatically Syncs</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="glass-panel-elevated w-full max-w-md rounded-3xl p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-emerald-400" />
                <span>{editingTableId ? 'Edit Restaurant Table' : 'Add New Restaurant Table'}</span>
              </h3>
              <button
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTable} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Table Name / Label *
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-bold"
                  placeholder="e.g. Table 1, AC-01, Family Table 4"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Floor Section
                  </label>
                  <CustomSelect
                    value={tableSection}
                    onChange={(val) => setTableSection(val)}
                    options={[
                      { value: 'Ground Floor', label: 'Ground Floor' },
                      { value: 'AC Hall', label: 'AC Hall' },
                      { value: 'Family Section', label: 'Family Section' },
                      { value: 'Garden / Outdoor', label: 'Garden / Outdoor' },
                      { value: 'First Floor', label: 'First Floor' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Initial Status
                </label>
                <CustomSelect
                  value={tableStatusState}
                  onChange={(val) => setTableStatusState(val as RestaurantTable['status'])}
                  options={[
                    { value: 'Available', label: 'Available', badge: 'Green', badgeColor: 'emerald' },
                    { value: 'Occupied', label: 'Occupied', badge: 'Amber', badgeColor: 'amber' },
                    { value: 'Held', label: 'Held', badge: 'Purple', badgeColor: 'purple' },
                    { value: 'Billing', label: 'Billing', badge: 'Cyan', badgeColor: 'blue' },
                    { value: 'Paid', label: 'Paid', badge: 'Blue', badgeColor: 'blue' },
                  ]}
                  size="sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tableActiveCheck"
                  checked={tableActive}
                  onChange={(e) => setTableActive(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-900 border-white/20 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="tableActiveCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Table is active and visible in POS Billing
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  {editingTableId ? 'Save Table Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APK & Mobile POS Download Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        businessName={profile.name || 'PATIL BIRYANI'}
      />
    </div>
  );
};
