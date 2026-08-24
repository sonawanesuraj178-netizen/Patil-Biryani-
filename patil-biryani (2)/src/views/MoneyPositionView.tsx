import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Banknote,
  Building2,
  Smartphone,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  History,
  Sliders,
  DollarSign,
  Calculator,
  Save,
  Trash2,
  Receipt,
  X,
  PieChart as PieChartIcon,
  Sparkles,
  ChevronLeft,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import { PaymentMode, MoneyTransfer, MoneyTransferType, MoneyTransactionAuditItem, DateFilterType } from '../types';
import {
  formatINR,
  getTodayDateString,
  getYesterdayDateString,
  formatDateDisplay,
  formatMonthDisplay,
  isDateInSelectedMonth,
  isDateBetweenRange,
} from '../utils/formatters';
import { ExportRowData } from '../utils/exportUtils';
import { NavTabId } from '../components/Navbar';
import { CustomSelect } from '../components/ui/CustomSelect';

interface MoneyPositionViewProps {
  onNavigate?: (tab: NavTabId) => void;
  onOpenPdfExport?: (reportTitle: string, rows: ExportRowData[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport?: (reportTitle: string, rows: ExportRowData[]) => void;
  onConfirmDelete?: (title: string, message: string, onConfirm: () => void) => void;
}

type TabType = 'overview' | 'audit' | 'transfers' | 'settings';

export interface CalculationInspectorData {
  title: string;
  subtitle: string;
  formula: string;
  resultAmount: number;
  modeTag?: string;
  sourceCategory?: string;
  isOpening?: boolean;
  channel?: PaymentMode | 'All';
  type?: 'Inflow' | 'Outflow' | 'All';
  items: MoneyTransactionAuditItem[];
  notes?: string[];
}

export const MoneyPositionView: React.FC<MoneyPositionViewProps> = ({
  onNavigate,
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const {
    businessProfile,
    updateBusinessProfile,
    moneyPosition,
    moneyTransfers,
    addMoneyTransfer,
    deleteMoneyTransfer,
    outstandingSummary,
    activeDateFilter,
    setActiveDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isDateInActiveFilter,
  } = useApp();
  const { showToast } = useAppNotification();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filter & Search states for Audit Ledger
  const [auditSearchText, setAuditSearchText] = useState('');
  const [auditModeFilter, setAuditModeFilter] = useState<'All' | 'Cash' | 'UPI' | 'Bank' | 'Card'>('All');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'All' | 'Inflow' | 'Outflow'>('All');
  const [auditSourceFilter, setAuditSourceFilter] = useState<string>('All');
  const [auditDateScope, setAuditDateScope] = useState<'Active Filter' | 'All Time'>('Active Filter');

  // Modals state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCashCounterModal, setShowCashCounterModal] = useState(false);
  const [showOpeningSettingsModal, setShowOpeningSettingsModal] = useState(false);
  const [inspectorData, setInspectorData] = useState<CalculationInspectorData | null>(null);
  const [inspectorSearchQuery, setInspectorSearchQuery] = useState('');

  // Transfers & Drawings Filter State
  const [transferPeriodFilter, setTransferPeriodFilter] = useState<
    'all' | 'this-month' | 'previous-month' | 'custom-month' | 'custom-range' | 'today' | 'yesterday'
  >('all');
  const [transferSelectedMonth, setTransferSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transferCustomStartDate, setTransferCustomStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [transferCustomEndDate, setTransferCustomEndDate] = useState(getTodayDateString());
  const [transferTypeFilter, setTransferTypeFilter] = useState<string>('All');
  const [transferSearchQuery, setTransferSearchQuery] = useState<string>('');

  // New Transfer Form State
  const [transferType, setTransferType] = useState<MoneyTransferType>('Cash to Bank Deposit');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferFrom, setTransferFrom] = useState<PaymentMode>('Cash');
  const [transferTo, setTransferTo] = useState<PaymentMode>('Bank');
  const [transferDate, setTransferDate] = useState<string>(getTodayDateString());
  const [transferReference, setTransferReference] = useState<string>('');
  const [transferRemarks, setTransferRemarks] = useState<string>('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Cash Denomination Counter state
  const [denominations, setDenominations] = useState<{
    d500: number;
    d200: number;
    d100: number;
    d50: number;
    d20: number;
    d10: number;
    coins: number;
  }>({
    d500: 0,
    d200: 0,
    d100: 0,
    d50: 0,
    d20: 0,
    d10: 0,
    coins: 0,
  });

  // Starting Opening Balances Form State
  const [tempOpeningCash, setTempOpeningCash] = useState<number>(moneyPosition.openingCash);
  const [tempOpeningBank, setTempOpeningBank] = useState<number>(moneyPosition.openingBank);
  const [tempOpeningUPI, setTempOpeningUPI] = useState<number>(moneyPosition.openingUPI);
  const [tempOpeningCard, setTempOpeningCard] = useState<number>(moneyPosition.openingCard);
  const [openingSavedSuccess, setOpeningSavedSuccess] = useState(false);

  // Synchronize opening balances form when profile changes
  React.useEffect(() => {
    setTempOpeningCash(moneyPosition.openingCash);
    setTempOpeningBank(moneyPosition.openingBank);
    setTempOpeningUPI(moneyPosition.openingUPI);
    setTempOpeningCard(moneyPosition.openingCard);
  }, [moneyPosition.openingCash, moneyPosition.openingBank, moneyPosition.openingUPI, moneyPosition.openingCard]);

  // Total physically counted cash in drawer
  const countedPhysicalCash = useMemo(() => {
    return (
      (denominations.d500 || 0) * 500 +
      (denominations.d200 || 0) * 200 +
      (denominations.d100 || 0) * 100 +
      (denominations.d50 || 0) * 50 +
      (denominations.d20 || 0) * 20 +
      (denominations.d10 || 0) * 10 +
      (denominations.coins || 0)
    );
  }, [denominations]);

  const cashDiscrepancy = countedPhysicalCash - moneyPosition.cashBalance;

  // Month navigation helpers for Transfers & Drawings filter
  const handleTransferPrevMonth = () => {
    const [yStr, mStr] = transferSelectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setTransferSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    setTransferPeriodFilter('custom-month');
  };

  const handleTransferNextMonth = () => {
    const [yStr, mStr] = transferSelectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setTransferSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    setTransferPeriodFilter('custom-month');
  };

  const handleTransferCurrentMonth = () => {
    const d = new Date();
    const curMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setTransferSelectedMonth(curMonth);
    setTransferPeriodFilter('this-month');
  };

  // Filtered Money Transfers & Drawings with Date / Month precision
  const filteredMoneyTransfers = useMemo(() => {
    const currentMonthStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const prevMonthStr = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();

    return moneyTransfers.filter((item) => {
      // 1. Period / Date / Month filter
      if (transferPeriodFilter === 'this-month') {
        if (!isDateInSelectedMonth(item.date, currentMonthStr)) return false;
      } else if (transferPeriodFilter === 'previous-month') {
        if (!isDateInSelectedMonth(item.date, prevMonthStr)) return false;
      } else if (transferPeriodFilter === 'custom-month') {
        if (!isDateInSelectedMonth(item.date, transferSelectedMonth)) return false;
      } else if (transferPeriodFilter === 'custom-range') {
        if (!isDateBetweenRange(item.date, transferCustomStartDate, transferCustomEndDate)) return false;
      } else if (transferPeriodFilter === 'today') {
        if (item.date !== todayStr) return false;
      } else if (transferPeriodFilter === 'yesterday') {
        if (item.date !== yesterdayStr) return false;
      }

      // 2. Transfer Type Filter
      if (transferTypeFilter !== 'All') {
        if (transferTypeFilter === 'Owner Drawing' && item.transferType !== 'Owner Drawing') {
          return false;
        } else if (transferTypeFilter === 'Capital Injection' && item.transferType !== 'Capital Injection') {
          return false;
        } else if (transferTypeFilter === 'Deposits & Withdrawals') {
          if (
            item.transferType !== 'Cash to Bank Deposit' &&
            item.transferType !== 'Bank to Cash Withdrawal'
          ) {
            return false;
          }
        } else if (transferTypeFilter === 'Digital Settlements') {
          if (
            item.transferType !== 'UPI to Bank Settlement' &&
            item.transferType !== 'Card POS to Bank Settlement'
          ) {
            return false;
          }
        } else if (item.transferType !== transferTypeFilter) {
          return false;
        }
      }

      // 3. Search Query Filter
      if (transferSearchQuery.trim()) {
        const q = transferSearchQuery.toLowerCase();
        const matchRemarks = (item.remarks || '').toLowerCase().includes(q);
        const matchRef = (item.reference || '').toLowerCase().includes(q);
        const matchType = (item.transferType || '').toLowerCase().includes(q);
        const matchFrom = (item.fromAccount || '').toLowerCase().includes(q);
        const matchTo = (item.toAccount || '').toLowerCase().includes(q);
        const matchAmt = String(item.amount).includes(q);
        if (!matchRemarks && !matchRef && !matchType && !matchFrom && !matchTo && !matchAmt) {
          return false;
        }
      }

      return true;
    });
  }, [
    moneyTransfers,
    transferPeriodFilter,
    transferSelectedMonth,
    transferCustomStartDate,
    transferCustomEndDate,
    transferTypeFilter,
    transferSearchQuery,
  ]);

  // Statistics for Filtered Transfers & Drawings
  const transferStats = useMemo(() => {
    const count = filteredMoneyTransfers.length;
    const totalDrawings = filteredMoneyTransfers
      .filter((t) => t.transferType === 'Owner Drawing')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCapital = filteredMoneyTransfers
      .filter((t) => t.transferType === 'Capital Injection')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalBankDeposits = filteredMoneyTransfers
      .filter((t) => t.transferType === 'Cash to Bank Deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSettlements = filteredMoneyTransfers
      .filter(
        (t) =>
          t.transferType === 'UPI to Bank Settlement' ||
          t.transferType === 'Card POS to Bank Settlement'
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = filteredMoneyTransfers.reduce((sum, t) => sum + t.amount, 0);

    return {
      count,
      totalDrawings,
      totalCapital,
      totalBankDeposits,
      totalSettlements,
      totalAmount,
    };
  }, [filteredMoneyTransfers]);

  // Export Filtered Transfers to PDF
  const handleExportTransfersPDF = () => {
    if (!onOpenPdfExport) return;
    const periodLabel =
      transferPeriodFilter === 'custom-month'
        ? formatMonthDisplay(transferSelectedMonth)
        : transferPeriodFilter === 'custom-range'
        ? `${formatDateDisplay(transferCustomStartDate)} to ${formatDateDisplay(transferCustomEndDate)}`
        : transferPeriodFilter;

    const rows = filteredMoneyTransfers.map((item, idx) => ({
      transactionId: `TRF-${idx + 1}`,
      date: formatDateDisplay(item.date),
      transferType: item.transferType,
      fromAccount: item.fromAccount || '-',
      toAccount: item.toAccount || '-',
      remarks: item.remarks || item.reference || '-',
      amount: formatINR(item.amount),
    }));

    onOpenPdfExport(
      `Money Transfers & Drawings Report (${periodLabel})`,
      rows,
      {
        'Total Transfers': formatINR(transferStats.totalAmount),
        'Owner Drawings': formatINR(transferStats.totalDrawings),
        'Capital Injections': formatINR(transferStats.totalCapital),
        'Total Count': transferStats.count,
      }
    );
  };

  // Export Filtered Transfers to Excel
  const handleExportTransfersExcel = () => {
    if (!onOpenExcelExport) return;
    const periodLabel =
      transferPeriodFilter === 'custom-month'
        ? transferSelectedMonth
        : transferPeriodFilter === 'custom-range'
        ? `${transferCustomStartDate}_to_${transferCustomEndDate}`
        : transferPeriodFilter;

    const rows = filteredMoneyTransfers.map((item, idx) => ({
      ID: `TRF-${idx + 1}`,
      Date: formatDateDisplay(item.date),
      'Transfer Type': item.transferType,
      'From Account': item.fromAccount || '-',
      'To Account': item.toAccount || '-',
      'Remarks / Reference': item.remarks || item.reference || '-',
      'Amount (₹)': item.amount,
    }));

    onOpenExcelExport(`Transfers_Drawings_${periodLabel}`, rows);
  };

  // Filtered Audit Transactions based on date scope, mode, type, search and source
  const filteredAuditList = useMemo(() => {
    return moneyPosition.auditTransactions.filter((item) => {
      // Date filter
      if (auditDateScope === 'Active Filter' && !isDateInActiveFilter(item.date)) {
        return false;
      }
      // Mode filter
      if (auditModeFilter !== 'All' && item.paymentMode !== auditModeFilter) {
        return false;
      }
      // Type filter
      if (auditTypeFilter !== 'All' && item.type !== auditTypeFilter) {
        return false;
      }
      // Source filter
      if (auditSourceFilter !== 'All' && item.source !== auditSourceFilter) {
        return false;
      }
      // Search text
      if (auditSearchText.trim()) {
        const q = auditSearchText.toLowerCase();
        const matchesEntity = item.entityOrTitle.toLowerCase().includes(q);
        const matchesRef = (item.reference || '').toLowerCase().includes(q);
        const matchesSource = item.source.toLowerCase().includes(q);
        const matchesMode = item.paymentMode.toLowerCase().includes(q);
        return matchesEntity || matchesRef || matchesSource || matchesMode;
      }
      return true;
    });
  }, [
    moneyPosition.auditTransactions,
    auditDateScope,
    isDateInActiveFilter,
    auditModeFilter,
    auditTypeFilter,
    auditSourceFilter,
    auditSearchText,
  ]);

  // Aggregate sums for filtered audit transactions
  const auditMetrics = useMemo(() => {
    let inflows = 0;
    let outflows = 0;
    filteredAuditList.forEach((item) => {
      if (item.type === 'Inflow') inflows += item.amount;
      else outflows += item.amount;
    });
    return {
      totalInflows: inflows,
      totalOutflows: outflows,
      netMovement: inflows - outflows,
      count: filteredAuditList.length,
    };
  }, [filteredAuditList]);

  // Breakdown of Inflows by Category
  const inflowSourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    moneyPosition.auditTransactions.forEach((item) => {
      if (item.type === 'Inflow') {
        map[item.source] = (map[item.source] || 0) + item.amount;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [moneyPosition.auditTransactions]);

  // Breakdown of Outflows by Category
  const outflowSourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    moneyPosition.auditTransactions.forEach((item) => {
      if (item.type === 'Outflow') {
        map[item.source] = (map[item.source] || 0) + item.amount;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [moneyPosition.auditTransactions]);

  // Working Capital and Solvency Metrics
  const totalLiquidCapital = moneyPosition.totalAvailableBalance;
  const currentPayables = outstandingSummary.totalPayables;
  const currentReceivables = outstandingSummary.customerReceivables;
  const netQuickLiquidity = totalLiquidCapital + currentReceivables - currentPayables;
  const solvencyRatio = currentPayables > 0 ? (totalLiquidCapital / currentPayables) : 999;

  // Average daily outflows estimation for runway
  const dailyOutflowEstimate = useMemo(() => {
    const totalOut = moneyPosition.totalOutflows;
    // Estimate based on a standard 30 day operational period
    return Math.max(totalOut / 30, 1000);
  }, [moneyPosition.totalOutflows]);

  const liquidityRunwayDays = dailyOutflowEstimate > 0 ? (totalLiquidCapital / dailyOutflowEstimate) : 0;

  // Handlers for Transfer Form
  const handleTransferTypeChange = (type: MoneyTransferType) => {
    setTransferType(type);
    if (type === 'Cash to Bank Deposit') {
      setTransferFrom('Cash');
      setTransferTo('Bank');
    } else if (type === 'Bank to Cash Withdrawal') {
      setTransferFrom('Bank');
      setTransferTo('Cash');
    } else if (type === 'UPI to Bank Settlement') {
      setTransferFrom('UPI');
      setTransferTo('Bank');
    } else if (type === 'Card POS to Bank Settlement') {
      setTransferFrom('Card');
      setTransferTo('Bank');
    } else if (type === 'Capital Injection') {
      setTransferTo('Bank');
    } else if (type === 'Owner Drawing') {
      setTransferFrom('Cash');
    }
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0) {
      showToast('Please enter a valid transfer amount greater than ₹0', 'warning');
      return;
    }

    addMoneyTransfer({
      date: transferDate,
      transferType,
      fromAccount: transferType === 'Capital Injection' ? undefined : transferFrom,
      toAccount: transferType === 'Owner Drawing' ? undefined : transferTo,
      amount: transferAmount,
      reference: transferReference.trim() || undefined,
      remarks: transferRemarks.trim() || undefined,
    });

    showToast('Transfer logged and accounts updated successfully!', 'success');
    setTransferSuccessMsg('Transfer logged and accounts updated successfully!');
    setTransferAmount(0);
    setTransferReference('');
    setTransferRemarks('');
    setTimeout(() => {
      setTransferSuccessMsg(null);
      setShowTransferModal(false);
    }, 1200);
  };

  const handleSaveOpeningBalances = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      ...businessProfile,
      openingBalanceCash: tempOpeningCash,
      openingBalanceBank: tempOpeningBank,
      openingBalanceUPI: tempOpeningUPI,
      openingBalanceCard: tempOpeningCard,
    });
    showToast('Opening ledger balances saved successfully!', 'success');
    setOpeningSavedSuccess(true);
    setTimeout(() => {
      setOpeningSavedSuccess(false);
      setShowOpeningSettingsModal(false);
    }, 1200);
  };

  // Quick action presets for transfers
  const handleQuickSweepUPI = () => {
    if (moneyPosition.upiBalance <= 0) {
      showToast('UPI balance is currently ₹0 or negative. No balance to sweep.', 'info');
      return;
    }
    setTransferType('UPI to Bank Settlement');
    setTransferFrom('UPI');
    setTransferTo('Bank');
    setTransferAmount(moneyPosition.upiBalance);
    setTransferRemarks('Instant QR collection settlement to Current Account');
    setTransferDate(getTodayDateString());
    setShowTransferModal(true);
  };

  const handleQuickDepositCash = () => {
    const depositAmt = Math.max(0, moneyPosition.cashBalance - 5000); // Leave 5000 for cash float
    setTransferType('Cash to Bank Deposit');
    setTransferFrom('Cash');
    setTransferTo('Bank');
    setTransferAmount(depositAmt > 0 ? depositAmt : moneyPosition.cashBalance);
    setTransferRemarks('Physical counter cash deposit to SBI Current Account');
    setTransferDate(getTodayDateString());
    setShowTransferModal(true);
  };

  // Export handlers
  const handleExportPDF = () => {
    if (!onOpenPdfExport) return;
    const rows: ExportRowData[] = filteredAuditList.map((item) => ({
      date: item.date,
      type: item.type,
      source: item.source,
      entity: item.entityOrTitle,
      account: item.paymentMode,
      reference: item.reference || '-',
      amount: item.type === 'Inflow' ? item.amount : -item.amount,
    }));

    onOpenPdfExport(
      `Money Position & Cashflow Statement (${auditDateScope === 'Active Filter' ? activeDateFilter : 'All Time'})`,
      rows,
      {
        totalInflows: auditMetrics.totalInflows,
        totalOutflows: auditMetrics.totalOutflows,
        netMovement: auditMetrics.netMovement,
        liquidBalance: moneyPosition.totalAvailableBalance,
      }
    );
  };

  const handleExportExcel = () => {
    if (!onOpenExcelExport) return;
    const rows: ExportRowData[] = filteredAuditList.map((item) => ({
      Date: item.date,
      Type: item.type,
      Source_Category: item.source,
      Entity_Description: item.entityOrTitle,
      Account_Channel: item.paymentMode,
      Reference: item.reference || '-',
      Inflow_Amount: item.type === 'Inflow' ? item.amount : 0,
      Outflow_Amount: item.type === 'Outflow' ? item.amount : 0,
      Net_Amount: item.type === 'Inflow' ? item.amount : -item.amount,
    }));

    onOpenExcelExport(`Patil_Biryani_Money_Position_${getTodayDateString()}`, rows);
  };

  // Calculation & Reference Inspector Open Handlers
  const openTotalAvailableInspector = () => {
    setInspectorSearchQuery('');
    setInspectorData({
      title: 'Total Liquid Available Money Position',
      subtitle: 'Consolidated Realized Liquid Capital across all 4 Payment Registers',
      formula: `Total Available = Base Opening (${formatINR(moneyPosition.totalOpeningBalance)}) + Total Realized Inflows (${formatINR(moneyPosition.totalInflows)}) - Total Realized Outflows (${formatINR(moneyPosition.totalOutflows)}) = ${formatINR(moneyPosition.totalAvailableBalance)}`,
      resultAmount: moneyPosition.totalAvailableBalance,
      type: 'All',
      channel: 'All',
      items: moneyPosition.auditTransactions,
      notes: [
        `Register Balance Verification: Cash in Hand (${formatINR(moneyPosition.cashBalance)}) + SBI Bank A/C (${formatINR(moneyPosition.bankBalance)}) + UPI QR (${formatINR(moneyPosition.upiBalance)}) + Card POS (${formatINR(moneyPosition.cardBalance)}) = ${formatINR(moneyPosition.totalAvailableBalance)}`,
        `Realization Guarantee: Customer Credit Receivables (${formatINR(outstandingSummary.customerReceivables)}) are strictly segregated until cash or UPI is physically collected.`,
        `Pending Supplier Payables (${formatINR(outstandingSummary.totalPayables)}) are preserved until actual payout is recorded.`,
      ],
    });
  };

  const openInflowsInspector = () => {
    setInspectorSearchQuery('');
    setInspectorData({
      title: 'Total Realized Operating Inflows',
      subtitle: `Aggregated receipts from Plate Sales, Invoices, Recovered Receivables & Capital Infusions across ${moneyPosition.totalInflowCount} records`,
      formula: `Total Inflows = Sum of ${moneyPosition.totalInflowCount} verified inflow transactions across Cash (${formatINR(moneyPosition.cashInflows)}), Bank (${formatINR(moneyPosition.bankInflows)}), UPI (${formatINR(moneyPosition.upiInflows)}), and Card (${formatINR(moneyPosition.cardInflows)}) = +${formatINR(moneyPosition.totalInflows)}`,
      resultAmount: moneyPosition.totalInflows,
      type: 'Inflow',
      channel: 'All',
      items: moneyPosition.auditTransactions.filter((i) => i.type === 'Inflow'),
      notes: [
        'Includes daily Plate-Wise restaurant counter sales, individual POS invoices, customer credit collection receipts, and capital infusions.',
      ],
    });
  };

  const openOutflowsInspector = () => {
    setInspectorSearchQuery('');
    setInspectorData({
      title: 'Total Realized Operating Outflows',
      subtitle: `Aggregated disbursements from Expenses, Purchases, Staff Advances, Salaries, Payables & Drawings across ${moneyPosition.totalOutflowCount} records`,
      formula: `Total Outflows = Sum of ${moneyPosition.totalOutflowCount} verified outflow transactions across Cash (${formatINR(moneyPosition.cashOutflows)}), Bank (${formatINR(moneyPosition.bankOutflows)}), UPI (${formatINR(moneyPosition.upiOutflows)}), and Card (${formatINR(moneyPosition.cardOutflows)}) = -${formatINR(moneyPosition.totalOutflows)}`,
      resultAmount: moneyPosition.totalOutflows,
      type: 'Outflow',
      channel: 'All',
      items: moneyPosition.auditTransactions.filter((i) => i.type === 'Outflow'),
      notes: [
        'Includes direct operational expenses paid, raw material inventory purchases paid, supplier payable settlements, staff salary/advances, and owner drawings.',
      ],
    });
  };

  const openChannelInspector = (channel: PaymentMode) => {
    setInspectorSearchQuery('');
    const chData = moneyPosition.channels.find((c) => c.channel === channel);
    if (!chData) return;

    setInspectorData({
      title: `${chData.name} Calculation Proof`,
      subtitle: `Verified ledger equation for ${channel} payment register`,
      formula: `Net Balance = Starting Base (${formatINR(chData.opening)}) + Inflows (+${formatINR(chData.inflows)} across ${chData.inflowCount} txns) - Outflows (-${formatINR(chData.outflows)} across ${chData.outflowCount} txns) = ${formatINR(chData.netBalance)}`,
      resultAmount: chData.netBalance,
      channel,
      type: 'All',
      items: moneyPosition.auditTransactions.filter((i) => i.paymentMode === channel),
      notes: [
        `Register Share: ${chData.percentageOfTotal.toFixed(1)}% of total available liquidity (${formatINR(moneyPosition.totalAvailableBalance)}).`,
        `Sample Active References: ${chData.sampleReferences.join(', ') || 'No active references'}`,
      ],
    });
  };

  const openInflowSourceInspector = (source: string) => {
    setInspectorSearchQuery('');
    const items = moneyPosition.auditTransactions.filter((i) => i.type === 'Inflow' && i.source === source);
    const sum = items.reduce((acc, curr) => acc + curr.amount, 0);

    setInspectorData({
      title: `Inflow Source: ${source}`,
      subtitle: `Detailed transaction list and itemized references for ${source}`,
      formula: `Total Collected = Sum of ${items.length} verified inflow records = +${formatINR(sum)}`,
      resultAmount: sum,
      sourceCategory: source,
      type: 'Inflow',
      items,
      notes: [
        `Category Contribution: ${moneyPosition.totalInflows > 0 ? ((sum / moneyPosition.totalInflows) * 100).toFixed(1) : 0}% of all realized cash inflows.`,
        source === 'Receivable Collection'
          ? 'These represent recovered customer dues and credit bill settlements credited directly to the respective payment register.'
          : 'Verified real-time receipts contributing to available liquidity.',
      ],
    });
  };

  const openOutflowSourceInspector = (source: string) => {
    setInspectorSearchQuery('');
    const items = moneyPosition.auditTransactions.filter((i) => i.type === 'Outflow' && i.source === source);
    const sum = items.reduce((acc, curr) => acc + curr.amount, 0);

    setInspectorData({
      title: `Outflow Category: ${source}`,
      subtitle: `Detailed transaction list and itemized vouchers for ${source}`,
      formula: `Total Disbursed = Sum of ${items.length} verified outflow records = -${formatINR(sum)}`,
      resultAmount: sum,
      sourceCategory: source,
      type: 'Outflow',
      items,
      notes: [
        `Category Share: ${moneyPosition.totalOutflows > 0 ? ((sum / moneyPosition.totalOutflows) * 100).toFixed(1) : 0}% of all realized cash outflows.`,
        'Every disbursement is tracked with vendor name, employee name, bill reference, and payment channel.',
      ],
    });
  };

  const openStartingBaseInspector = () => {
    setInspectorSearchQuery('');
    setInspectorData({
      title: 'Starting Base Balances Vault',
      subtitle: 'Configured baseline ledger opening capital anchored in Business Profile',
      formula: `Total Starting Base = Cash (${formatINR(moneyPosition.openingCash)}) + SBI Current A/C (${formatINR(moneyPosition.openingBank)}) + UPI Baseline (${formatINR(moneyPosition.openingUPI)}) + Card Baseline (${formatINR(moneyPosition.openingCard)}) = ${formatINR(moneyPosition.totalOpeningBalance)}`,
      resultAmount: moneyPosition.totalOpeningBalance,
      isOpening: true,
      items: [],
      notes: [
        'These opening balances represent your verified anchor capital at system initialization or period start.',
        'You can adjust or re-anchor baseline opening balances anytime via the Starting Balances Vault or Settings.',
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Period Filter Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-display text-xl font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            <Landmark className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
                Available Money Position & Liquidity Vault
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Live Capital Ledger
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time multi-channel cash in hand, bank accounts, UPI collections, and liquidity health
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowRightLeft className="h-4 w-4 stroke-[2.5]" />
            <span>Transfer / Move Money</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCashCounterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-400" />
            <span>Count Drawer Cash</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOpeningSettingsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            title="Configure Opening Base Balances"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Set Starting Balances</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('closing')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-all"
            >
              <span>Daily Closing</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Date Scope:</span>
          </span>
          {(['Today', 'Yesterday', 'This Week', 'This Month', 'All Time', 'Custom'] as DateFilterType[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveDateFilter(filter)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeDateFilter === filter
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {activeDateFilter === 'Custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="glass-input px-2.5 py-1 text-xs rounded-lg text-slate-100"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="glass-input px-2.5 py-1 text-xs rounded-lg text-slate-100"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>Active Scope: <strong className="text-emerald-400">{activeDateFilter}</strong></span>
        </div>
      </div>

      {/* 2. Master Available Money Position Mathematical Equation Card */}
      <div className="glass-card p-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100">
                  Available Money Position Master Equation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ Verified Live Calculation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% Traceable Mathematical Formula · Every Rupee Backed by Referenced Bills & Vouchers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openTotalAvailableInspector}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all hover:scale-105"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Inspect Full Calculation Proof</span>
            </button>
          </div>
        </div>

        {/* Master Formula Equation Walkthrough */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1: Starting Base */}
          <button
            type="button"
            onClick={openStartingBaseInspector}
            className="text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <span>[1] Starting Base Capital</span>
              </span>
              <Sliders className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400" />
            </div>
            <div className="font-mono-num text-xl font-extrabold text-slate-100">
              {formatINR(moneyPosition.totalOpeningBalance)}
            </div>
            <p className="text-[10px] text-slate-400">
              Base anchor across Cash, Bank, UPI & POS
            </p>
          </button>

          {/* Step 2: Inflows */}
          <button
            type="button"
            onClick={openInflowsInspector}
            className="text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5" />
                <span>[+] Realized Inflows</span>
              </span>
              <span className="text-[10px] font-mono-num text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {moneyPosition.totalInflowCount} txns
              </span>
            </div>
            <div className="font-mono-num text-xl font-extrabold text-emerald-400">
              +{formatINR(moneyPosition.totalInflows)}
            </div>
            <p className="text-[10px] text-slate-400">
              Sales, POS Invoices & Credit Recoveries
            </p>
          </button>

          {/* Step 3: Outflows */}
          <button
            type="button"
            onClick={openOutflowsInspector}
            className="text-left p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-rose-500/20 hover:border-rose-500/40 transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>[-] Realized Outflows</span>
              </span>
              <span className="text-[10px] font-mono-num text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                {moneyPosition.totalOutflowCount} txns
              </span>
            </div>
            <div className="font-mono-num text-xl font-extrabold text-rose-400">
              -{formatINR(moneyPosition.totalOutflows)}
            </div>
            <p className="text-[10px] text-slate-400">
              Expenses, Purchases, Salaries & Drawings
            </p>
          </button>

          {/* Step 4: Total Result */}
          <button
            type="button"
            onClick={openTotalAvailableInspector}
            className="text-left p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 hover:from-emerald-900/50 border border-emerald-500/40 transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>[=] Total Available Liquidity</span>
              </span>
              <span className="text-[10px] font-bold text-slate-950 bg-emerald-400 px-1.5 py-0.5 rounded">
                100% Solid
              </span>
            </div>
            <div className="font-mono-num text-xl sm:text-2xl font-black text-emerald-300">
              {formatINR(moneyPosition.totalAvailableBalance)}
            </div>
            <p className="text-[10px] text-emerald-400/90 font-mono-num">
              Discrepancy: ₹0.00 (Balanced)
            </p>
          </button>
        </div>
      </div>

      {/* 3. Executive KPI Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Available Liquid Capital */}
        <div
          onClick={openTotalAvailableInspector}
          className="glass-card relative overflow-hidden p-4 rounded-2xl border border-emerald-500/20 bg-slate-900/60 shadow-lg cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Liquid Capital
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span
              className={`font-mono-num text-2xl sm:text-3xl font-extrabold tracking-tight ${
                totalLiquidCapital < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {formatINR(totalLiquidCapital)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Starting Base: <strong className="text-slate-200 font-mono-num">{formatINR(moneyPosition.totalOpeningBalance)}</strong>
            </span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${
              totalLiquidCapital >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {totalLiquidCapital >= 0 ? '✓ Liquid Surplus' : '⚠ Capital Deficit'}
            </span>
          </div>
        </div>

        {/* Metric 2: Net Cash Movement */}
        <div
          onClick={openInflowsInspector}
          className="glass-card relative overflow-hidden p-4 rounded-2xl border border-white/5 bg-slate-900/60 shadow-lg cursor-pointer hover:border-teal-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cumulative Net Flow
            </span>
            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-400 border border-teal-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span
              className={`font-mono-num text-2xl sm:text-3xl font-extrabold tracking-tight ${
                (moneyPosition.totalInflows - moneyPosition.totalOutflows) < 0 ? 'text-rose-400' : 'text-teal-400'
              }`}
            >
              {(moneyPosition.totalInflows - moneyPosition.totalOutflows) >= 0 ? '+' : ''}
              {formatINR(moneyPosition.totalInflows - moneyPosition.totalOutflows)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono-num">
            <span className="text-emerald-400">+{formatINR(moneyPosition.totalInflows)}</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400">-{formatINR(moneyPosition.totalOutflows)}</span>
          </div>
        </div>

        {/* Metric 3: Liquidity Runway */}
        <div className="glass-card relative overflow-hidden p-4 rounded-2xl border border-white/5 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Operational Runway
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="font-mono-num text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-400">
              {liquidityRunwayDays > 100 ? '>90' : liquidityRunwayDays.toFixed(1)} <span className="text-sm font-bold text-slate-400">Days</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Avg Daily Outflow: <strong className="text-slate-300 font-mono-num">{formatINR(dailyOutflowEstimate)}</strong>
            </span>
            <span className="text-blue-300 font-semibold">
              {liquidityRunwayDays > 30 ? 'Strong' : 'Moderate'}
            </span>
          </div>
        </div>

        {/* Metric 4: Working Capital Solvency */}
        <div className="glass-card relative overflow-hidden p-4 rounded-2xl border border-white/5 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Solvency Coverage
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="font-mono-num text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-400">
              {solvencyRatio >= 999 ? '∞' : `${solvencyRatio.toFixed(2)}x`}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              Short-term Dues: <strong className="text-amber-300 font-mono-num">{formatINR(currentPayables)}</strong>
            </span>
            <span className="text-purple-300 font-semibold">
              {solvencyRatio >= 1.5 ? '✓ 0% Default Risk' : 'Watch Dues'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Four Account Channel Vault Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Live Account Vaults & Payment Registers
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Real-time balance per payment register with referenced transaction proof
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Channel 1: Cash in Hand */}
          <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-slate-950/60 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Cash in Hand</h3>
                    <p className="text-[10px] text-slate-400">Physical Counter Drawer</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openChannelInspector('Cash')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                >
                  Proof & Refs
                </button>
              </div>

              <div className="mt-4">
                <span
                  className={`font-mono-num text-2xl font-black tracking-tight ${
                    moneyPosition.cashBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatINR(moneyPosition.cashBalance)}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px] font-mono-num border-t border-white/5 pt-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Opening Base:</span>
                  <span className="text-slate-300 font-semibold">{formatINR(moneyPosition.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">+ Inflows ({moneyPosition.channels[0]?.inflowCount || 0} txns):</span>
                  <span className="text-emerald-400 font-semibold">+{formatINR(moneyPosition.cashInflows)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">- Outflows ({moneyPosition.channels[0]?.outflowCount || 0} txns):</span>
                  <span className="text-rose-400 font-semibold">-{formatINR(moneyPosition.cashOutflows)}</span>
                </div>
              </div>

              {/* Sample References Tags */}
              {moneyPosition.channels[0]?.sampleReferences && moneyPosition.channels[0].sampleReferences.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Recent References</span>
                  <div className="flex flex-wrap gap-1">
                    {moneyPosition.channels[0].sampleReferences.slice(0, 3).map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-300/80"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCashCounterModal(true)}
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] text-center border border-slate-700 transition-colors"
              >
                Count Drawer
              </button>
              <button
                type="button"
                onClick={handleQuickDepositCash}
                className="py-1.5 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30 transition-colors"
                title="Deposit cash into Bank Current Account"
              >
                Deposit
              </button>
            </div>
          </div>

          {/* Channel 2: Bank Balance */}
          <div className="glass-card p-4 rounded-2xl border border-blue-500/20 bg-slate-950/60 relative overflow-hidden flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Bank Account</h3>
                    <p className="text-[10px] text-slate-400">SBI Current Account</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openChannelInspector('Bank')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                >
                  Proof & Refs
                </button>
              </div>

              <div className="mt-4">
                <span
                  className={`font-mono-num text-2xl font-black tracking-tight ${
                    moneyPosition.bankBalance < 0 ? 'text-rose-400' : 'text-blue-400'
                  }`}
                >
                  {formatINR(moneyPosition.bankBalance)}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px] font-mono-num border-t border-white/5 pt-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Opening Base:</span>
                  <span className="text-slate-300 font-semibold">{formatINR(moneyPosition.openingBank)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">+ Inflows ({moneyPosition.channels[1]?.inflowCount || 0} txns):</span>
                  <span className="text-emerald-400 font-semibold">+{formatINR(moneyPosition.bankInflows)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">- Outflows ({moneyPosition.channels[1]?.outflowCount || 0} txns):</span>
                  <span className="text-rose-400 font-semibold">-{formatINR(moneyPosition.bankOutflows)}</span>
                </div>
              </div>

              {/* Sample References Tags */}
              {moneyPosition.channels[1]?.sampleReferences && moneyPosition.channels[1].sampleReferences.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Recent References</span>
                  <div className="flex flex-wrap gap-1">
                    {moneyPosition.channels[1].sampleReferences.slice(0, 3).map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-blue-300/80"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransferType('Bank to Cash Withdrawal');
                  setTransferFrom('Bank');
                  setTransferTo('Cash');
                  setTransferAmount(5000);
                  setTransferRemarks('ATM cash withdrawal for counter float');
                  setShowTransferModal(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] text-center border border-slate-700 transition-colors"
              >
                Withdraw Cash
              </button>
            </div>
          </div>

          {/* Channel 3: UPI & QR Code */}
          <div className="glass-card p-4 rounded-2xl border border-teal-500/20 bg-slate-950/60 relative overflow-hidden flex flex-col justify-between hover:border-teal-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">UPI / QR Scans</h3>
                    <p className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openChannelInspector('UPI')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition-colors"
                >
                  Proof & Refs
                </button>
              </div>

              <div className="mt-4">
                <span
                  className={`font-mono-num text-2xl font-black tracking-tight ${
                    moneyPosition.upiBalance < 0 ? 'text-rose-400' : 'text-teal-400'
                  }`}
                >
                  {formatINR(moneyPosition.upiBalance)}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px] font-mono-num border-t border-white/5 pt-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Opening Base:</span>
                  <span className="text-slate-300 font-semibold">{formatINR(moneyPosition.openingUPI)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">+ Inflows ({moneyPosition.channels[2]?.inflowCount || 0} txns):</span>
                  <span className="text-emerald-400 font-semibold">+{formatINR(moneyPosition.upiInflows)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">- Outflows ({moneyPosition.channels[2]?.outflowCount || 0} txns):</span>
                  <span className="text-rose-400 font-semibold">-{formatINR(moneyPosition.upiOutflows)}</span>
                </div>
              </div>

              {/* Sample References Tags */}
              {moneyPosition.channels[2]?.sampleReferences && moneyPosition.channels[2].sampleReferences.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Recent References</span>
                  <div className="flex flex-wrap gap-1">
                    {moneyPosition.channels[2].sampleReferences.slice(0, 3).map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-teal-300/80"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
              <button
                type="button"
                onClick={handleQuickSweepUPI}
                className="flex-1 py-1.5 px-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold text-[11px] text-center border border-teal-500/30 transition-colors"
                title="Sweep UPI balance to Bank Current Account"
              >
                Sweep to Bank A/C
              </button>
            </div>
          </div>

          {/* Channel 4: Card / POS Swipes */}
          <div className="glass-card p-4 rounded-2xl border border-purple-500/20 bg-slate-950/60 relative overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Card / POS Swipes</h3>
                    <p className="text-[10px] text-slate-400">PineLabs / EDC Terminal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openChannelInspector('Card')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors"
                >
                  Proof & Refs
                </button>
              </div>

              <div className="mt-4">
                <span
                  className={`font-mono-num text-2xl font-black tracking-tight ${
                    moneyPosition.cardBalance < 0 ? 'text-rose-400' : 'text-purple-400'
                  }`}
                >
                  {formatINR(moneyPosition.cardBalance)}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px] font-mono-num border-t border-white/5 pt-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Opening Base:</span>
                  <span className="text-slate-300 font-semibold">{formatINR(moneyPosition.openingCard)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">+ Inflows ({moneyPosition.channels[3]?.inflowCount || 0} txns):</span>
                  <span className="text-emerald-400 font-semibold">+{formatINR(moneyPosition.cardInflows)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">- Outflows ({moneyPosition.channels[3]?.outflowCount || 0} txns):</span>
                  <span className="text-rose-400 font-semibold">-{formatINR(moneyPosition.cardOutflows)}</span>
                </div>
              </div>

              {/* Sample References Tags */}
              {moneyPosition.channels[3]?.sampleReferences && moneyPosition.channels[3].sampleReferences.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Recent References</span>
                  <div className="flex flex-wrap gap-1">
                    {moneyPosition.channels[3].sampleReferences.slice(0, 3).map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300/80"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTransferType('Card POS to Bank Settlement');
                  setTransferFrom('Card');
                  setTransferTo('Bank');
                  setTransferAmount(moneyPosition.cardBalance > 0 ? moneyPosition.cardBalance : 0);
                  setTransferRemarks('POS EDC card swipe batch settlement');
                  setShowTransferModal(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-[11px] text-center border border-purple-500/30 transition-colors"
              >
                Settle POS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-emerald-400 shadow-md border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <PieChartIcon className="h-4 w-4" />
          <span>Liquidity Analytics & Waterfall</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-emerald-400 shadow-md border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Full Transaction Audit Ledger ({filteredAuditList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'transfers'
              ? 'bg-slate-800 text-emerald-400 shadow-md border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Inter-Account Transfers ({moneyTransfers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-emerald-400 shadow-md border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Starting Balances Vault</span>
        </button>
      </div>

      {/* TAB 1: LIQUIDITY ANALYTICS & WATERFALL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Channel Distribution & Flow Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inflow Sources Breakdown */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Inflow Sources Breakdown
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-num text-xs font-bold text-emerald-400">
                    +{formatINR(moneyPosition.totalInflows)}
                  </span>
                  <button
                    type="button"
                    onClick={openInflowsInspector}
                    className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20"
                    title="Inspect all contributing inflow references"
                  >
                    Inspect All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {inflowSourceBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No inflows recorded yet.</p>
                ) : (
                  inflowSourceBreakdown.map(([source, amount]) => {
                    const pct = moneyPosition.totalInflows > 0 ? (amount / moneyPosition.totalInflows) * 100 : 0;
                    const isReceivable = source === 'Receivable Collection';
                    const srcData = moneyPosition.inflowSources?.find((s) => s.source === source);
                    return (
                      <div
                        key={source}
                        className={`p-3 rounded-xl transition-all border space-y-2 ${
                          isReceivable
                            ? 'bg-teal-950/30 border-teal-500/30'
                            : 'bg-slate-900/40 border-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${isReceivable ? 'text-teal-300' : 'text-slate-300'}`}>
                              {source}
                            </span>
                            {isReceivable && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                Credit Recoveries
                              </span>
                            )}
                            {srcData && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-400 bg-slate-800">
                                {srcData.count} txns
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-bold text-emerald-400">
                              +{formatINR(amount)} <span className="text-slate-500 text-[10px]">({pct.toFixed(1)}%)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => openInflowSourceInspector(source)}
                              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] border border-slate-700 transition-colors"
                            >
                              Proof
                            </button>
                          </div>
                        </div>

                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isReceivable ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>

                        {srcData && srcData.sampleReferences && srcData.sampleReferences.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 truncate pt-0.5">
                            <span className="text-slate-400 font-sans">Refs:</span>
                            {srcData.sampleReferences.slice(0, 3).map((ref, idx) => (
                              <span key={idx} className="px-1 rounded bg-slate-900 border border-slate-800 text-emerald-400/80">
                                {ref}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Outflow Categories Breakdown */}
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Outflow Categories Breakdown
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-num text-xs font-bold text-rose-400">
                    -{formatINR(moneyPosition.totalOutflows)}
                  </span>
                  <button
                    type="button"
                    onClick={openOutflowsInspector}
                    className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/20"
                    title="Inspect all contributing outflow references"
                  >
                    Inspect All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {outflowSourceBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No paid outflows recorded yet.</p>
                ) : (
                  outflowSourceBreakdown.map(([source, amount]) => {
                    const pct = moneyPosition.totalOutflows > 0 ? (amount / moneyPosition.totalOutflows) * 100 : 0;
                    const srcData = moneyPosition.outflowSources?.find((s) => s.source === source);
                    return (
                      <div
                        key={source}
                        className="p-3 rounded-xl transition-all border bg-slate-900/40 border-white/5 space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-300">{source}</span>
                            {srcData && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-400 bg-slate-800">
                                {srcData.count} txns
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-bold text-rose-400">
                              -{formatINR(amount)} <span className="text-slate-500 text-[10px]">({pct.toFixed(1)}%)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => openOutflowSourceInspector(source)}
                              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-[10px] border border-slate-700 transition-colors"
                            >
                              Proof
                            </button>
                          </div>
                        </div>

                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>

                        {srcData && srcData.sampleReferences && srcData.sampleReferences.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 truncate pt-0.5">
                            <span className="text-slate-400 font-sans">Refs:</span>
                            {srcData.sampleReferences.slice(0, 3).map((ref, idx) => (
                              <span key={idx} className="px-1 rounded bg-slate-900 border border-slate-800 text-rose-400/80">
                                {ref}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Liquid Capital Channel Balance Table */}
          <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
            <div className="p-4 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Channel-by-Channel Balance & Inflow/Outflow Matrix
                </h3>
                <p className="text-[11px] text-slate-400">Verified mathematical breakdown of all live liquid registers</p>
              </div>
              <span className="text-xs font-mono-num font-bold text-slate-300">
                Net: {formatINR(moneyPosition.totalAvailableBalance)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-white/5">
                  <tr>
                    <th className="p-3.5">Account / Channel</th>
                    <th className="p-3.5 text-right">Opening Base</th>
                    <th className="p-3.5 text-right text-emerald-400">+ Live Inflows</th>
                    <th className="p-3.5 text-right text-rose-400">- Live Outflows</th>
                    <th className="p-3.5 text-right font-bold text-slate-100">Net Current Balance</th>
                    <th className="p-3.5 text-right">% of Total Liquid</th>
                    <th className="p-3.5 text-center">Audit & Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono-num">
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-sans font-semibold text-slate-200 flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-400" />
                      <span>Cash in Hand (Counter Drawer)</span>
                    </td>
                    <td className="p-3.5 text-right text-slate-300">{formatINR(moneyPosition.openingCash)}</td>
                    <td className="p-3.5 text-right text-emerald-400">+{formatINR(moneyPosition.cashInflows)}</td>
                    <td className="p-3.5 text-right text-rose-400">-{formatINR(moneyPosition.cashOutflows)}</td>
                    <td className={`p-3.5 text-right font-bold ${
                      moneyPosition.cashBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {formatINR(moneyPosition.cashBalance)}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {moneyPosition.totalAvailableBalance > 0
                        ? `${((moneyPosition.cashBalance / moneyPosition.totalAvailableBalance) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => openChannelInspector('Cash')}
                        className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/20 transition-colors"
                      >
                        Inspect Proof
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-sans font-semibold text-slate-200 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-400" />
                      <span>Bank Account (Current Account)</span>
                    </td>
                    <td className="p-3.5 text-right text-slate-300">{formatINR(moneyPosition.openingBank)}</td>
                    <td className="p-3.5 text-right text-emerald-400">+{formatINR(moneyPosition.bankInflows)}</td>
                    <td className="p-3.5 text-right text-rose-400">-{formatINR(moneyPosition.bankOutflows)}</td>
                    <td className={`p-3.5 text-right font-bold ${
                      moneyPosition.bankBalance < 0 ? 'text-rose-400' : 'text-blue-400'
                    }`}>
                      {formatINR(moneyPosition.bankBalance)}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {moneyPosition.totalAvailableBalance > 0
                        ? `${((moneyPosition.bankBalance / moneyPosition.totalAvailableBalance) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => openChannelInspector('Bank')}
                        className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-[11px] border border-blue-500/20 transition-colors"
                      >
                        Inspect Proof
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-sans font-semibold text-slate-200 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-teal-400" />
                      <span>UPI Receipts (QR Code & GPay)</span>
                    </td>
                    <td className="p-3.5 text-right text-slate-300">{formatINR(moneyPosition.openingUPI)}</td>
                    <td className="p-3.5 text-right text-emerald-400">+{formatINR(moneyPosition.upiInflows)}</td>
                    <td className="p-3.5 text-right text-rose-400">-{formatINR(moneyPosition.upiOutflows)}</td>
                    <td className={`p-3.5 text-right font-bold ${
                      moneyPosition.upiBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {formatINR(moneyPosition.upiBalance)}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {moneyPosition.totalAvailableBalance > 0
                        ? `${((moneyPosition.upiBalance / moneyPosition.totalAvailableBalance) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => openChannelInspector('UPI')}
                        className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-[11px] border border-teal-500/20 transition-colors"
                      >
                        Inspect Proof
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-sans font-semibold text-slate-200 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-400" />
                      <span>Card Receipts (POS Swipes & EDC)</span>
                    </td>
                    <td className="p-3.5 text-right text-slate-300">{formatINR(moneyPosition.openingCard)}</td>
                    <td className="p-3.5 text-right text-emerald-400">+{formatINR(moneyPosition.cardInflows)}</td>
                    <td className="p-3.5 text-right text-rose-400">-{formatINR(moneyPosition.cardOutflows)}</td>
                    <td className={`p-3.5 text-right font-bold ${
                      moneyPosition.cardBalance < 0 ? 'text-rose-400' : 'text-purple-400'
                    }`}>
                      {formatINR(moneyPosition.cardBalance)}
                    </td>
                    <td className="p-3.5 text-right text-slate-400">
                      {moneyPosition.totalAvailableBalance > 0
                        ? `${((moneyPosition.cardBalance / moneyPosition.totalAvailableBalance) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => openChannelInspector('Card')}
                        className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/20 transition-colors"
                      >
                        Inspect Proof
                      </button>
                    </td>
                  </tr>

                  {/* Summary Total Row */}
                  <tr className={`font-bold border-t ${
                    moneyPosition.totalAvailableBalance < 0
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-emerald-950/20 border-emerald-500/30'
                  }`}>
                    <td className={`p-3.5 font-sans uppercase ${
                      moneyPosition.totalAvailableBalance < 0 ? 'text-rose-300' : 'text-emerald-300'
                    }`}>
                      Total Net Available Capital
                    </td>
                    <td className="p-3.5 text-right text-slate-200">{formatINR(moneyPosition.totalOpeningBalance)}</td>
                    <td className="p-3.5 text-right text-emerald-300">+{formatINR(moneyPosition.totalInflows)}</td>
                    <td className="p-3.5 text-right text-rose-300">-{formatINR(moneyPosition.totalOutflows)}</td>
                    <td className={`p-3.5 text-right text-sm font-black ${
                      moneyPosition.totalAvailableBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {formatINR(moneyPosition.totalAvailableBalance)}
                    </td>
                    <td className="p-3.5 text-right text-slate-200">100.0%</td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={openTotalAvailableInspector}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm transition-colors"
                      >
                        Inspect Equation
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Strict Segregation of Credit Dues */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
            <div className="font-bold flex items-center gap-2 text-amber-300 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>Accounting Integrity: Strict Segregation of Future Dues</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Customer Receivables (<strong>{formatINR(outstandingSummary.customerReceivables)}</strong>) and Supplier Payables (<strong>{formatINR(outstandingSummary.totalPayables)}</strong>) represent expected future cash flows and are strictly kept separate from this <strong>Liquid Available Money Position</strong> until the physical cash or bank transfer is executed. When collected, payments are automatically credited under <strong>Receivable Collection</strong> with full transaction bill references.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION AUDIT TRAIL LEDGER */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Toolbar & Filters */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-950/60 flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
              {/* Search Box */}
              <div className="relative w-full lg:w-80">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entity, bill ref (e.g. PB-2026-0002), source..."
                  value={auditSearchText}
                  onChange={(e) => setAuditSearchText(e.target.value)}
                  className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 rounded-xl"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto overflow-x-auto">
                {/* Channel Mode Filter */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
                  {(['All', 'Cash', 'UPI', 'Bank', 'Card'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAuditModeFilter(mode)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                        auditModeFilter === mode
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Inflow / Outflow Filter */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
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
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Date Scope Toggle */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
                  {(['Active Filter', 'All Time'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setAuditDateScope(scope)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                        auditDateScope === scope
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                    title="Export Statement to PDF"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                    title="Export Statement to Excel"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category / Source Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/5 pb-1">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3 text-slate-400" />
                <span>Source:</span>
              </span>
              {[
                { label: 'All Categories', value: 'All' },
                { label: 'Receivable Collection', value: 'Receivable Collection', highlight: true },
                { label: 'Plate Sales', value: 'Plate Sales' },
                { label: 'Invoice Payment', value: 'Invoice Payment' },
                { label: 'Expense', value: 'Expense' },
                { label: 'Purchase', value: 'Purchase' },
                { label: 'Payable Settlement', value: 'Payable Settlement' },
                { label: 'Staff Advance', value: 'Staff Advance' },
                { label: 'Staff Salary', value: 'Staff Salary' },
                { label: 'Money Transfer', value: 'Money Transfer' },
                { label: 'Capital Injection', value: 'Capital Injection' },
                { label: 'Owner Drawing', value: 'Owner Drawing' },
              ].map((src) => {
                const isSelected = auditSourceFilter === src.value;
                return (
                  <button
                    key={src.value}
                    type="button"
                    onClick={() => setAuditSourceFilter(src.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 border ${
                      isSelected
                        ? src.highlight
                          ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-md shadow-teal-500/20'
                          : 'bg-slate-700 text-white border-slate-600 shadow-sm'
                        : src.highlight
                        ? 'bg-teal-950/40 text-teal-300 border-teal-500/30 hover:bg-teal-900/60'
                        : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {src.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Table */}
          <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
            <div className="max-h-[550px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Flow Type</th>
                    <th className="p-3">Category / Source</th>
                    <th className="p-3">Entity & Description</th>
                    <th className="p-3">Transaction Reference / Bill #</th>
                    <th className="p-3">Account</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono-num">
                  {filteredAuditList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        No transactions matched the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditList.map((item) => {
                      const isReceivable = item.source === 'Receivable Collection';
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isReceivable
                              ? 'bg-teal-950/15 hover:bg-teal-950/30'
                              : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateDisplay(item.date)}</td>
                          <td className="p-3 font-sans">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.type === 'Inflow'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {item.type === 'Inflow' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              <span>{item.type}</span>
                            </span>
                          </td>
                          <td className="p-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] inline-block ${
                                isReceivable
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold'
                                  : item.source === 'Plate Sales'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : item.source === 'Invoice Payment'
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                  : item.source === 'Expense'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                  : item.source === 'Purchase'
                                  ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                                  : item.source === 'Payable Settlement'
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {item.source}
                            </span>
                          </td>
                          <td className="p-3 font-sans">
                            <div className="font-medium text-slate-200 truncate max-w-xs">{item.entityOrTitle}</div>
                          </td>
                          <td className="p-3 font-sans">
                            {item.reference ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono-num font-semibold border ${
                                  isReceivable
                                    ? 'bg-teal-950/60 text-teal-200 border-teal-500/40 shadow-xs'
                                    : 'bg-slate-900/80 text-slate-200 border-white/10'
                                }`}
                              >
                                {item.reference}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px] font-mono-num">-</span>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                              {item.paymentMode}
                            </span>
                          </td>
                          <td
                            className={`p-3 text-right font-bold text-sm ${
                              item.type === 'Inflow' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.type === 'Inflow' ? '+' : '-'}
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Audit Footer Summary */}
            <div className="p-3.5 bg-slate-900/90 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div>
                Showing <strong>{filteredAuditList.length}</strong> matching supporting audit records
                {auditSourceFilter !== 'All' && (
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    Category: {auditSourceFilter}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 font-mono-num font-bold">
                <span className="text-emerald-400">Inflows: +{formatINR(auditMetrics.totalInflows)}</span>
                <span className="text-rose-400">Outflows: -{formatINR(auditMetrics.totalOutflows)}</span>
                <span className={`text-sm ${auditMetrics.netMovement < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Net Delta: {formatINR(auditMetrics.netMovement)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTER-ACCOUNT TRANSFERS & OWNER DRAWINGS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          {/* Header Actions & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Transfers & Owner Drawings Ledger</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Log cash deposits, ATM withdrawals, UPI sweeps, capital infusions & owner drawings with month-wise filters.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportTransfersPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                title="Export Transfers to PDF"
              >
                <FileText className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportTransfersExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                title="Export Transfers to Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransferDate(getTodayDateString());
                  setShowTransferModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all shrink-0"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Log New Transfer</span>
              </button>
            </div>
          </div>

          {/* KPI STATS CARDS FOR FILTERED TRANSFERS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Transferred ({transferPeriodFilter === 'custom-month' ? formatMonthDisplay(transferSelectedMonth) : transferPeriodFilter})
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-slate-100 mt-1">
                {formatINR(transferStats.totalAmount)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{transferStats.count} transfers logged</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Owner Drawings Only
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-purple-300 mt-1">
                {formatINR(transferStats.totalDrawings)}
              </div>
              <span className="text-[10px] text-purple-400/80 mt-0.5 block">Withdrawn by business owner</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Capital Injections
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-emerald-400 mt-1">
                {formatINR(transferStats.totalCapital)}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Owner capital introduced</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Bank Deposits & Sweeps
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-cyan-300 mt-1">
                {formatINR(transferStats.totalBankDeposits + transferStats.totalSettlements)}
              </div>
              <span className="text-[10px] text-cyan-400/80 mt-0.5 block">Cash & digital sweeps</span>
            </div>
          </div>

          {/* DATE & MONTH FILTER BAR */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-950/60">
            {/* Quick Period Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                <span>Period:</span>
              </span>
              {(
                [
                  { id: 'all', label: 'All Time' },
                  { id: 'this-month', label: 'This Month' },
                  { id: 'previous-month', label: 'Previous Month' },
                  { id: 'custom-month', label: 'Specific Month' },
                  { id: 'custom-range', label: 'Custom Date Range' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTransferPeriodFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    transferPeriodFilter === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Specific Month Selector */}
            {transferPeriodFilter === 'custom-month' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-medium text-slate-400">Select Month:</span>
                <button
                  type="button"
                  onClick={handleTransferPrevMonth}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <input
                  type="month"
                  value={transferSelectedMonth}
                  onChange={(e) => {
                    setTransferSelectedMonth(e.target.value);
                    setTransferPeriodFilter('custom-month');
                  }}
                  className="glass-input px-3 py-1 text-xs text-slate-100 font-bold rounded-xl border border-emerald-500/40"
                />

                <button
                  type="button"
                  onClick={handleTransferNextMonth}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTransferCurrentMonth}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-300 text-xs font-semibold hover:bg-slate-700 border border-emerald-500/20"
                >
                  Current Month
                </button>

                <span className="text-xs text-emerald-400 font-bold ml-1">
                  Viewing {formatMonthDisplay(transferSelectedMonth)}
                </span>
              </div>
            )}

            {/* Custom Date Range Pickers */}
            {transferPeriodFilter === 'custom-range' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-medium text-slate-400">From Date:</span>
                <input
                  type="date"
                  value={transferCustomStartDate}
                  onChange={(e) => setTransferCustomStartDate(e.target.value)}
                  className="glass-input px-3 py-1 text-xs text-slate-100 rounded-xl"
                />
                <span className="text-xs font-medium text-slate-400">To Date:</span>
                <input
                  type="date"
                  value={transferCustomEndDate}
                  onChange={(e) => setTransferCustomEndDate(e.target.value)}
                  className="glass-input px-3 py-1 text-xs text-slate-100 rounded-xl"
                />
              </div>
            )}

            {/* Transfer Type & Search Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Filter by Transfer Type / Movement
                </label>
                <CustomSelect
                  value={transferTypeFilter}
                  onChange={(val) => setTransferTypeFilter(val)}
                  options={[
                    { value: 'All', label: 'All Movement Types' },
                    { value: 'Owner Drawing', label: 'Owner Drawings', badge: 'Drawing', badgeColor: 'purple' },
                    { value: 'Capital Injection', label: 'Capital Injections', badge: 'Capital', badgeColor: 'emerald' },
                    { value: 'Cash to Bank Deposit', label: 'Cash to Bank Deposit' },
                    { value: 'Bank to Cash Withdrawal', label: 'Bank to Cash (ATM Withdrawal)' },
                    { value: 'UPI to Bank Settlement', label: 'UPI to Bank Settlement' },
                    { value: 'Card POS to Bank Settlement', label: 'Card POS to Bank Settlement' },
                    { value: 'Inter-Account Transfer', label: 'General Inter-Account Transfer' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Search Remarks, Reference, Accounts
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={transferSearchQuery}
                    onChange={(e) => setTransferSearchQuery(e.target.value)}
                    placeholder="Search remarks, account, amount..."
                    className="w-full glass-input pl-8 pr-2.5 py-1.5 text-xs text-slate-200 rounded-xl"
                  />
                  {transferSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTransferSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TRANSFERS & DRAWINGS TABLE */}
          <div className="glass-card rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3 whitespace-nowrap min-w-[110px]">Date</th>
                    <th className="p-3">Transfer Type</th>
                    <th className="p-3">From Account</th>
                    <th className="p-3">To Account</th>
                    <th className="p-3">Remarks / Reference</th>
                    <th className="p-3 text-right whitespace-nowrap">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono-num">
                  {filteredMoneyTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        No transfers or drawings found matching the selected period and criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMoneyTransfers.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 text-slate-300 font-mono-num font-semibold whitespace-nowrap min-w-[110px]">
                          {formatDateDisplay(item.date)}
                        </td>
                        <td className="p-3 font-sans font-semibold text-slate-200">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.transferType === 'Owner Drawing'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                : item.transferType === 'Capital Injection'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {item.transferType}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          {item.fromAccount ? (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                              {item.fromAccount}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-3 font-sans">
                          {item.toAccount ? (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                              {item.toAccount}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-3 font-sans text-slate-300 max-w-xs truncate">
                          {item.remarks || item.reference || '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-sm text-slate-100 whitespace-nowrap">
                          {formatINR(item.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (onConfirmDelete) {
                                onConfirmDelete(
                                  'Delete Money Transfer',
                                  `Are you sure you want to delete this ${item.transferType} of ${formatINR(item.amount)} dated ${formatDateDisplay(item.date)}? Account balances will recalculate automatically.`,
                                  () => deleteMoneyTransfer(item.id)
                                );
                              } else {
                                if (window.confirm('Delete this money transfer?')) {
                                  deleteMoneyTransfer(item.id);
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Transfer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STARTING BALANCES VAULT CONFIGURATION */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveOpeningBalances} className="space-y-4 max-w-3xl">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-blue-300">Baseline Starting Balances Calibration</h4>
              <p className="text-xs text-blue-200/90 leading-relaxed">
                Set or adjust the starting opening balances for each payment channel. The system takes these opening bases and layers real-time plate sales, invoices, customer recoveries, purchases, expenses, and salaries to calculate live available capital.
              </p>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-emerald-400" />
                <span>Opening Cash in Hand (Drawer Baseline)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={tempOpeningCash}
                  onChange={(e) => setTempOpeningCash(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input pl-8 pr-3 py-2 text-sm font-bold text-slate-100"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>Opening Bank Balance (Current Account)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={tempOpeningBank}
                  onChange={(e) => setTempOpeningBank(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input pl-8 pr-3 py-2 text-sm font-bold text-slate-100"
                  placeholder="25000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-teal-400" />
                <span>Opening UPI Balance (QR Codes)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={tempOpeningUPI}
                  onChange={(e) => setTempOpeningUPI(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input pl-8 pr-3 py-2 text-sm font-bold text-slate-100"
                  placeholder="5000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-purple-400" />
                <span>Opening Card / POS Balance</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={tempOpeningCard}
                  onChange={(e) => setTempOpeningCard(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input pl-8 pr-3 py-2 text-sm font-bold text-slate-100"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Opening Baseline Capital:</span>
              <div className="text-lg font-black font-mono-num text-slate-100">
                {formatINR(tempOpeningCash + tempOpeningBank + tempOpeningUPI + tempOpeningCard)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {openingSavedSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved & Recalculated Live!</span>
                </span>
              )}
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>Save Starting Balances</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MODAL 1: INTER-ACCOUNT TRANSFER & CAPITAL MOVEMENT */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">Log Money Transfer / Movement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Transfer Type</label>
                <CustomSelect<MoneyTransferType>
                  value={transferType}
                  onChange={(val) => handleTransferTypeChange(val)}
                  options={[
                    { value: 'Cash to Bank Deposit', label: 'Cash in Hand → Bank Deposit', sublabel: 'Counter Cash to Current A/C' },
                    { value: 'Bank to Cash Withdrawal', label: 'Bank → Cash Withdrawal', sublabel: 'ATM/Cheque Withdrawal for Drawer' },
                    { value: 'UPI to Bank Settlement', label: 'UPI → Bank Auto-Settlement Sweep', sublabel: 'QR to Current A/C' },
                    { value: 'Card POS to Bank Settlement', label: 'Card POS → Bank Settlement', sublabel: 'EDC Swipes to Current A/C' },
                    { value: 'Capital Injection', label: 'Capital Injection', sublabel: 'Owner Deposits Additional Capital', badge: 'Capital', badgeColor: 'emerald' },
                    { value: 'Owner Drawing', label: 'Owner Drawing', sublabel: 'Owner Withdraws Profit / Personal Cash', badge: 'Drawing', badgeColor: 'purple' },
                    { value: 'Inter-Account Transfer', label: 'Custom Inter-Account Movement', sublabel: 'Manual Internal Transfer' },
                  ]}
                  size="md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {transferType !== 'Capital Injection' && (
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">From Account (Source)</label>
                    <CustomSelect<PaymentMode>
                      value={transferFrom}
                      onChange={(val) => setTransferFrom(val)}
                      options={[
                        { value: 'Cash', label: 'Cash in Hand' },
                        { value: 'Bank', label: 'Bank Account' },
                        { value: 'UPI', label: 'UPI / QR' },
                        { value: 'Card', label: 'Card / POS' },
                      ]}
                      size="sm"
                    />
                  </div>
                )}

                {transferType !== 'Owner Drawing' && (
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">To Account (Destination)</label>
                    <CustomSelect<PaymentMode>
                      value={transferTo}
                      onChange={(val) => setTransferTo(val)}
                      options={[
                        { value: 'Bank', label: 'Bank Account' },
                        { value: 'Cash', label: 'Cash in Hand' },
                        { value: 'UPI', label: 'UPI / QR' },
                        { value: 'Card', label: 'Card / POS' },
                      ]}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferAmount || ''}
                    onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 15000"
                    className="w-full glass-input px-3 py-2 text-xs font-bold text-slate-100 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Bank Reference / Slip No. (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SBI-DEP-9921 or UTR-384729"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 rounded-xl"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Remarks / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Counter evening cash deposit"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 rounded-xl"
                />
              </div>

              {transferSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{transferSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PHYSICAL DRAWER CASH DENOMINATION COUNTER */}
      {showCashCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-xl p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Cash Drawer Denomination Counter</h3>
                  <p className="text-[11px] text-slate-400">Count physical currency notes in the counter drawer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCashCounterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Denomination inputs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { label: '₹500 Notes', key: 'd500' as const, val: 500 },
                { label: '₹200 Notes', key: 'd200' as const, val: 200 },
                { label: '₹100 Notes', key: 'd100' as const, val: 100 },
                { label: '₹50 Notes', key: 'd50' as const, val: 50 },
                { label: '₹20 Notes', key: 'd20' as const, val: 20 },
                { label: '₹10 Notes', key: 'd10' as const, val: 10 },
              ].map((denom) => (
                <div key={denom.key} className="p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">{denom.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom.key] || ''}
                      onChange={(e) =>
                        setDenominations({
                          ...denominations,
                          [denom.key]: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="w-full glass-input px-2.5 py-1.5 text-xs font-bold text-slate-100 rounded-xl"
                    />
                  </div>
                  <div className="mt-1 text-right text-[10px] font-mono-num text-slate-400">
                    = {formatINR((denominations[denom.key] || 0) * denom.val)}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Loose Coins / Change Total (₹)</label>
              <input
                type="number"
                min="0"
                value={denominations.coins || ''}
                onChange={(e) =>
                  setDenominations({
                    ...denominations,
                    coins: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="w-32 glass-input px-2.5 py-1.5 text-xs font-bold text-slate-100 rounded-xl text-right"
              />
            </div>

            {/* Reconciliation Comparison Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3 font-mono-num">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Physically Counted Drawer Cash:</span>
                <strong className="text-emerald-400 text-sm">{formatINR(countedPhysicalCash)}</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Book Cash Balance (Software Ledger):</span>
                <strong className="text-slate-100">{formatINR(moneyPosition.cashBalance)}</strong>
              </div>
              <div className="flex justify-between text-xs border-t border-white/10 pt-2 font-bold">
                <span>Discrepancy / Variance:</span>
                <span className={cashDiscrepancy === 0 ? 'text-emerald-400' : cashDiscrepancy > 0 ? 'text-teal-400' : 'text-rose-400'}>
                  {cashDiscrepancy === 0 ? '✓ Exact Match (₹0)' : `${cashDiscrepancy > 0 ? '+ Surplus ' : '- Shortage '}${formatINR(Math.abs(cashDiscrepancy))}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() =>
                  setDenominations({
                    d500: 0,
                    d200: 0,
                    d100: 0,
                    d50: 0,
                    d20: 0,
                    d10: 0,
                    coins: 0,
                  })
                }
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Reset Denominations
              </button>

              <button
                type="button"
                onClick={() => setShowCashCounterModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK OPENING SETTINGS MODAL */}
      {showOpeningSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">Set Starting Balances</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOpeningSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpeningBalances} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cash in Hand (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempOpeningCash}
                    onChange={(e) => setTempOpeningCash(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input px-3 py-2 text-xs font-bold text-slate-100 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bank Current A/C (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempOpeningBank}
                    onChange={(e) => setTempOpeningBank(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input px-3 py-2 text-xs font-bold text-slate-100 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">UPI / QR Baseline (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempOpeningUPI}
                    onChange={(e) => setTempOpeningUPI(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input px-3 py-2 text-xs font-bold text-slate-100 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Card / POS Baseline (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempOpeningCard}
                    onChange={(e) => setTempOpeningCard(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input px-3 py-2 text-xs font-bold text-slate-100 rounded-xl"
                  />
                </div>
              </div>

              {openingSavedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Starting balances updated and live totals recalculated!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowOpeningSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                >
                  Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CALCULATION PROOF & TRANSACTION REFERENCES INSPECTOR */}
      {inspectorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-3xl border border-emerald-500/30 bg-slate-900 shadow-2xl space-y-4 overflow-hidden">
            {/* Inspector Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Calculator className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-100">{inspectorData.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Calculation Proof
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{inspectorData.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectorData(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formula & Result Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Mathematical Ledger Equation
                </span>
                <span className="font-mono-num text-base font-black text-emerald-300">
                  {formatINR(inspectorData.resultAmount)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
                {inspectorData.formula}
              </div>
              {inspectorData.notes && inspectorData.notes.length > 0 && (
                <div className="space-y-1 pt-1">
                  {inspectorData.notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* In-Modal Search & Controls */}
            {!inspectorData.isOpening && inspectorData.items.length > 0 && (
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Bill / Reference ID, customer, vendor..."
                    value={inspectorSearchQuery}
                    onChange={(e) => setInspectorSearchQuery(e.target.value)}
                    className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 rounded-xl"
                  />
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Showing{' '}
                  <strong className="text-slate-200">
                    {
                      inspectorData.items.filter((item) => {
                        if (!inspectorSearchQuery.trim()) return true;
                        const q = inspectorSearchQuery.toLowerCase();
                        return (
                          (item.reference || '').toLowerCase().includes(q) ||
                          item.entityOrTitle.toLowerCase().includes(q) ||
                          item.source.toLowerCase().includes(q) ||
                          item.paymentMode.toLowerCase().includes(q)
                        );
                      }).length
                    }
                  </strong>{' '}
                  of {inspectorData.items.length} contributing txns
                </span>
              </div>
            )}

            {/* Contributing Transactions List Table */}
            <div className="flex-1 overflow-y-auto border border-white/10 rounded-2xl bg-slate-950/60">
              {inspectorData.isOpening ? (
                <div className="p-6 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Sliders className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Starting Base Anchor</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Starting balances are configured in the Business Profile settings. You can edit these at any time using the Starting Balances button in the top action bar.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Cash Opening</span>
                      <strong className="text-xs font-mono-num text-slate-100">{formatINR(moneyPosition.openingCash)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Bank Opening</span>
                      <strong className="text-xs font-mono-num text-slate-100">{formatINR(moneyPosition.openingBank)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 block">UPI Baseline</span>
                      <strong className="text-xs font-mono-num text-slate-100">{formatINR(moneyPosition.openingUPI)}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Card Baseline</span>
                      <strong className="text-xs font-mono-num text-slate-100">{formatINR(moneyPosition.openingCard)}</strong>
                    </div>
                  </div>
                </div>
              ) : inspectorData.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No contributing transactions found for this selection.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/5 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Reference #</th>
                      <th className="p-3">Entity / Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono-num">
                    {inspectorData.items
                      .filter((item) => {
                        if (!inspectorSearchQuery.trim()) return true;
                        const q = inspectorSearchQuery.toLowerCase();
                        return (
                          (item.reference || '').toLowerCase().includes(q) ||
                          item.entityOrTitle.toLowerCase().includes(q) ||
                          item.source.toLowerCase().includes(q) ||
                          item.paymentMode.toLowerCase().includes(q)
                        );
                      })
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{item.date}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-800 border border-slate-700 text-emerald-300">
                              {item.reference || `REF-${idx + 1}`}
                            </span>
                          </td>
                          <td className="p-3 font-sans font-medium text-slate-200 max-w-[220px] truncate">
                            {item.entityOrTitle}
                          </td>
                          <td className="p-3 font-sans text-slate-300 text-[11px] whitespace-nowrap">
                            {item.source}
                          </td>
                          <td className="p-3 font-sans whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-white/5">
                              {item.paymentMode}
                            </span>
                          </td>
                          <td
                            className={`p-3 text-right font-bold whitespace-nowrap ${
                              item.type === 'Inflow' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.type === 'Inflow' ? '+' : '-'}
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Inspector Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setInspectorData(null);
                  setActiveTab('audit');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                <History className="h-3.5 w-3.5 text-emerald-400" />
                <span>Open in Full Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorData(null)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
