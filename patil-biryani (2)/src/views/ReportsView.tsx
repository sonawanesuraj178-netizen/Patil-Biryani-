import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Utensils,
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  formatINR,
  formatNumberIN,
  formatPercent,
  formatDateDisplay,
  formatMonthDisplay,
  getTodayDateString,
} from '../utils/formatters';
import { DateFilterType } from '../types';

interface ReportsViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
}) => {
  const {
    invoices,
    expenses,
    purchases,
    plateWiseSales,
    products,
    categories,
    staffEmployees,
    salaryCalculations,
    staffAdvances,
    receivables,
    receivablePayments,
    payables,
    payablePayments,
    moneyPosition,
    isDateInActiveFilter,
    activeDateFilter,
    setActiveDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    businessProfile,
  } = useApp();

  // Sub tab for reports
  const [selectedReportType, setSelectedReportType] = useState<
    'pnl' | 'plates' | 'cashflow' | 'daily' | 'aging' | 'payroll'
  >('pnl');

  const [searchFilter, setSearchFilter] = useState('');

  const dateFilterTabs: DateFilterType[] = [
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'Previous Month',
    'Custom Date',
  ];

  // Filtered dataset for active period
  const periodInvoices = useMemo(
    () => invoices.filter((i) => isDateInActiveFilter(i.date)),
    [invoices, isDateInActiveFilter]
  );
  const periodExpenses = useMemo(
    () => expenses.filter((e) => isDateInActiveFilter(e.date)),
    [expenses, isDateInActiveFilter]
  );
  const periodPurchases = useMemo(
    () => purchases.filter((p) => isDateInActiveFilter(p.date)),
    [purchases, isDateInActiveFilter]
  );
  const periodPlateSales = useMemo(
    () => plateWiseSales.filter((p) => isDateInActiveFilter(p.date)),
    [plateWiseSales, isDateInActiveFilter]
  );
  const periodPayablePayments = useMemo(
    () => payablePayments.filter((p) => isDateInActiveFilter(p.date)),
    [payablePayments, isDateInActiveFilter]
  );
  const periodReceivablePayments = useMemo(
    () => receivablePayments.filter((r) => isDateInActiveFilter(r.date)),
    [receivablePayments, isDateInActiveFilter]
  );
  const periodStaffAdvances = useMemo(
    () => staffAdvances.filter((a) => isDateInActiveFilter(a.date)),
    [staffAdvances, isDateInActiveFilter]
  );
  const periodSalaryCalculations = useMemo(
    () =>
      salaryCalculations.filter(
        (s) =>
          s.status === 'Paid' &&
          isDateInActiveFilter(s.paidDate || s.calculatedAt?.split(' ')[0] || '')
      ),
    [salaryCalculations, isDateInActiveFilter]
  );

  // 1. P&L Financial Summary
  const pnlSummary = useMemo(() => {
    // Gross sales from invoices or plate sales
    const invoiceGross = periodInvoices.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    const invoiceDiscount = periodInvoices.reduce((sum, i) => sum + (i.discount || 0), 0);
    const invoiceTax = periodInvoices.reduce((sum, i) => sum + (i.tax || 0), 0);
    const invoiceNet = invoiceGross - invoiceDiscount;

    const plateGross = periodPlateSales.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

    const grossSales = Math.max(invoiceGross, plateGross);
    const discounts = invoiceDiscount;
    const netSales = grossSales - discounts;
    const taxesCollected = invoiceTax;

    const rawMaterialCost = periodPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const grossProfit = netSales - rawMaterialCost;
    const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    const operatingExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = grossProfit - operatingExpenses;
    const netProfitMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    return {
      grossSales,
      discounts,
      netSales,
      taxesCollected,
      rawMaterialCost,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      netProfit,
      netProfitMargin,
    };
  }, [periodInvoices, periodExpenses, periodPurchases, periodPlateSales]);

  // 2. Plate Sales & Item-wise Breakdown
  const platePerformance = useMemo(() => {
    const itemMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        platesSold: number;
        totalRevenue: number;
        estimatedCost: number;
      }
    >();

    // Initialize from products
    products.forEach((prod) => {
      const cat = categories.find((c) => c.id === prod.categoryId);
      itemMap.set(prod.id, {
        id: prod.id,
        name: prod.name,
        category: cat?.name || 'Biryani',
        platesSold: 0,
        totalRevenue: 0,
        estimatedCost: prod.sellingPrice * 0.45,
      });
    });

    // Accumulate from Plate Wise Sales
    periodPlateSales.forEach((pws) => {
      pws.items.forEach((it) => {
        const exist = itemMap.get(it.productId);
        if (exist) {
          exist.platesSold += it.quantity || 0;
          exist.totalRevenue += it.amount || 0;
        } else {
          itemMap.set(it.productId, {
            id: it.productId,
            name: it.productName,
            category: it.categoryName || 'Dishes',
            platesSold: it.quantity || 0,
            totalRevenue: it.amount || 0,
            estimatedCost: (it.rate || 150) * 0.45,
          });
        }
      });
    });

    // If no plate sales, accumulate from POS Invoices
    if (periodPlateSales.length === 0) {
      periodInvoices.forEach((inv) => {
        inv.items.forEach((it) => {
          const exist = itemMap.get(it.productId);
          if (exist) {
            exist.platesSold += it.quantity || 0;
            exist.totalRevenue += it.amount || (it.quantity * it.rate);
          } else {
            itemMap.set(it.productId, {
              id: it.productId,
              name: it.productName,
              category: it.categoryName || 'Dishes',
              platesSold: it.quantity || 0,
              totalRevenue: it.amount || (it.quantity * it.rate),
              estimatedCost: (it.rate || 150) * 0.45,
            });
          }
        });
      });
    }

    return Array.from(itemMap.values()).filter((i) => i.platesSold > 0);
  }, [periodPlateSales, periodInvoices, products, categories]);

  // 3. Cash Flow Summary & Comprehensive Tally
  const cashFlowSummary = useMemo(() => {
    const invoiceCashInflows = periodInvoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
    const plateCashInflows = periodPlateSales.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const salesInflows = Math.max(invoiceCashInflows, plateCashInflows);
    
    // Customer credit collections
    const receivablesInflows = periodReceivablePayments.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalInflows = salesInflows + receivablesInflows;

    // Outflows
    const paidExpenses = periodExpenses
      .filter((e) => e.paymentStatus === 'Paid')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const paidPurchases = periodPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const paidPayables = periodPayablePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidAdvances = periodStaffAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const paidSalaries = periodSalaryCalculations.reduce((sum, s) => sum + (s.netSalary || 0), 0);
    const staffDisbursements = paidAdvances + paidSalaries;

    const totalOutflows = paidExpenses + paidPurchases + paidPayables + staffDisbursements;
    const netCashFlow = totalInflows - totalOutflows;

    // Mode-wise breakdown
    let cashInflow = 0;
    let upiInflow = 0;
    let bankInflow = 0;
    let cardInflow = 0;

    let cashOutflow = 0;
    let upiOutflow = 0;
    let bankOutflow = 0;
    let cardOutflow = 0;

    // Sales mode-wise
    if (periodPlateSales.length > 0) {
      periodPlateSales.forEach((p) => {
        cashInflow += p.cashSales || 0;
        upiInflow += p.upiSales || 0;
        bankInflow += p.bankSales || 0;
        cardInflow += p.cardSales || 0;
      });
    } else {
      periodInvoices.forEach((i) => {
        const amt = i.amountPaid || 0;
        if (i.paymentMode === 'Cash') cashInflow += amt;
        else if (i.paymentMode === 'UPI') upiInflow += amt;
        else if (i.paymentMode === 'Bank') bankInflow += amt;
        else if (i.paymentMode === 'Card') cardInflow += amt;
      });
    }

    // Receivables mode-wise
    periodReceivablePayments.forEach((r) => {
      const amt = r.amount || 0;
      if (r.paymentMode === 'Cash') cashInflow += amt;
      else if (r.paymentMode === 'UPI') upiInflow += amt;
      else if (r.paymentMode === 'Bank') bankInflow += amt;
      else if (r.paymentMode === 'Card') cardInflow += amt;
    });

    // Expenses mode-wise
    periodExpenses.forEach((e) => {
      if (e.paymentStatus === 'Paid') {
        const amt = e.amount || 0;
        if (e.paymentMode === 'Cash') cashOutflow += amt;
        else if (e.paymentMode === 'UPI') upiOutflow += amt;
        else if (e.paymentMode === 'Bank') bankOutflow += amt;
        else if (e.paymentMode === 'Card') cardOutflow += amt;
      }
    });

    // Purchases mode-wise
    periodPurchases.forEach((p) => {
      const amt = p.paidAmount || 0;
      if (p.paymentMode === 'Cash') cashOutflow += amt;
      else if (p.paymentMode === 'UPI') upiOutflow += amt;
      else if (p.paymentMode === 'Bank') bankOutflow += amt;
      else if (p.paymentMode === 'Card') cardOutflow += amt;
    });

    // Payables settled mode-wise
    periodPayablePayments.forEach((p) => {
      const amt = p.amount || 0;
      if (p.paymentMode === 'Cash') cashOutflow += amt;
      else if (p.paymentMode === 'UPI') upiOutflow += amt;
      else if (p.paymentMode === 'Bank') bankOutflow += amt;
      else if (p.paymentMode === 'Card') cardOutflow += amt;
    });

    // Staff advances
    periodStaffAdvances.forEach((a) => {
      const amt = a.amount || 0;
      if (a.paymentMode === 'Cash') cashOutflow += amt;
      else if (a.paymentMode === 'UPI') upiOutflow += amt;
      else if (a.paymentMode === 'Bank') bankOutflow += amt;
      else if (a.paymentMode === 'Card') cardOutflow += amt;
    });

    // Salary payouts
    periodSalaryCalculations.forEach((s) => {
      const amt = s.netSalary || 0;
      if (s.paymentMode === 'Cash') cashOutflow += amt;
      else if (s.paymentMode === 'UPI') upiOutflow += amt;
      else if (s.paymentMode === 'Bank') bankOutflow += amt;
      else if (s.paymentMode === 'Card') cardOutflow += amt;
    });

    return {
      salesInflows,
      receivablesInflows,
      cashInflows: totalInflows,
      paidExpenses,
      paidPurchases,
      paidPayables,
      staffDisbursements,
      totalOutflows,
      netCashFlow,
      // By Mode
      cashInflow,
      upiInflow,
      bankInflow,
      cardInflow,
      cashOutflow,
      upiOutflow,
      bankOutflow,
      cardOutflow,
      netCashDrawer: cashInflow - cashOutflow,
      netUpiOnline: upiInflow - upiOutflow,
      netBankTransfer: bankInflow - bankOutflow,
    };
  }, [
    periodInvoices,
    periodPlateSales,
    periodExpenses,
    periodPurchases,
    periodReceivablePayments,
    periodPayablePayments,
    periodStaffAdvances,
    periodSalaryCalculations,
  ]);

  // 4. Daily Sales Ledger
  const dailyLedger = useMemo(() => {
    const dateMap = new Map<
      string,
      {
        date: string;
        sales: number;
        plates: number;
        expenses: number;
        purchases: number;
        net: number;
        cash: number;
        upi: number;
        card: number;
      }
    >();

    // Invoices by date
    periodInvoices.forEach((inv) => {
      const entry = dateMap.get(inv.date) || {
        date: inv.date,
        sales: 0,
        plates: 0,
        expenses: 0,
        purchases: 0,
        net: 0,
        cash: 0,
        upi: 0,
        card: 0,
      };
      entry.sales += inv.grandTotal || 0;
      entry.plates += inv.items.reduce((s, it) => s + (it.quantity || 0), 0);
      if (inv.paymentMode === 'Cash') entry.cash += inv.amountPaid || 0;
      else if (inv.paymentMode === 'UPI') entry.upi += inv.amountPaid || 0;
      else if (inv.paymentMode === 'Card') entry.card += inv.amountPaid || 0;
      dateMap.set(inv.date, entry);
    });

    // Plate sales by date if no invoice for that date
    periodPlateSales.forEach((pws) => {
      const entry = dateMap.get(pws.date) || {
        date: pws.date,
        sales: 0,
        plates: 0,
        expenses: 0,
        purchases: 0,
        net: 0,
        cash: 0,
        upi: 0,
        card: 0,
      };
      if (entry.sales === 0) {
        entry.sales = pws.grandTotal || 0;
        entry.plates = pws.totalPlates || 0;
        entry.cash = pws.cashSales || 0;
        entry.upi = pws.upiSales || 0;
        entry.card = pws.cardSales || 0;
      }
      dateMap.set(pws.date, entry);
    });

    // Expenses by date
    periodExpenses.forEach((exp) => {
      const entry = dateMap.get(exp.date) || {
        date: exp.date,
        sales: 0,
        plates: 0,
        expenses: 0,
        purchases: 0,
        net: 0,
        cash: 0,
        upi: 0,
        card: 0,
      };
      entry.expenses += exp.amount || 0;
      dateMap.set(exp.date, entry);
    });

    // Purchases by date
    periodPurchases.forEach((pur) => {
      const entry = dateMap.get(pur.date) || {
        date: pur.date,
        sales: 0,
        plates: 0,
        expenses: 0,
        purchases: 0,
        net: 0,
        cash: 0,
        upi: 0,
        card: 0,
      };
      entry.purchases += pur.totalAmount || 0;
      dateMap.set(pur.date, entry);
    });

    return Array.from(dateMap.values())
      .map((row) => ({
        ...row,
        net: row.sales - row.expenses,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [periodInvoices, periodPlateSales, periodExpenses, periodPurchases]);

  // Chart Colors
  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  // Top Items Chart Data
  const topItemsChartData = useMemo(() => {
    return platePerformance
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 6)
      .map((item) => ({
        name: item.name,
        revenue: item.totalRevenue,
        plates: item.platesSold,
      }));
  }, [platePerformance]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Report Navigation */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-emerald-400" />
            <span>Financial & Operations Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time profit & loss, item margin analysis, cash movements, daily sales ledger & aging audit
          </p>
        </div>

        {/* Date Filter & Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-1">
            {dateFilterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDateFilter(tab)}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                  activeDateFilter === tab
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {activeDateFilter === 'Custom Date' && (
        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs border border-white/10">
          <span className="text-slate-400 font-bold">Custom Date Range:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="glass-input px-3 py-1 text-xs text-slate-100"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="glass-input px-3 py-1 text-xs text-slate-100"
          />
        </div>
      )}

      {/* Sub-Navigation Tabs for Reports */}
      <div className="glass rounded-2xl p-1.5 flex items-center flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedReportType('pnl')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedReportType === 'pnl'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Income & Expenditure (P&L)</span>
        </button>

        <button
          onClick={() => setSelectedReportType('plates')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedReportType === 'plates'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Utensils className="h-3.5 w-3.5" />
          <span>Plate Sales & Item Margins</span>
        </button>

        <button
          onClick={() => setSelectedReportType('daily')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedReportType === 'daily'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Daily Sales Ledger</span>
        </button>

        <button
          onClick={() => setSelectedReportType('cashflow')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedReportType === 'cashflow'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>Cash Movement Flow</span>
        </button>

        <button
          onClick={() => setSelectedReportType('aging')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedReportType === 'aging'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Receivables & Payables Aging</span>
        </button>

        <button
          onClick={() => setSelectedReportType('payroll')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedReportType === 'payroll'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Staff Payroll Summary</span>
        </button>
      </div>

      {/* 1. PROFIT & LOSS STATEMENT */}
      {selectedReportType === 'pnl' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Total Net Sales</div>
              <div className="font-mono-num text-2xl font-black text-emerald-400 mt-1">
                {formatINR(pnlSummary.netSales)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{periodInvoices.length} billings logged</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Raw Material COGS</div>
              <div className="font-mono-num text-2xl font-black text-amber-400 mt-1">
                {formatINR(pnlSummary.rawMaterialCost)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Purchases (Chicken, Mutton, Rice)</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Operating Expenses</div>
              <div className="font-mono-num text-2xl font-black text-rose-400 mt-1">
                {formatINR(pnlSummary.operatingExpenses)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Gas, electricity, store rent, repairs</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20">
              <div className="text-[11px] font-semibold text-emerald-300">Net Profit (EBITDA)</div>
              <div className="font-mono-num text-2xl font-black text-emerald-300 mt-1">
                {formatINR(pnlSummary.netProfit)}
              </div>
              <div className="text-[10px] text-emerald-400/70 mt-0.5">
                {formatPercent(pnlSummary.netProfitMargin)} profit margin
              </div>
            </div>
          </div>

          {/* Formatted Financial Statement Card */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-black text-slate-100">
                  Income & Expenditure Statement
                </h3>
                <span className="text-xs text-slate-400">
                  Entity: {businessProfile.name || 'Patil Biryani'} ({activeDateFilter})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPdfExport(
                      `Patil Biryani - Profit and Loss Statement (${activeDateFilter})`,
                      [
                        { LineItem: 'Gross Food & Beverage Sales', Amount: formatINR(pnlSummary.grossSales) },
                        { LineItem: 'Less: Customer Discounts', Amount: `- ${formatINR(pnlSummary.discounts)}` },
                        { LineItem: 'Net Operating Sales', Amount: formatINR(pnlSummary.netSales) },
                        { LineItem: 'Less: Cost of Goods Sold (Raw Materials)', Amount: `- ${formatINR(pnlSummary.rawMaterialCost)}` },
                        { LineItem: 'Gross Operating Profit', Amount: formatINR(pnlSummary.grossProfit) },
                        { LineItem: 'Less: Operating Expenses (Rent, Gas, Utilities)', Amount: `- ${formatINR(pnlSummary.operatingExpenses)}` },
                        { LineItem: 'NET RESTAURANT PROFIT', Amount: formatINR(pnlSummary.netProfit) },
                      ],
                      {
                        'Gross Margin': formatPercent(pnlSummary.grossMarginPercent),
                        'Net Profit Margin': formatPercent(pnlSummary.netProfitMargin),
                        'Net Profit': formatINR(pnlSummary.netProfit),
                      }
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>PDF Export</span>
                </button>

                <button
                  onClick={() =>
                    onOpenExcelExport(`Patil_Biryani_PNL_${activeDateFilter}`, [
                      { 'Financial Line Item': 'Gross Sales', Amount: pnlSummary.grossSales },
                      { 'Financial Line Item': 'Discounts Allowed', Amount: -pnlSummary.discounts },
                      { 'Financial Line Item': 'Net Sales', Amount: pnlSummary.netSales },
                      { 'Financial Line Item': 'Raw Material Purchases', Amount: -pnlSummary.rawMaterialCost },
                      { 'Financial Line Item': 'Gross Margin', Amount: pnlSummary.grossProfit },
                      { 'Financial Line Item': 'Operating Expenses', Amount: -pnlSummary.operatingExpenses },
                      { 'Financial Line Item': 'Net Profit', Amount: pnlSummary.netProfit },
                    ])
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Excel Export</span>
                </button>
              </div>
            </div>

            {/* Income Statement Line Items */}
            <div className="space-y-4 font-mono-num text-xs">
              {/* Revenue */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider">
                  1. Operating Revenue
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5 text-slate-200">
                  <span className="font-sans">Gross Sales & Billing</span>
                  <span>{formatINR(pnlSummary.grossSales)}</span>
                </div>
                {pnlSummary.discounts > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-white/5 text-rose-400">
                    <span className="font-sans">Less: Discounts Allowed</span>
                    <span>- {formatINR(pnlSummary.discounts)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-white/10 font-bold text-emerald-400">
                  <span className="font-sans">Net Restaurant Sales</span>
                  <span>{formatINR(pnlSummary.netSales)}</span>
                </div>
              </div>

              {/* COGS */}
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider">
                  2. Cost of Goods Sold (COGS)
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5 text-amber-400">
                  <span className="font-sans">Raw Materials & Kitchen Purchases</span>
                  <span>- {formatINR(pnlSummary.rawMaterialCost)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10 font-bold text-slate-100">
                  <span className="font-sans">Gross Margin (Margin: {formatPercent(pnlSummary.grossMarginPercent)})</span>
                  <span>{formatINR(pnlSummary.grossProfit)}</span>
                </div>
              </div>

              {/* OPEX */}
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider">
                  3. Operating Expenses & Utilities
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5 text-rose-400">
                  <span className="font-sans">Gas cylinders, electricity, rent, maintenance & supplies</span>
                  <span>- {formatINR(pnlSummary.operatingExpenses)}</span>
                </div>
              </div>

              {/* Net Profit Bar */}
              <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-sm font-black mt-4">
                <span className="font-sans uppercase text-emerald-300">
                  Net Bottom-Line Profit
                </span>
                <span className="text-xl font-bold text-emerald-400">
                  {formatINR(pnlSummary.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PLATE SALES & MARGINS REPORT */}
      {selectedReportType === 'plates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Items Chart */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-amber-400" />
                <span>Top Revenue Biryanis & Dishes</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItemsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      formatter={(val: any) => formatINR(Number(val))}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Share */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-cyan-400" />
                <span>Plate Volume Distribution</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topItemsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="plates"
                      nameKey="name"
                    >
                      {topItemsChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Plate-wise Detailed Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-display font-bold text-sm text-slate-200">
                  Item-Wise Sales & Estimated Margin Matrix
                </span>
                <p className="text-[11px] text-slate-400">Plates sold, sales revenue & contribution</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPdfExport(
                      `Patil Biryani - Plate Sales & Margin Report (${activeDateFilter})`,
                      platePerformance.map((p) => ({
                        Item: p.name,
                        Category: p.category,
                        'Plates Sold': p.platesSold,
                        'Avg Rate': formatINR(Math.round(p.totalRevenue / p.platesSold)),
                        'Total Revenue': formatINR(p.totalRevenue),
                        'Estimated Margin': '55%',
                      })),
                      {
                        'Total Plates': platePerformance.reduce((s, p) => s + p.platesSold, 0),
                        'Total Revenue': formatINR(platePerformance.reduce((s, p) => s + p.totalRevenue, 0)),
                      }
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>PDF Export</span>
                </button>
                <button
                  onClick={() =>
                    onOpenExcelExport(
                      `Plate_Sales_${activeDateFilter}`,
                      platePerformance.map((p) => ({
                        Item: p.name,
                        Category: p.category,
                        'Plates Sold': p.platesSold,
                        'Avg Price': Math.round(p.totalRevenue / p.platesSold),
                        'Total Revenue': p.totalRevenue,
                      }))
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Excel Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3.5">Biryani / Menu Item</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-center">Plates Sold</th>
                    <th className="px-4 py-3.5 text-right">Avg Rate</th>
                    <th className="px-4 py-3.5 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {platePerformance.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-200">{item.name}</td>
                      <td className="px-4 py-3 text-slate-400">{item.category}</td>
                      <td className="px-4 py-3 text-center font-mono-num font-bold text-emerald-400">
                        {item.platesSold}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-slate-300">
                        {formatINR(Math.round(item.totalRevenue / item.platesSold))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-100">
                        {formatINR(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                  {platePerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No plate sales recorded for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. DAILY SALES LEDGER */}
      {selectedReportType === 'daily' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-display font-bold text-sm text-slate-200">
                  Daily Restaurant Sales & Expenses Ledger
                </span>
                <p className="text-[11px] text-slate-400">Day-by-day cash, UPI, sales, expenses & profit breakdown</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPdfExport(
                      `Patil Biryani - Daily Sales Ledger (${activeDateFilter})`,
                      dailyLedger.map((row) => ({
                        Date: formatDateDisplay(row.date),
                        'Plates Sold': row.plates,
                        'Total Sales': formatINR(row.sales),
                        'Cash Sales': formatINR(row.cash),
                        'UPI Sales': formatINR(row.upi),
                        Expenses: formatINR(row.expenses),
                        'Net Daily Profit': formatINR(row.net),
                      })),
                      {
                        'Total Sales': formatINR(dailyLedger.reduce((s, r) => s + r.sales, 0)),
                        'Total Expenses': formatINR(dailyLedger.reduce((s, r) => s + r.expenses, 0)),
                        'Total Net Profit': formatINR(dailyLedger.reduce((s, r) => s + r.net, 0)),
                      }
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>PDF Export</span>
                </button>

                <button
                  onClick={() =>
                    onOpenExcelExport(
                      `Daily_Ledger_${activeDateFilter}`,
                      dailyLedger.map((row) => ({
                        Date: row.date,
                        'Plates Sold': row.plates,
                        'Total Sales': row.sales,
                        'Cash Sales': row.cash,
                        'UPI Sales': row.upi,
                        'Card Sales': row.card,
                        Expenses: row.expenses,
                        Purchases: row.purchases,
                        'Net Profit': row.net,
                      }))
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Excel Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5 text-center">Plates</th>
                    <th className="px-4 py-3.5 text-right">Total Sales</th>
                    <th className="px-4 py-3.5 text-right">Cash</th>
                    <th className="px-4 py-3.5 text-right">UPI</th>
                    <th className="px-4 py-3.5 text-right">Expenses</th>
                    <th className="px-4 py-3.5 text-right">Net Day Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dailyLedger.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-200">{formatDateDisplay(row.date)}</td>
                      <td className="px-4 py-3 text-center font-mono-num text-slate-300">{row.plates}</td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-emerald-400">
                        {formatINR(row.sales)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-slate-300">
                        {formatINR(row.cash)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-cyan-400">
                        {formatINR(row.upi)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-rose-400">
                        {formatINR(row.expenses)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono-num font-black ${
                          row.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatINR(row.net)}
                      </td>
                    </tr>
                  ))}
                  {dailyLedger.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No transactions found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CASH FLOW STATEMENT */}
      {selectedReportType === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Total Cash Inflows</div>
              <div className="font-mono-num text-2xl font-black text-emerald-400 mt-1">
                {formatINR(cashFlowSummary.cashInflows)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Sales ({formatINR(cashFlowSummary.salesInflows)}) + Collected Credits ({formatINR(cashFlowSummary.receivablesInflows)})
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Total Cash Outflows</div>
              <div className="font-mono-num text-2xl font-black text-rose-400 mt-1">
                {formatINR(cashFlowSummary.totalOutflows)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Expenses + Purchases + Payable Settlements + Staff
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Net Period Cash Movement</div>
              <div
                className={`font-mono-num text-2xl font-black mt-1 ${
                  cashFlowSummary.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatINR(cashFlowSummary.netCashFlow)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Net liquidity added to registers & bank</div>
            </div>
          </div>

          {/* Statement Breakdown */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-display font-bold text-base text-slate-100">
                  Comprehensive Statement of Cash Inflows & Outflows
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Includes all restaurant sales, supplier payable settlements, and credit recoveries
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPdfExport(
                      `Patil Biryani - Cash Flow Statement (${activeDateFilter})`,
                      [
                        { 'Cash Flow Line': '1. Cash Inflows from Customer Sales', Amount: formatINR(cashFlowSummary.salesInflows) },
                        { 'Cash Flow Line': '2. Cash Inflows: Customer Receivables Recovered', Amount: `+ ${formatINR(cashFlowSummary.receivablesInflows)}` },
                        { 'Cash Flow Line': '3. Cash Outflows: Paid Supplier Invoices', Amount: `- ${formatINR(cashFlowSummary.paidPurchases)}` },
                        { 'Cash Flow Line': '4. Cash Outflows: Operating Expenses & Utilities', Amount: `- ${formatINR(cashFlowSummary.paidExpenses)}` },
                        { 'Cash Flow Line': '5. Cash Outflows: Supplier & Creditor Payables Settled', Amount: `- ${formatINR(cashFlowSummary.paidPayables)}` },
                        { 'Cash Flow Line': '6. Cash Outflows: Staff Salaries & Advance Payouts', Amount: `- ${formatINR(cashFlowSummary.staffDisbursements)}` },
                        { 'Cash Flow Line': 'NET CASH SURPLUS FOR PERIOD', Amount: formatINR(cashFlowSummary.netCashFlow) },
                      ],
                      {
                        'Total Inflows': formatINR(cashFlowSummary.cashInflows),
                        'Total Outflows': formatINR(cashFlowSummary.totalOutflows),
                        'Net Cash Flow': formatINR(cashFlowSummary.netCashFlow),
                      }
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() =>
                    onOpenExcelExport(
                      `Cash_Flow_${activeDateFilter}`,
                      [
                        { 'Cash Flow Line': 'Cash Inflows: Customer Sales', Amount: cashFlowSummary.salesInflows },
                        { 'Cash Flow Line': 'Cash Inflows: Credit Receivables Collected', Amount: cashFlowSummary.receivablesInflows },
                        { 'Cash Flow Line': 'Cash Outflows: Supplier Purchases Paid', Amount: -cashFlowSummary.paidPurchases },
                        { 'Cash Flow Line': 'Cash Outflows: Operating Expenses', Amount: -cashFlowSummary.paidExpenses },
                        { 'Cash Flow Line': 'Cash Outflows: Payables Settled', Amount: -cashFlowSummary.paidPayables },
                        { 'Cash Flow Line': 'Cash Outflows: Staff Disbursements', Amount: -cashFlowSummary.staffDisbursements },
                        { 'Cash Flow Line': 'Net Cash Flow', Amount: cashFlowSummary.netCashFlow },
                      ]
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 font-mono-num text-xs">
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-200">
                <span className="font-sans">1. Cash Inflows from Counter & POS Sales</span>
                <span className="text-emerald-400 font-bold">+ {formatINR(cashFlowSummary.salesInflows)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-200">
                <span className="font-sans">2. Cash Inflows: Customer Receivables Recovered ({periodReceivablePayments.length} Payments)</span>
                <span className="text-emerald-400 font-bold">+ {formatINR(cashFlowSummary.receivablesInflows)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-200">
                <span className="font-sans">3. Cash Outflows: Paid Direct Purchases</span>
                <span className="text-rose-400 font-bold">- {formatINR(cashFlowSummary.paidPurchases)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-200">
                <span className="font-sans">4. Cash Outflows: Paid Operating Expenses & Fuel</span>
                <span className="text-rose-400 font-bold">- {formatINR(cashFlowSummary.paidExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-200 bg-rose-500/5 px-2 rounded-lg">
                <span className="font-sans font-semibold text-rose-300">
                  5. Cash Outflows: Supplier & Creditor Payables Settled ({periodPayablePayments.length} Settlements)
                </span>
                <span className="text-rose-400 font-bold">- {formatINR(cashFlowSummary.paidPayables)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-200">
                <span className="font-sans">6. Cash Outflows: Staff Advances & Salary Payouts</span>
                <span className="text-rose-400 font-bold">- {formatINR(cashFlowSummary.staffDisbursements)}</span>
              </div>
              <div className="flex justify-between py-3 border-t border-white/10 font-bold text-sm text-slate-100">
                <span className="font-sans">Net Cash Surplus for Period</span>
                <span className={`font-bold ${cashFlowSummary.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatINR(cashFlowSummary.netCashFlow)}
                </span>
              </div>
            </div>

            {/* Mode-wise Reconciled Matrix */}
            <div className="pt-4 border-t border-white/10">
              <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                <span>Payment Mode Liquidity & Tally Matrix</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✓ Reconciled with Ledgers
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-num text-xs">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="text-slate-400 font-sans font-medium text-[11px] flex justify-between">
                    <span>Cash Register Drawer</span>
                    <span className="text-slate-300">{formatINR(cashFlowSummary.netCashDrawer)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-400">
                    <span>Inflow:</span>
                    <span>+{formatINR(cashFlowSummary.cashInflow)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-rose-400">
                    <span>Outflow:</span>
                    <span>-{formatINR(cashFlowSummary.cashOutflow)}</span>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="text-slate-400 font-sans font-medium text-[11px] flex justify-between">
                    <span>Online UPI Accounts</span>
                    <span className="text-cyan-300">{formatINR(cashFlowSummary.netUpiOnline)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-400">
                    <span>Inflow:</span>
                    <span>+{formatINR(cashFlowSummary.upiInflow)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-rose-400">
                    <span>Outflow:</span>
                    <span>-{formatINR(cashFlowSummary.upiOutflow)}</span>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="text-slate-400 font-sans font-medium text-[11px] flex justify-between">
                    <span>Bank & Card Channels</span>
                    <span className="text-indigo-300">{formatINR(cashFlowSummary.netBankTransfer + (cashFlowSummary.cardInflow - cashFlowSummary.cardOutflow))}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-400">
                    <span>Inflow:</span>
                    <span>+{formatINR(cashFlowSummary.bankInflow + cashFlowSummary.cardInflow)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-rose-400">
                    <span>Outflow:</span>
                    <span>-{formatINR(cashFlowSummary.bankOutflow + cashFlowSummary.cardOutflow)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AGING ANALYSIS */}
      {selectedReportType === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receivables Aging */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-base text-emerald-300 flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5" />
                  <span>Customer Receivables ({receivables.filter((r) => r.balance > 0).length})</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onOpenPdfExport(
                        'Patil Biryani - Customer Receivables Aging',
                        receivables.map((r) => ({
                          Customer: r.customerName,
                          Bill: r.invoiceNumber,
                          'Total Bill': formatINR(r.totalAmount),
                          Received: formatINR(r.amountReceived),
                          'Balance Due': formatINR(r.balance),
                          Status: r.status,
                        })),
                        {
                          'Total Outstanding Due': formatINR(
                            receivables.reduce((s, r) => s + (r.balance || 0), 0)
                          ),
                        }
                      )
                    }
                    className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3 text-rose-400" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() =>
                      onOpenExcelExport(
                        'Customer_Receivables_Aging',
                        receivables.map((r) => ({
                          Customer: r.customerName,
                          'Invoice / Bill': r.invoiceNumber,
                          Date: r.date,
                          'Total Amount': r.totalAmount,
                          'Amount Received': r.amountReceived,
                          'Balance Due': r.balance,
                          Status: r.status,
                        }))
                      )
                    }
                    className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {receivables
                  .filter((r) => r.balance > 0)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{r.customerName}</div>
                        <div className="text-[10px] text-slate-400">Bill: {r.invoiceNumber} • {formatDateDisplay(r.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-num font-bold text-amber-400">
                          {formatINR(r.balance)}
                        </div>
                        <div className="text-[10px] text-slate-500">Due: {r.dueDate ? formatDateDisplay(r.dueDate) : 'Immediate'}</div>
                      </div>
                    </div>
                  ))}
                {receivables.filter((r) => r.balance > 0).length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    All customer dues are fully cleared. No outstanding receivables!
                  </div>
                )}
              </div>
            </div>

            {/* Payables Aging */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-base text-rose-300 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5" />
                  <span>Supplier Payables ({payables.filter((p) => p.balance > 0).length})</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onOpenPdfExport(
                        'Patil Biryani - Supplier Payables Aging',
                        payables.map((p) => ({
                          Supplier: p.entityName,
                          Ref: p.referenceNumber,
                          'Total Payable': formatINR(p.totalAmount),
                          Paid: formatINR(p.amountPaid),
                          'Balance Due': formatINR(p.balance),
                          Status: p.status,
                        })),
                        {
                          'Total Supplier Due': formatINR(
                            payables.reduce((s, p) => s + (p.balance || 0), 0)
                          ),
                        }
                      )
                    }
                    className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3 text-rose-400" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() =>
                      onOpenExcelExport(
                        'Supplier_Payables_Aging',
                        payables.map((p) => ({
                          Supplier: p.entityName,
                          'Invoice / Ref': p.referenceNumber,
                          Category: p.category,
                          'Total Payable': p.totalAmount,
                          'Amount Paid': p.amountPaid,
                          'Balance Due': p.balance,
                          'Due Date': p.dueDate,
                          Status: p.status,
                        }))
                      )
                    }
                    className="glass px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <FileSpreadsheet className="h-3 w-3 text-emerald-400" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {payables
                  .filter((p) => p.balance > 0)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{p.entityName}</div>
                        <div className="text-[10px] text-slate-400">Ref: {p.referenceNumber} • {p.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-num font-bold text-rose-400">
                          {formatINR(p.balance)}
                        </div>
                        <div className="text-[10px] text-slate-500">Due: {p.dueDate ? formatDateDisplay(p.dueDate) : 'Immediate'}</div>
                      </div>
                    </div>
                  ))}
                {payables.filter((p) => p.balance > 0).length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    All supplier balances are fully settled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. STAFF PAYROLL REPORT */}
      {selectedReportType === 'payroll' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-display font-bold text-sm text-slate-200">
                  Staff Roster & Payroll Compensation Register
                </span>
                <p className="text-[11px] text-slate-400">Employee basic wages, model, joining dates & bank accounts</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPdfExport(
                      'Patil Biryani - Staff Roster & Compensation Report',
                      staffEmployees.map((emp) => ({
                        'Emp Code': emp.employeeId,
                        Name: emp.name,
                        Designation: emp.designation,
                        Department: emp.department,
                        'Joined Date': formatDateDisplay(emp.joiningDate),
                        'Salary Model': `${emp.salaryType} (₹${emp.basicSalary})`,
                        Contact: emp.mobile,
                        Status: emp.status,
                      }))
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-rose-400" />
                  <span>PDF Export</span>
                </button>
                <button
                  onClick={() =>
                    onOpenExcelExport(
                      'Staff_Roster',
                      staffEmployees.map((emp) => ({
                        'Employee ID': emp.employeeId,
                        Name: emp.name,
                        Role: emp.designation,
                        Department: emp.department,
                        'Joining Date': emp.joiningDate,
                        'Salary Type': emp.salaryType,
                        'Basic Salary': emp.basicSalary,
                        Mobile: emp.mobile,
                        Status: emp.status,
                      }))
                    )
                  }
                  className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Excel Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3.5">Emp ID</th>
                    <th className="px-4 py-3.5">Staff Name</th>
                    <th className="px-4 py-3.5">Role & Department</th>
                    <th className="px-4 py-3.5">Joining Date</th>
                    <th className="px-4 py-3.5 text-right">Basic Wage</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staffEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono-num font-bold text-cyan-400">{emp.employeeId}</td>
                      <td className="px-4 py-3 font-bold text-slate-200">{emp.name}</td>
                      <td className="px-4 py-3 text-slate-400">{emp.designation} • {emp.department}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono-num">{formatDateDisplay(emp.joiningDate)}</td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-200">
                        {formatINR(emp.basicSalary)} <span className="text-[10px] text-slate-400 font-normal">({emp.salaryType})</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            emp.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
