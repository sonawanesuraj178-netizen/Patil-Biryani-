import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Tag,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
  getCurrentMonthString,
} from '../utils/formatters';
import { Expense, ExpenseCategory, PaymentMode } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { PeriodDateFilter, FilterPeriodType, isDateMatchingPeriod } from '../components/ui/PeriodDateFilter';
import { ExpensesSkeleton } from '../components/ui/Skeleton';
import { useAppNotification } from '../context/AppNotificationContext';
import { AppModal } from '../components/ui/AppModal';

interface ExpensesViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    expenseCategories,
    addExpenseCategory,
    deleteExpenseCategory,
    vendors,
    isDateInActiveFilter,
    isLoading,
  } = useApp();
  const { showToast } = useAppNotification();

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState<string>(getTodayDateString());
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [remarks, setRemarks] = useState<string>('');

  // Category Management Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Table Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState('all');

  // Advanced Date Filter State
  const [periodType, setPeriodType] = useState<FilterPeriodType>('all');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!isDateMatchingPeriod(e.date, periodType, selectedMonth, customStartDate, customEndDate)) return false;
      if (selectedCategoryFilter !== 'all' && e.categoryId !== selectedCategoryFilter) return false;
      if (selectedStatusFilter !== 'all' && e.paymentStatus !== selectedStatusFilter) return false;
      if (selectedModeFilter !== 'all' && e.paymentMode !== selectedModeFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchNum = e.expenseNumber.toLowerCase().includes(q);
        const matchCat = e.categoryName.toLowerCase().includes(q);
        const matchVend = e.vendorName.toLowerCase().includes(q);
        return matchDesc || matchNum || matchCat || matchVend;
      }
      return true;
    });
  }, [
    expenses,
    periodType,
    selectedMonth,
    customStartDate,
    customEndDate,
    selectedCategoryFilter,
    selectedStatusFilter,
    selectedModeFilter,
    searchQuery,
  ]);

  // Financial Stats
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paid = filteredExpenses
      .filter((e) => e.paymentStatus === 'Paid')
      .reduce((sum, e) => sum + e.amount, 0);
    const pending = filteredExpenses
      .filter((e) => e.paymentStatus === 'Pending')
      .reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const catMap = new Map<string, number>();
    filteredExpenses.forEach((e) => {
      catMap.set(e.categoryName, (catMap.get(e.categoryName) || 0) + e.amount);
    });

    let topCategory = { name: 'None', amount: 0 };
    catMap.forEach((amt, name) => {
      if (amt > topCategory.amount) {
        topCategory = { name, amount: amt };
      }
    });

    return { total, paid, pending, topCategory, categoryBreakdown: Array.from(catMap.entries()) };
  }, [filteredExpenses]);

  // Open Edit Modal
  const handleOpenEdit = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setDate(expense.date);
    setCategoryId(expense.categoryId);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setVendorId(expense.vendorId || '');
    setVendorName(expense.vendorName);
    setPaymentMode(expense.paymentMode);
    setPaymentStatus(expense.paymentStatus);
    setRemarks(expense.remarks || '');
    setShowAddModal(true);
  };

  // Reset Form
  const handleResetForm = () => {
    setEditingExpenseId(null);
    setDate(getTodayDateString());
    setCategoryId(expenseCategories[0]?.id || '');
    setDescription('');
    setAmount('');
    setVendorId('');
    setVendorName('');
    setPaymentMode('Cash');
    setPaymentStatus('Paid');
    setRemarks('');
    setShowAddModal(false);
  };

  // Save / Submit Expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid expense amount.', 'warning');
      return;
    }

    const cat = expenseCategories.find((c) => c.id === categoryId);
    const selectedCatName = cat ? cat.name : 'General Expense';

    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        date,
        categoryId: categoryId || 'expcat-general',
        categoryName: selectedCatName,
        description: description.trim() || 'Daily operating expense',
        vendorId: vendorId || undefined,
        vendorName: vendorName.trim() || 'Direct Expense',
        amount: numAmount,
        paymentMode,
        paymentStatus,
        remarks: remarks.trim() || undefined,
      });
      showToast('Expense updated successfully', 'success');
    } else {
      addExpense({
        date,
        categoryId: categoryId || expenseCategories[0]?.id || 'expcat-general',
        categoryName: selectedCatName,
        description: description.trim() || 'Daily operating expense',
        vendorId: vendorId || undefined,
        vendorName: vendorName.trim() || 'Direct Expense',
        amount: numAmount,
        paymentMode,
        paymentStatus,
        remarks: remarks.trim() || undefined,
      });
      showToast('Expense recorded successfully', 'success');
    }

    handleResetForm();
  };

  if (isLoading) {
    return <ExpensesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-rose-400" />
            <span>Operating Expenses Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track daily restaurant outflows (vegetables, gas cylinder, electricity, store rent, repairs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="glass px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => {
              handleResetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Total Expenses</span>
            <Wallet className="h-4 w-4 text-rose-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-rose-400 mt-1">
            {formatINR(stats.total)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{filteredExpenses.length} expense entries</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Paid Outflows</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-emerald-400 mt-1">
            {formatINR(stats.paid)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cleared via Cash / UPI / Bank</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Pending Payables</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono-num text-2xl font-extrabold text-amber-400 mt-1">
            {formatINR(stats.pending)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Linked to Payables ledger</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Top Outflow Category</span>
            <TrendingDown className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-slate-200 mt-1 truncate">
            {stats.topCategory.name}
          </div>
          <div className="font-mono-num text-xs font-bold text-cyan-400 mt-0.5">
            {formatINR(stats.topCategory.amount)}
          </div>
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
        totalCount={expenses.length}
        filteredCount={filteredExpenses.length}
        label="Filter Expenses by Date"
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
              placeholder="Search description, voucher #..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <CustomSelect
            value={selectedCategoryFilter}
            onChange={(val) => setSelectedCategoryFilter(val)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...expenseCategories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="w-44"
            size="sm"
          />

          <CustomSelect
            value={selectedStatusFilter}
            onChange={(val) => setSelectedStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Paid', label: 'Paid', badge: 'Paid', badgeColor: 'emerald' },
              { value: 'Pending', label: 'Pending', badge: 'Pending', badgeColor: 'amber' },
            ]}
            className="w-36"
            size="sm"
          />

          <CustomSelect
            value={selectedModeFilter}
            onChange={(val) => setSelectedModeFilter(val)}
            options={[
              { value: 'all', label: 'All Payment Modes' },
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Bank', label: 'Bank Transfer' },
            ]}
            className="w-44"
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenPdfExport(
                'Patil Biryani - Expenses Register',
                filteredExpenses.map((exp) => ({
                  'Voucher #': exp.expenseNumber,
                  Date: exp.date,
                  Category: exp.categoryName,
                  Description: exp.description,
                  Payee: exp.vendorName,
                  Amount: exp.amount,
                  Mode: exp.paymentMode,
                  Status: exp.paymentStatus,
                  Remarks: exp.remarks || '',
                })),
                {
                  'Total Expenses': formatINR(stats.total),
                  'Paid Total': formatINR(stats.paid),
                  'Pending Total': formatINR(stats.pending),
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
                'Patil_Biryani_Expenses',
                filteredExpenses.map((exp) => ({
                  'Expense Voucher Number': exp.expenseNumber,
                  Date: exp.date,
                  Category: exp.categoryName,
                  Description: exp.description,
                  'Vendor / Payee': exp.vendorName,
                  Amount: exp.amount,
                  'Payment Mode': exp.paymentMode,
                  'Payment Status': exp.paymentStatus,
                  Remarks: exp.remarks || '',
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

      {/* Expenses Data Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Voucher #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Vendor / Payee</th>
                <th className="px-4 py-3.5">Payment Mode</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No expense records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono-num font-bold text-rose-400">
                      {exp.expenseNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDateDisplay(exp.date)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-semibold border border-white/5">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      <div>{exp.description}</div>
                      {exp.remarks && <div className="text-[10px] text-slate-500">{exp.remarks}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{exp.vendorName}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-300">{exp.paymentMode}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-rose-400">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() =>
                            onConfirmDelete(
                              'Delete Expense',
                              `Are you sure you want to delete voucher ${exp.expenseNumber} for ${formatINR(exp.amount)}?`,
                              () => deleteExpense(exp.id)
                            )
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Expense"
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

      {/* Add / Edit Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-rose-400" />
                <span>{editingExpenseId ? 'Edit Expense Voucher' : 'Record New Expense'}</span>
              </h3>
              <button
                onClick={handleResetForm}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
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
                    Expense Category
                  </label>
                  <CustomSelect
                    value={categoryId}
                    onChange={(val) => setCategoryId(val)}
                    options={expenseCategories.map((cat) => ({ value: cat.id, label: cat.name }))}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num font-bold text-rose-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payment Mode
                  </label>
                  <CustomSelect
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val as PaymentMode)}
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'Bank', label: 'Bank Transfer' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Description / Items Purchased
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 2 Commercial LPG Cylinders, Onions 20kg"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Vendor / Payee
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Bharat Gas, Mandi Vendor"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Payment Status
                  </label>
                  <CustomSelect
                    value={paymentStatus}
                    onChange={(val) => setPaymentStatus(val as 'Paid' | 'Pending')}
                    options={[
                      { value: 'Paid', label: 'Paid', badge: 'Paid', badgeColor: 'emerald' },
                      { value: 'Pending', label: 'Pending (Create Payable)', badge: 'Pending', badgeColor: 'amber' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Remarks / Voucher Note (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Paid by cash via counter drawer"
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/25"
                >
                  {editingExpenseId ? 'Save Changes' : 'Record Outflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span>Expense Categories</span>
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Add Category */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category (e.g. Electricity, Charcoal)"
                className="w-full glass-input px-3 py-2 text-xs text-slate-200"
              />
              <button
                onClick={() => {
                  if (newCatName.trim()) {
                    addExpenseCategory(newCatName.trim());
                    setNewCatName('');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shrink-0"
              >
                Add
              </button>
            </div>

            {/* Existing List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pt-2">
              {expenseCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-xs"
                >
                  <span className="font-semibold text-slate-200">{c.name}</span>
                  <button
                    onClick={() => deleteExpenseCategory(c.id)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
