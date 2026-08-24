import React, { useState } from 'react';
import {
  Receipt,
  RotateCcw,
  Plus,
  Trash2,
  Percent,
  ChefHat,
  PauseCircle,
  CheckCircle2,
  Printer,
  QrCode,
  Edit3,
  DollarSign,
  CreditCard,
  Banknote,
  Building,
  Sparkles,
} from 'lucide-react';
import { InvoiceItem, OrderType, PaymentMode } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PosCartPanelProps {
  nextInvoiceNumber: string;
  orderType: OrderType;
  selectedTable: string;
  customerName: string;
  lastSavedTime: string | null;
  hasDraftRestored: boolean;
  cartItems: InvoiceItem[];
  cartSubtotal: number;
  discountPercent: number;
  setDiscountPercent: (val: number) => void;
  gstExemptBilling: boolean;
  onToggleGstExempt: (exempt: boolean) => void;
  cartTax: number;
  cartGrandTotal: number;
  paymentMode: PaymentMode;
  setPaymentMode: (mode: PaymentMode) => void;
  amountPaidInput: string;
  setAmountPaidInput: (val: string) => void;
  cartBalanceDue: number;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateItemNote: (productId: string, note: string) => void;
  onResetCart: () => void;
  onOpenCustomItemModal: () => void;
  onOpenUpiQrModal: () => void;
  onHoldOrder: () => void;
  onOpenKOT: () => void;
  onSaveOrder: (printDirectly: boolean) => void;
}

