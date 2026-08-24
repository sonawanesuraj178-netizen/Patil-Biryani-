import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Receipt,
  UtensilsCrossed,
  Wallet,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  BookOpen,
  ChefHat,
  CornerDownLeft,
  Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDateDisplay } from '../utils/formatters';
import { NavTabId } from './Navbar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTabId) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const {
    invoices,
    heldOrders,
    plateWiseSales,
    products,
    customers,
    vendors,
    staffEmployees,
    expenses,
    purchases,
    receivables,
    payables,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: {
      id: string;
      title: string;
      subtitle: string;
      category: string;
      tab: NavTabId;
      amount?: number;
      date?: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];

    // Pending Kitchen Orders / KOTs
    heldOrders.forEach((held) => {
      if (
        held.tableName.toLowerCase().includes(q) ||
        (held.customerName && held.customerName.toLowerCase().includes(q)) ||
        (held.staffWaiter && held.staffWaiter.toLowerCase().includes(q)) ||
        (held.notes && held.notes.toLowerCase().includes(q)) ||
        held.items.some((it) => it.productName.toLowerCase().includes(q))
      ) {
        results.push({
          id: held.id,
          title: `Kitchen Order: ${held.tableName} (${held.items.length} items)`,
          subtitle: `${held.orderType} • Server: ${held.staffWaiter || 'Counter'} • Live KDS Queue`,
          category: 'Kitchen Order',
          tab: 'kitchen',
          amount: held.grandTotal,
          date: held.heldAt,
          icon: ChefHat,
        });
      }
    });

    // Invoices
    invoices.forEach((inv) => {
      const rawDate = (inv.date || '').toLowerCase();
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        rawDate.includes(q) ||
        inv.items.some((it) => it.productName.toLowerCase().includes(q))
      ) {
        results.push({
          id: inv.id,
          title: `Invoice #${inv.invoiceNumber} - ${inv.customerName || 'Walk-in Customer'}`,
          subtitle: `${inv.items.length} dishes • Mode: ${inv.paymentMode} • Status: ${inv.paymentStatus}`,
          category: 'Invoice',
          tab: 'invoices',
          amount: inv.grandTotal,
          date: inv.date,
          icon: Receipt,
        });
      }
    });

    // Plate-Wise Daily Sales
    plateWiseSales.forEach((pws) => {
      if (pws.productName.toLowerCase().includes(q) || (pws.date && pws.date.includes(q))) {
        results.push({
          id: pws.id,
          title: `Plate Sale: ${pws.productName} (${pws.platesSold} plates)`,
          subtitle: `Rate: ₹${pws.ratePerPlate} • Shift: ${pws.shift || 'Full Day'}`,
          category: 'Plate Sale',
          tab: 'plate-sales',
          amount: pws.totalAmount,
          date: pws.date,
          icon: UtensilsCrossed,
        });
      }
    });

    // Products / Menu Items
    products.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.marathiName && p.marathiName.toLowerCase().includes(q))
      ) {
        results.push({
          id: p.id,
          title: `Menu Dish: ${p.name} ${p.marathiName ? `(${p.marathiName})` : ''}`,
          subtitle: `Category: ${p.category} • Cost: ₹${p.costPrice || 0} • Status: ${p.status}`,
          category: 'Menu Item',
          tab: 'menu',
          amount: p.sellingPrice,
          icon: BookOpen,
        });
      }
    });

    // Customers
    customers.forEach((c) => {
      if (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      ) {
        results.push({
          id: c.id,
          title: `Customer: ${c.name}`,
          subtitle: `Phone: ${c.phone || 'N/A'} • Total Invoices: ${c.totalInvoices || 0}`,
          category: 'Customer',
          tab: 'customers',
          amount: c.pendingBalance,
          icon: User,
        });
      }
    });

    // Vendors
    vendors.forEach((v) => {
      if (
        v.name.toLowerCase().includes(q) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q))
      ) {
        results.push({
          id: v.id,
          title: `Vendor: ${v.name}`,
          subtitle: `Contact: ${v.contactPerson || 'N/A'} • Category: ${v.category}`,
          category: 'Vendor',
          tab: 'vendors',
          amount: v.pendingBalance,
          icon: ShoppingBag,
        });
      }
    });

    // Expenses
    expenses.forEach((e) => {
      if (
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
        e.expenseNumber.toLowerCase().includes(q)
      ) {
        results.push({
          id: e.id,
          title: `Expense #${e.expenseNumber}: ${e.category} (${e.paidTo || 'Cash'})`,
          subtitle: `${e.description || 'General Expense'} • Mode: ${e.paymentMode}`,
          category: 'Expense',
          tab: 'expenses',
          amount: e.amount,
          date: e.date,
          icon: Wallet,
        });
      }
    });

    // Purchases
    purchases.forEach((p) => {
      if (
        p.vendorName.toLowerCase().includes(q) ||
        p.purchaseNumber.toLowerCase().includes(q) ||
        p.items.some((it) => it.productName.toLowerCase().includes(q))
      ) {
        results.push({
          id: p.id,
          title: `Purchase #${p.purchaseNumber}: ${p.vendorName}`,
          subtitle: `${p.items.length} items • Mode: ${p.paymentMode} • Status: ${p.paymentStatus}`,
          category: 'Purchase',
          tab: 'purchases',
          amount: p.totalAmount,
          date: p.date,
          icon: ShoppingBag,
        });
      }
    });

    // Staff
    staffEmployees.forEach((stf) => {
      if (
        stf.name.toLowerCase().includes(q) ||
        stf.designation.toLowerCase().includes(q) ||
        stf.department.toLowerCase().includes(q)
      ) {
        results.push({
          id: stf.id,
          title: `Staff: ${stf.name}`,
          subtitle: `${stf.designation} • ${stf.department} • ${stf.salaryType} Salary`,
          category: 'Staff',
          tab: 'staff',
          amount: stf.basicSalary,
          icon: User,
        });
      }
    });

    // Receivables
    receivables.forEach((r) => {
      if (r.customerName.toLowerCase().includes(q) || r.invoiceNumber.toLowerCase().includes(q)) {
        results.push({
          id: r.id,
          title: `Receivable from ${r.customerName}`,
          subtitle: `Ref: ${r.invoiceNumber} • Status: ${r.status}`,
          category: 'Receivable',
          tab: 'receivables',
          amount: r.balance,
          date: r.date,
          icon: ArrowDownLeft,
        });
      }
    });

    // Payables
    payables.forEach((p) => {
      if (p.entityName.toLowerCase().includes(q) || p.referenceNumber.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          title: `Payable to ${p.entityName}`,
          subtitle: `Ref: ${p.referenceNumber} • Status: ${p.status}`,
          category: 'Payable',
          tab: 'payables',
          amount: p.balance,
          date: p.date,
          icon: ArrowUpRight,
        });
      }
    });

    return results.slice(0, 24); // Top 24 results
  }, [
    query,
    heldOrders,
    invoices,
    plateWiseSales,
    products,
    customers,
    vendors,
    staffEmployees,
    expenses,
    purchases,
    receivables,
    payables,
  ]);

  // Handle arrow key navigation & enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < searchResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        onNavigate(searchResults[selectedIndex].tab);
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 pt-12 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/98 to-slate-950/98 shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden flex flex-col"
          >
            {/* Top Gloss Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

            {/* Spotlight Search Header Input */}
            <div className="flex items-center px-5 py-4 border-b border-white/10 bg-slate-950/60">
              <Search className="h-5 w-5 text-emerald-400 mr-3.5 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to search invoices, kitchen KOTs, dishes, vendors, expenses..."
                className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mr-2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 rounded-xl bg-slate-800/80 border border-white/10 px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                  title="Close (Esc)"
                >
                  <span>ESC</span>
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div
              ref={resultsContainerRef}
              className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 custom-scrollbar"
            >
              {!query ? (
                <div className="py-12 px-6 text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 border border-white/10 text-slate-400">
                      <Command className="h-6 w-6" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Global Restaurant Spotlight</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Search across all live orders, invoices, dishes, expenses, customer accounts &amp; staff records in real-time.
                  </p>
                  <div className="pt-3 flex flex-wrap justify-center gap-1.5 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/5 font-mono">Invoice #</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/5 font-mono">Table #</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/5 font-mono">Biryani Dish</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/5 font-mono">Supplier Name</span>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                  No matching records found for <span className="text-amber-400 font-semibold">"{query}"</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
                    <span>Search Results ({searchResults.length})</span>
                    <span className="text-[10px] text-slate-500">Use ↑↓ keys to navigate, Enter to open</span>
                  </div>

                  {searchResults.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;

                    return (
                      <button
                        key={`${item.category}-${item.id}`}
                        onClick={() => {
                          onNavigate(item.tab);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex w-full items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                          isSelected
                            ? 'bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                            : 'border-white/5 bg-slate-800/30 hover:bg-slate-800/60 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-white/10'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs sm:text-sm font-bold truncate ${
                                  isSelected ? 'text-emerald-300' : 'text-slate-200'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.subtitle} {item.date && `• ${formatDateDisplay(item.date)}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {item.amount !== undefined && (
                            <div className="font-mono-num text-xs sm:text-sm font-bold text-emerald-400 text-right">
                              {formatINR(item.amount)}
                            </div>
                          )}
                          {isSelected && (
                            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
                              <span>Open</span>
                              <CornerDownLeft className="h-3 w-3 text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Spotlight Footer */}
            <div className="px-5 py-2.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-white/10">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-white/10">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-white/10">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Live Database</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
