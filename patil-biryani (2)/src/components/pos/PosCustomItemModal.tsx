import React, { useState } from 'react';
import { Plus, X, Tag, DollarSign } from 'lucide-react';
import { InvoiceItem } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';

interface PosCustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomItem: (item: InvoiceItem) => void;
}

export const PosCustomItemModal: React.FC<PosCustomItemModalProps> = ({
  isOpen,
  onClose,
  onAddCustomItem,
}) => {
  const [itemName, setItemName] = useState('');
  const [rate, setRate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Portion');
  const [taxGstRate, setTaxGstRate] = useState('5');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(rate);
    const parsedQty = parseInt(quantity, 10);
    const parsedGst = parseFloat(taxGstRate) || 0;

    if (!itemName.trim() || isNaN(parsedRate) || parsedRate <= 0 || isNaN(parsedQty) || parsedQty <= 0) {
      return;
    }

    const sub = parsedQty * parsedRate;
    const tax = (sub * parsedGst) / 100;

    const newItem: InvoiceItem = {
      productId: `custom_${Date.now()}`,
      productName: itemName.trim(),
      categoryName: 'Custom',
      quantity: parsedQty,
      rate: parsedRate,
      discount: 0,
      tax,
      amount: sub + tax,
      taxGstRate: parsedGst,
      unit: unit.trim() || 'Portion',
      note: note.trim() || undefined,
      notes: note.trim() || undefined,
    };

    onAddCustomItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-400" />
            <h3 className="font-display font-bold text-sm text-slate-100">Add Open / Custom Dish</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Custom Item Description *
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Extra Gravy Pack, Handi Rassa"
              className="w-full glass-input px-3 py-2 text-xs text-slate-200"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Rate (₹ Price) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="100"
                className="w-full glass-input px-3 py-2 text-xs font-mono-num text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full glass-input px-3 py-2 text-xs font-mono-num text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Portion Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Portion / Pack"
                className="w-full glass-input px-3 py-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                GST Rate
              </label>
              <CustomSelect
                value={taxGstRate}
                onChange={(val) => setTaxGstRate(val)}
                options={[
                  { value: '0', label: '0% (Exempt)' },
                  { value: '5', label: '5% (Standard)' },
                  { value: '18', label: '18% (Beverage)' },
                ]}
                size="sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Cooking / Prep Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Mild spice, no garnish"
              className="w-full glass-input px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              Add to Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
