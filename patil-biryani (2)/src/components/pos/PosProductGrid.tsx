import React from 'react';
import { Plus, Sparkles, Flame, Check, Utensils, Info } from 'lucide-react';
import { Product, InvoiceItem, Category } from '../../types';
import { formatINR } from '../../utils/formatters';

interface PosProductGridProps {
  products: Product[];
  categories: Category[];
  cartItems: InvoiceItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  viewMode: 'cards' | 'compact' | 'list';
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  products,
  categories,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  viewMode,
}) => {
  if (products.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-slate-400 space-y-3 border border-white/5">
        <Utensils className="h-10 w-10 text-slate-600 mx-auto" />
        <div className="text-sm font-semibold text-slate-300">No dishes match your filter</div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Try clearing your search query or selecting a different category from above.
        </p>
      </div>
    );
  }

  // 1. CARDS VIEW (Visual Food Photography Grid)
  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
        {products.map((product) => {
          const inCart = cartItems.find((ci) => ci.productId === product.id);
          const category = categories.find((c) => c.id === product.categoryId);

          return (
            <div
              key={product.id}
              className={`glass-card rounded-2xl overflow-hidden border text-left transition-all group flex flex-col justify-between select-none ${
                inCart
                  ? 'border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-slate-800/40'
              }`}
            >
              {/* Card Photo Header */}
              <div
                onClick={() => onAddToCart(product)}
                className="relative h-28 w-full bg-slate-950 overflow-hidden cursor-pointer"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/40 to-slate-900 text-amber-400/40">
                    <Utensils className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-medium tracking-wide">Patil Biryani</span>
                  </div>
                )}

                {/* Gradient shade for bottom readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Dietary Badge (Veg / Non-Veg) & Category */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                  <div
                    className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border shadow-md ${
                      product.isVeg
                        ? 'border-emerald-500 bg-emerald-950/90 text-emerald-400'
                        : 'border-rose-500 bg-rose-950/90 text-rose-400'
                    }`}
                    title={product.isVeg ? 'Pure Veg' : 'Non-Veg'}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  {product.isPopular && (
                    <span className="text-[9px] font-extrabold text-amber-300 bg-amber-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-0.5 shadow">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      Popular
                    </span>
                  )}
                </div>

                {/* In Cart Live Indicator Counter */}
                {inCart && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-lg animate-in fade-in zoom-in duration-200">
                    <span>{inCart.quantity} in order</span>
                  </div>
                )}

                {/* Price & Code on Photo bottom */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-end justify-between">
                  <span className="font-mono-num text-sm font-black text-amber-300 drop-shadow-md">
                    {formatINR(product.sellingPrice)}
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold bg-slate-900/80 px-1.5 py-0.2 rounded border border-white/10">
                    {product.unit}
                  </span>
                </div>
              </div>

              {/* Card Details & Quick Quantity Controls */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div
                    onClick={() => onAddToCart(product)}
                    className="cursor-pointer"
                  >
                    <div className="text-[10px] text-slate-400 font-semibold truncate flex items-center gap-1">
                      <span>{category?.name || 'Dish'}</span>
                      {product.code && <span className="font-mono text-slate-500">#{product.code}</span>}
                    </div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 line-clamp-2 mt-0.5 leading-snug">
                      {product.name}
                    </div>
                  </div>

                  {product.spicyLevel && product.spicyLevel !== 'mild' && (
                    <div className="flex items-center gap-1 text-[9px] text-orange-400 mt-1 font-semibold">
                      <Flame className="h-2.5 w-2.5" />
                      <span>{product.spicyLevel === 'extra_hot' ? 'Extra Hot' : 'Spicy'}</span>
                    </div>
                  )}
                </div>

                {/* Action Row: Direct On-Card Quantity Stepper or Add Button */}
                <div className="pt-2 border-t border-white/5">
                  {inCart ? (
                    <div className="flex items-center justify-between bg-slate-900/90 rounded-xl p-1 border border-amber-500/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(product.id, -1);
                        }}
                        className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 flex items-center justify-center font-black text-sm transition-all"
                        title="Reduce quantity"
                      >
                        -
                      </button>
                      <span className="font-mono-num font-extrabold text-amber-300 text-xs px-2">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(product.id, 1);
                        }}
                        className="h-7 w-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm transition-all shadow"
                        title="Add one more"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(product)}
                      className="w-full py-1.5 rounded-xl bg-slate-800/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group-hover:bg-slate-700"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Add Dish</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. COMPACT GRID VIEW (High Speed Cashier Rush)
  if (viewMode === 'compact') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[620px] overflow-y-auto pr-1">
        {products.map((product) => {
          const inCart = cartItems.find((ci) => ci.productId === product.id);

          return (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 relative group ${
                inCart
                  ? 'border-amber-500/60 bg-amber-950/30 ring-1 ring-amber-500/40 shadow-md'
                  : 'glass hover:border-amber-500/40 hover:bg-slate-800/60'
              }`}
            >
              {/* Photo Thumbnail */}
              <div className="h-12 w-12 rounded-xl bg-slate-950 overflow-hidden flex-shrink-0 relative border border-white/10">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-400/40">
                    <Utensils className="h-5 w-5" />
                  </div>
                )}
                {/* Veg / Non veg dot */}
                <span
                  className={`absolute top-1 left-1 h-2.5 w-2.5 rounded-full border border-white ${
                    product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </div>

              {/* Title & Price */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate">
                  {product.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono-num text-xs font-extrabold text-amber-400">
                    {formatINR(product.sellingPrice)}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">{product.unit}</span>
                </div>
              </div>

              {/* Quantity badge */}
              {inCart && (
                <span className="h-5 w-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
                  {inCart.quantity}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 3. LIST VIEW (Dense keyboard friendly table)
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 max-h-[620px] overflow-y-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-white/10 sticky top-0 backdrop-blur-md">
          <tr>
            <th className="py-2.5 px-3 w-10">Type</th>
            <th className="py-2.5 px-3">Dish Name</th>
            <th className="py-2.5 px-3">Portion</th>
            <th className="py-2.5 px-3 text-right">Price</th>
            <th className="py-2.5 px-3 text-center w-28">Order Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-200">
          {products.map((product) => {
            const inCart = cartItems.find((ci) => ci.productId === product.id);

            return (
              <tr
                key={product.id}
                className={`hover:bg-slate-800/40 transition-colors ${
                  inCart ? 'bg-amber-950/20' : ''
                }`}
              >
                <td className="py-2 px-3">
                  <span
                    className={`inline-block h-3 w-3 rounded-full border border-white shadow-sm ${
                      product.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </td>
                <td className="py-2 px-3 font-semibold">
                  <div className="flex items-center gap-2">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-7 w-7 rounded-lg object-cover border border-white/10"
                      />
                    )}
                    <div>
                      <span className="text-slate-100">{product.name}</span>
                      {product.code && (
                        <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                          #{product.code}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2 px-3 text-slate-400">{product.unit}</td>
                <td className="py-2 px-3 text-right font-mono-num font-bold text-amber-300">
                  {formatINR(product.sellingPrice)}
                </td>
                <td className="py-2 px-3 text-center">
                  {inCart ? (
                    <div className="flex items-center justify-center gap-1.5 bg-slate-900 p-0.5 rounded-lg border border-amber-500/40">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        className="h-5 w-5 rounded bg-slate-800 text-rose-300 font-bold hover:bg-slate-700 flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono-num font-bold text-xs text-amber-300 px-1">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        className="h-5 w-5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(product)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 font-bold text-xs transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
