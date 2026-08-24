import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  Wallet,
  Coins,
  Calendar,
  Filter,
  Eye,
  Trash2,
  FileText,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatNumberIN, formatDateDisplay, getTodayDateString } from '../utils/formatters';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { NavTabId } from '../components/Navbar';
import { DataViewSkeleton } from '../components/ui/Skeleton';

interface DailySalesViewProps {
  onNavigate: (tab: NavTabId) => void;
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
}

const STORAGE_KEY = 'patil_biryani_v1_daily_sales_filter_draft';

export const DailySalesView: React.FC<DailySalesViewProps> = ({
  onNavigate,
  onOpenPdfExport,
  onOpenExcelExport,
}) => {
  const {
    activeDateFilter,
    setActiveDateFilter,
    isDateInActiveFilter,
    plateWiseSales,
    invoices,
    expenses,
    deleteInvoice,
    deletePlateWiseSale,
    isLoading,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '';
      }
    } catch (e) {
      console.error('Failed to parse daily sales draft from localStorage', e);
    }
    return '';
  });

  const [hasSavedDraft, setHasSavedDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return !!saved;
    } catch {
      return false;
    }
  });

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'invoice' | 'plate' } | null>(null);

  // Auto-save search input and filters to localStorage
  useEffect(() => {
    try {
      if (searchQuery.trim()) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            searchQuery: searchQuery.trim(),
            savedAt: new Date().toISOString(),
          })
        );
        setHasSavedDraft(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setHasSavedDraft(false);
      }
    } catch (e) {
      console.error('Failed to auto-save daily sales draft', e);
    }
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasSavedDraft(false);
    } catch {}
  };

  // Filtered plate sales and invoices
  const filteredPlateSales = useMemo(
    () => plateWiseSales.filter((p) => isDateInActiveFilter(p.date)),
    [plateWiseSales, isDateInActiveFilter]
  );

  const filteredInvoices = useMemo(
    () => invoices.filter((i) => isDateInActiveFilter(i.date)),
    [invoices, isDateInActiveFilter]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isDateInActiveFilter(e.date)),
    [expenses, isDateInActiveFilter]
  );

  // Overall Financial Aggregates (#7)
  const totalSales = useMemo(() => {
    const pws = filteredPlateSales.reduce((s, p) => s + p.grandTotal, 0);
    if (pws > 0) return pws;
    return filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);
  }, [filteredPlateSales, filteredInvoices]);

  const totalPlates = useMemo(() => {
    const pwsPlates = filteredPlateSales.reduce((s, p) => s + p.totalPlates, 0);
    if (pwsPlates > 0) return pwsPlates;
    return filteredInvoices.reduce(
      (sum, i) => sum + i.items.reduce((s, item) => s + item.quantity, 0),
      0
    );
  }, [filteredPlateSales, filteredInvoices]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const netProfit = totalSales - totalExpenses;

  // Payment Mode Breakdown
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let bank = 0;
    let card = 0;
    let credit = 0;

    if (filteredPlateSales.length > 0) {
      filteredPlateSales.forEach((pws) => {
        cash += pws.cashSales || 0;
        upi += pws.upiSales || 0;
        bank += pws.bankSales || 0;
        card += pws.cardSales || 0;
        credit += pws.creditSales || 0;
      });
    } else {
      filteredInvoices.forEach((inv) => {
        if (inv.paymentMode === 'Cash') cash += inv.amountPaid || inv.grandTotal;
        else if (inv.paymentMode === 'UPI') upi += inv.amountPaid || inv.grandTotal;
        else if (inv.paymentMode === 'Bank') bank += inv.amountPaid || inv.grandTotal;
        else if (inv.paymentMode === 'Card') card += inv.amountPaid || inv.grandTotal;
        else if (inv.paymentMode === 'Credit') credit += inv.balanceDue || inv.grandTotal;
      });
    }

    return { cash, upi, bank, card, credit };
  }, [filteredPlateSales, filteredInvoices]);

  // Combined searchable transactions
  const combinedTransactions = useMemo(() => {
    const list: {
      id: string;
      rawId: string;
      type: 'invoice' | 'plate';
      title: string;
      date: string;
      subtitle: string;
      amount: number;
      paymentMode: string;
      status: string;
    }[] = [];

    filteredInvoices.forEach((inv) => {
      list.push({
        id: inv.invoiceNumber,
        rawId: inv.id,
        type: 'invoice',
        title: `Bill ${inv.invoiceNumber} • ${inv.customerName}`,
        date: inv.date,
        subtitle: `${inv.tableNumber} • ${inv.orderType} • ${inv.items.length} items`,
        amount: inv.grandTotal,
        paymentMode: inv.paymentMode,
        status: inv.paymentStatus,
      });
    });

    filteredPlateSales.forEach((pws) => {
      list.push({
        id: `PWS-${pws.date}`,
        rawId: pws.id,
        type: 'plate',
        title: `Daily Plate Sales Summary (${formatDateDisplay(pws.date)})`,
        date: pws.date,
        subtitle: `${pws.totalPlates} Plates Sold • ${pws.items.filter((i) => i.quantity > 0).length} Dishes`,
        amount: pws.grandTotal,
        paymentMode: 'Multi-channel',
        status: 'Reconciled',
      });
    });

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.paymentMode.toLowerCase().includes(q) ||
        item.date.includes(q)
    );
  }, [filteredInvoices, filteredPlateSales, searchQuery]);

  const handleExportPDF = () => {
    const rows = combinedTransactions.map((tx) => ({
      transactionId: tx.id,
      date: formatDateDisplay(tx.date),
      product: tx.title,
      category: tx.type === 'invoice' ? 'Restaurant Bill' : 'Daily Dum Summary',
      quantity: '-',
      amount: formatINR(tx.amount),
      paymentMode: tx.paymentMode,
    }));

    onOpenPdfExport(
      `Patil Biryani - Daily Sales Summary (${activeDateFilter})`,
      rows,
      {
        'Total Sales': formatINR(totalSales),
        'Total Expenses': formatINR(totalExpenses),
        'Net Profit': formatINR(netProfit),
        'Plates Sold': formatNumberIN(totalPlates),
      }
    );
  };

  const handleExportExcel = () => {
    const rows = combinedTransactions.map((tx) => ({
      transactionId: tx.id,
      date: tx.date,
      product: tx.title,
      category: tx.type === 'invoice' ? 'POS Bill' : 'Plate Summary',
      quantity: 1,
      amount: tx.amount,
      paymentMode: tx.paymentMode,
    }));

    onOpenExcelExport(`Sales_Summary_${activeDateFilter}`, rows);
  };

  if (isLoading) {
    return (
      <DataViewSkeleton
        title="Consolidated Daily Sales"
        subtitle="Aggregating real-time POS bills and daily plate sales..."
        metricCount={4}
        columns={6}
        rows={6}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Consolidated Revenue Ledger</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Daily Sales Summary
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track daily sales, payment collections, cash/UPI splits, and individual restaurant checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('invoices')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/25 hover:scale-105 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New POS Bill</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-emerald-300"
          >
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-teal-300"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS (#7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-card rounded-2xl p-4 border-emerald-500/30">
          <span className="text-[11px] font-semibold text-slate-400">Total Sales</span>
          <div className="font-mono-num text-xl font-black text-emerald-400 mt-1">
            {formatINR(totalSales)}
          </div>
          <span className="text-[10px] text-slate-500">Gross revenue</span>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400">Total Plates Sold</span>
          <div className="font-mono-num text-xl font-extrabold text-amber-300 mt-1">
            {formatNumberIN(totalPlates)} <span className="text-xs font-normal">units</span>
          </div>
          <span className="text-[10px] text-slate-500">Dum Biryani & Dishes</span>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400">Total Expenses</span>
          <div className="font-mono-num text-xl font-extrabold text-rose-300 mt-1">
            {formatINR(totalExpenses)}
          </div>
          <span className="text-[10px] text-slate-500">Outflow period</span>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400">Net Profit</span>
          <div className={`font-mono-num text-xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatINR(netProfit)}
          </div>
          <span className="text-[10px] text-slate-500">Sales minus expenses</span>
        </div>

        <div className="glass-card rounded-2xl p-4 bg-emerald-950/30 border-emerald-500/30 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-emerald-300">UPI + Cash Split</span>
          <div className="font-mono-num text-sm font-bold text-slate-200 mt-1">
            UPI: {formatINR(paymentBreakdown.upi)}
          </div>
          <div className="font-mono-num text-xs text-slate-400 mt-0.5">
            Cash: {formatINR(paymentBreakdown.cash)}
          </div>
        </div>
      </div>

      {/* Payment Channel Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-semibold text-slate-400">Cash Collections</div>
          <div className="font-mono-num text-base font-bold text-slate-200 mt-1">
            {formatINR(paymentBreakdown.cash)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-semibold text-slate-400">UPI / QR Collections</div>
          <div className="font-mono-num text-base font-bold text-emerald-400 mt-1">
            {formatINR(paymentBreakdown.upi)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-semibold text-slate-400">Bank / NEFT</div>
          <div className="font-mono-num text-base font-bold text-blue-300 mt-1">
            {formatINR(paymentBreakdown.bank)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-semibold text-slate-400">Card POS Machine</div>
          <div className="font-mono-num text-base font-bold text-purple-300 mt-1">
            {formatINR(paymentBreakdown.card)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-semibold text-slate-400">Customer Credit Sales</div>
          <div className="font-mono-num text-base font-bold text-rose-400 mt-1">
            {formatINR(paymentBreakdown.credit)}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" />
              <span>Sales Activity Log ({combinedTransactions.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual customer bills and daily plate sales summaries
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {hasSavedDraft && searchQuery && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Auto-saved</span>
              </span>
            )}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, bill no, payment..."
                className="glass-input rounded-xl pl-3 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title="Clear search draft"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {combinedTransactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No sales records found for this period. Click 'New POS Bill' or 'Plate Sales' to record sales.
            </div>
          ) : (
            combinedTransactions.map((tx) => (
              <div
                key={`${tx.type}-${tx.rawId}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/90 transition-all gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      tx.type === 'invoice'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {tx.type === 'invoice' ? (
                      <Receipt className="h-5 w-5" />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-xs sm:text-sm">{tx.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          tx.status === 'Paid' || tx.status === 'Reconciled'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {tx.subtitle} • {formatDateDisplay(tx.date)} • Mode: {tx.paymentMode}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="font-mono-num text-base font-extrabold text-emerald-400">
                    {formatINR(tx.amount)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tx.type === 'invoice' ? (
                      <button
                        onClick={() => onNavigate('invoices')}
                        className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-emerald-300 hover:bg-slate-700 transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('plate-sales')}
                        className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-emerald-300 hover:bg-slate-700 transition-colors"
                        title="Edit Plate Sales"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteTarget({ id: tx.rawId, type: tx.type })}
                      className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Transaction Record?"
        message="Are you sure you want to delete this sales transaction? All financial figures, reports, and receivables will automatically recalculate."
        onConfirm={() => {
          if (deleteTarget) {
            if (deleteTarget.type === 'invoice') deleteInvoice(deleteTarget.id);
            else deletePlateWiseSale(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
