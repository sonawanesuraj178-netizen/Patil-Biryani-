import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { GoogleDriveProvider } from './context/GoogleDriveContext';
import { LocalFolderProvider } from './context/LocalFolderContext';
import { AppNotificationProvider } from './context/AppNotificationContext';
import { Navbar, NavTabId } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { DailySalesView } from './views/DailySalesView';
import { PlateWiseSalesView } from './views/PlateWiseSalesView';
import { InvoicesView } from './views/InvoicesView';
import { ExpensesView } from './views/ExpensesView';
import { PurchasesView } from './views/PurchasesView';
import { ReceivablesView } from './views/ReceivablesView';
import { PayablesView } from './views/PayablesView';
import { MoneyPositionView } from './views/MoneyPositionView';
import { StaffView } from './views/StaffView';
import { ReportsView } from './views/ReportsView';
import { MenuView } from './views/MenuView';
import { VendorsView } from './views/VendorsView';
import { CustomersView } from './views/CustomersView';
import { DailyClosingView } from './views/DailyClosingView';
import { SettingsView } from './views/SettingsView';
import { KitchenDisplayView } from './views/KitchenDisplayView';

import { QuickAddModal, QuickActionType } from './components/QuickAddModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CustomPdfExportModal } from './components/CustomPdfExportModal';
import { CustomExcelExportModal } from './components/CustomExcelExportModal';
import { SyncStatusModal } from './components/SyncStatusModal';
import { AutoUpdateBanner } from './components/AutoUpdateBanner';
import { ExportRowData } from './utils/exportUtils';

function MainAppContent() {
  const { businessProfile, activeDateFilter } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');

  // Global Modals State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // PDF Export Modal State
  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    reportTitle: string;
    rows: ExportRowData[];
    totals?: Record<string, number | string>;
  }>({
    isOpen: false,
    reportTitle: 'Patil Biryani Financial Report',
    rows: [],
  });

  // Excel Export Modal State
  const [excelModal, setExcelModal] = useState<{
    isOpen: boolean;
    reportTitle: string;
    rows: ExportRowData[];
  }>({
    isOpen: false,
    reportTitle: 'Patil Biryani Export',
    rows: [],
  });

  // Helper trigger to open PDF modal from any view
  const handleOpenPdfExport = (
    reportTitle: string,
    rows: any[],
    totals?: Record<string, number | string>
  ) => {
    setPdfModal({
      isOpen: true,
      reportTitle,
      rows,
      totals,
    });
  };

  // Helper trigger to open Excel modal from any view
  const handleOpenExcelExport = (reportTitle: string, rows: any[]) => {
    setExcelModal({
      isOpen: true,
      reportTitle,
      rows,
    });
  };

  // Helper trigger for global confirm delete
  const handleConfirmDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Handle Quick Action Center triggers
  const handleSelectQuickAction = (action: QuickActionType) => {
    switch (action) {
      case 'plate-sale':
        setCurrentTab('plate-sales');
        break;
      case 'invoice':
        setCurrentTab('invoices');
        break;
      case 'expense':
        setCurrentTab('expenses');
        break;
      case 'purchase':
        setCurrentTab('purchases');
        break;
      case 'customer-payment':
        setCurrentTab('receivables');
        break;
      case 'supplier-payment':
        setCurrentTab('payables');
        break;
      case 'staff-advance':
      case 'staff-attendance':
        setCurrentTab('staff');
        break;
      case 'new-product':
        setCurrentTab('menu');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar & Secondary Module Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20 lg:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
          />
        )}

        {currentTab === 'sales' && (
          <DailySalesView
            onNavigate={setCurrentTab}
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
          />
        )}

        {currentTab === 'plate-sales' && (
          <PlateWiseSalesView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoicesView
            onNavigate={setCurrentTab}
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'kitchen' && (
          <KitchenDisplayView onNavigateToPOS={() => setCurrentTab('invoices')} />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'purchases' && (
          <PurchasesView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'receivables' && (
          <ReceivablesView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'payables' && (
          <PayablesView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'money-position' && (
          <MoneyPositionView
            onNavigate={setCurrentTab}
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'staff' && (
          <StaffView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
          />
        )}

        {currentTab === 'menu' && (
          <MenuView onConfirmDelete={handleConfirmDelete} />
        )}

        {currentTab === 'vendors' && (
          <VendorsView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
            onConfirmDelete={handleConfirmDelete}
          />
        )}

        {currentTab === 'closing' && (
          <DailyClosingView
            onOpenPdfExport={handleOpenPdfExport}
            onOpenExcelExport={handleOpenExcelExport}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView onConfirmDelete={handleConfirmDelete} />
        )}
      </main>

      {/* Global Quick Add Action Center */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />

      {/* Global Search Dialog (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentTab}
      />

      {/* Global Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Custom PDF Export Modal */}
      <CustomPdfExportModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
        reportTitle={pdfModal.reportTitle}
        dateRangeText={activeDateFilter}
        defaultRows={pdfModal.rows}
        businessProfile={businessProfile}
        summaryTotals={pdfModal.totals}
      />

      {/* Custom Excel Export Modal */}
      <CustomExcelExportModal
        isOpen={excelModal.isOpen}
        onClose={() => setExcelModal((prev) => ({ ...prev, isOpen: false }))}
        reportTitle={excelModal.reportTitle}
        dateRangeText={activeDateFilter}
        defaultRows={excelModal.rows}
        businessProfile={businessProfile}
      />

      {/* Live Web & App Synchronisation Hub */}
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Auto-Update Detector Banner for Installed PWAs & Mobile Apps */}
      <AutoUpdateBanner />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <GoogleDriveProvider>
        <LocalFolderProvider>
          <AppNotificationProvider>
            <MainAppContent />
          </AppNotificationProvider>
        </LocalFolderProvider>
      </GoogleDriveProvider>
    </AppProvider>
  );
}
