import React, { useState, useMemo } from 'react';
import {
  User,
  UserPlus,
  Search,
  Trash2,
  Edit2,
  FileText,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Award,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
} from '../utils/formatters';
import { Customer } from '../types';
import { AddressInputGroup, AddressFormValues } from '../components/ui/AddressInputGroup';
import { formatFullAddress } from '../data/geoData';

interface CustomersViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, receivables, invoices } = useApp();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [creditLimit, setCreditLimit] = useState('5000');
  const [notes, setNotes] = useState('');
  const [addressDetails, setAddressDetails] = useState<AddressFormValues>({
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: 'Kolhapur',
    state: 'Maharashtra',
    country: 'India',
    pinCode: '',
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'credit'>('all');

  // Open Edit
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomerId(c.id);
    setName(c.name);
    setMobile(c.mobile);
    setCreditLimit((c.creditLimit || 5000).toString());
    setNotes(c.notes || '');
    setAddressDetails({
      addressLine1: c.address || '',
      addressLine2: '',
      landmark: '',
      city: 'Kolhapur',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '',
    });
    setShowAddModal(true);
  };

  const handleResetForm = () => {
    setEditingCustomerId(null);
    setName('');
    setMobile('');
    setCreditLimit('5000');
    setNotes('');
    setAddressDetails({
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: 'Kolhapur',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '',
    });
    setShowAddModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(creditLimit) || 5000;
    const computedAddress = formatFullAddress(addressDetails);

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, {
        name: name.trim(),
        mobile: mobile.trim(),
        address: computedAddress.trim(),
        creditLimit: limit,
        notes: notes.trim() || undefined,
      });
    } else {
      addCustomer({
        name: name.trim(),
        mobile: mobile.trim(),
        address: computedAddress.trim(),
        openingBalance: 0,
        creditLimit: limit,
        notes: notes.trim() || undefined,
        active: true,
      });
    }
    handleResetForm();
  };

  // Helper to compute stats for a customer
  const getCustomerMetrics = (c: Customer) => {
    const custInvoices = invoices.filter(
      (inv) => (inv.customerId && inv.customerId === c.id) || (inv.customerName && inv.customerName.toLowerCase() === c.name.toLowerCase())
    );
    const totalOrders = custInvoices.length;
    const totalSpend = custInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    const custReceivables = receivables.filter(
      (r) => r.customerId === c.id || r.customerName.toLowerCase() === c.name.toLowerCase()
    );
    const totalDue = custReceivables
      .filter((r) => r.status !== 'Fully Received')
      .reduce((sum, r) => sum + r.balance, 0);

    return { totalOrders, totalSpend, totalDue };
  };

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const metrics = getCustomerMetrics(c);
      if (filterMode === 'credit' && metrics.totalDue <= 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.address && c.address.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, filterMode, searchQuery, invoices, receivables]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalCreditBalance = receivables
      .filter((r) => r.status !== 'Fully Received')
      .reduce((sum, r) => sum + r.balance, 0);

    return { totalCustomers, totalCreditBalance };
  }, [customers, receivables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <User className="h-7 w-7 text-emerald-400" />
            <span>Customer Directory & Diner Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Regular diners, catering party organizers, credit balances & contact directory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenPdfExport(
                'Patil Biryani - Customer Directory',
                filteredCustomers.map((c) => {
                  const m = getCustomerMetrics(c);
                  return {
                    Name: c.name,
                    Phone: c.mobile,
                    Address: c.address || 'N/A',
                    'Total Orders': m.totalOrders,
                    'Lifetime Spend': formatINR(m.totalSpend),
                    'Credit Due': formatINR(m.totalDue),
                  };
                })
              )
            }
            className="glass px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-rose-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => {
              handleResetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="h-4 w-4 stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] font-semibold text-slate-400">Total Registered Customers</div>
          <div className="font-mono-num text-2xl font-black text-emerald-400 mt-1">
            {stats.totalCustomers}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Diners & Party clients</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] font-semibold text-slate-400">Outstanding Customer Dues</div>
          <div className="font-mono-num text-2xl font-black text-amber-400 mt-1">
            {formatINR(stats.totalCreditBalance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Linked to Receivables ledger</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="glass-card rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative min-w-[240px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, mobile..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filterMode === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Diners
            </button>
            <button
              onClick={() => setFilterMode('credit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                filterMode === 'credit'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Dues Only
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          {filteredCustomers.length} Customers
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const metrics = getCustomerMetrics(cust);

          return (
            <div
              key={cust.id}
              className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-100">{cust.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <span>{cust.mobile}</span>
                  </div>
                </div>
                {cust.creditLimit > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                    Limit: {formatINR(cust.creditLimit)}
                  </span>
                )}
              </div>

              {cust.address && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                  <span className="truncate">{cust.address}</span>
                </p>
              )}

              {cust.notes && (
                <p className="text-[11px] text-slate-400 italic truncate">
                  "{cust.notes}"
                </p>
              )}

              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Invoices / Visits:</span>
                  <span className="font-bold text-slate-200">{metrics.totalOrders}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Lifetime Spending:</span>
                  <span className="font-mono-num font-bold text-emerald-400">
                    {formatINR(metrics.totalSpend)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                  <span>Current Outstanding Due:</span>
                  <span
                    className={`font-mono-num font-bold ${
                      metrics.totalDue > 0 ? 'text-amber-400 text-sm' : 'text-emerald-400'
                    }`}
                  >
                    {metrics.totalDue > 0 ? formatINR(metrics.totalDue) : 'Nil (All Cleared)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleOpenEdit(cust)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Edit Customer"
                >
                  <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                </button>
                <button
                  onClick={() =>
                    onConfirmDelete(
                      'Delete Customer',
                      `Are you sure you want to remove ${cust.name}?`,
                      () => deleteCustomer(cust.id)
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                  title="Delete Customer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-100">
                    {editingCustomerId ? 'Edit Customer Profile' : 'Register Customer Profile'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Maintain diner records, catering deliveries &amp; linked ledger
                  </p>
                </div>
              </div>
              <button onClick={handleResetForm} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mahesh Patil"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Credit Limit Allowed (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="5000"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-mono-num font-bold"
                />
              </div>

              {/* Structured Address Details with Country/State Selection */}
              <AddressInputGroup
                values={addressDetails}
                onChange={(field, val) =>
                  setAddressDetails((prev) => ({ ...prev, [field]: val }))
                }
                title="Customer Address & Location (Optional)"
                subtitle="For catering delivery, home orders &amp; tax invoicing"
                compact={true}
                required={false}
                showPreview={true}
              />

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Special Notes / Food Preferences
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefers extra spicy gravy, regular weekend party orders"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
