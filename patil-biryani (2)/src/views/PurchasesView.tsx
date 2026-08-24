import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
  getCurrentMonthString,
  generateId,
} from '../utils/formatters';
import { Purchase, PurchaseItem, PaymentMode } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { PeriodDateFilter, FilterPeriodType, isDateMatchingPeriod } from '../components/ui/PeriodDateFilter';

interface PurchasesViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const {
    purchases,
    addPurchase,
    updatePurchase,
    deletePurchase,
    vendors,
    isDateInActiveFilter,
  } = useApp();
  const { showToast } = useAppNotification();

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);

  // Form Fields
  const [date, setDate] = useState<string>(getTodayDateString());
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [items, setItems] = useState<PurchaseItem[]>([
    { itemId: '1', itemName: 'Fresh Chicken', quantity: 20, unit: 'kg', rate: 180, total: 3600 },
  ]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Bank');
  const [paidAmount, setPaidAmount] = useState<string>('3600');
  const [dueDate, setDueDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Table Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Advanced Date Filter State
  const [periodType, setPeriodType] = useState<FilterPeriodType>('all');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());

  // Calculate items total
  const formTotalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.quantity * it.rate || 0), 0);
  }, [items]);

  const formPaidNum = useMemo(() => {
    const p = parseFloat(paidAmount);
    return isNaN(p) ? 0 : p;
  }, [paidAmount]);

  const formBalanceDue = Math.max(0, formTotalAmount - formPaidNum);

  // Handle Item Row Changes
  const handleItemChange = (index: number, field: keyof PurchaseItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      if (field === 'quantity' || field === 'rate') {
        const q = parseFloat(field === 'quantity' ? val : item.quantity) || 0;
        const r = parseFloat(field === 'rate' ? val : item.rate) || 0;
        item.total = Math.round(q * r);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { itemId: generateId('item'), itemName: '', quantity: 1, unit: 'kg', rate: 0, total: 0 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Vendor Selection
  const handleSelectVendor = (vId: string) => {
    setVendorId(vId);
    const vend = vendors.find((v) => v.id === vId);
    if (vend) {
      setVendorName(vend.name);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setDate(getTodayDateString());
    setVendorId(vendors[0]?.id || '');
    setVendorName(vendors[0]?.name || '');
    setItems([
      { itemId: '1', itemName: 'Fresh Chicken', quantity: 20, unit: 'kg', rate: 180, total: 3600 },
    ]);
    setPaymentMode('Bank');
    setPaidAmount('3600');
    setDueDate('');
    setRemarks('');
    setShowAddModal(false);
  };

  // Submit Purchase
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || formTotalAmount <= 0) {
      showToast('Please add valid purchase items with quantity and rate.', 'warning');
      return;
    }

    const vName = vendorName.trim() || vendors.find((v) => v.id === vendorId)?.name || 'Direct Supplier';

    addPurchase({
      date,
      vendorId: vendorId || 'vend-general',
      vendorName: vName,
      items,
      totalAmount: formTotalAmount,
      paidAmount: formPaidNum,
      balanceDue: formBalanceDue,
      paymentStatus: formBalanceDue <= 0 ? 'Paid' : formPaidNum > 0 ? 'Partial' : 'Pending',
      paymentMode,
      dueDate: formBalanceDue > 0 ? dueDate : undefined,
      remarks: remarks.trim() || undefined,
    });

    showToast(`Purchase logged for ${vName}`, 'success');
    handleResetForm();
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (!isDateMatchingPeriod(p.date, periodType, selectedMonth, customStartDate, customEndDate)) return false;
      if (selectedVendorFilter !== 'all' && p.vendorId !== selectedVendorFilter) return false;
      if (selectedStatusFilter !== 'all' && p.paymentStatus !== selectedStatusFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNum = p.purchaseNumber.toLowerCase().includes(q);
        const matchVend = p.vendorName.toLowerCase().includes(q);
        const matchItem = p.items.some((it) => it.itemName.toLowerCase().includes(q));
        return matchNum || matchVend || matchItem;
      }
      return true;
    });
  }, [
    purchases,
    periodType,
    selectedMonth,
    customStartDate,
    customEndDate,
    selectedVendorFilter,
    selectedStatusFilter,
    searchQuery,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const paid = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const balance = filteredPurchases.reduce((sum, p) => sum + p.balanceDue, 0);
    return { total, paid, balance };
  }, [filteredPurchases]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-amber-400" />
            <span>Raw Materials & Inventory Purchases</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log chicken, mutton, basmati rice, oil, spices & packaging stock with vendor ledger tracking
          </p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Record Purchase</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Total Purchases</span>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-amber-400 mt-1">
            {formatINR(stats.total)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{filteredPurchases.length} stock receipts</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Paid to Suppliers</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-emerald-400 mt-1">
            {formatINR(stats.paid)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cleared via Bank / UPI / Cash</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Outstanding Supplier Payables</span>
            <Clock className="h-4 w-4 text-rose-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-rose-400 mt-1">
            {formatINR(stats.balance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending supplier balance</div>
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
        totalCount={purchases.length}
        filteredCount={filteredPurchases.length}
        label="Filter Purchases by Date"
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
              placeholder="Search purchase #, item, vendor..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <CustomSelect
            value={selectedVendorFilter}
            onChange={(val) => setSelectedVendorFilter(val)}
            options={[
              { value: 'all', label: 'All Suppliers' },
              ...vendors.map((v) => ({ value: v.id, label: v.name, sublabel: v.contactPerson })),
            ]}
            className="w-48"
            size="sm"
          />

          <CustomSelect
            value={selectedStatusFilter}
            onChange={(val) => setSelectedStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Paid', label: 'Paid', badge: 'Paid', badgeColor: 'emerald' },
              { value: 'Partial', label: 'Partial', badge: 'Partial', badgeColor: 'amber' },
              { value: 'Pending', label: 'Pending', badge: 'Pending', badgeColor: 'rose' },
            ]}
            className="w-36"
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenPdfExport(
                'Patil Biryani - Purchases Register',
                filteredPurchases.map((p) => ({
                  'Purchase #': p.purchaseNumber,
                  Date: p.date,
                  Vendor: p.vendorName,
                  Items: p.items.map((i) => `${i.itemName} (${i.quantity} ${i.unit})`).join(', '),
                  Total: p.totalAmount,
                  Paid: p.paidAmount,
                  BalanceDue: p.balanceDue,
                  Mode: p.paymentMode,
                  Status: p.paymentStatus,
                })),
                {
                  'Total Purchases': formatINR(stats.total),
                  'Total Paid': formatINR(stats.paid),
                  'Total Due': formatINR(stats.balance),
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
                'Patil_Biryani_Purchases',
                filteredPurchases.map((p) => ({
                  'Purchase Order Number': p.purchaseNumber,
                  Date: p.date,
                  Vendor: p.vendorName,
                  'Items Summary': p.items.map((i) => `${i.itemName} (${i.quantity} ${i.unit} @ ₹${i.rate})`).join(', '),
                  'Total Amount': p.totalAmount,
                  'Paid Amount': p.paidAmount,
                  'Balance Due': p.balanceDue,
                  'Payment Mode': p.paymentMode,
                  'Payment Status': p.paymentStatus,
                  'Due Date': p.dueDate || '',
                  Remarks: p.remarks || '',
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

      {/* Purchases Data Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Purchase #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Supplier / Vendor</th>
                <th className="px-4 py-3.5">Items & Quantity</th>
                <th className="px-4 py-3.5 text-right">Total Amount</th>
                <th className="px-4 py-3.5 text-right">Paid</th>
                <th className="px-4 py-3.5 text-right">Due Balance</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No purchase records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono-num font-bold text-amber-400">
                      {p.purchaseNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDateDisplay(p.date)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-200">{p.vendorName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div className="space-y-0.5">
                        {p.items.map((it, idx) => (
                          <div key={idx} className="text-[11px]">
                            {it.itemName} • <span className="text-slate-400">{it.quantity} {it.unit} @ ₹{it.rate}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-100">
                      {formatINR(p.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num text-emerald-400">
                      {formatINR(p.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-rose-400">
                      {p.balanceDue > 0 ? formatINR(p.balanceDue) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : p.paymentStatus === 'Partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          onConfirmDelete(
                            'Delete Purchase',
                            `Are you sure you want to delete purchase ${p.purchaseNumber}? This will revert any supplier payable balances.`,
                            () => deletePurchase(p.id)
                          )
                        }
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Purchase"
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

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
                <span>Record Stock Purchase</span>
              </h3>
              <button
                onClick={handleResetForm}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Purchase Date
                  </label>
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
                    Select Supplier / Vendor
                  </label>
                  <CustomSelect
                    value={vendorId}
                    onChange={(val) => handleSelectVendor(val)}
                    options={[
                      { value: '', label: 'Custom / Walk-in Supplier' },
                      ...vendors.map((v) => ({
                        value: v.id,
                        label: v.name,
                        sublabel: v.contactPerson ? `${v.contactPerson} • ${v.phone || ''}` : v.phone,
                      })),
                    ]}
                    size="sm"
                    searchable
                  />
                </div>
              </div>

              {/* Items Table Form */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Purchased Items & Rates</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-950/40 border border-white/5"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item (e.g. Chicken, Mutton, Rice)"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          className="w-full glass-input px-2 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0.1"
                          step="any"
                          placeholder="Qty"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full glass-input px-2 py-1.5 text-xs font-mono-num text-slate-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <CustomSelect
                          value={item.unit}
                          onChange={(val) => handleItemChange(idx, 'unit', val)}
                          options={[
                            { value: 'kg', label: 'kg' },
                            { value: 'ltr', label: 'ltr' },
                            { value: 'bags', label: 'bags' },
                            { value: 'tins', label: 'tins' },
                            { value: 'boxes', label: 'boxes' },
                            { value: 'pcs', label: 'pcs' },
                          ]}
                          size="sm"
                          buttonClassName="py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="0"
                          step="any"
                          placeholder="Rate ₹"
                          value={item.rate || ''}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full glass-input px-2 py-1.5 text-xs font-mono-num text-slate-200"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment Split */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Total Bill (₹)
                  </label>
                  <div className="glass-input px-3 py-2 font-mono-num font-bold text-amber-400 text-sm">
                    {formatINR(formTotalAmount)}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Balance Due (₹)
                  </label>
                  <div
                    className={`px-3 py-2 rounded-xl border font-mono-num font-bold text-sm ${
                      formBalanceDue > 0
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                        : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {formatINR(formBalanceDue)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payment Mode
                  </label>
                  <CustomSelect
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val as PaymentMode)}
                    options={[
                      { value: 'Bank', label: 'Bank Transfer / NEFT / IMPS' },
                      { value: 'UPI', label: 'UPI / QR' },
                      { value: 'Cash', label: 'Cash' },
                    ]}
                    size="sm"
                  />
                </div>

                {formBalanceDue > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Balance Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Remarks / Invoice Reference
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Bill #8843 from Poultry farm"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25"
                >
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
