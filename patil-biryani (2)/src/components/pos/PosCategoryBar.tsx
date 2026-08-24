import React from 'react';
import { Sparkles, Flame, Leaf, Utensils, Search, X } from 'lucide-react';
import { Category, Product } from '../../types';

export type PosDietaryFilter = 'all' | 'veg' | 'non-veg' | 'popular' | 'spicy';

interface PosCategoryBarProps {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  dietaryFilter: PosDietaryFilter;
  onSelectDietaryFilter: (filter: PosDietaryFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  posViewMode: 'cards' | 'compact' | 'list';
  onChangeViewMode: (mode: 'cards' | 'compact' | 'list') => void;
}

export const PosCategoryBar: React.FC<PosCategoryBarProps> = ({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  dietaryFilter,
  onSelectDietaryFilter,
  searchQuery,
  onSearchChange,
  posViewMode,
  onChangeViewMode,
}) => {
  // Counts
  const totalActive = products.filter((p) => p.active).length;
  const vegCount = products.filter((p) => p.active && p.isVeg).length;
  const nonVegCount = products.filter((p) => p.active && !p.isVeg).length;
  const popularCount = products.filter((p) => p.active && p.isPopular).length;
  const spicyCount = products.filter((p) => p.active && p.spicyLevel && p.spicyLevel !== 'mild').length;

  return (
    <div className="space-y-2.5">
      {/* Top Search & View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dish name, code (e.g. PB-CB), price..."
            className="w-full glass-input pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dietary / Highlight Quick Tags */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectDietaryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              dietaryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalActive})
          </button>

          <button
            onClick={() => onSelectDietaryFilter('non-veg')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              dietaryFilter === 'non-veg'
                ? 'bg-rose-500 text-white font-bold shadow'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 border border-white inline-block" />
            Non-Veg ({nonVegCount})
          </button>

          <button
            onClick={() => onSelectDietaryFilter('veg')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              dietaryFilter === 'veg'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 border border-white inline-block" />
            Pure Veg ({vegCount})
          </button>

          {popularCount > 0 && (
            <button
              onClick={() => onSelectDietaryFilter('popular')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                dietaryFilter === 'popular'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Popular ({popularCount})
            </button>
          )}

          {spicyCount > 0 && (
            <button
              onClick={() => onSelectDietaryFilter('spicy')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                dietaryFilter === 'spicy'
                  ? 'bg-orange-500 text-slate-950 font-bold shadow'
                  : 'text-orange-400 hover:text-orange-300'
              }`}
            >
              <Flame className="h-3 w-3" />
              Spicy ({spicyCount})
            </button>
          )}
        </div>

        {/* View Mode Toggle: Cards / Compact / List */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onChangeViewMode('cards')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              posViewMode === 'cards'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visual Food Photo Cards (Recommended for touch POS)"
          >
            📸 Cards
          </button>
          <button
            onClick={() => onChangeViewMode('compact')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              posViewMode === 'compact'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Compact High-Density Grid"
          >
            📱 Compact
          </button>
          <button
            onClick={() => onChangeViewMode('list')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              posViewMode === 'list'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Keyboard-friendly List View"
          >
            📋 List
          </button>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategoryId === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
              : 'glass text-slate-400 hover:text-slate-200 hover:border-white/20'
          }`}
        >
          <Utensils className="h-3.5 w-3.5" />
          <span>All Dishes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono-num font-bold">
            {totalActive}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const count = products.filter((p) => p.categoryId === cat.id && p.active).length;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'glass text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              <span>{cat.icon || '🍽️'}</span>
              <span>{cat.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono-num font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
