import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  UtensilsCrossed,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  Award,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Calculator,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  Search,
  Filter,
  Sliders,
  Check,
  Save,
  Info,
  Landmark,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
  getYesterdayDateString,
} from '../utils/formatters';
import { DateFilterType } from '../types';
import { NavTabId } from '../components/Navbar';

interface DashboardViewProps {
  onNavigate: (tab: NavTabId) => void;
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenPdfExport,
  onOpenExcelExport,
}) => {
  const {
    businessProfile,
    updateBusinessProfile,
    activeDateFilter,
    setActiveDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isDateInActiveFilter,
    plateWiseSales,
    invoices,
    expenses,
    purchases,
    receivables,
    payables,
    staffEmployees,
    staffAttendance,
    staffAdvances,
    salaryCalculations,
    moneyPosition,
    outstandingSummary,
  } = useApp();

  const todayStr = getTodayDateString();

  // State for Available Money Calculation Modal
  const [showMoneyCalcModal, setShowMoneyCalcModal] = useState(false);
  const [moneyModalTab, setMoneyModalTab] = useState<'breakdown' | 'audit' | 'settings'>('breakdown');
  const [auditSearchText, setAuditSearchText] = useState('');
  const [auditModeFilter, setAuditModeFilter] = useState<'All' | 'Cash' | 'UPI' | 'Bank' | 'Card'>('All');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'All' | 'Inflow' | 'Outflow'>('All');

  // Local state for editing opening balances
  const [tempOpeningCash, setTempOpeningCash] = useState<number>(businessProfile.openingBalanceCash ?? 5000);
  const [tempOpeningBank, setTempOpeningBank] = useState<number>(businessProfile.openingBalanceBank ?? 25000);
  const [tempOpeningUPI, setTempOpeningUPI] = useState<number>(businessProfile.openingBalanceUPI ?? 5000);
  const [tempOpeningCard, setTempOpeningCard] = useState<number>(businessProfile.openingBalanceCard ?? 0);
  const [openingSavedSuccess, setOpeningSavedSuccess] = useState(false);

  useEffect(() => {
    setTempOpeningCash(businessProfile.openingBalanceCash ?? 5000);
    setTempOpeningBank(businessProfile.openingBalanceBank ?? 25000);
    setTempOpeningUPI(businessProfile.openingBalanceUPI ?? 5000);
    setTempOpeningCard(businessProfile.openingBalanceCard ?? 0);
  }, [businessProfile]);

  const handleSaveOpeningBalances = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      ...businessProfile,
      openingBalanceCash: tempOpeningCash,
      openingBalanceBank: tempOpeningBank,
      openingBalanceUPI: tempOpeningUPI,
      openingBalanceCard: tempOpeningCard,
    });
    setOpeningSavedSuccess(true);
    setTimeout(() => {
      setOpeningSavedSuccess(false);
    }, 2500);
  };

  // Filtered audit transactions for the audit tab
  const filteredAuditList = useMemo(() => {
    return (moneyPosition.auditTransactions || []).filter((item) => {
      if (auditModeFilter !== 'All' && item.paymentMode !== auditModeFilter) return false;
      if (auditTypeFilter !== 'All' && item.type !== auditTypeFilter) return false;
      if (auditSearchText.trim()) {
        const query = auditSearchText.toLowerCase();
        const matchTitle = item.entityOrTitle?.toLowerCase().includes(query);
        const matchRef = item.reference?.toLowerCase().includes(query);
        const matchSrc = item.source?.toLowerCase().includes(query);
        if (!matchTitle && !matchRef && !matchSrc) return false;
      }
      return true;
    });
  }, [moneyPosition.auditTransactions, auditModeFilter, auditTypeFilter, auditSearchText]);

  // Filtered dataset for active period
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

  const filteredPurchases = useMemo(
    () => purchases.filter((p) => isDateInActiveFilter(p.date)),
    [purchases, isDateInActiveFilter]
  );

  // Business Performance Figures for active period
  const totalSales = useMemo(() => {
    const pwsTotal = filteredPlateSales.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    if (pwsTotal > 0) return pwsTotal;
    return filteredInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  }, [filteredPlateSales, filteredInvoices]);

  const totalPlatesSold = useMemo(() => {
    const pwsPlates = filteredPlateSales.reduce((sum, p) => sum + (p.totalPlates || 0), 0);
    if (pwsPlates > 0) return pwsPlates;
    return filteredInvoices.reduce(
      (sum, i) => sum + i.items.reduce((s, item) => s + (item.quantity || 0), 0),
      0
    );
  }, [filteredPlateSales, filteredInvoices]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalPurchases = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [filteredPurchases]);

  // Net Profit = Sales - Direct Expenses
  const netProfit = totalSales - totalExpenses;
  const profitMarginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';

  // Staff Stats Today
  const todayAttendance = useMemo(() => {
    return staffAttendance.filter((a) => a.date === todayStr);
  }, [staffAttendance, todayStr]);

  const staffStats = useMemo(() => {
    const present = todayAttendance.filter((a) => a.status === 'Present').length;
    const halfDay = todayAttendance.filter((a) => a.status === 'Half Day').length;
    const leave = todayAttendance.filter((a) => a.status === 'Leave').length;
    const absent = todayAttendance.filter((a) => a.status === 'Absent').length;
    const weeklyOff = todayAttendance.filter((a) => a.status === 'Weekly Off').length;

    const activeStaff = staffEmployees.filter((s) => s.status === 'Active');
    const todayCost = activeStaff.reduce((sum, emp) => {
      if (emp.salaryType === 'Daily') return sum + emp.basicSalary;
      return sum + Math.round(emp.basicSalary / 30);
    }, 0);

    return {
      totalStaff: activeStaff.length,
      present,
      halfDay,
      leave,
      absent,
      weeklyOff,
      todayCost,
    };
  }, [todayAttendance, staffEmployees]);

  // Top Selling Products & Category Breakdown
  const productSalesMap = useMemo(() => {
    const map = new Map<string, { name: string; category: string; qty: number; revenue: number }>();

    filteredPlateSales.forEach((pws) => {
      pws.items.forEach((item) => {
        const existing = map.get(item.productName) || {
          name: item.productName,
          category: item.categoryName,
          qty: 0,
          revenue: 0,
        };
        existing.qty += item.quantity || 0;
        existing.revenue += item.amount || 0;
        map.set(item.productName, existing);
      });
    });

    if (map.size === 0) {
      filteredInvoices.forEach((inv) => {
        inv.items.forEach((item) => {
          const existing = map.get(item.productName) || {
            name: item.productName,
            category: item.categoryName || 'General',
            qty: 0,
            revenue: 0,
          };
          existing.qty += item.quantity || 0;
          existing.revenue += item.amount || 0;
          map.set(item.productName, existing);
        });
      });
    }

    const list = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    return list;
  }, [filteredPlateSales, filteredInvoices]);

  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, number>();
    productSalesMap.forEach((p) => {
      const current = catMap.get(p.category) || 0;
      catMap.set(p.category, current + p.revenue);
    });
    return Array.from(catMap.entries()).map(([cat, rev]) => ({
      category: cat,
      revenue: rev,
      percentage: totalSales > 0 ? ((rev / totalSales) * 100).toFixed(1) : '0',
    }));
  }, [productSalesMap, totalSales]);

  // Critical Alerts
  const alerts = useMemo(() => {
    const list: { type: 'danger' | 'warning' | 'info'; title: string; desc: string; tab: NavTabId }[] = [];

    const overdueRecs = receivables.filter((r) => r.status === 'Overdue');
    if (overdueRecs.length > 0) {
      const totalOverdue = overdueRecs.reduce((s, r) => s + r.balance, 0);
      list.push({
        type: 'danger',
        title: `${overdueRecs.length} Overdue Customer Receivables`,
        desc: `${formatINR(totalOverdue)} total overdue payment from ${overdueRecs.map((r) => r.customerName).slice(0, 2).join(', ')}`,
        tab: 'receivables',
      });
    }

    const overduePays = payables.filter((p) => p.status === 'Overdue');
    if (overduePays.length > 0) {
      const totalOverduePay = overduePays.reduce((s, p) => s + p.balance, 0);
      list.push({
        type: 'warning',
        title: `${overduePays.length} Overdue Supplier & Staff Payables`,
        desc: `${formatINR(totalOverduePay)} due to ${overduePays.map((p) => p.entityName).slice(0, 2).join(', ')}`,
        tab: 'payables',
      });
    }

    const pendingAdvances = staffAdvances.filter((a) => a.recoveryStatus === 'Pending');
    if (pendingAdvances.length > 0) {
      const totalAdv = pendingAdvances.reduce((s, a) => s + (a.amount - (a.recoveredAmount || 0)), 0);
      list.push({
        type: 'info',
        title: `${pendingAdvances.length} Unrecovered Staff Advances`,
        desc: `${formatINR(totalAdv)} total advances to be adjusted in upcoming salary slips`,
        tab: 'staff',
      });
    }

    return list;
  }, [receivables, payables, staffAdvances]);

  const dateFilterTabs: DateFilterType[] = [
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'Previous Month',
    'Custom Date',
  ];

  // Export handlers
  const handleExportPDF = () => {
    const rows = productSalesMap.map((p, idx) => ({
      transactionId: `P-${idx + 1}`,
      date: activeDateFilter,
      product: p.name,
      category: p.category,
      quantity: p.qty,
      amount: formatINR(p.revenue),
      paymentMode: 'Consolidated',
    }));

    onOpenPdfExport(
      `Patil Biryani - Business Overview (${activeDateFilter})`,
      rows,
      {
        'Total Sales': formatINR(totalSales),
        'Total Expenses': formatINR(totalExpenses),
        'Net Profit': formatINR(netProfit),
        'Plates Sold': formatNumberIN(totalPlatesSold),
      }
    );
  };

  const handleExportExcel = () => {
    const rows = productSalesMap.map((p, idx) => ({
      transactionId: `P-${idx + 1}`,
      date: activeDateFilter,
      product: p.name,
      category: p.category,
      quantity: p.qty,
      amount: p.revenue,
      paymentMode: 'Consolidated',
    }));

    onOpenExcelExport(`Business_Performance_${activeDateFilter}`, rows);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner Greeting Section */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Patil Biryani Financial Command</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 mt-1 tracking-tight">
              WELCOME BACK, SURAJ
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Live business operations, dum plate sales, receivables, kitchen payables, and money balance.
            </p>
          </div>

          {/* Period Filter Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-1.5">
              {dateFilterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDateFilter(tab)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeDateFilter === tab
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
                title="Export PDF Report"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:text-teal-300 transition-colors"
                title="Export Excel Sheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers if selected */}
        {activeDateFilter === 'Custom Date' && (
          <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 font-medium">Select Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="glass-input rounded-xl px-3 py-1 text-xs text-slate-100"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="glass-input rounded-xl px-3 py-1 text-xs text-slate-100"
            />
          </div>
        )}
      </div>

      {/* SECTION 1: TODAY'S / PERIOD BUSINESS METRICS (CLICKABLE WITH DRILLDOWN) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Business Performance ({activeDateFilter})</span>
          </h2>
          <span className="text-xs text-slate-400">Click any card to view detailed transaction ledger</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <div
            onClick={() => onNavigate('plate-sales')}
            className="glass-card rounded-2xl p-5 relative overflow-hidden border-emerald-500/20 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Sales</span>
              <span className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="font-mono-num text-2xl font-extrabold text-slate-100 mt-2">
              {formatINR(totalSales)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Gross food & drinks</span>
              <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>View Plates</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Total Expenses */}
          <div
            onClick={() => onNavigate('expenses')}
            className="glass-card rounded-2xl p-5 relative overflow-hidden border-rose-500/20 hover:border-rose-500/50 hover:bg-slate-850 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Expenses</span>
              <span className="rounded-lg bg-rose-500/20 p-2 text-rose-400 group-hover:scale-110 transition-transform">
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <div className="font-mono-num text-2xl font-extrabold text-rose-300 mt-2">
              {formatINR(totalExpenses)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Raw materials, gas & rent</span>
              <span className="text-rose-400 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>Details</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Net Profit */}
          <div
            onClick={() => onNavigate('reports')}
            className="glass-card rounded-2xl p-5 relative overflow-hidden border-teal-500/25 hover:border-teal-500/50 hover:bg-slate-850 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Net Profit</span>
              <span className="rounded-lg bg-teal-500/20 p-2 text-teal-400 group-hover:scale-110 transition-transform">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className={`font-mono-num text-2xl font-extrabold mt-2 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatINR(netProfit)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Margin: {profitMarginPercent}%</span>
              <span className="text-teal-400 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>P&L Statement</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Total Plates Sold */}
          <div
            onClick={() => onNavigate('plate-sales')}
            className="glass-card rounded-2xl p-5 relative overflow-hidden border-amber-500/20 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Plates & Units Sold</span>
              <span className="rounded-lg bg-amber-500/20 p-2 text-amber-400 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
            </div>
            <div className="font-mono-num text-2xl font-extrabold text-amber-300 mt-2">
              {formatNumberIN(totalPlatesSold)} <span className="text-sm font-normal text-slate-400">plates</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Biryani & Food Dishes</span>
              <span className="text-amber-400 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>Breakdown</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MONEY POSITION (CLICKABLE WITH FORMULA BREAKDOWN) & OUTSTANDING BALANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Money Position Box - Clickable with Detailed Calculation Dialog */}
        <div
          onClick={() => {
            setMoneyModalTab('breakdown');
            setShowMoneyCalcModal(true);
          }}
          className="rounded-3xl p-6 lg:col-span-2 cursor-pointer bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-500/70 transition-all hover:shadow-2xl hover:shadow-emerald-500/15 group relative overflow-hidden"
        >
          {/* Subtle Ambient Accent Background */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                    <Wallet className={`h-5 w-5 ${moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span>Available Money Position</span>
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                    moneyPosition.totalAvailableBalance < 0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {moneyPosition.totalAvailableBalance < 0 ? 'Net Deficit (Negative Balance)' : '100% Reconciled Surplus'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Liquid cash in counter drawer + Bank + UPI + Card receipts (Excludes pending dues)
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Liquid Money
                </span>
                <span className={`font-mono-num text-2xl font-black transition-colors ${
                  moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatINR(moneyPosition.totalAvailableBalance)}
                </span>
              </div>
            </div>

            {/* 4 Supported Channel Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className={`rounded-2xl border bg-slate-950/70 p-3.5 transition-colors ${
                moneyPosition.cashBalance < 0
                  ? 'border-rose-500/40 hover:border-rose-400'
                  : 'border-slate-800/90 group-hover:border-emerald-500/40'
              }`}>
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Cash in Hand</span>
                  <Banknote className={`h-3.5 w-3.5 ${moneyPosition.cashBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                </div>
                <div className={`font-mono-num text-base font-bold mt-1 ${
                  moneyPosition.cashBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatINR(moneyPosition.cashBalance)}
                </div>
                <div className={`text-[10px] mt-1 flex items-center justify-between ${
                  moneyPosition.cashBalance < 0 ? 'text-rose-400/90' : 'text-emerald-400/90'
                }`}>
                  <span>Counter Drawer</span>
                  <span className="font-mono-num text-[9px] text-slate-400">Base: {formatINR(moneyPosition.openingCash)}</span>
                </div>
              </div>

              <div className={`rounded-2xl border bg-slate-950/70 p-3.5 transition-colors ${
                moneyPosition.bankBalance < 0
                  ? 'border-rose-500/40 hover:border-rose-400'
                  : 'border-slate-800/90 group-hover:border-blue-500/40'
              }`}>
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Bank Balance</span>
                  <Building2 className={`h-3.5 w-3.5 ${moneyPosition.bankBalance < 0 ? 'text-rose-400' : 'text-blue-400'}`} />
                </div>
                <div className={`font-mono-num text-base font-bold mt-1 ${
                  moneyPosition.bankBalance < 0 ? 'text-rose-400' : 'text-blue-400'
                }`}>
                  {formatINR(moneyPosition.bankBalance)}
                </div>
                <div className={`text-[10px] mt-1 flex items-center justify-between ${
                  moneyPosition.bankBalance < 0 ? 'text-rose-400/90' : 'text-blue-400/90'
                }`}>
                  <span>Current Account</span>
                  <span className="font-mono-num text-[9px] text-slate-400">Base: {formatINR(moneyPosition.openingBank)}</span>
                </div>
              </div>

              <div className={`rounded-2xl border bg-slate-950/70 p-3.5 transition-colors ${
                moneyPosition.upiBalance < 0
                  ? 'border-rose-500/40 hover:border-rose-400'
                  : 'border-slate-800/90 group-hover:border-teal-500/40'
              }`}>
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>UPI Receipts</span>
                  <Smartphone className={`h-3.5 w-3.5 ${moneyPosition.upiBalance < 0 ? 'text-rose-400' : 'text-teal-400'}`} />
                </div>
                <div className={`font-mono-num text-base font-bold mt-1 ${
                  moneyPosition.upiBalance < 0 ? 'text-rose-400' : 'text-teal-400'
                }`}>
                  {formatINR(moneyPosition.upiBalance)}
                </div>
                <div className={`text-[10px] mt-1 flex items-center justify-between ${
                  moneyPosition.upiBalance < 0 ? 'text-rose-400/90' : 'text-teal-400/90'
                }`}>
                  <span>QR & GPay</span>
                  <span className="font-mono-num text-[9px] text-slate-400">Base: {formatINR(moneyPosition.openingUPI)}</span>
                </div>
              </div>

              <div className={`rounded-2xl border bg-slate-950/70 p-3.5 transition-colors ${
                moneyPosition.cardBalance < 0
                  ? 'border-rose-500/40 hover:border-rose-400'
                  : 'border-slate-800/90 group-hover:border-purple-500/40'
              }`}>
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Card Receipts</span>
                  <CreditCard className={`h-3.5 w-3.5 ${moneyPosition.cardBalance < 0 ? 'text-rose-400' : 'text-purple-400'}`} />
                </div>
                <div className={`font-mono-num text-base font-bold mt-1 ${
                  moneyPosition.cardBalance < 0 ? 'text-rose-400' : 'text-purple-400'
                }`}>
                  {formatINR(moneyPosition.cardBalance)}
                </div>
                <div className={`text-[10px] mt-1 flex items-center justify-between ${
                  moneyPosition.cardBalance < 0 ? 'text-rose-400/90' : 'text-purple-400/90'
                }`}>
                  <span>POS Machine</span>
                  <span className="font-mono-num text-[9px] text-slate-400">Base: {formatINR(moneyPosition.openingCard)}</span>
                </div>
              </div>
            </div>

            {/* Formula & Movement Indicator Ribbon */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-xs gap-2">
              <div className="flex items-center gap-3 text-slate-300 font-mono-num text-[11px] flex-wrap">
                <span className="text-slate-400">Opening: <strong className="text-slate-200">{formatINR(moneyPosition.totalOpeningBalance)}</strong></span>
                <span className="text-emerald-400 font-bold">+ Inflows: {formatINR(moneyPosition.totalInflows)}</span>
                <span className="text-rose-400 font-bold">- Outflows: {formatINR(moneyPosition.totalOutflows)}</span>
                <span className={`font-black ${moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  = Total: {formatINR(moneyPosition.totalAvailableBalance)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('money-position');
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1 transition-all"
                  title="Open Dedicated Money Position & Liquidity Center Tab"
                >
                  <Landmark className="h-3.5 w-3.5" />
                  <span>Open Dedicated Tab</span>
                </button>
                <span className={`font-bold group-hover:underline flex items-center gap-1 text-xs ${
                  moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  <span>Audit</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Outstanding Summary (Receivables vs Payables) */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-400" />
                <span>Outstanding Ledger</span>
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                Live
              </span>
            </div>

            <div className="space-y-3.5 mt-4">
              {/* Customer Receivables */}
              <div
                onClick={() => onNavigate('receivables')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Customer Receivables</div>
                    <div className="text-[10px] text-slate-400">Uncollected party/credit bills</div>
                  </div>
                </div>
                <div className="font-mono-num text-sm font-bold text-emerald-400">
                  {formatINR(outstandingSummary.customerReceivables)}
                </div>
              </div>

              {/* Supplier Payables */}
              <div
                onClick={() => onNavigate('payables')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Supplier Payables</div>
                    <div className="text-[10px] text-slate-400">Poultry, mutton & spice vendors</div>
                  </div>
                </div>
                <div className="font-mono-num text-sm font-bold text-rose-400">
                  {formatINR(outstandingSummary.supplierPayables)}
                </div>
              </div>

              {/* Staff Payables */}
              <div
                onClick={() => onNavigate('staff')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Staff Payables</div>
                    <div className="text-[10px] text-slate-400">Pending salary balances</div>
                  </div>
                </div>
                <div className="font-mono-num text-sm font-bold text-amber-400">
                  {formatINR(outstandingSummary.staffPayables)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Outflow Due:</span>
            <span className="font-mono-num font-extrabold text-rose-400">
              {formatINR(outstandingSummary.totalPayables)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: STAFF OVERVIEW & CRITICAL ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Today Card */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Staff & Kitchen Crew Today</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {staffStats.totalStaff} Total registered staff
              </p>
            </div>
            <button
              onClick={() => onNavigate('staff')}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Attendance →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Present Today</span>
              </div>
              <div className="font-mono-num text-xl font-extrabold text-slate-100 mt-1">
                {staffStats.present}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Absent / Leave</span>
              </div>
              <div className="font-mono-num text-xl font-extrabold text-slate-100 mt-1">
                {staffStats.absent + staffStats.leave}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-900/60 p-3 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Estimated Today's Staff Cost:</span>
            <span className="font-mono-num font-bold text-cyan-300">
              {formatINR(staffStats.todayCost)}
            </span>
          </div>
        </div>

        {/* Business Alerts */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Active Business & Ledger Alerts</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Immediate actionable reminders for Suraj Patil
              </p>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
              {alerts.length} Warnings
            </span>
          </div>

          <div className="space-y-2.5 mt-4">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                🎉 Excellent! No overdue receivables, payables, or critical warnings at this moment.
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate(alert.tab)}
                  className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    alert.type === 'danger'
                      ? 'bg-rose-950/30 border-rose-500/30 hover:bg-rose-950/50'
                      : alert.type === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/30 hover:bg-amber-950/50'
                      : 'bg-blue-950/30 border-blue-500/30 hover:bg-blue-950/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        alert.type === 'danger'
                          ? 'bg-rose-500/20 text-rose-400'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{alert.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{alert.desc}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 hover:text-white shrink-0 ml-2">
                    Review →
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: SALES ANALYTICS (Top Selling & Category Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                <span>Top Selling Dishes ({activeDateFilter})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Product-wise plate volume & gross revenue
              </p>
            </div>
            <button
              onClick={() => onNavigate('plate-sales')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              All Plate Sales →
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {productSalesMap.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No dish sales logged for {activeDateFilter}. Click Quick Add or Plate Sales to record.
              </div>
            ) : (
              productSalesMap.slice(0, 6).map((item, idx) => {
                const maxRevenue = productSalesMap[0]?.revenue || 1;
                const percent = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">({item.category})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono-num text-slate-400">{item.qty} plates</span>
                        <span className="font-mono-num font-bold text-emerald-400">
                          {formatINR(item.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category-wise Sales Breakdown */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-emerald-400" />
                <span>Category Sales</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Share of Biryani vs Starters vs Drinks
              </p>
            </div>
          </div>

          <div className="space-y-3.5 mt-4">
            {categoryBreakdown.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No category sales recorded yet.
              </div>
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat.category} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{cat.category}</span>
                    <span className="font-mono-num font-extrabold text-emerald-400">
                      {formatINR(cat.revenue)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Revenue Share</span>
                    <span className="font-semibold text-slate-300">{cat.percentage}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AVAILABLE MONEY CALCULATION & BREAKDOWN MODAL */}
      {showMoneyCalcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in overflow-y-auto">
          <div className="glass-panel-elevated w-full max-w-3xl rounded-3xl p-6 sm:p-7 border border-emerald-500/30 space-y-5 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <h3 className="font-display text-lg font-black text-slate-100 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-emerald-400" />
                  <span>Available Money Position — Financial Verification</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  100% verified arithmetic formula, channel registers & itemized transaction audit trail
                </p>
              </div>
              <button
                onClick={() => setShowMoneyCalcModal(false)}
                className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Sub Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/60 border border-white/5 flex-wrap">
              <button
                type="button"
                onClick={() => setMoneyModalTab('breakdown')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  moneyModalTab === 'breakdown'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Formula & Breakdown</span>
              </button>

              <button
                type="button"
                onClick={() => setMoneyModalTab('audit')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  moneyModalTab === 'audit'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Transaction Audit Trail ({moneyPosition.auditTransactions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setMoneyModalTab('settings')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  moneyModalTab === 'settings'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Set Starting Balances</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoneyCalcModal(false);
                  onNavigate('money-position');
                }}
                className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40"
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>Open Dedicated Workspace Tab</span>
              </button>
            </div>

            {/* TAB 1: FORMULA & BREAKDOWN */}
            {moneyModalTab === 'breakdown' && (
              <div className="space-y-4">
                {/* Equation Card */}
                <div className={`p-4 rounded-2xl bg-slate-950/80 border space-y-2 transition-colors ${
                  moneyPosition.totalAvailableBalance < 0 ? 'border-rose-500/40' : 'border-emerald-500/30'
                }`}>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Master Liquid Balance Equation
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono-num text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Starting Capital</span>
                      <strong className="text-slate-100 text-sm">{formatINR(moneyPosition.totalOpeningBalance)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 block font-sans">+ Total Inflows</span>
                      <strong className="text-emerald-300 text-sm font-bold">+{formatINR(moneyPosition.totalInflows)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                      <span className="text-[10px] text-rose-400 block font-sans">- Total Outflows</span>
                      <strong className="text-rose-300 text-sm font-bold">-{formatINR(moneyPosition.totalOutflows)}</strong>
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-colors ${
                      moneyPosition.totalAvailableBalance < 0
                        ? 'bg-rose-500/20 border-rose-500/50'
                        : 'bg-emerald-500/20 border-emerald-500/50'
                    }`}>
                      <span className={`text-[10px] block font-sans font-bold ${
                        moneyPosition.totalAvailableBalance < 0 ? 'text-rose-300' : 'text-emerald-300'
                      }`}>
                        = Net Available
                      </span>
                      <strong className={`text-base font-extrabold ${
                        moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {formatINR(moneyPosition.totalAvailableBalance)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Channel-by-Channel Breakdown Table */}
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="p-3">Payment Register / Account</th>
                        <th className="p-3 text-right">Opening Base</th>
                        <th className="p-3 text-right text-emerald-400">+ Inflows</th>
                        <th className="p-3 text-right text-rose-400">- Outflows</th>
                        <th className="p-3 text-right text-slate-100 font-bold">Net Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono-num">
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-semibold text-slate-200 flex items-center gap-2">
                          <Banknote className={`h-4 w-4 ${moneyPosition.cashBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                          <span>Cash in Hand (Counter Drawer)</span>
                        </td>
                        <td className="p-3 text-right text-slate-300">{formatINR(moneyPosition.openingCash)}</td>
                        <td className="p-3 text-right text-emerald-400">+{formatINR(moneyPosition.cashInflows)}</td>
                        <td className="p-3 text-right text-rose-400">-{formatINR(moneyPosition.cashOutflows)}</td>
                        <td className={`p-3 text-right font-bold ${
                          moneyPosition.cashBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {formatINR(moneyPosition.cashBalance)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-semibold text-slate-200 flex items-center gap-2">
                          <Building2 className={`h-4 w-4 ${moneyPosition.bankBalance < 0 ? 'text-rose-400' : 'text-blue-400'}`} />
                          <span>Bank Balance (Current Account)</span>
                        </td>
                        <td className="p-3 text-right text-slate-300">{formatINR(moneyPosition.openingBank)}</td>
                        <td className="p-3 text-right text-emerald-400">+{formatINR(moneyPosition.bankInflows)}</td>
                        <td className="p-3 text-right text-rose-400">-{formatINR(moneyPosition.bankOutflows)}</td>
                        <td className={`p-3 text-right font-bold ${
                          moneyPosition.bankBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {formatINR(moneyPosition.bankBalance)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-semibold text-slate-200 flex items-center gap-2">
                          <Smartphone className={`h-4 w-4 ${moneyPosition.upiBalance < 0 ? 'text-rose-400' : 'text-teal-400'}`} />
                          <span>UPI Receipts (QR Code & GPay)</span>
                        </td>
                        <td className="p-3 text-right text-slate-300">{formatINR(moneyPosition.openingUPI)}</td>
                        <td className="p-3 text-right text-emerald-400">+{formatINR(moneyPosition.upiInflows)}</td>
                        <td className="p-3 text-right text-rose-400">-{formatINR(moneyPosition.upiOutflows)}</td>
                        <td className={`p-3 text-right font-bold ${
                          moneyPosition.upiBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {formatINR(moneyPosition.upiBalance)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-semibold text-slate-200 flex items-center gap-2">
                          <CreditCard className={`h-4 w-4 ${moneyPosition.cardBalance < 0 ? 'text-rose-400' : 'text-purple-400'}`} />
                          <span>Card Receipts (POS Swipes & EDC)</span>
                        </td>
                        <td className="p-3 text-right text-slate-300">{formatINR(moneyPosition.openingCard)}</td>
                        <td className="p-3 text-right text-emerald-400">+{formatINR(moneyPosition.cardInflows)}</td>
                        <td className="p-3 text-right text-rose-400">-{formatINR(moneyPosition.cardOutflows)}</td>
                        <td className={`p-3 text-right font-bold ${
                          moneyPosition.cardBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {formatINR(moneyPosition.cardBalance)}
                        </td>
                      </tr>
                      <tr className={`font-bold border-t ${
                        moneyPosition.totalAvailableBalance < 0
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-emerald-950/20 border-emerald-500/30'
                      }`}>
                        <td className={`p-3 font-sans uppercase ${
                          moneyPosition.totalAvailableBalance < 0 ? 'text-rose-300' : 'text-emerald-300'
                        }`}>
                          Total Available Liquid Capital
                        </td>
                        <td className="p-3 text-right text-slate-200">{formatINR(moneyPosition.totalOpeningBalance)}</td>
                        <td className="p-3 text-right text-emerald-300">+{formatINR(moneyPosition.totalInflows)}</td>
                        <td className="p-3 text-right text-rose-300">-{formatINR(moneyPosition.totalOutflows)}</td>
                        <td className={`p-3 text-right text-sm font-extrabold ${
                          moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {formatINR(moneyPosition.totalAvailableBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Accounting Integrity Note */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Strict Segregation of Future Dues</span>
                  </div>
                  <p className="text-[11px] text-amber-200/85 leading-relaxed">
                    Pending Customer Receivables (<strong>{formatINR(outstandingSummary.customerReceivables)}</strong>) and Supplier Payables (<strong>{formatINR(outstandingSummary.totalPayables)}</strong>) are strictly separated from this position until actual payment is collected or disbursed.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: TRANSACTION AUDIT TRAIL */}
            {moneyModalTab === 'audit' && (
              <div className="space-y-3">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, ref, or source..."
                      value={auditSearchText}
                      onChange={(e) => setAuditSearchText(e.target.value)}
                      className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                    {(['All', 'Cash', 'UPI', 'Bank', 'Card'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAuditModeFilter(mode)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                          auditModeFilter === mode
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}

                    <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                    {(['All', 'Inflow', 'Outflow'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAuditTypeFilter(type)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                          auditTypeFilter === type
                            ? type === 'Inflow'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : type === 'Outflow'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-700 text-white'
                            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audit Items Table */}
                <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/10 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Category / Source</th>
                        <th className="p-2.5">Entity / Reference</th>
                        <th className="p-2.5">Account</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono-num">
                      {filteredAuditList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                            No transactions matched the active filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-2.5 text-slate-400 whitespace-nowrap">{formatDateDisplay(item.date)}</td>
                            <td className="p-2.5 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.type === 'Inflow'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {item.source}
                              </span>
                            </td>
                            <td className="p-2.5 font-sans font-medium text-slate-200 max-w-[200px] truncate">
                              {item.entityOrTitle}
                            </td>
                            <td className="p-2.5 font-sans">
                              <span className="text-[11px] text-slate-300 font-semibold">{item.paymentMode}</span>
                            </td>
                            <td
                              className={`p-2.5 text-right font-bold ${
                                item.type === 'Inflow' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {item.type === 'Inflow' ? '+' : '-'}
                              {formatINR(item.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                  <span>Showing {filteredAuditList.length} supporting transaction records</span>
                  <span className={`font-mono-num font-bold ${
                    (moneyPosition.totalInflows - moneyPosition.totalOutflows) < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    Net Movement: {formatINR(moneyPosition.totalInflows - moneyPosition.totalOutflows)}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: SET STARTING BALANCES */}
            {moneyModalTab === 'settings' && (
              <form onSubmit={handleSaveOpeningBalances} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Set or adjust the starting opening balances for your cash drawer, bank accounts, and UPI. The app combines these opening balances with live sales inflows and paid outflows to maintain real-time accuracy.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono-num text-xs bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-[11px] font-sans font-semibold text-slate-300 block mb-1">
                      Opening Cash in Hand (Counter Drawer)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={tempOpeningCash}
                        onChange={(e) => setTempOpeningCash(parseFloat(e.target.value) || 0)}
                        className="w-full glass-input pl-7 pr-3 py-2 text-xs font-bold text-slate-100"
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-sans font-semibold text-slate-300 block mb-1">
                      Opening Bank Balance (Current Account)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={tempOpeningBank}
                        onChange={(e) => setTempOpeningBank(parseFloat(e.target.value) || 0)}
                        className="w-full glass-input pl-7 pr-3 py-2 text-xs font-bold text-slate-100"
                        placeholder="25000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-sans font-semibold text-slate-300 block mb-1">
                      Opening UPI Balance (QR & Online)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={tempOpeningUPI}
                        onChange={(e) => setTempOpeningUPI(parseFloat(e.target.value) || 0)}
                        className="w-full glass-input pl-7 pr-3 py-2 text-xs font-bold text-slate-100"
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-sans font-semibold text-slate-300 block mb-1">
                      Opening Card Balance (POS Machine)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={tempOpeningCard}
                        onChange={(e) => setTempOpeningCard(parseFloat(e.target.value) || 0)}
                        className="w-full glass-input pl-7 pr-3 py-2 text-xs font-bold text-slate-100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {openingSavedSuccess && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Opening Balances Updated & Recalculated!</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save & Recalculate Live</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick Links & Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowMoneyCalcModal(false);
                  onNavigate('closing');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <span>Reconcile in Daily Closing</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowMoneyCalcModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
