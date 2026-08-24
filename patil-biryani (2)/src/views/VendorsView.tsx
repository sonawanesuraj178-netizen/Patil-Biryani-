import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  Trash2,
  Edit2,
  FileText,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
} from '../utils/formatters';
import { Vendor } from '../types';
import { AddressInputGroup, AddressFormValues } from '../components/ui/AddressInputGroup';
import { formatFullAddress } from '../data/geoData';

interface VendorsViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const { vendors, addVendor, updateVendor, deleteVendor, purchases, payables } = useApp();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Weekly Settlement');
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

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Open Edit
  const handleOpenEdit = (v: Vendor) => {
    setEditingVendorId(v.id);
    setName(v.name);
    setContactPerson(v.contactPerson);
    setMobile(v.mobile);
    setGstNumber(v.gstNumber || '');
    setPaymentTerms(v.paymentTerms || 'Weekly Settlement');
    setNotes(v.notes || '');
    setAddressDetails({
      addressLine1: v.address || '',
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
    setEditingVendorId(null);
    setName('');
    setContactPerson('');
    setMobile('');
    setGstNumber('');
    setPaymentTerms('Weekly Settlement');
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
    const computedAddress = formatFullAddress(addressDetails);

    if (editingVendorId) {
      updateVendor(editingVendorId, {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        mobile: mobile.trim(),
        address: computedAddress.trim(),
        gstNumber: gstNumber.trim() || undefined,
        paymentTerms,
        notes: notes.trim() || undefined,
      });
    } else {
      addVendor({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        mobile: mobile.trim(),
        address: computedAddress.trim(),
        gstNumber: gstNumber.trim() || undefined,
        openingBalance: 0,
        paymentTerms,
        notes: notes.trim() || undefined,
        active: true,
      });
    }
    handleResetForm();
  };

  // Filtered List
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.contactPerson.toLowerCase().includes(q) ||
          v.mobile.includes(q) ||
          (v.notes && v.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [vendors, searchQuery]);

  // Overall stats
  const stats = useMemo(() => {
    const totalVendors = vendors.length;
    const totalPayablesDue = payables
      .filter((p) => p.type === 'Supplier' && p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + p.balance, 0);

    return { totalVendors, totalPayablesDue };
  }, [vendors, payables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <Building className="h-7 w-7 text-amber-400" />
            <span>Raw Material Vendors & Suppliers Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supplier accounts for poultry, mutton, rice mills, ghee, gas and packaging vendors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onOpenPdfExport(
                'Patil Biryani - Vendors Directory',
                filteredVendors.map((v) => ({
                  'Supplier Name': v.name,
                  Contact: v.contactPerson,
                  Phone: v.mobile,
                  Address: v.address,
                  'GST Number': v.gstNumber || 'N/A',
                  'Terms': v.paymentTerms || 'Standard',
                }))
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] font-semibold text-slate-400">Total Registered Suppliers</div>
          <div className="font-mono-num text-2xl font-black text-amber-400 mt-1">
            {stats.totalVendors}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active supply network</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] font-semibold text-slate-400">Current Outstanding Supplier Dues</div>
          <div className="font-mono-num text-2xl font-black text-rose-400 mt-1">
            {formatINR(stats.totalPayablesDue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unsettled purchase liabilities</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-3 flex items-center justify-between">
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, contact person..."
            className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
          />
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          {filteredVendors.length} Suppliers Listed
        </div>
      </div>

      {/* Vendors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => {
          const supplierPayables = payables.filter(
            (p) => p.type === 'Supplier' && p.entityId === vendor.id && p.status !== 'Fully Paid'
          );
          const currentDue = supplierPayables.reduce((sum, p) => sum + p.balance, 0);

          return (
            <div
              key={vendor.id}
              className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-100">
                    {vendor.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{vendor.contactPerson}</p>
                </div>
                {vendor.paymentTerms && (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                    {vendor.paymentTerms}
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{vendor.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <span className="truncate">{vendor.address}</span>
                </div>
                {vendor.gstNumber && (
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>GSTIN:</span>
                    <span className="font-mono text-slate-300">{vendor.gstNumber}</span>
                  </div>
                )}
                {vendor.notes && (
                  <div className="text-[11px] text-slate-400 italic">
                    {vendor.notes}
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-slate-400">Current Balance Due:</span>
                  <span
                    className={`font-mono-num font-bold ${
                      currentDue > 0 ? 'text-rose-400 text-sm' : 'text-emerald-400'
                    }`}
                  >
                    {currentDue > 0 ? formatINR(currentDue) : 'All Cleared'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleOpenEdit(vendor)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Edit Supplier"
                >
                  <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                </button>
                <button
                  onClick={() =>
                    onConfirmDelete(
                      'Delete Vendor',
                      `Are you sure you want to remove supplier ${vendor.name}?`,
                      () => deleteVendor(vendor.id)
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                  title="Delete Supplier"
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
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-100">
                    {editingVendorId ? 'Edit Supplier Information' : 'Add New Vendor / Supplier'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Raw material supply contracts, tax invoicing &amp; payables ledger
                  </p>
                </div>
              </div>
              <button onClick={handleResetForm} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Supplier / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Poultry & Broiler Farm"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rafiq Bhai"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. Weekly Settlement / 15 Days Credit"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Structured Address Details with Dependent Country & State Selection */}
              <AddressInputGroup
                values={addressDetails}
                onChange={(field, val) =>
                  setAddressDetails((prev) => ({ ...prev, [field]: val }))
                }
                title="Supplier Address & Market Location"
                subtitle="Wholesale market depot, state & postal code for purchase bills"
                compact={true}
                required={true}
                showPreview={true}
              />

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Supply Notes / Category
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Fresh dressed broiler chicken supply daily 8 AM"
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
