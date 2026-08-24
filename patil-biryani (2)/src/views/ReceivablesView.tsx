import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  DollarSign,
  User,
  Share2,
  Copy,
  Check,
  CreditCard,
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
import { Receivable, PaymentMode } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { PeriodDateFilter, FilterPeriodType, isDateMatchingPeriod } from '../components/ui/PeriodDateFilter';

interface ReceivablesViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const ReceivablesView: React.FC<ReceivablesViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const {
    receivables,
    addReceivable,
    recordReceivablePayment,
    deleteReceivable,
    customers,
    businessProfile,
  } = useApp();
  const { showToast } = useAppNotification();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [collectPaymentModalRec, setCollectPaymentModalRec] = useState<Receivable | null>(null);

  // Add Form
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [amountReceived, setAmountReceived] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Collect Payment Form
  const [collectAmount, setCollectAmount] = useState('');
  const [collectPaymentMode, setCollectPaymentMode] = useState<PaymentMode>('UPI');
  const [collectRemarks, setCollectRemarks] = useState('');

  // Copied reminder state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Advanced Date Filter State
  const [periodType, setPeriodType] = useState<FilterPeriodType>('all');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());

  // Customer Select Handler
  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setCustomerName(c.name);
    }
  };

  // Submit New Receivable
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount);
    const rec = parseFloat(amountReceived) || 0;
    if (isNaN(tot) || tot <= 0) {
      showToast('Please enter a valid receivable amount.', 'warning');
      return;
    }

    const bal = Math.max(0, tot - rec);
    const cName = customerName.trim() || customers.find((c) => c.id === customerId)?.name || 'Direct Customer';

    addReceivable({
      customerId: customerId || 'cust-general',
      customerName: cName,
      invoiceNumber: invoiceNumber.trim() || `REC-${Date.now().toString().slice(-4)}`,
      date,
      description: description.trim() || 'Catering / Party Biryani Order',
      totalAmount: tot,
      amountReceived: rec,
      balance: bal,
      dueDate: dueDate || undefined,
      status: bal <= 0 ? 'Fully Received' : rec > 0 ? 'Partially Received' : 'Pending',
      remarks: remarks.trim() || undefined,
    });

    showToast(`Receivable recorded for ${cName}`, 'success');
    setShowAddModal(false);
    setCustomerId('');
    setCustomerName('');
    setInvoiceNumber('');
    setDescription('');
    setTotalAmount('');
    setAmountReceived('0');
    setDueDate('');
    setRemarks('');
  };

  // Submit Collect Payment
  const handleSubmitCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectPaymentModalRec) return;
    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid collection amount.', 'warning');
      return;
    }

    recordReceivablePayment(collectPaymentModalRec.id, amt, collectPaymentMode, collectRemarks);
    showToast(`Collected ${formatINR(amt)} from ${collectPaymentModalRec.customerName}`, 'success');
    setCollectPaymentModalRec(null);
    setCollectAmount('');
    setCollectRemarks('');
  };

  // Filtered List
  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      if (!isDateMatchingPeriod(r.date, periodType, selectedMonth, customStartDate, customEndDate)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCust = r.customerName.toLowerCase().includes(q);
        const matchInv = r.invoiceNumber.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        return matchCust || matchInv || matchDesc;
      }
      return true;
    });
  }, [
    receivables,
    periodType,
    selectedMonth,
    customStartDate,
    customEndDate,
    statusFilter,
    searchQuery,
  ]);

  // Financial Stats
  const stats = useMemo(() => {
    const totalDue = receivables
      .filter((r) => r.status !== 'Fully Received')
      .reduce((sum, r) => sum + r.balance, 0);

    const totalCollected = receivables.reduce((sum, r) => sum + r.amountReceived, 0);
    const fullyReceivedCount = receivables.filter((r) => r.status === 'Fully Received').length;
    const pendingCount = receivables.filter((r) => r.status !== 'Fully Received').length;

    return { totalDue, totalCollected, fullyReceivedCount, pendingCount };
  }, [receivables]);

  // Copy WhatsApp Reminder Text
  const handleCopyReminder = (r: Receivable) => {
    const text = `Namaskar ${r.customerName} ji,\nThis is a gentle reminder from *${businessProfile.name || 'Patil Biryani'}* regarding pending payment of *${formatINR(r.balance)}* against Bill #${r.invoiceNumber}.\n\nPlease find payment details:\nUPI ID: ${businessProfile.ownerMobile}@upi (Patil Biryani)\nThank you! 🙏`;
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <ArrowDownLeft className="h-7 w-7 text-emerald-400" />
            <span>Customer Receivables Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track customer party orders, bulk catering dues, partial collections & payment recovery
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add Receivable</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Total Outstanding Due</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-amber-400 mt-1">
            {formatINR(stats.totalDue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{stats.pendingCount} pending customer accounts</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Total Collected Amount</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-emerald-400 mt-1">
            {formatINR(stats.totalCollected)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recovered collections</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Cleared Accounts</span>
            <User className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-cyan-400 mt-1">
            {stats.fullyReceivedCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Fully paid invoices</div>
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
        totalCount={receivables.length}
        filteredCount={filteredReceivables.length}
        label="Filter Receivables by Date"
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
              placeholder="Search customer, bill #..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Pending', label: 'Pending', badge: 'Pending', badgeColor: 'rose' },
              { value: 'Partially Received', label: 'Partially Received', badge: 'Partial', badgeColor: 'amber' },
              { value: 'Fully Received', label: 'Fully Received', badge: 'Received', badgeColor: 'emerald' },
            ]}
            className="w-40"
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenPdfExport(
                'Patil Biryani - Customer Receivables',
                filteredReceivables.map((r) => ({
                  Customer: r.customerName,
                  'Invoice #': r.invoiceNumber,
                  Date: r.date,
                  Description: r.description,
                  'Total Amount': r.totalAmount,
                  Received: r.amountReceived,
                  Balance: r.balance,
                  'Due Date': r.dueDate || '',
                  Status: r.status,
                })),
                {
                  'Total Due': formatINR(stats.totalDue),
                  'Total Received': formatINR(stats.totalCollected),
                }
              )
            }
            className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-rose-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() =>
              onOpenExcelExport(
                'Patil_Biryani_Receivables',
                filteredReceivables.map((r) => ({
                  Customer: r.customerName,
                  'Invoice Reference': r.invoiceNumber,
                  Date: r.date,
                  Description: r.description,
                  'Total Amount': r.totalAmount,
                  'Amount Received': r.amountReceived,
                  'Outstanding Balance': r.balance,
                  'Due Date': r.dueDate || '',
                  Status: r.status,
                  Remarks: r.remarks || '',
                }))
              )
            }
            className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Bill / Ref #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-right">Total Bill</th>
                <th className="px-4 py-3.5 text-right">Received</th>
                <th className="px-4 py-3.5 text-right">Balance Due</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No receivable accounts found.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-200">{r.customerName}</div>
                    </td>
                    <td className="px-4 py-3 font-mono-num text-slate-300">{r.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-300">{formatDateDisplay(r.date)}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <div>{r.description}</div>
                      {r.remarks && <div className="text-[10px] text-slate-500">{r.remarks}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-100">
                      {formatINR(r.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-emerald-400">
                      {formatINR(r.amountReceived)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-amber-400">
                      {r.balance > 0 ? formatINR(r.balance) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Fully Received'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.status === 'Partially Received'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.balance > 0 && (
                          <>
                            <button
                              onClick={() => {
                                setCollectPaymentModalRec(r);
                                setCollectAmount(r.balance.toString());
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-bold border border-emerald-500/30 transition-all"
                            >
                              Collect
                            </button>

                            <button
                              onClick={() => handleCopyReminder(r)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Copy WhatsApp Payment Reminder"
                            >
                              {copiedId === r.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                              )}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() =>
                            onConfirmDelete(
                              'Delete Receivable Record',
                              `Are you sure you want to delete receivable for ${r.customerName}?`,
                              () => deleteReceivable(r.id)
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Record"
                        >
                          ✕
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

      {/* Collect Payment Modal */}
      {collectPaymentModalRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                Collect Payment: {collectPaymentModalRec.customerName}
              </h3>
              <button
                onClick={() => setCollectPaymentModalRec(null)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Invoice / Order:</span>
                <span className="font-bold text-slate-200">{collectPaymentModalRec.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Balance:</span>
                <span className="font-mono-num font-bold text-amber-400">
                  {formatINR(collectPaymentModalRec.balance)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitCollect} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Collection Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={collectPaymentModalRec.balance}
                  step="any"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs font-mono-num font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Payment Mode
                </label>
                <CustomSelect
                  value={collectPaymentMode}
                  onChange={(val) => setCollectPaymentMode(val as PaymentMode)}
                  options={[
                    { value: 'UPI', label: 'UPI / QR Payment' },
                    { value: 'Cash', label: 'Cash Payment' },
                    { value: 'Bank', label: 'Bank Transfer / NEFT' },
                    { value: 'Card', label: 'Card Payment' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Transaction Notes / Reference
                </label>
                <input
                  type="text"
                  value={collectRemarks}
                  onChange={(e) => setCollectRemarks(e.target.value)}
                  placeholder="e.g. GPay ref #98320492"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCollectPaymentModalRec(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Receivable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                Record Party / Catering Receivable
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
                    Select Customer
                  </label>
                  <CustomSelect
                    value={customerId}
                    onChange={(val) => handleSelectCustomer(val)}
                    options={[
                      { value: '', label: 'Custom Customer' },
                      ...customers.map((c) => ({
                        value: c.id,
                        label: c.name,
                        sublabel: c.mobile || c.address,
                      })),
                    ]}
                    size="sm"
                    searchable
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
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
                    Order / Bill Reference #
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. CAT-2026-001"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Description / Order Details
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 50 Plates Chicken Dum Biryani for Marriage Function"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Total Order Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Advance Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="5000"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Expected Payment Due Date
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25"
                >
                  Save Receivable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
