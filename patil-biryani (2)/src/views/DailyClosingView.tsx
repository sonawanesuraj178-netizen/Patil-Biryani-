import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Save,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  QrCode,
  CreditCard,
  Building,
  RotateCcw,
  Calculator,
  Lock,
  Unlock,
  History,
  TrendingUp,
  Percent,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { DailyClosing } from '../types';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
} from '../utils/formatters';

interface DailyClosingViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
}

interface DenominationsState {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  n5: number;
  n2: number;
  n1: number;
  coins: number;
}

const emptyDenominations: DenominationsState = {
  n500: 0,
  n200: 0,
  n100: 0,
  n50: 0,
  n20: 0,
  n10: 0,
  n5: 0,
  n2: 0,
  n1: 0,
  coins: 0,
};

export const DailyClosingView: React.FC<DailyClosingViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
}) => {
  const {
    invoices,
    plateWiseSales,
    expenses,
    purchases,
    staffAdvances,
    receivables,
    receivablePayments,
    payables,
    payablePayments,
    dailyClosings,
    saveDailyClosing,
    deleteDailyClosing,
    reopenDay,
    businessProfile,
  } = useApp();
  const { toastSuccess } = useAppNotification();

  const [closingDate, setClosingDate] = useState<string>(getTodayDateString());
  const [openingCash, setOpeningCash] = useState<string>('0');
  const [actualPhysicalCash, setActualPhysicalCash] = useState<string>('0');
  const [actualUpiSettled, setActualUpiSettled] = useState<string>('');
  const [otherCashInflows, setOtherCashInflows] = useState<string>('0');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [denominations, setDenominations] = useState<DenominationsState>(emptyDenominations);
  const [showDenomCalculator, setShowDenomCalculator] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [historyTab, setHistoryTab] = useState<'current' | 'history'>('current');
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [closingToDelete, setClosingToDelete] = useState<{ idOrDate: string; date: string } | null>(null);

  const getDraftKey = (date: string) => `patil_biryani_v1_daily_closing_draft_${date}`;

  // Check if closing record exists for the selected date
  const savedRecord = useMemo(
    () => dailyClosings.find((dc) => dc.date === closingDate),
    [dailyClosings, closingDate]
  );

  // Day's transactions
  const dayInvoices = useMemo(
    () => invoices.filter((i) => i.date === closingDate),
    [invoices, closingDate]
  );

  const dayPlateSales = useMemo(
    () => plateWiseSales.filter((p) => p.date === closingDate),
    [plateWiseSales, closingDate]
  );

  const dayExpenses = useMemo(
    () => expenses.filter((e) => e.date === closingDate),
    [expenses, closingDate]
  );

  const dayPurchases = useMemo(
    () => purchases.filter((p) => p.date === closingDate),
    [purchases, closingDate]
  );

  const dayAdvances = useMemo(
    () => staffAdvances.filter((a) => a.date === closingDate),
    [staffAdvances, closingDate]
  );

  const dayPayablePayments = useMemo(
    () => payablePayments.filter((p) => p.date === closingDate),
    [payablePayments, closingDate]
  );

  const dayReceivablePayments = useMemo(
    () => receivablePayments.filter((r) => r.date === closingDate),
    [receivablePayments, closingDate]
  );

  // Revenue & Collections Calculations
  const salesSummary = useMemo(() => {
    let cashSales = 0;
    let upiSales = 0;
    let bankSales = 0;
    let cardSales = 0;
    let creditSales = 0;
    let totalPlates = 0;
    let grossTotal = 0;

    if (dayPlateSales.length > 0) {
      dayPlateSales.forEach((pws) => {
        cashSales += pws.cashSales || 0;
        upiSales += pws.upiSales || 0;
        bankSales += pws.bankSales || 0;
        cardSales += pws.cardSales || 0;
        creditSales += pws.creditSales || 0;
        totalPlates += pws.totalPlates || 0;
        grossTotal += pws.grandTotal || (pws.cashSales + pws.upiSales + pws.bankSales + pws.cardSales + (pws.creditSales || 0));
      });
    } else {
      dayInvoices.forEach((inv) => {
        const paid = typeof inv.amountPaid === 'number' ? inv.amountPaid : inv.grandTotal;
        grossTotal += inv.grandTotal;

        if (inv.paymentMode === 'Cash') {
          cashSales += paid;
        } else if (inv.paymentMode === 'UPI') {
          upiSales += paid;
        } else if (inv.paymentMode === 'Bank') {
          bankSales += paid;
        } else if (inv.paymentMode === 'Card') {
          cardSales += paid;
        } else if (inv.paymentMode === 'Credit') {
          creditSales += inv.balanceDue || inv.grandTotal;
        }

        if (inv.balanceDue > 0 && inv.paymentMode !== 'Credit') {
          creditSales += inv.balanceDue;
        }

        inv.items.forEach((item) => {
          totalPlates += item.quantity || 0;
        });
      });
    }

    // Include customer receivable payments recovered today
    let cashReceivables = 0;
    let upiReceivables = 0;
    let bankReceivables = 0;

    dayReceivablePayments.forEach((rec) => {
      if (rec.paymentMode === 'Cash') cashReceivables += rec.amount || 0;
      else if (rec.paymentMode === 'UPI') upiReceivables += rec.amount || 0;
      else bankReceivables += rec.amount || 0;
    });

    const netSales = cashSales + upiSales + bankSales + cardSales;

    return {
      cashSales,
      upiSales,
      bankSales,
      cardSales,
      creditSales,
      totalPlates,
      grossTotal,
      netSales,
      cashReceivables,
      upiReceivables,
      bankReceivables,
      totalReceivablesRecovered: cashReceivables + upiReceivables + bankReceivables,
    };
  }, [dayPlateSales, dayInvoices, dayReceivablePayments]);

  // Outflows & Disbursements Calculations
  const outflowsSummary = useMemo(() => {
    let cashExpenses = 0;
    let onlineExpenses = 0;

    dayExpenses.forEach((exp) => {
      if (exp.paymentMode === 'Cash') {
        cashExpenses += exp.amount || 0;
      } else {
        onlineExpenses += exp.amount || 0;
      }
    });

    let cashPurchases = 0;
    let onlinePurchases = 0;

    dayPurchases.forEach((p) => {
      if (p.paymentMode === 'Cash') {
        cashPurchases += p.paidAmount || 0;
      } else {
        onlinePurchases += p.paidAmount || 0;
      }
    });

    const cashAdvances = dayAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);

    // Payables settled today
    let cashPayables = 0;
    let onlinePayables = 0;

    dayPayablePayments.forEach((pay) => {
      if (pay.paymentMode === 'Cash') {
        cashPayables += pay.amount || 0;
      } else {
        onlinePayables += pay.amount || 0;
      }
    });

    const totalCashOutflow = cashExpenses + cashPurchases + cashAdvances + cashPayables;
    const totalOutflows = totalCashOutflow + onlineExpenses + onlinePurchases + onlinePayables;

    return {
      cashExpenses,
      onlineExpenses,
      totalExpenses: cashExpenses + onlineExpenses,
      cashPurchases,
      onlinePurchases,
      totalPurchases: cashPurchases + onlinePurchases,
      cashAdvances,
      cashPayables,
      onlinePayables,
      totalPayablesPaid: cashPayables + onlinePayables,
      totalCashOutflow,
      totalOutflows,
    };
  }, [dayExpenses, dayPurchases, dayAdvances, dayPayablePayments]);

  // Denominations Total Calculation
  const denominationsTotal = useMemo(() => {
    return (
      (denominations.n500 || 0) * 500 +
      (denominations.n200 || 0) * 200 +
      (denominations.n100 || 0) * 100 +
      (denominations.n50 || 0) * 50 +
      (denominations.n20 || 0) * 20 +
      (denominations.n10 || 0) * 10 +
      (denominations.n5 || 0) * 5 +
      (denominations.n2 || 0) * 2 +
      (denominations.n1 || 0) * 1 +
      (denominations.coins || 0)
    );
  }, [denominations]);

  // Synchronize state whenever closing date changes (with strict zero handling & draft recovery)
  useEffect(() => {
    if (savedRecord) {
      setIsDraftRestored(false);
      setLastAutoSavedTime(null);
      // Load saved record: honor exact 0 values!
      setOpeningCash(
        savedRecord.openingCash !== undefined && savedRecord.openingCash !== null
          ? savedRecord.openingCash.toString()
          : '0'
      );
      setActualPhysicalCash(
        savedRecord.actualCash !== undefined && savedRecord.actualCash !== null
          ? savedRecord.actualCash.toString()
          : '0'
      );
      setActualUpiSettled(
        savedRecord.actualUpiSettled !== undefined && savedRecord.actualUpiSettled !== null
          ? savedRecord.actualUpiSettled.toString()
          : salesSummary.upiSales > 0
          ? salesSummary.upiSales.toString()
          : ''
      );
      setOtherCashInflows(
        savedRecord.otherCashInflows !== undefined && savedRecord.otherCashInflows !== null
          ? savedRecord.otherCashInflows.toString()
          : '0'
      );
      setClosingNotes(savedRecord.notes || '');
      if (savedRecord.denominations) {
        setDenominations({
          n500: savedRecord.denominations.n500 || 0,
          n200: savedRecord.denominations.n200 || 0,
          n100: savedRecord.denominations.n100 || 0,
          n50: savedRecord.denominations.n50 || 0,
          n20: savedRecord.denominations.n20 || 0,
          n10: savedRecord.denominations.n10 || 0,
          n5: savedRecord.denominations.n5 || 0,
          n2: savedRecord.denominations.n2 || 0,
          n1: savedRecord.denominations.n1 || 0,
          coins: savedRecord.denominations.coins || 0,
        });
      } else {
        setDenominations(emptyDenominations);
      }
    } else {
      // Check for an uncommitted local draft for this date
      let draftLoaded = false;
      try {
        const rawDraft = localStorage.getItem(getDraftKey(closingDate));
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft) {
            if (draft.openingCash !== undefined) setOpeningCash(draft.openingCash);
            if (draft.actualPhysicalCash !== undefined) setActualPhysicalCash(draft.actualPhysicalCash);
            if (draft.actualUpiSettled !== undefined) setActualUpiSettled(draft.actualUpiSettled);
            if (draft.otherCashInflows !== undefined) setOtherCashInflows(draft.otherCashInflows);
            if (draft.closingNotes !== undefined) setClosingNotes(draft.closingNotes);
            if (draft.denominations) setDenominations(draft.denominations);
            setLastAutoSavedTime(draft.savedAt || null);
            setIsDraftRestored(true);
            draftLoaded = true;
          }
        }
      } catch {}

      if (!draftLoaded) {
        setIsDraftRestored(false);
        setLastAutoSavedTime(null);
        // Find yesterday's closing to auto-carry opening balance if available
        const dateObj = new Date(closingDate);
        dateObj.setDate(dateObj.getDate() - 1);
        const yesterdayStr = dateObj.toISOString().split('T')[0];
        const yesterdayClosing = dailyClosings.find((dc) => dc.date === yesterdayStr);

        if (yesterdayClosing && yesterdayClosing.actualCash !== undefined) {
          setOpeningCash(yesterdayClosing.actualCash.toString());
        } else {
          setOpeningCash('0');
        }

        // Default expected physical cash based on current sales & expenses
        const derivedExpected =
          (yesterdayClosing?.actualCash || 0) +
          salesSummary.cashSales -
          outflowsSummary.totalCashOutflow;

        setActualPhysicalCash(Math.max(0, derivedExpected).toString());
        setActualUpiSettled(salesSummary.upiSales > 0 ? salesSummary.upiSales.toString() : '');
        setOtherCashInflows('0');
        setClosingNotes('');
        setDenominations(emptyDenominations);
      }
    }
  }, [closingDate, savedRecord, salesSummary.upiSales]);

  // Continuous 1-Second Auto-Save Function for Daily Closing Draft
  const performClosingDraftSave = useCallback(() => {
    // Only auto-save if this date does not have a saved/closed record
    if (savedRecord?.isClosed) return;

    const hasAnyInput =
      openingCash !== '0' ||
      actualPhysicalCash !== '0' ||
      actualUpiSettled !== '' ||
      otherCashInflows !== '0' ||
      closingNotes.trim().length > 0 ||
      Object.values(denominations).some((v) => Number(v) > 0);

    if (hasAnyInput) {
      try {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        localStorage.setItem(
          getDraftKey(closingDate),
          JSON.stringify({
            openingCash,
            actualPhysicalCash,
            actualUpiSettled,
            otherCashInflows,
            closingNotes,
            denominations,
            savedAt: timeStr,
          })
        );
        setLastAutoSavedTime(timeStr);
      } catch (err) {
        console.error('Failed to auto-save closing draft', err);
      }
    }
  }, [closingDate, openingCash, actualPhysicalCash, actualUpiSettled, otherCashInflows, closingNotes, denominations, savedRecord]);

  // Immediate save on user interaction
  useEffect(() => {
    performClosingDraftSave();
  }, [performClosingDraftSave]);

  // Continuous 1-Second Recurring Auto-Save Heartbeat & Lifecycle Flush for Daily Closing
  useEffect(() => {
    const timer = setInterval(() => {
      performClosingDraftSave();
    }, 1000);

    const handleFlush = () => {
      performClosingDraftSave();
    };

    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('pagehide', handleFlush);
    window.addEventListener('blur', handleFlush);
    const handleVisChange = () => {
      if (document.visibilityState === 'hidden') handleFlush();
    };
    document.addEventListener('visibilitychange', handleVisChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleFlush);
      window.removeEventListener('pagehide', handleFlush);
      window.removeEventListener('blur', handleFlush);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, [performClosingDraftSave]);

  // Safe numerical conversions for live formulas
  const openCashNum = openingCash.trim() === '' ? 0 : Number(openingCash) || 0;
  const actualCashNum = actualPhysicalCash.trim() === '' ? 0 : Number(actualPhysicalCash) || 0;
  const otherInflowsNum = otherCashInflows.trim() === '' ? 0 : Number(otherCashInflows) || 0;
  const actualUpiNum = actualUpiSettled.trim() === '' ? salesSummary.upiSales : Number(actualUpiSettled) || 0;

  // Drawer Cash Reconciliation Formula:
  // Expected Cash = Opening Cash + Cash Sales + Other Cash Inflows - Cash Outflows
  const expectedCashInDrawer = openCashNum + salesSummary.cashSales + otherInflowsNum - outflowsSummary.totalCashOutflow;
  const cashDifference = actualCashNum - expectedCashInDrawer; // > 0 is Excess, < 0 is Shortage

  // UPI Reconciliation Formula:
  // UPI Difference = Actual Settled - System Recorded UPI Sales
  const upiDifference = actualUpiNum - salesSummary.upiSales;

  // Operating Net Profit Formula:
  // Net Profit = Gross Sales - Total Expenses - Total Purchases
  const operatingNetProfit = salesSummary.grossTotal - outflowsSummary.totalExpenses - outflowsSummary.totalPurchases;

  // Status calculation
  const closingStatus: 'Balanced' | 'Excess' | 'Shortage' =
    Math.abs(cashDifference) < 5 ? 'Balanced' : cashDifference > 0 ? 'Excess' : 'Shortage';

  // Apply denomination count to actual physical cash
  const handleApplyDenominations = () => {
    setActualPhysicalCash(denominationsTotal.toString());
    setShowDenomCalculator(false);
  };

  // Quick Match UPI helper
  const handleMatchSystemUpi = () => {
    setActualUpiSettled(salesSummary.upiSales.toString());
  };

  // Save Daily Closing Form Submission
  const handleSaveClosing = (e: React.FormEvent) => {
    e.preventDefault();

    const closingData: DailyClosing = {
      id: savedRecord?.id || `close_${closingDate.replace(/-/g, '')}`,
      date: closingDate,
      openingCash: openCashNum,
      totalSales: salesSummary.grossTotal,
      totalPlates: salesSummary.totalPlates,
      cashSales: salesSummary.cashSales,
      upiSales: salesSummary.upiSales,
      bankSales: salesSummary.bankSales,
      cardSales: salesSummary.cardSales,
      creditSales: salesSummary.creditSales,
      actualUpiSettled: actualUpiNum,
      upiDifference,
      cashExpenses: outflowsSummary.cashExpenses,
      onlineExpenses: outflowsSummary.onlineExpenses,
      totalExpenses: outflowsSummary.totalExpenses,
      cashAdvances: outflowsSummary.cashAdvances,
      cashPurchases: outflowsSummary.cashPurchases,
      totalPurchases: outflowsSummary.totalPurchases,
      otherCashInflows: otherInflowsNum,
      customerReceivablesAdded: salesSummary.creditSales,
      supplierPayablesAdded: outflowsSummary.totalPurchases - outflowsSummary.cashPurchases,
      netProfit: operatingNetProfit,
      expectedCash: expectedCashInDrawer,
      actualCash: actualCashNum,
      cashDifference,
      status: closingStatus,
      denominations: { ...denominations },
      closingCash: actualCashNum,
      closingBank: 0,
      closingUPI: actualUpiNum,
      closingCard: salesSummary.cardSales,
      totalClosingBalance: actualCashNum + actualUpiNum + salesSummary.cardSales,
      isClosed: true,
      closedAt: `${closingDate} ${new Date().toLocaleTimeString('en-IN')}`,
      closedBy: businessProfile.ownerName || 'Suraj Patil',
      notes: closingNotes || 'Day closing calculated and locked.',
    };

    saveDailyClosing(closingData);
    try {
      localStorage.removeItem(getDraftKey(closingDate));
    } catch {}
    setIsDraftRestored(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Export Daily Closing Statement PDF
  const handleExportDailyClosingPDF = () => {
    const reportRows = [
      { 'Accounting Particulars': '1. Morning Opening Cash in Drawer', Category: 'Inflow', 'Amount (₹)': formatINR(openCashNum) },
      { 'Accounting Particulars': '2. Daily Cash Sales Collections', Category: 'Inflow', 'Amount (₹)': formatINR(salesSummary.cashSales) },
      { 'Accounting Particulars': '3. Customer Credit Receivables Collected (Cash)', Category: 'Inflow', 'Amount (₹)': formatINR(salesSummary.cashReceivables) },
      { 'Accounting Particulars': '4. Other Cash Inflows (Deposits/Recoveries)', Category: 'Inflow', 'Amount (₹)': formatINR(otherInflowsNum) },
      { 'Accounting Particulars': '5. Total Cash Drawer Inflows', Category: 'Inflow', 'Amount (₹)': formatINR(openCashNum + salesSummary.cashSales + salesSummary.cashReceivables + otherInflowsNum) },
      { 'Accounting Particulars': '6. Cash Expenses Paid from Drawer', Category: 'Outflow', 'Amount (₹)': formatINR(outflowsSummary.cashExpenses) },
      { 'Accounting Particulars': '7. Staff Salary Advances Paid in Cash', Category: 'Outflow', 'Amount (₹)': formatINR(outflowsSummary.cashAdvances) },
      { 'Accounting Particulars': '8. Cash Raw Material Purchases Paid', Category: 'Outflow', 'Amount (₹)': formatINR(outflowsSummary.cashPurchases) },
      { 'Accounting Particulars': '9. Supplier & Creditor Payables Paid in Cash', Category: 'Outflow', 'Amount (₹)': formatINR(outflowsSummary.cashPayables) },
      { 'Accounting Particulars': '10. Total Cash Drawer Outflows', Category: 'Outflow', 'Amount (₹)': formatINR(outflowsSummary.totalCashOutflow) },
      { 'Accounting Particulars': '11. System Expected Physical Cash in Hand', Category: 'Reconciliation', 'Amount (₹)': formatINR(expectedCashInDrawer) },
      { 'Accounting Particulars': '12. Actual Physical Cash Counted in Drawer', Category: 'Reconciliation', 'Amount (₹)': formatINR(actualCashNum) },
      {
        'Accounting Particulars': '13. Cash Reconciliation Difference / Variance',
        Category: 'Reconciliation',
        'Amount (₹)': `${cashDifference >= 0 ? '+' : ''}${formatINR(cashDifference)} (${closingStatus})`,
      },
      { 'Accounting Particulars': '14. System Recorded UPI / QR Sales', Category: 'Digital Payments', 'Amount (₹)': formatINR(salesSummary.upiSales) },
      { 'Accounting Particulars': '15. Actual Bank / Merchant QR Settled Amount', Category: 'Digital Payments', 'Amount (₹)': formatINR(actualUpiNum) },
      { 'Accounting Particulars': '16. UPI Settlement Variance', Category: 'Digital Payments', 'Amount (₹)': `${upiDifference >= 0 ? '+' : ''}${formatINR(upiDifference)}` },
      { 'Accounting Particulars': '17. Bank Transfer & POS Card Sales', Category: 'Digital Payments', 'Amount (₹)': formatINR(salesSummary.bankSales + salesSummary.cardSales) },
      { 'Accounting Particulars': '18. Total Gross Day Revenue (All Modes)', Category: 'Business Performance', 'Amount (₹)': formatINR(salesSummary.grossTotal) },
      { 'Accounting Particulars': '19. Total Operating Day Expenses & Purchases', Category: 'Business Performance', 'Amount (₹)': formatINR(outflowsSummary.totalExpenses + outflowsSummary.totalPurchases + outflowsSummary.totalPayablesPaid) },
      { 'Accounting Particulars': '20. Net Daily Operating Profit', Category: 'Business Performance', 'Amount (₹)': formatINR(operatingNetProfit) },
    ];

    onOpenPdfExport(
      `Patil Biryani - Daily Closing & Reconciliation Statement (${formatDateDisplay(closingDate)})`,
      reportRows,
      {
        'Opening Cash': formatINR(openCashNum),
        'Gross Sales': formatINR(salesSummary.grossTotal),
        'Cash Collections': formatINR(salesSummary.cashSales),
        'UPI Settled': formatINR(actualUpiNum),
        'Cash Outflows': formatINR(outflowsSummary.totalCashOutflow),
        'Physical Cash': formatINR(actualCashNum),
        'Drawer Status': closingStatus,
        'Net Profit': formatINR(operatingNetProfit),
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Date Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
              <CalendarCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
                <span>Daily Closing &amp; Cash Reconciliation</span>
                {savedRecord?.isClosed && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>LOCKED &amp; SAVED</span>
                  </span>
                )}
                {!savedRecord?.isClosed && lastAutoSavedTime && (
                  <span
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm"
                    title={`Inputs continuously auto-saved every second. Last saved at ${lastAutoSavedTime}`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Auto-saved (1s)</span>
                  </span>
                )}
                {!savedRecord?.isClosed && isDraftRestored && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20">
                    <span>Draft Restored</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reconcile counter opening cash, shift sales, UPI settlements, expenses, and physical drawer count
              </p>
            </div>
          </div>
        </div>

        {/* Date and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Tabs */}
          <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => setClosingDate(getTodayDateString())}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                closingDate === getTodayDateString()
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setClosingDate(d.toISOString().split('T')[0]);
              }}
              className="px-3 py-1 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition-all"
            >
              Yesterday
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400 font-semibold">Date:</span>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="bg-transparent text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* PDF Statement Button */}
          <button
            type="button"
            onClick={handleExportDailyClosingPDF}
            className="glass px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 border border-white/10 hover:border-emerald-500/40 hover:bg-slate-800 transition-all shadow-sm"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Print Statement</span>
          </button>

          {/* View Tab Toggle */}
          <button
            type="button"
            onClick={() => setHistoryTab(historyTab === 'current' ? 'history' : 'current')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              historyTab === 'history'
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'glass text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <History className="h-4 w-4" />
            <span>{historyTab === 'history' ? 'Back to Editor' : `Closing History (${dailyClosings.length})`}</span>
          </button>
        </div>
      </div>

      {historyTab === 'history' ? (
        /* Daily Closings Audit History Table */
        <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-400" />
                <span>Historical Daily Closing Audit Ledger</span>
              </h3>
              <p className="text-xs text-slate-400">
                All confirmed shift reconciliations and variance records
              </p>
            </div>
            <button
              onClick={() => setHistoryTab('current')}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Close History View
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <th className="py-3 px-4">Closing Date</th>
                  <th className="py-3 px-4">Opening Cash</th>
                  <th className="py-3 px-4">Gross Sales</th>
                  <th className="py-3 px-4">Cash Sales</th>
                  <th className="py-3 px-4">UPI Settled</th>
                  <th className="py-3 px-4">Cash Expenses</th>
                  <th className="py-3 px-4">Expected Cash</th>
                  <th className="py-3 px-4">Actual Cash</th>
                  <th className="py-3 px-4">Variance</th>
                  <th className="py-3 px-4">Net Profit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {dailyClosings.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-500 text-xs">
                      No daily closing records locked yet. Reconcile today's shift above to create your first record.
                    </td>
                  </tr>
                ) : (
                  dailyClosings.map((dc) => {
                    const diff = dc.cashDifference ?? ((dc.actualCash || 0) - (dc.expectedCash || 0));
                    const isBalanced = Math.abs(diff) < 5;
                    return (
                      <tr key={dc.id || dc.date} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-slate-200">
                          {formatDateDisplay(dc.date)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{formatINR(dc.openingCash || 0)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">{formatINR(dc.totalSales || 0)}</td>
                        <td className="py-3 px-4 text-slate-200">{formatINR(dc.cashSales || 0)}</td>
                        <td className="py-3 px-4 text-cyan-400">{formatINR(dc.actualUpiSettled || dc.upiSales || 0)}</td>
                        <td className="py-3 px-4 text-rose-400">{formatINR(dc.cashExpenses || 0)}</td>
                        <td className="py-3 px-4 text-slate-300">{formatINR(dc.expectedCash || 0)}</td>
                        <td className="py-3 px-4 font-bold text-amber-300">{formatINR(dc.actualCash || 0)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isBalanced
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                                : diff > 0
                                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                                : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {diff >= 0 ? '+' : ''}
                            {formatINR(diff)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-teal-300">{formatINR(dc.netProfit || 0)}</td>
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isBalanced
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : diff > 0
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {dc.status || (isBalanced ? 'Balanced' : diff > 0 ? 'Excess' : 'Shortage')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setClosingDate(dc.date);
                              setHistoryTab('current');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                            title="Edit or review this daily closing record"
                          >
                            Edit / View
                          </button>
                          <button
                            type="button"
                            onClick={() => setClosingToDelete({ idOrDate: dc.id || dc.date, date: dc.date })}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 text-xs font-bold transition-all border border-rose-500/20 inline-flex items-center justify-center align-middle"
                            title={`Delete closing record for ${formatDateDisplay(dc.date)}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Active Daily Closing Form */
        <form onSubmit={handleSaveClosing} className="space-y-6">
          {/* Top Quick KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="glass-card rounded-2xl p-3.5 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Opening Cash</span>
              <div className="text-base font-black font-mono-num text-slate-200">{formatINR(openCashNum)}</div>
              <span className="text-[10.5px] text-slate-500">Counter float</span>
            </div>

            <div className="glass-card rounded-2xl p-3.5 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider block">Gross Sales</span>
              <div className="text-base font-black font-mono-num text-emerald-400">{formatINR(salesSummary.grossTotal)}</div>
              <span className="text-[10.5px] text-slate-500">{salesSummary.totalPlates} plates sold</span>
            </div>

            <div className="glass-card rounded-2xl p-3.5 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider block">Cash Inflows</span>
              <div className="text-base font-black font-mono-num text-cyan-300">{formatINR(salesSummary.cashSales + otherInflowsNum)}</div>
              <span className="text-[10.5px] text-slate-500">Cash sales + other</span>
            </div>

            <div className="glass-card rounded-2xl p-3.5 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider block">Cash Outflows</span>
              <div className="text-base font-black font-mono-num text-rose-400">{formatINR(outflowsSummary.totalCashOutflow)}</div>
              <span className="text-[10.5px] text-slate-500">Expenses + advances</span>
            </div>

            <div className="glass-card rounded-2xl p-3.5 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block">Physical Cash</span>
              <div className="text-base font-black font-mono-num text-amber-300">{formatINR(actualCashNum)}</div>
              <span className="text-[10.5px] text-slate-500">Counted in drawer</span>
            </div>

            <div
              className={`rounded-2xl p-3.5 border space-y-1 ${
                Math.abs(cashDifference) < 5
                  ? 'bg-emerald-950/40 border-emerald-500/30'
                  : cashDifference > 0
                  ? 'bg-cyan-950/40 border-cyan-500/30'
                  : 'bg-rose-950/40 border-rose-500/30'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  Math.abs(cashDifference) < 5
                    ? 'text-emerald-400'
                    : cashDifference > 0
                    ? 'text-cyan-400'
                    : 'text-rose-400'
                }`}
              >
                Cash Variance
              </span>
              <div
                className={`text-base font-black font-mono-num ${
                  Math.abs(cashDifference) < 5
                    ? 'text-emerald-300'
                    : cashDifference > 0
                    ? 'text-cyan-300'
                    : 'text-rose-300'
                }`}
              >
                {cashDifference >= 0 ? '+' : ''}
                {formatINR(cashDifference)}
              </div>
              <span className="text-[10.5px] opacity-80 block truncate">
                {Math.abs(cashDifference) < 5 ? 'Exact match ✓' : cashDifference > 0 ? 'Surplus cash' : 'Shortage'}
              </span>
            </div>
          </div>

          {/* 3 Major Structural Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Sales & Collections Inflow */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                    <span>1. Collections &amp; Sales Inflow</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">{formatDateDisplay(closingDate)}</span>
                </div>

                {/* Opening Cash Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
                    <span>Morning Opening Cash (₹)</span>
                    <span className="text-[10px] text-slate-500">Carried from morning float</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm font-mono-num font-bold text-slate-100 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>

                {/* Other Cash Inflow Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
                    <span>Other Cash Inflows (₹)</span>
                    <span className="text-[10px] text-slate-500">Khata recoveries / capital</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={otherCashInflows}
                    onChange={(e) => setOtherCashInflows(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-sm font-mono-num font-semibold text-slate-200"
                    placeholder="0"
                  />
                </div>

                {/* Itemized Sales Inflows */}
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-2.5 text-xs font-mono-num">
                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Cash Sales:</span>
                    </span>
                    <span className="font-mono-num font-bold text-slate-100">{formatINR(salesSummary.cashSales)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>UPI / QR Sales:</span>
                    </span>
                    <span className="font-mono-num font-bold text-emerald-400">{formatINR(salesSummary.upiSales)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Card / POS Machine:</span>
                    </span>
                    <span className="font-mono-num font-bold text-cyan-300">{formatINR(salesSummary.cardSales)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span className="flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>Bank NEFT / Direct:</span>
                    </span>
                    <span className="font-mono-num font-bold text-indigo-300">{formatINR(salesSummary.bankSales)}</span>
                  </div>

                  {salesSummary.cashReceivables > 0 && (
                    <div className="flex justify-between items-center text-slate-300 font-sans">
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <ArrowDownLeft className="h-3.5 w-3.5 shrink-0" />
                        <span>Credit Recoveries (Cash):</span>
                      </span>
                      <span className="font-mono-num font-bold text-emerald-400">+{formatINR(salesSummary.cashReceivables)}</span>
                    </div>
                  )}

                  {salesSummary.creditSales > 0 && (
                    <div className="flex justify-between items-center text-slate-400 font-sans">
                      <span>Customer Khata (Due):</span>
                      <span className="font-mono-num font-semibold text-rose-300">{formatINR(salesSummary.creditSales)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-100 pt-2.5 border-t border-white/10 font-bold font-sans">
                    <span>Total Day Revenue:</span>
                    <span className="font-mono-num text-sm text-emerald-400 font-black">{formatINR(salesSummary.grossTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Total Inflow Badge */}
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs flex justify-between items-center">
                <span className="text-slate-300 font-bold">Total Cash Added to Drawer:</span>
                <span className="font-mono-num font-black text-emerald-400 text-sm">
                  {formatINR(openCashNum + salesSummary.cashSales + salesSummary.cashReceivables + otherInflowsNum)}
                </span>
              </div>
            </div>

            {/* Column 2: UPI Reconciliation & Cash Outflows */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-cyan-400" />
                    <span>2. UPI Settlement &amp; Outflows</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Digital &amp; Expenses</span>
                </div>

                {/* UPI Reconciliation Card */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5" />
                      <span>UPI / QR Merchant Reconciliation</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleMatchSystemUpi}
                      className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[10px] border border-cyan-500/30"
                    >
                      Match System UPI
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono-num">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">System UPI Sales:</span>
                      <span className="font-bold text-slate-200">{formatINR(salesSummary.upiSales)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Actual Bank Settled (₹):</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={actualUpiSettled}
                        onChange={(e) => setActualUpiSettled(e.target.value)}
                        placeholder={salesSummary.upiSales.toString()}
                        className="w-full glass-input px-2.5 py-1 text-xs font-mono-num font-bold text-cyan-300"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20 font-sans">
                    <span className="text-[11px] text-slate-400">UPI Settlement Diff:</span>
                    <span
                      className={`font-mono-num font-bold text-xs ${
                        Math.abs(upiDifference) < 5 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {upiDifference >= 0 ? '+' : ''}
                      {formatINR(upiDifference)} {Math.abs(upiDifference) < 5 ? '✓ Settled' : '(Variance)'}
                    </span>
                  </div>
                </div>

                {/* Itemized Cash Outflows */}
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-2.5 text-xs font-mono-num">
                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span>Cash Expenses ({dayExpenses.filter((e) => e.paymentMode === 'Cash').length}):</span>
                    <span className="font-mono-num font-bold text-rose-400">{formatINR(outflowsSummary.cashExpenses)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span>Staff Salary Advances ({dayAdvances.length}):</span>
                    <span className="font-mono-num font-bold text-amber-400">{formatINR(outflowsSummary.cashAdvances)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 font-sans">
                    <span>Cash Raw Material Purchases:</span>
                    <span className="font-mono-num font-bold text-rose-400">{formatINR(outflowsSummary.cashPurchases)}</span>
                  </div>

                  {outflowsSummary.cashPayables > 0 && (
                    <div className="flex justify-between items-center text-slate-300 font-sans">
                      <span className="text-rose-300">Supplier Payables Paid (Cash):</span>
                      <span className="font-mono-num font-bold text-rose-400">-{formatINR(outflowsSummary.cashPayables)}</span>
                    </div>
                  )}

                  {outflowsSummary.onlineExpenses > 0 && (
                    <div className="flex justify-between items-center text-slate-400 font-sans">
                      <span>Online / UPI Paid Expenses:</span>
                      <span className="font-mono-num font-semibold text-slate-300">{formatINR(outflowsSummary.onlineExpenses)}</span>
                    </div>
                  )}

                  {outflowsSummary.onlinePayables > 0 && (
                    <div className="flex justify-between items-center text-slate-400 font-sans">
                      <span>Supplier Payables Paid (Online/Bank):</span>
                      <span className="font-mono-num font-semibold text-slate-300">{formatINR(outflowsSummary.onlinePayables)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-100 pt-2.5 border-t border-white/10 font-bold font-sans">
                    <span>Total Cash Paid from Drawer:</span>
                    <span className="font-mono-num text-sm text-rose-400 font-black">{formatINR(outflowsSummary.totalCashOutflow)}</span>
                  </div>
                </div>
              </div>

              {/* Operating Profit Summary Badge */}
              <div className="p-3 rounded-2xl bg-teal-950/30 border border-teal-500/20 text-xs flex justify-between items-center">
                <span className="text-slate-300 font-bold">Estimated Day Net Profit:</span>
                <span className={`font-mono-num font-black text-sm ${operatingNetProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {formatINR(operatingNetProfit)}
                </span>
              </div>
            </div>

            {/* Column 3: Physical Cash Count & Reconciliation */}
            <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span>3. Physical Cash &amp; Drawer Audit</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Reconciliation</span>
                </div>

                {/* Expected Cash in Hand */}
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>System Expected Drawer Cash:</span>
                    <span className="font-mono-num text-base font-black text-slate-100">
                      {formatINR(expectedCashInDrawer)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Formula: (Opening ₹{openCashNum} + Cash Sales ₹{salesSummary.cashSales} + Recoveries ₹{salesSummary.cashReceivables} + Other ₹{otherInflowsNum}) - Outflows ₹{outflowsSummary.totalCashOutflow}
                  </div>
                </div>

                {/* Actual Physical Cash Counted Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      Actual Physical Cash Counted (₹) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDenomCalculator(!showDenomCalculator)}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
                    >
                      <Calculator className="h-3 w-3" />
                      <span>{showDenomCalculator ? 'Hide Counter' : 'Denominations Calculator'}</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={actualPhysicalCash}
                    onChange={(e) => setActualPhysicalCash(e.target.value)}
                    className="w-full glass-input px-3.5 py-2 text-lg font-mono-num font-black text-amber-400 focus:border-amber-400"
                    placeholder="0"
                  />
                </div>

                {/* Denominations Counter Dropdown (If expanded) */}
                {showDenomCalculator && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 pb-1.5 border-b border-white/10">
                      <span>Currency Denominations Counter</span>
                      <span className="font-mono-num text-sm text-emerald-400">{formatINR(denominationsTotal)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
                      {[
                        { label: '₹500 x', key: 'n500', mult: 500 },
                        { label: '₹200 x', key: 'n200', mult: 200 },
                        { label: '₹100 x', key: 'n100', mult: 100 },
                        { label: '₹50 x', key: 'n50', mult: 50 },
                        { label: '₹20 x', key: 'n20', mult: 20 },
                        { label: '₹10 x', key: 'n10', mult: 10 },
                        { label: '₹5 x', key: 'n5', mult: 5 },
                        { label: 'Coins (₹)', key: 'coins', mult: 1 },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 w-16">{item.label}</span>
                          <input
                            type="number"
                            min="0"
                            value={(denominations as any)[item.key] || ''}
                            onChange={(e) =>
                              setDenominations({
                                ...denominations,
                                [item.key]: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            placeholder="0"
                            className="w-16 glass-input px-2 py-1 text-xs text-center font-bold text-slate-100"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleApplyDenominations}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-sm hover:scale-[1.02] transition-all"
                      >
                        Apply Total ({formatINR(denominationsTotal)})
                      </button>
                    </div>
                  </div>
                )}

                {/* Discrepancy Status Card */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                    Math.abs(cashDifference) < 5
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : cashDifference > 0
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-sm">
                      {Math.abs(cashDifference) < 5
                        ? 'Drawer Perfectly Balanced ✓'
                        : cashDifference > 0
                        ? 'Cash Excess / Surplus'
                        : 'Cash Shortage / Deficit'}
                    </span>
                    <span className="text-[10.5px] opacity-80">
                      {Math.abs(cashDifference) < 5
                        ? 'Physical cash exactly tallies with system calculation'
                        : `Net Discrepancy: ${formatINR(Math.abs(cashDifference))}`}
                    </span>
                  </div>
                  <div className="font-mono-num text-base font-black">
                    {cashDifference >= 0 ? '+' : ''}
                    {formatINR(cashDifference)}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Match Button */}
              <button
                type="button"
                onClick={() => setActualPhysicalCash(Math.max(0, expectedCashInDrawer).toString())}
                className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
              >
                Auto-Fill Expected Cash ({formatINR(expectedCashInDrawer)})
              </button>
            </div>
          </div>

          {/* Shift Notes & Lock Action Bar */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Daily Closing Shift Notes / Audit Remarks
              </label>
              <input
                type="text"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="e.g. Counter handed over to morning shift. All LPG cylinders filled. Rs. 200 petty cash kept in drawer."
                className="w-full glass-input px-3.5 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {savedSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Daily Closing for {formatDateDisplay(closingDate)} locked and saved to master ledger!</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  All transactions and cash float for {formatDateDisplay(closingDate)} will be immutably locked and archived.
                </div>
              )}

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportDailyClosingPDF}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-all"
                >
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>Export Statement</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save className="h-4 w-4 stroke-[2.5]" />
                  <span>{savedRecord ? 'Update & Lock Closing' : 'Save & Lock Daily Closing'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Delete Daily Closing Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!closingToDelete}
        title="Delete Daily Closing Record"
        message={`Are you sure you want to permanently delete the locked daily closing statement for ${
          closingToDelete ? formatDateDisplay(closingToDelete.date) : ''
        }? This will remove the locked snapshot from the audit history.`}
        confirmText="Yes, Delete Record"
        cancelText="Keep Record"
        onConfirm={() => {
          if (closingToDelete) {
            deleteDailyClosing(closingToDelete.idOrDate);
            try {
              localStorage.removeItem(getDraftKey(closingToDelete.date));
            } catch {}
            toastSuccess(`Daily closing for ${formatDateDisplay(closingToDelete.date)} deleted successfully.`);
            setClosingToDelete(null);
          }
        }}
        onCancel={() => setClosingToDelete(null)}
      />
    </div>
  );
};
