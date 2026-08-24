import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Building,
  DollarSign,
  User,
  History,
  Trash2,
  Wallet,
  QrCode,
  CreditCard,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
  getCurrentMonthString,
} from '../utils/formatters';
import { Payable, PayableType, PayablePayment, PaymentMode } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { PeriodDateFilter, FilterPeriodType, isDateMatchingPeriod } from '../components/ui/PeriodDateFilter';

interface PayablesViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const PayablesView: React.FC<PayablesViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const {
    payables,
    payablePayments,
    addPayable,
    recordPayablePayment,
    deletePayablePayment,
    deletePayable,
    vendors,
  } = useApp();
  const { showToast } = useAppNotification();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'payables' | 'payments'>('payables');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [payModalItem, setPayModalItem] = useState<Payable | null>(null);

  // Add Form
  const [type, setType] = useState<PayableType>('Supplier');
  const [entityId, setEntityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Settle Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payPaymentMode, setPayPaymentMode] = useState<PaymentMode>('Bank');
  const [payDate, setPayDate] = useState(getTodayDateString());
  const [payRemarks, setPayRemarks] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Advanced Date Filter State
  const [periodType, setPeriodType] = useState<FilterPeriodType>('all');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());

  // Vendor Select
  const handleSelectVendor = (vId: string) => {
    setEntityId(vId);
    const v = vendors.find((vend) => vend.id === vId);
    if (v) {
      setEntityName(v.name);
    }
  };

  // Submit Add
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount);
    const pd = parseFloat(amountPaid) || 0;
    if (isNaN(tot) || tot <= 0) {
      showToast('Please enter a valid payable amount.', 'warning');
      return;
    }

    const bal = Math.max(0, tot - pd);
    const eName = entityName.trim() || 'Creditor / Supplier';

    addPayable({
      type,
      entityId: entityId || undefined,
      entityName: eName,
      referenceNumber: referenceNumber.trim() || `PAY-${Date.now().toString().slice(-4)}`,
      date,
      description: description.trim() || 'Supplier purchase / Creditor balance',
      totalAmount: tot,
      amountPaid: pd,
      balance: bal,
      dueDate: dueDate || undefined,
      status: bal <= 0 ? 'Fully Paid' : pd > 0 ? 'Partially Paid' : 'Pending',
      remarks: remarks.trim() || undefined,
    });

    showToast(`Recorded payable for ${eName}`, 'success');
    setShowAddModal(false);
    setEntityId('');
    setEntityName('');
    setReferenceNumber('');
    setDescription('');
    setTotalAmount('');
    setAmountPaid('0');
    setDueDate('');
    setRemarks('');
  };

  // Submit Pay
  const handleSubmitPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalItem) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid payment amount.', 'warning');
      return;
    }

    recordPayablePayment(payModalItem.id, amt, payPaymentMode, payRemarks, payDate);
    showToast(`Paid ${formatINR(amt)} to ${payModalItem.entityName}`, 'success');
    setPayModalItem(null);
    setPayAmount('');
    setPayRemarks('');
    setPayDate(getTodayDateString());
  };

  // Filtered List
  const filteredPayables = useMemo(() => {
    return payables.filter((p) => {
      if (!isDateMatchingPeriod(p.date, periodType, selectedMonth, customStartDate, customEndDate)) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchEntity = p.entityName.toLowerCase().includes(q);
        const matchRef = p.referenceNumber.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        return matchEntity || matchRef || matchDesc;
      }
      return true;
    });
  }, [
    payables,
    periodType,
    selectedMonth,
    customStartDate,
    customEndDate,
    typeFilter,
    statusFilter,
    searchQuery,
  ]);

  // Filtered Payments History
  const filteredPayments = useMemo(() => {
    return payablePayments.filter((pmt) => {
      if (!isDateMatchingPeriod(pmt.date, periodType, selectedMonth, customStartDate, customEndDate)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = pmt.entityName.toLowerCase().includes(q);
        const matchRef = (pmt.reference || '').toLowerCase().includes(q);
        const matchRemarks = (pmt.remarks || '').toLowerCase().includes(q);
        return matchName || matchRef || matchRemarks;
      }
      return true;
    });
  }, [
    payablePayments,
    periodType,
    selectedMonth,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const totalDue = payables
      .filter((p) => p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + p.balance, 0);

    const supplierDue = payables
      .filter((p) => p.type === 'Supplier' && p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + p.balance, 0);

    const staffDue = payables
      .filter((p) => p.type === 'Staff' && p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + p.balance, 0);

    const totalPaid = payablePayments.reduce((sum, p) => sum + p.amount, 0) || payables.reduce((sum, p) => sum + p.amountPaid, 0);

    return { totalDue, supplierDue, staffDue, totalPaid };
  }, [payables, payablePayments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <ArrowUpRight className="h-7 w-7 text-rose-400" />
            <span>Supplier &amp; Creditor Payables Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track poultry, mutton, spice supplier balances, electricity &amp; staff salary liabilities with automatic cashflow tallying
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('payables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'payables'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Dues Ledger ({payables.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-rose-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Payment History &amp; Cashflow ({payablePayments.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Payable</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Total Outstanding Payables</span>
            <Clock className="h-4 w-4 text-rose-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-rose-400 mt-1">
            {formatINR(stats.totalDue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total liability balance</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Supplier Dues</span>
            <Building className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-amber-400 mt-1">
            {formatINR(stats.supplierDue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Raw material vendors</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Staff Salary Liabilities</span>
            <User className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-cyan-400 mt-1">
            {formatINR(stats.staffDue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Approved salary dues</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Settled Outflows</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-emerald-400 mt-1">
            {formatINR(stats.totalPaid)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Paid &amp; Tallied in Cash Flow</div>
        </div>
      </div>

      {/* Advanced Period & Date Filter */}
      <PeriodDateFilter
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        customStartDate={customStartDate}
        onStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onEndDateChange={setCustomEndDate}
        totalCount={activeTab === 'payables' ? payables.length : payablePayments.length}
        filteredCount={activeTab === 'payables' ? filteredPayables.length : filteredPayments.length}
        label={activeTab === 'payables' ? 'Filter Payables by Date' : 'Filter Payment History by Date'}
      />

      {/* Filter and Action Bar */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, reference #..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          {activeTab === 'payables' && (
            <>
              <CustomSelect
                value={typeFilter}
                onChange={(val) => setTypeFilter(val)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'Supplier', label: 'Supplier Dues' },
                  { value: 'Staff', label: 'Staff Dues' },
                  { value: 'Other', label: 'Other Creditors' },
                ]}
                className="w-40"
                size="sm"
              />

              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Pending', label: 'Pending', badge: 'Pending', badgeColor: 'rose' },
                  { value: 'Partially Paid', label: 'Partially Paid', badge: 'Partial', badgeColor: 'amber' },
                  { value: 'Fully Paid', label: 'Fully Paid', badge: 'Paid', badgeColor: 'emerald' },
                ]}
                className="w-36"
                size="sm"
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'payables') {
                onOpenPdfExport(
                  'Patil Biryani - Payables Ledger',
                  filteredPayables.map((p) => ({
                    'Creditor / Supplier': p.entityName,
                    Type: p.type,
                    'Ref #': p.referenceNumber,
                    Date: p.date,
                    Description: p.description,
                    Total: p.totalAmount,
                    Paid: p.amountPaid,
                    Balance: p.balance,
                    'Due Date': p.dueDate || '',
                    Status: p.status,
                  })),
                  {
                    'Total Payables': formatINR(stats.totalDue),
                    'Total Paid': formatINR(stats.totalPaid),
                  }
                );
              } else {
                onOpenPdfExport(
                  'Patil Biryani - Payable Payment Outflow Vouchers',
                  filteredPayments.map((pmt) => ({
                    Date: pmt.date,
                    'Supplier / Entity': pmt.entityName,
                    'Ref / Bill': pmt.reference || '',
                    'Payment Mode': pmt.paymentMode,
                    'Amount Paid (₹)': formatINR(pmt.amount),
                    Remarks: pmt.remarks || '',
                  })),
                  {
                    'Total Outflows Paid': formatINR(filteredPayments.reduce((s, p) => s + p.amount, 0)),
                  }
                );
              }
            }}
            className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-rose-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'payables') {
                onOpenExcelExport(
                  'Patil_Biryani_Payables',
                  filteredPayables.map((p) => ({
                    'Entity Name': p.entityName,
                    Type: p.type,
                    'Reference Number': p.referenceNumber,
                    Date: p.date,
                    Description: p.description,
                    'Total Amount': p.totalAmount,
                    'Amount Paid': p.amountPaid,
                    'Outstanding Balance': p.balance,
                    'Due Date': p.dueDate || '',
                    Status: p.status,
                    Remarks: p.remarks || '',
                  }))
                );
              } else {
                onOpenExcelExport(
                  'Patil_Biryani_Payable_Payments',
                  filteredPayments.map((pmt) => ({
                    Date: pmt.date,
                    'Entity Name': pmt.entityName,
                    Reference: pmt.reference || '',
                    'Payment Mode': pmt.paymentMode,
                    'Amount Paid': pmt.amount,
                    Remarks: pmt.remarks || '',
                  }))
                );
              }
            }}
            className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Payables Ledger Table */}
      {activeTab === 'payables' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3.5">Supplier / Creditor</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Ref #</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5 text-right">Total Liability</th>
                  <th className="px-4 py-3.5 text-right">Paid</th>
                  <th className="px-4 py-3.5 text-right">Balance Due</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayables.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                      No payable records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayables.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-200">{p.entityName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300">
                          {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono-num text-slate-300">{p.referenceNumber}</td>
                      <td className="px-4 py-3 text-slate-300">{formatDateDisplay(p.date)}</td>
                      <td className="px-4 py-3 text-slate-300">
                        <div>{p.description}</div>
                        {p.remarks && <div className="text-[10px] text-slate-500">{p.remarks}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-100">
                        {formatINR(p.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num text-emerald-400">
                        {formatINR(p.amountPaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-rose-400">
                        {p.balance > 0 ? formatINR(p.balance) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Fully Paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : p.status === 'Partially Paid'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.balance > 0 && (
                            <button
                              onClick={() => {
                                setPayModalItem(p);
                                setPayAmount(p.balance.toString());
                                setPayDate(getTodayDateString());
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 text-[11px] font-bold border border-rose-500/30 transition-all flex items-center gap-1"
                            >
                              <DollarSign className="h-3 w-3" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              onConfirmDelete(
                                'Delete Payable Record',
                                `Are you sure you want to delete payable for ${p.entityName}?`,
                                () => deletePayable(p.id)
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Paid Cashflow Outflow Vouchers History */}
      {activeTab === 'payments' && (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10 space-y-4 p-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-rose-400" />
                <span>Supplier Payment Cashflow Outflows Ledger</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every settlement below is automatically tallied in the Cash Flow Statement, Daily Closing Drawer, and Mode-wise Balance.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Total Outflow: {formatINR(filteredPayments.reduce((s, p) => s + p.amount, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Supplier / Creditor</th>
                  <th className="px-4 py-3">Bill / Ref #</th>
                  <th className="px-4 py-3">Payment Channel</th>
                  <th className="px-4 py-3 text-right">Amount Settled</th>
                  <th className="px-4 py-3">Remarks / Voucher</th>
                  <th className="px-4 py-3 text-center">Cashflow Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No payment outflow vouchers recorded yet. Settle any payable above to generate a record.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono-num">{formatDateDisplay(pmt.date)}</td>
                      <td className="px-4 py-3 font-bold text-slate-200">{pmt.entityName}</td>
                      <td className="px-4 py-3 font-mono-num text-slate-400">{pmt.reference || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                          pmt.paymentMode === 'Cash'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : pmt.paymentMode === 'UPI'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}>
                          {pmt.paymentMode === 'Cash' && <Wallet className="h-3 w-3" />}
                          {pmt.paymentMode === 'UPI' && <QrCode className="h-3 w-3" />}
                          {pmt.paymentMode === 'Bank' && <Building className="h-3 w-3" />}
                          {pmt.paymentMode === 'Card' && <CreditCard className="h-3 w-3" />}
                          <span>{pmt.paymentMode}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-num font-extrabold text-rose-400">
                        -{formatINR(pmt.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{pmt.remarks || 'Supplier Dues Settle'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Tallied in Cashflow</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            onConfirmDelete(
                              'Reverse Payment Outflow',
                              `Reverse ₹${formatINR(pmt.amount)} payment to ${pmt.entityName}? This will restore the payable liability balance.`,
                              () => deletePayablePayment(pmt.id)
                            )
                          }
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Reverse Payment"
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
      )}

      {/* Pay Modal */}
      {payModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                Settle Payment: {payModalItem.entityName}
              </h3>
              <button
                onClick={() => setPayModalItem(null)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Ref Number:</span>
                <span className="font-bold text-slate-200">{payModalItem.referenceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Balance:</span>
                <span className="font-mono-num font-bold text-rose-400">
                  {formatINR(payModalItem.balance)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitPay} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={payModalItem.balance}
                    step="any"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num font-bold text-rose-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Payment Mode
                </label>
                <CustomSelect
                  value={payPaymentMode}
                  onChange={(val) => setPayPaymentMode(val as PaymentMode)}
                  options={[
                    { value: 'Bank', label: 'Bank Transfer / NEFT / IMPS' },
                    { value: 'UPI', label: 'UPI / QR' },
                    { value: 'Cash', label: 'Cash Payment (Deducted from Drawer)' },
                    { value: 'Card', label: 'Card / POS' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Payment Remarks / Voucher Reference
                </label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="e.g. Paid via HDFC NetBanking"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Cashflow Notice Badge */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cashflow &amp; Tally:</strong> This payment is logged as an outflow on {formatDateDisplay(payDate)} and automatically tallies in the Cash Flow Statement and Daily Closing.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/25"
                >
                  Settle &amp; Tally Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                Add Payable Liability
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payable Type
                  </label>
                  <CustomSelect
                    value={type}
                    onChange={(val) => setType(val as PayableType)}
                    options={[
                      { value: 'Supplier', label: 'Supplier Dues' },
                      { value: 'Staff', label: 'Staff Payable' },
                      { value: 'Other', label: 'Other Creditor' },
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Supplier / Payee Name
                  </label>
                  <input
                    type="text"
                    required
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="e.g. Royal Poultry Farm"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Reference Bill #
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. SUP-9921"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 50kg Chicken & 20kg Mutton Balance"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="12000"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="2000"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/25"
                >
                  Save Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
