import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Save,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  History,
  FileText,
  FileSpreadsheet,
  Edit2,
  Trash2,
  CheckCircle2,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatNumberIN, formatDateDisplay, getTodayDateString } from '../utils/formatters';
import { PlateWiseSale, PlateWiseSaleItem, PaymentMode } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { DataViewSkeleton } from '../components/ui/Skeleton';

interface PlateWiseSalesViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
}

export const PlateWiseSalesView: React.FC<PlateWiseSalesViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
}) => {
  const {
    products,
    categories,
    plateWiseSales,
    savePlateWiseSale,
    deletePlateWiseSale,
    expenses,
    isLoading,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'analytics'>('entry');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentSplit, setPaymentSplit] = useState<{
    cash: number;
    upi: number;
    bank: number;
    card: number;
    credit: number;
  }>({
    cash: 0,
    upi: 0,
    bank: 0,
    card: 0,
    credit: 0,
  });
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);

  const getDraftKey = (date: string) => `patil_biryani_v1_plate_sales_draft_${date}`;

  // Load existing plate sales or unsaved draft for selectedDate
  useEffect(() => {
    const existing = plateWiseSales.find((pws) => pws.date === selectedDate);
    const newQtyMap: Record<string, number> = {};

    products.forEach((prod) => {
      newQtyMap[prod.id] = 0;
    });

    if (existing) {
      existing.items.forEach((item) => {
        newQtyMap[item.productId] = item.quantity;
      });
      setPaymentSplit({
        cash: existing.cashSales || 0,
        upi: existing.upiSales || 0,
        bank: existing.bankSales || 0,
        card: existing.cardSales || 0,
        credit: existing.creditSales || 0,
      });
      setNotes(existing.notes || '');
      setIsDraftRestored(false);
    } else {
      // Check if there is an unsaved draft in localStorage for this date
      try {
        const rawDraft = localStorage.getItem(getDraftKey(selectedDate));
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft.quantities && typeof draft.quantities === 'object') {
            Object.keys(draft.quantities).forEach((k) => {
              newQtyMap[k] = draft.quantities[k];
            });
          }
          if (draft.paymentSplit) {
            setPaymentSplit(draft.paymentSplit);
          } else {
            setPaymentSplit({ cash: 0, upi: 0, bank: 0, card: 0, credit: 0 });
          }
          setNotes(draft.notes || '');
          setIsDraftRestored(true);
          setLastAutoSavedTime(draft.savedAt || null);
        } else {
          setPaymentSplit({ cash: 0, upi: 0, bank: 0, card: 0, credit: 0 });
          setNotes('');
          setIsDraftRestored(false);
        }
      } catch (e) {
        console.error('Failed to load plate sales draft', e);
        setPaymentSplit({ cash: 0, upi: 0, bank: 0, card: 0, credit: 0 });
        setNotes('');
        setIsDraftRestored(false);
      }
    }

    setQuantities(newQtyMap);
    setSaveSuccess(false);
  }, [selectedDate, plateWiseSales, products]);

  // Continuous 1-Second Auto-Save Function for Plate Sales Draft
  const performPlateDraftSave = useCallback(() => {
    // Only auto-save if this date does not have an existing submitted record in store
    const existing = plateWiseSales.find((pws) => pws.date === selectedDate);
    if (existing) return;

    const hasAnyQty = Object.values(quantities).some((q) => Number(q) > 0);
    const hasSplit = Object.values(paymentSplit).some((s) => Number(s) > 0);
    const hasNotes = notes.trim().length > 0;

    if (hasAnyQty || hasSplit || hasNotes) {
      try {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        localStorage.setItem(
          getDraftKey(selectedDate),
          JSON.stringify({
            quantities,
            paymentSplit,
            notes,
            savedAt: timeStr,
          })
        );
        setLastAutoSavedTime(timeStr);
      } catch (err) {
        console.error('Failed to auto-save plate sales draft', err);
      }
    } else {
      try {
        localStorage.removeItem(getDraftKey(selectedDate));
        setLastAutoSavedTime(null);
      } catch {}
    }
  }, [selectedDate, quantities, paymentSplit, notes, plateWiseSales]);

  // Immediate save on user interaction
  useEffect(() => {
    performPlateDraftSave();
  }, [performPlateDraftSave]);

  // Continuous 1-Second Recurring Auto-Save Heartbeat & Lifecycle Flush for Plate Sales
  useEffect(() => {
    const timer = setInterval(() => {
      performPlateDraftSave();
    }, 1000);

    const handleFlush = () => {
      performPlateDraftSave();
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
  }, [performPlateDraftSave]);

  const handleQtyChange = (productId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setQuantities((prev) => ({
      ...prev,
      [productId]: num,
    }));
  };

  // Group products by category
  const categorizedProducts = useMemo(() => {
    const activeProds = products.filter((p) => p.active);
    const map = new Map<string, typeof activeProds>();

    categories.forEach((cat) => {
      map.set(cat.name, []);
    });

    activeProds.forEach((prod) => {
      const cat = categories.find((c) => c.id === prod.categoryId)?.name || 'Other';
      const list = map.get(cat) || [];
      list.push(prod);
      map.set(cat, list);
    });

    return Array.from(map.entries()).filter(([_, prods]) => prods.length > 0);
  }, [products, categories]);

  // Live Auto Calculations (#6)
  const computedItems: PlateWiseSaleItem[] = useMemo(() => {
    return products
      .filter((p) => p.active)
      .map((prod) => {
        const cat = categories.find((c) => c.id === prod.categoryId);
        const qty = quantities[prod.id] || 0;
        const amount = qty * prod.sellingPrice;
        return {
          productId: prod.id,
          productName: prod.name,
          categoryName: cat?.name || 'General',
          quantity: qty,
          rate: prod.sellingPrice,
          amount,
        };
      });
  }, [products, categories, quantities]);

  const totalCalculations = useMemo(() => {
    let totalPlates = 0;
    let totalFoodSales = 0;
    let totalBeverageSales = 0;
    let totalDessertSales = 0;
    let totalOtherSales = 0;

    computedItems.forEach((item) => {
      const cat = categories.find((c) => c.name === item.categoryName);
      const catType = cat?.type || 'Food';

      totalPlates += item.quantity;

      if (catType === 'Food' || catType === 'Add-on') {
        totalFoodSales += item.amount;
      } else if (catType === 'Beverage') {
        totalBeverageSales += item.amount;
      } else if (catType === 'Dessert') {
        totalDessertSales += item.amount;
      } else {
        totalOtherSales += item.amount;
      }
    });

    const grandTotal = totalFoodSales + totalBeverageSales + totalDessertSales + totalOtherSales;

    return {
      totalPlates,
      totalFoodSales,
      totalBeverageSales,
      totalDessertSales,
      totalOtherSales,
      grandTotal,
    };
  }, [computedItems, categories]);

  // Auto-balance payment split if 0
  const totalAllocated =
    paymentSplit.cash + paymentSplit.upi + paymentSplit.bank + paymentSplit.card + paymentSplit.credit;

  const handleAutoAllocateUPI = () => {
    setPaymentSplit({
      cash: Math.round(totalCalculations.grandTotal * 0.35),
      upi: Math.round(totalCalculations.grandTotal * 0.65),
      bank: 0,
      card: 0,
      credit: 0,
    });
  };

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();

    // Default UPI if not allocated
    let finalSplit = { ...paymentSplit };
    if (totalAllocated === 0 && totalCalculations.grandTotal > 0) {
      finalSplit.upi = totalCalculations.grandTotal;
    }

    const salePayload: Omit<PlateWiseSale, 'id' | 'createdAt'> = {
      date: selectedDate,
      items: computedItems,
      totalPlates: totalCalculations.totalPlates,
      totalFoodSales: totalCalculations.totalFoodSales,
      totalBeverageSales: totalCalculations.totalBeverageSales,
      totalDessertSales: totalCalculations.totalDessertSales,
      totalOtherSales: totalCalculations.totalOtherSales,
      grandTotal: totalCalculations.grandTotal,
      cashSales: finalSplit.cash,
      upiSales: finalSplit.upi,
      bankSales: finalSplit.bank,
      cardSales: finalSplit.card,
      creditSales: finalSplit.credit,
      paymentMode: 'UPI',
      notes,
    };

    savePlateWiseSale(salePayload);
    try {
      localStorage.removeItem(getDraftKey(selectedDate));
      setLastAutoSavedTime(null);
      setIsDraftRestored(false);
    } catch {}
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Requirement #7: Weekly and Monthly Product Quantity Summaries
  const productQuantityAnalytics = useMemo(() => {
    const todayStr = getTodayDateString();
    const now = new Date();

    // Week start
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const currentYear = now.getFullYear();
    const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return products.map((prod) => {
      let todayQty = 0;
      let weekQty = 0;
      let monthQty = 0;
      let totalRevenue = 0;

      plateWiseSales.forEach((sale) => {
        const item = sale.items.find((i) => i.productId === prod.id);
        if (item) {
          const itemQty = item.quantity || 0;
          const itemRev = item.amount || 0;

          if (sale.date === todayStr) {
            todayQty += itemQty;
          }

          const saleDate = new Date(sale.date);
          if (saleDate >= startOfWeek && saleDate <= now) {
            weekQty += itemQty;
          }

          if (sale.date.startsWith(currentMonthStr)) {
            monthQty += itemQty;
          }

          totalRevenue += itemRev;
        }
      });

      return {
        product: prod,
        todayQty,
        weekQty,
        monthQty,
        totalRevenue,
      };
    });
  }, [products, plateWiseSales]);

  // Export handlers
  const handleExportPDF = () => {
    const rows = computedItems
      .filter((item) => item.quantity > 0)
      .map((item, idx) => ({
        transactionId: `PWS-${idx + 1}`,
        date: selectedDate,
        product: item.productName,
        category: item.categoryName,
        quantity: item.quantity,
        rate: formatINR(item.rate),
        amount: formatINR(item.amount),
        paymentMode: 'Daily Aggregate',
      }));

    onOpenPdfExport(
      `Patil Biryani - Plate-Wise Sales (${formatDateDisplay(selectedDate)})`,
      rows,
      {
        'Total Plates': formatNumberIN(totalCalculations.totalPlates),
        'Food Sales': formatINR(totalCalculations.totalFoodSales),
        'Beverages': formatINR(totalCalculations.totalBeverageSales),
        'Grand Total': formatINR(totalCalculations.grandTotal),
      }
    );
  };

  const handleExportExcel = () => {
    const rows = computedItems
      .filter((item) => item.quantity > 0)
      .map((item, idx) => ({
        transactionId: `PWS-${idx + 1}`,
        date: selectedDate,
        product: item.productName,
        category: item.categoryName,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        paymentMode: 'Daily Aggregate',
      }));

    onOpenExcelExport(`PlateWise_Sales_${selectedDate}`, rows);
  };

  if (isLoading) {
    return (
      <DataViewSkeleton
        title="Plate-Wise Dum Sales"
        subtitle="Loading real-time dish items and daily dum sales register..."
        metricCount={4}
        columns={6}
        rows={6}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Date Selector */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
            <span>Daily Dum Count & Dish Units</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-100 mt-1">
            Daily Plate-Wise Sales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Select any business date, enter dish quantities, and automatically calculate category totals & payment splits.
          </p>
        </div>

        {/* Date Selector & Mode Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 p-1.5">
            <Calendar className="h-4 w-4 text-emerald-400 ml-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-100 focus:outline-none pr-2"
            />
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-900/90 p-1">
            <button
              onClick={() => setActiveTab('entry')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'entry'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plate Entry
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quantity Trends
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past History
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-300"
              title="Export PDF"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-teal-300"
              title="Export Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'entry' && (
        <form onSubmit={handleSaveSale} className="space-y-6">
          {/* Real-time Summary Cards (#6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="glass-card rounded-2xl p-4 border-emerald-500/30">
              <span className="text-[11px] font-semibold text-slate-400">Total Plates</span>
              <div className="font-mono-num text-xl font-extrabold text-emerald-400 mt-1">
                {formatNumberIN(totalCalculations.totalPlates)}
              </div>
              <span className="text-[10px] text-slate-500">Units sold</span>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">Food Sales</span>
              <div className="font-mono-num text-xl font-extrabold text-slate-200 mt-1">
                {formatINR(totalCalculations.totalFoodSales)}
              </div>
              <span className="text-[10px] text-slate-500">Biryani & Add-ons</span>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">Beverage Sales</span>
              <div className="font-mono-num text-xl font-extrabold text-blue-300 mt-1">
                {formatINR(totalCalculations.totalBeverageSales)}
              </div>
              <span className="text-[10px] text-slate-500">Mineral Water & Drinks</span>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">Dessert Sales</span>
              <div className="font-mono-num text-xl font-extrabold text-amber-300 mt-1">
                {formatINR(totalCalculations.totalDessertSales)}
              </div>
              <span className="text-[10px] text-slate-500">Ice Cream & Kulfi</span>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400">Other Sales</span>
              <div className="font-mono-num text-xl font-extrabold text-purple-300 mt-1">
                {formatINR(totalCalculations.totalOtherSales)}
              </div>
              <span className="text-[10px] text-slate-500">Packaging / Extras</span>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-emerald-950/30 border-emerald-500/40">
              <span className="text-[11px] font-bold text-emerald-300">Grand Total</span>
              <div className="font-mono-num text-2xl font-black text-emerald-400 mt-1">
                {formatINR(totalCalculations.grandTotal)}
              </div>
              <span className="text-[10px] text-emerald-400">Net Revenue</span>
            </div>
          </div>

          {/* Product Entry by Category */}
          <div className="space-y-6">
            {categorizedProducts.map(([categoryName, prods]) => (
              <div key={categoryName} className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <h3 className="font-display text-base font-bold text-slate-100">
                      {categoryName}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {prods.length} Products
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {prods.map((prod) => {
                    const qty = quantities[prod.id] || 0;
                    const rowAmount = qty * prod.sellingPrice;
                    return (
                      <div
                        key={prod.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          qty > 0
                            ? 'border-emerald-500/40 bg-emerald-950/20 shadow-md shadow-emerald-950/50'
                            : 'border-slate-800/80 bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{prod.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {prod.unit} • Selling Rate:{' '}
                              <span className="font-mono-num font-semibold text-slate-200">
                                {formatINR(prod.sellingPrice)}
                              </span>
                            </div>
                          </div>
                          {rowAmount > 0 && (
                            <span className="font-mono-num text-xs font-bold text-emerald-400">
                              {formatINR(rowAmount)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter */}
                        <div className="mt-3.5 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-400">Quantity Sold:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [prod.id]: Math.max(0, (prev[prod.id] || 0) - 1),
                                }))
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={quantities[prod.id] !== undefined && quantities[prod.id] !== 0 ? quantities[prod.id] : ''}
                              onChange={(e) => handleQtyChange(prod.id, e.target.value)}
                              placeholder="0"
                              className="w-16 rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono-num text-sm font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [prod.id]: (prev[prod.id] || 0) + 1,
                                }))
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Breakdown & Remarks Box */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-400" />
                  <span>Payment Mode Breakdown for {formatDateDisplay(selectedDate)}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total Allocated: <span className="font-mono-num font-bold text-slate-200">{formatINR(totalAllocated)}</span> of{' '}
                  <span className="font-mono-num font-bold text-emerald-400">{formatINR(totalCalculations.grandTotal)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoAllocateUPI}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                Auto Split (35% Cash / 65% UPI)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cash (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSplit.cash || ''}
                  onChange={(e) =>
                    setPaymentSplit((prev) => ({
                      ...prev,
                      cash: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  placeholder="0"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">UPI (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSplit.upi || ''}
                  onChange={(e) =>
                    setPaymentSplit((prev) => ({
                      ...prev,
                      upi: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  placeholder="0"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Bank / NEFT (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSplit.bank || ''}
                  onChange={(e) =>
                    setPaymentSplit((prev) => ({
                      ...prev,
                      bank: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  placeholder="0"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-blue-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Card POS (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSplit.card || ''}
                  onChange={(e) =>
                    setPaymentSplit((prev) => ({
                      ...prev,
                      card: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  placeholder="0"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-purple-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Customer Credit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={paymentSplit.credit || ''}
                  onChange={(e) =>
                    setPaymentSplit((prev) => ({
                      ...prev,
                      credit: Math.max(0, parseInt(e.target.value, 10) || 0),
                    }))
                  }
                  placeholder="0"
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono-num font-bold text-rose-300"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Day Notes / Shift Remarks
              </label>
              <input
                type="text"
                value={notes ?? ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Special handi dum batch, evening rush, Kolhapur festival special"
                className="glass-input w-full rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Action Save Bar */}
          <div className="sticky bottom-16 lg:bottom-4 z-20 flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">Grand Total:</span>
              <span className="font-mono-num text-xl font-black text-emerald-400">
                {formatINR(totalCalculations.grandTotal)}
              </span>
              <span className="text-xs text-slate-400">({totalCalculations.totalPlates} plates)</span>
            </div>

            <div className="flex items-center gap-3">
              {lastAutoSavedTime && !saveSuccess && (
                <div
                  className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl shadow-sm"
                  title={`Inputs continuously auto-saved every second. Last saved at ${lastAutoSavedTime}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Auto-saved (1s)</span>
                </div>
              )}

              {isDraftRestored && !saveSuccess && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                  <span>Draft Restored</span>
                </div>
              )}

              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-pulse">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved Successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                <Save className="h-4 w-4 stroke-[2.5]" />
                <span>Save Plate Sale</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* QUANTITY TRENDS TAB (Requirement #7) */}
      {activeTab === 'analytics' && (
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Product-Wise Quantity Summary</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare dish quantities sold Today, This Week, and This Month
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="p-3">Dish / Product</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3 text-center">Today</th>
                  <th className="p-3 text-center">This Week</th>
                  <th className="p-3 text-center">This Month</th>
                  <th className="p-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {productQuantityAnalytics.map((item) => (
                  <tr key={item.product.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-slate-100">{item.product.name}</td>
                    <td className="p-3 text-slate-400">{item.product.unit}</td>
                    <td className="p-3 font-mono-num">{formatINR(item.product.sellingPrice)}</td>
                    <td className="p-3 text-center font-mono-num font-bold text-emerald-400">
                      {item.todayQty}
                    </td>
                    <td className="p-3 text-center font-mono-num font-bold text-teal-300">
                      {item.weekQty}
                    </td>
                    <td className="p-3 text-center font-mono-num font-bold text-blue-300">
                      {item.monthQty}
                    </td>
                    <td className="p-3 text-right font-mono-num font-bold text-slate-100">
                      {formatINR(item.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAST HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="font-display text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-400" />
                <span>Plate-Wise Sales History</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {plateWiseSales.length} Total recorded sales dates
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {plateWiseSales.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">
                      {formatDateDisplay(sale.date)}
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                      {sale.totalPlates} Plates Sold
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Food: {formatINR(sale.totalFoodSales)} • Drinks: {formatINR(sale.totalBeverageSales)} • Desserts: {formatINR(sale.totalDessertSales)}
                  </div>
                  {sale.notes && (
                    <div className="text-[11px] text-slate-500 mt-0.5 italic">"{sale.notes}"</div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-mono-num text-base font-extrabold text-emerald-400">
                      {formatINR(sale.grandTotal)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Cash: {formatINR(sale.cashSales)} | UPI: {formatINR(sale.upiSales)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDate(sale.date);
                        setActiveTab('entry');
                      }}
                      className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-300 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setItemToDelete(sale.id)}
                      className="rounded-xl bg-slate-800 p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={itemToDelete !== null}
        title="Delete Plate Sale Record?"
        message="Are you sure you want to delete this plate sales record? Financial reports, plate counts, and cash balance figures will automatically recalculate."
        onConfirm={() => {
          if (itemToDelete) deletePlateWiseSale(itemToDelete);
          setItemToDelete(null);
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
