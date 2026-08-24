import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Receipt,
  Wallet,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  BookOpen,
  CalendarCheck,
  Zap,
  Search,
  ChefHat,
} from 'lucide-react';
import { AppModal } from './ui/AppModal';

export type QuickActionType =
  | 'plate-sale'
  | 'invoice'
  | 'kitchen'
  | 'expense'
  | 'purchase'
  | 'customer-payment'
  | 'supplier-payment'
  | 'staff-advance'
  | 'new-product'
  | 'staff-attendance';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: QuickActionType) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Reset query on open
  useEffect(() => {
    if (isOpen) setSearchQuery('');
  }, [isOpen]);

  const actions = [
    {
      id: 'invoice' as QuickActionType,
      title: 'POS Billing & Tables',
      desc: 'Create customer invoice, print KOT or bill',
      icon: Receipt,
      color: 'from-blue-500/25 to-indigo-500/20 text-blue-400 border-blue-500/30',
      badge: 'POS',
      shortcut: '1',
    },
    {
      id: 'plate-sale' as QuickActionType,
      title: 'Daily Plate Sales',
      desc: 'Enter counter portions for Biryanis & specials',
      icon: UtensilsCrossed,
      color: 'from-emerald-500/25 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      badge: 'Daily Core',
      shortcut: '2',
    },
    {
      id: 'kitchen' as QuickActionType,
      title: 'Kitchen Display (KDS)',
      desc: 'Live kitchen orders & prep queue',
      icon: ChefHat,
      color: 'from-amber-500/25 to-orange-500/20 text-amber-400 border-amber-500/30',
      badge: 'Live KOT',
      shortcut: '3',
    },
    {
      id: 'expense' as QuickActionType,
      title: 'Record Expense',
      desc: 'Log vegetables, gas, electricity, rent, wages',
      icon: Wallet,
      color: 'from-rose-500/25 to-red-500/20 text-rose-400 border-rose-500/30',
      badge: 'Cash Outflow',
      shortcut: '4',
    },
    {
      id: 'purchase' as QuickActionType,
      title: 'Record Purchase',
      desc: 'Poultry, mutton, rice or grocery inventory',
      icon: ShoppingBag,
      color: 'from-amber-500/25 to-yellow-500/20 text-amber-400 border-amber-500/30',
      badge: 'Inventory',
      shortcut: '5',
    },
    {
      id: 'customer-payment' as QuickActionType,
      title: 'Customer Payment',
      desc: 'Settle pending catering or credit balance',
      icon: ArrowDownLeft,
      color: 'from-green-500/25 to-emerald-500/20 text-green-400 border-green-500/30',
      badge: 'Receivable',
      shortcut: '6',
    },
    {
      id: 'supplier-payment' as QuickActionType,
      title: 'Supplier Payment',
      desc: 'Pay poultry or spice supplier account',
      icon: ArrowUpRight,
      color: 'from-purple-500/25 to-pink-500/20 text-purple-400 border-purple-500/30',
      badge: 'Payable',
      shortcut: '7',
    },
    {
      id: 'staff-advance' as QuickActionType,
      title: 'Staff Advance / Loan',
      desc: 'Record salary advance, drawing or loan',
      icon: HandCoins,
      color: 'from-cyan-500/25 to-sky-500/20 text-cyan-400 border-cyan-500/30',
      badge: 'Staff',
      shortcut: '8',
    },
    {
      id: 'staff-attendance' as QuickActionType,
      title: 'Staff Attendance',
      desc: 'Mark present, absent, half-day or overtime',
      icon: CalendarCheck,
      color: 'from-violet-500/25 to-purple-500/20 text-violet-400 border-violet-500/30',
      badge: 'HR / Payroll',
      shortcut: '9',
    },
    {
      id: 'new-product' as QuickActionType,
      title: 'Add Menu Dish',
      desc: 'Create new biryani, starter or beverage dish',
      icon: BookOpen,
      color: 'from-orange-500/25 to-amber-500/20 text-orange-400 border-orange-500/30',
      badge: 'Menu',
    },
  ];

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Quick Action Command"
      subtitle="Select an operation to instantly jump into data recording"
      icon={Zap}
      iconColorClass="from-emerald-500/25 to-teal-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-950/40"
      headerActions={
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-white/10">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px] border border-white/10">
            Esc
          </kbd>
          <span>to close</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs text-slate-400">
          <span>{filteredActions.length} quick actions available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold transition-all hover:text-white"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Bar within Quick Action Pop-up */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action by name, category or operation..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/15 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
          />
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {filteredActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="group relative flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-800/40 hover:bg-gradient-to-br hover:from-slate-800/90 hover:to-slate-850 hover:border-amber-500/40 transition-all duration-150 text-left hover:scale-[1.01] hover:shadow-lg hover:shadow-black/40"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-tr ${act.color} border shadow-inner`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {act.shortcut && (
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-slate-400 border border-white/10 group-hover:text-amber-300">
                        #{act.shortcut}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-white/5 text-slate-400 group-hover:text-amber-300">
                      {act.badge}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  {act.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {act.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppModal>
  );
};