const COMMON_COOKING_NOTES = [
  'Less Spicy',
  'Extra Spicy / Kolhapuri',
  'Extra Gravy / Salan',
  'No Onion / No Garlic',
  'Separate Rassa',
  'Parcel Packing',
  'Serve Hot',
];

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  nextInvoiceNumber,
  orderType,
  selectedTable,
  customerName,
  lastSavedTime,
  hasDraftRestored,
  cartItems,
  cartSubtotal,
  discountPercent,
  setDiscountPercent,
  gstExemptBilling,
  onToggleGstExempt,
  cartTax,
  cartGrandTotal,
  paymentMode,
  setPaymentMode,
  amountPaidInput,
  setAmountPaidInput,
  cartBalanceDue,
  orderNotes,
  setOrderNotes,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateItemNote,
  onResetCart,
  onOpenCustomItemModal,
  onOpenUpiQrModal,
  onHoldOrder,
  onOpenKOT,
  onSaveOrder,
}) => {
  const [editingNoteProductId, setEditingNoteProductId] = useState<string | null>(null);
  const [customNoteInput, setCustomNoteInput] = useState('');

  // Discount calculation
  const discountAmount = Math.round((cartSubtotal * discountPercent) / 100);

  // Cash tendered calculations
  const parsedPaid = parseFloat(amountPaidInput) || 0;
  const returnChange = parsedPaid > cartGrandTotal ? parsedPaid - cartGrandTotal : 0;

  const handleOpenNoteModal = (item: InvoiceItem) => {
    setEditingNoteProductId(item.productId);
    setCustomNoteInput(item.note || '');
  };

  const handleSaveNote = () => {
    if (editingNoteProductId) {
      onUpdateItemNote(editingNoteProductId, customNoteInput.trim());
      setEditingNoteProductId(null);
      setCustomNoteInput('');
    }
  };

  return (
    <div className="glass-panel-elevated rounded-3xl p-4 sm:p-5 space-y-3.5 sticky top-24 border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-amber-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-slate-100">Active Order</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono-num font-bold text-amber-400">
                Bill #{nextInvoiceNumber}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {orderType} {orderType === 'Dine In' && `• ${selectedTable}`} • {customerName || 'Walk-in'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {lastSavedTime && (
            <span
              className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm"
              title={`Saved automatically: ${lastSavedTime}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Auto-saved</span>
            </span>
          )}

          {hasDraftRestored && (
            <span className="hidden sm:inline-flex text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Draft Restored
            </span>
          )}

          {cartItems.length > 0 && (
            <button
              onClick={onResetCart}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/40 transition-colors"
              title="Clear draft and reset current order"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      {cartItems.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs space-y-2">
          <div className="text-2xl">🍛</div>
          <div className="font-semibold text-slate-400">No dishes added yet</div>
          <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
            Click on any menu dish on the left to start adding to this bill.
          </p>
          <button
            onClick={onOpenCustomItemModal}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-white/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Open / Custom Dish</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {cartItems.map((item) => (
            <div
              key={item.productId}
              className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 text-xs space-y-1.5 hover:border-white/15 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-slate-100 truncate">{item.productName}</div>
                  <div className="text-[10px] text-slate-400 font-mono-num flex items-center gap-1">
                    <span>{formatINR(item.rate)}</span>
                    <span>×</span>
                    <span>{item.quantity}</span>
                    {item.unit && <span className="text-slate-500">({item.unit})</span>}
                  </div>
                </div>

                {/* Stepper & Line Total */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-slate-900 border border-white/10 p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, -1)}
                      className="h-6 w-6 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center font-bold text-xs"
                      title="Reduce quantity"
                    >
                      -
                    </button>
                    <span className="font-mono-num font-extrabold px-2 text-xs text-amber-300 min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, 1)}
                      className="h-6 w-6 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center font-bold text-xs"
                      title="Add one more"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-16 text-right font-mono-num font-extrabold text-slate-100 text-xs">
                    {formatINR(item.quantity * item.rate)}
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400"
                    title="Remove item from order"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Cooking note tag or note adder */}
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                {item.note ? (
                  <div className="flex items-center gap-1 text-amber-300/90 font-medium italic">
                    <span>Note: "{item.note}"</span>
                    <button
                      onClick={() => handleOpenNoteModal(item)}
                      className="text-slate-400 hover:text-white underline ml-1"
                    >
                      edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenNoteModal(item)}
                    className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="h-2.5 w-2.5" />
                    <span>+ Add cooking note</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Quick button to add custom dish */}
          <div className="pt-1">
            <button
              onClick={onOpenCustomItemModal}
              className="w-full py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Open / Custom Dish</span>
            </button>
          </div>
        </div>
      )}

      {/* Bill Totals & Calculations */}
      {cartItems.length > 0 && (
        <div className="space-y-2 pt-2.5 border-t border-white/10 text-xs">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-slate-400">
            <span>Item Subtotal:</span>
            <span className="font-mono-num text-slate-200 font-bold">{formatINR(cartSubtotal)}</span>
          </div>

          {/* Discount Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-amber-400" />
                <span>Discount:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) =>
                    setDiscountPercent(
                      Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                    )
                  }
                  placeholder="0"
                  className="w-12 glass-input px-1.5 py-0.5 text-right text-xs font-mono-num text-amber-400 font-bold"
                />
                <span className="text-slate-500">%</span>
                {discountAmount > 0 && (
                  <span className="font-mono-num text-rose-400 font-bold">
                    -{formatINR(discountAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Discount Preset Chips */}
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercent(pct)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                    discountPercent === pct
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* GST Tax Toggle & Calculation */}
          <div className="flex items-center justify-between text-slate-400 pt-1">
            <span>GST Tax:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleGstExempt(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  !gstExemptBilling
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-white/5 hover:text-slate-200'
                }`}
              >
                Standard (5%)
              </button>
              <button
                type="button"
                onClick={() => onToggleGstExempt(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  gstExemptBilling
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border border-white/5 hover:text-slate-200'
                }`}
              >
                Exempt (0%)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>{gstExemptBilling || cartTax === 0 ? 'GST Status:' : 'GST (5% CGST+SGST):'}</span>
            <span
              className={`font-mono-num ${
                gstExemptBilling || cartTax === 0
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-200 font-semibold'
              }`}
            >
              {gstExemptBilling || cartTax === 0 ? 'Exempted (₹0)' : formatINR(cartTax)}
            </span>
          </div>

          {/* Grand Total Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border border-amber-500/30 flex items-center justify-between shadow-inner">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Grand Total Payable
              </div>
              <div className="text-[10px] text-slate-400">
                {cartItems.reduce((sum, ci) => sum + ci.quantity, 0)} items in order
              </div>
            </div>
            <div className="font-mono-num text-2xl font-black text-amber-300">
              {formatINR(cartGrandTotal)}
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Payment Mode</span>
              {paymentMode === 'UPI' && (
                <button
                  type="button"
                  onClick={onOpenUpiQrModal}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                >
                  <QrCode className="h-3 w-3" />
                  <span>Show Dynamic UPI QR</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(['UPI', 'Cash', 'Card', 'Credit'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    paymentMode === mode
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                      : 'glass text-slate-400 hover:text-slate-200 border-white/5'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Tendered & Change Returner */}
          {paymentMode === 'Cash' && (
            <div className="space-y-1.5 p-2.5 rounded-2xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">Cash Tendered (₹):</span>
                <input
                  type="number"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  placeholder={cartGrandTotal.toString()}
                  className="w-24 glass-input px-2 py-1 text-right text-xs font-mono-num text-emerald-300 font-bold"
                />
              </div>

              {/* Quick Cash Preset Chips */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(cartGrandTotal.toString())}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold border border-amber-500/30"
                >
                  Exact ({cartGrandTotal})
                </button>
                {[100, 200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaidInput(amt.toString())}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Return Change or Balance Due display */}
              {returnChange > 0 ? (
                <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs font-bold text-emerald-300 animate-in fade-in">
                  <span>💵 Return Change to Customer:</span>
                  <span className="font-mono-num text-sm text-emerald-400 font-black">
                    {formatINR(returnChange)}
                  </span>
                </div>
              ) : cartBalanceDue > 0 ? (
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-xs font-bold text-rose-300 animate-in fade-in">
                  <span>⚠️ Balance Due / Unpaid:</span>
                  <span className="font-mono-num text-sm text-rose-400 font-black">
                    {formatINR(cartBalanceDue)}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Special Order Instructions */}
          <div className="pt-1">
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Order Notes / Kitchen Instructions (Auto-saved)
            </label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Less spicy, extra salan, parcel packing..."
              className="w-full glass-input px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onHoldOrder}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all shadow-sm"
                title="Hold order & mark table as busy to serve another customer"
              >
                <PauseCircle className="h-4 w-4 text-amber-400" />
                <span>Hold Order (KOT)</span>
              </button>

              <button
                onClick={onOpenKOT}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all shadow-sm"
                title="Print Kitchen Order Ticket"
              >
                <ChefHat className="h-4 w-4 text-cyan-400" />
                <span>Print KOT Slip</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSaveOrder(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Save Order</span>
              </button>

              <button
                onClick={() => onSaveOrder(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
              >
                <Printer className="h-4 w-4 stroke-[2.5]" />
                <span>Settle & Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cooking Note Edit Popup */}
      {editingNoteProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-display font-bold text-xs text-slate-200">
                Item Cooking Instructions
              </h4>
              <button
                onClick={() => setEditingNoteProductId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Quick Note Presets:</label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_COOKING_NOTES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomNoteInput(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-medium transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Custom Note:</label>
              <input
                type="text"
                value={customNoteInput}
                onChange={(e) => setCustomNoteInput(e.target.value)}
                placeholder="e.g. Extra crisp, spicy masala"
                className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingNoteProductId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Apply Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
