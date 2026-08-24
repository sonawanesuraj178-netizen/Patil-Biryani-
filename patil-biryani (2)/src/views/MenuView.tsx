import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Search,
  Trash2,
  Edit2,
  Tag,
  CheckCircle2,
  XCircle,
  Percent,
  Layers,
  History,
  Flame,
  Sparkles,
  Image as ImageIcon,
  Leaf,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import {
  formatINR,
  formatDateDisplay,
} from '../utils/formatters';
import { Product, Category } from '../types';
import { CustomSelect } from '../components/ui/CustomSelect';

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Chicken Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80' },
  { label: 'Mutton Biryani', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80' },
  { label: 'Egg Biryani', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80' },
  { label: 'Special Biryani', url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80' },
  { label: 'Chicken Suka', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80' },
  { label: 'Mutton Suka', url: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=80' },
  { label: 'Rassa Bowl', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80' },
  { label: 'Chapati / Roti', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80' },
  { label: 'Extra Rice', url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&auto=format&fit=crop&q=80' },
  { label: 'Fresh Salad', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80' },
  { label: 'Cold Drink / Solkadhi', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80' },
  { label: 'Mineral Water', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80' },
  { label: 'Ice Cream / Kulfi', url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Gulab Jamun / Sweet', url: 'https://images.unsplash.com/photo-1593798605673-4f1a27743789?w=500&auto=format&fit=crop&q=80' },
];

const CATEGORY_EMOJI_OPTIONS = ['🍗', '🍛', '🍲', '🥤', '🍨', '📦', '✨', '🥗', '☕', '🍢', '🥟', '🍰'];

interface MenuViewProps {
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ onConfirmDelete }) => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    priceHistory,
    addCategory,
  } = useApp();
  const { showToast } = useAppNotification();

  // Modal / form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Product Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [sellingPrice, setSellingPrice] = useState('220');
  const [unit, setUnit] = useState('Full Plate');
  const [taxGstRate, setTaxGstRate] = useState('5');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [priceChangeNote, setPriceChangeNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [spicyLevel, setSpicyLevel] = useState<'mild' | 'medium' | 'hot' | 'extra_hot'>('medium');
  const [isPopular, setIsPopular] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'Food' | 'Beverage' | 'Dessert' | 'Add-on'>('Food');
  const [newCatIcon, setNewCatIcon] = useState('🍗');
  const [newCatColor, setNewCatColor] = useState('amber');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [gstFilter, setGstFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  const unitsList = [
    'Full Plate',
    'Half Plate',
    'Family Pack',
    'Jumbo Handi',
    'Single Portion',
    'Per Kg',
    'Per Piece',
    'Glass / Bottle',
    'Bowl',
    'Plate',
  ];

  // Open Edit
  const handleOpenEdit = (item: Product) => {
    setEditingProductId(item.id);
    setName(item.name);
    setCategoryId(item.categoryId);
    setSellingPrice(item.sellingPrice.toString());
    setUnit(item.unit);
    setTaxGstRate(item.taxGstRate !== undefined && item.taxGstRate !== null ? item.taxGstRate.toString() : '0');
    setDescription(item.description || '');
    setCode(item.code || '');
    setImageUrl(item.imageUrl || '');
    setIsVeg(Boolean(item.isVeg));
    setSpicyLevel(item.spicyLevel || 'medium');
    setIsPopular(Boolean(item.isPopular));
    setIsSpecial(Boolean(item.isSpecial));
    setPriceChangeNote('');
    setShowAddModal(true);
  };

  const handleResetForm = () => {
    setEditingProductId(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setSellingPrice('220');
    setUnit('Full Plate');
    setTaxGstRate('5');
    setDescription('');
    setCode('');
    setImageUrl('');
    setIsVeg(false);
    setSpicyLevel('medium');
    setIsPopular(false);
    setIsSpecial(false);
    setPriceChangeNote('');
    setShowAddModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(sellingPrice);
    const parsedGst = parseFloat(taxGstRate);
    const gst = isNaN(parsedGst) ? 0 : parsedGst;
    if (isNaN(p) || p <= 0) {
      showToast('Please enter a valid selling price.', 'warning');
      return;
    }

    if (editingProductId) {
      updateProduct(
        editingProductId,
        {
          name: name.trim(),
          categoryId,
          sellingPrice: p,
          unit,
          taxGstRate: gst,
          description: description.trim() || undefined,
          code: code.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          isVeg,
          spicyLevel,
          isPopular,
          isSpecial,
        },
        priceChangeNote.trim() || undefined
      );
      showToast(`Updated menu dish "${name.trim()}"`, 'success');
    } else {
      addProduct({
        name: name.trim(),
        categoryId,
        sellingPrice: p,
        unit,
        taxGstRate: gst,
        description: description.trim() || undefined,
        code: code.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        isVeg,
        spicyLevel,
        isPopular,
        isSpecial,
        active: true,
        order: products.length + 1,
      });
      showToast(`Added "${name.trim()}" to menu`, 'success');
    }

    handleResetForm();
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      icon: newCatIcon || '🍽️',
      color: newCatColor || 'amber',
      active: true,
      order: categories.length + 1,
    });
    setNewCatName('');
    setShowCategoryModal(false);
    showToast('Category created successfully.', 'success');
  };

  // Statistics
  const menuStats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const zeroGst = products.filter((p) => !p.taxGstRate || p.taxGstRate === 0).length;
    const gst5 = products.filter((p) => p.taxGstRate === 5).length;
    const vegCount = products.filter((p) => p.isVeg).length;
    const nonVegCount = products.filter((p) => !p.isVeg).length;
    return { total, active, zeroGst, gst5, vegCount, nonVegCount };
  }, [products]);

  // Filtered Items
  const filteredProducts = useMemo(() => {
    return products.filter((m) => {
      if (selectedCategoryId !== 'all' && m.categoryId !== selectedCategoryId) return false;

      // Veg / Non-veg filter
      if (vegFilter === 'veg' && !m.isVeg) return false;
      if (vegFilter === 'non-veg' && m.isVeg) return false;

      // GST filter
      if (gstFilter !== 'all') {
        const rate = typeof m.taxGstRate === 'number' ? m.taxGstRate : 0;
        if (gstFilter === '0') {
          if (rate !== 0) return false;
        } else {
          if (rate !== Number(gstFilter)) return false;
        }
      }

      // Status filter
      if (statusFilter === 'active' && !m.active) return false;
      if (statusFilter === 'inactive' && m.active) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const cat = categories.find((c) => c.id === m.categoryId);
        const matchName = m.name.toLowerCase().includes(q);
        const matchUnit = m.unit.toLowerCase().includes(q);
        const matchCode = m.code ? m.code.toLowerCase().includes(q) : false;
        const matchCat = cat ? cat.name.toLowerCase().includes(q) : false;
        const isZeroRate = !m.taxGstRate || m.taxGstRate === 0;
        const matchGstKeyword =
          (q === '0' ||
            q === '0%' ||
            q.includes('exempt') ||
            q.includes('gst na') ||
            q.includes('na') ||
            q.includes('nil') ||
            q.includes('tax free')) &&
          isZeroRate;
        const matchGstRate = m.taxGstRate ? `${m.taxGstRate}%`.includes(q) || `${m.taxGstRate}` === q : false;

        return matchName || matchUnit || matchCode || matchCat || matchGstKeyword || matchGstRate;
      }
      return true;
    });
  }, [products, selectedCategoryId, vegFilter, gstFilter, statusFilter, searchQuery, categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <Utensils className="h-7 w-7 text-amber-400" />
            <span>Menu & Dish Catalog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage Patil Biryani signature dishes, high-resolution food images, pricing, and portions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="glass px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <History className="h-4 w-4 text-cyan-400" />
            <span>Price Log ({priceHistory.length})</span>
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="glass px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>+ Category</span>
          </button>

          <button
            onClick={() => {
              handleResetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setGstFilter('all');
            setStatusFilter('all');
            setSelectedCategoryId('all');
            setVegFilter('all');
          }}
          className={`glass-card rounded-2xl p-3.5 border text-left transition-all hover:scale-[1.01] ${
            gstFilter === 'all' && statusFilter === 'all' && selectedCategoryId === 'all' && vegFilter === 'all'
              ? 'border-amber-500/40 bg-amber-950/20 ring-1 ring-amber-500/30'
              : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Total Menu Items</span>
            <Utensils className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="font-mono-num text-xl font-extrabold text-slate-100 mt-1">{menuStats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {menuStats.nonVegCount} Non-Veg • {menuStats.vegCount} Veg
          </div>
        </button>

        <button
          onClick={() => {
            setGstFilter('0');
            setStatusFilter('all');
          }}
          className={`glass-card rounded-2xl p-3.5 border text-left transition-all hover:scale-[1.01] ${
            gstFilter === '0'
              ? 'border-emerald-500/50 bg-emerald-950/30 ring-1 ring-emerald-500/40'
              : 'border-emerald-500/20 bg-emerald-950/10'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
            <span>0% GST / Exempt / NA</span>
            <Tag className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="font-mono-num text-xl font-extrabold text-emerald-400 mt-1">
            {menuStats.zeroGst} Items
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Nil-tax / Non-taxable food</div>
        </button>

        <button
          onClick={() => {
            setGstFilter('5');
            setStatusFilter('all');
          }}
          className={`glass-card rounded-2xl p-3.5 border text-left transition-all hover:scale-[1.01] ${
            gstFilter === '5'
              ? 'border-cyan-500/50 bg-cyan-950/30 ring-1 ring-cyan-500/40'
              : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400">
            <span>5% Standard GST</span>
            <Percent className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="font-mono-num text-xl font-extrabold text-cyan-400 mt-1">
            {menuStats.gst5} Items
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Restaurant dining food rate</div>
        </button>

        <button
          onClick={() => {
            setStatusFilter(statusFilter === 'active' ? 'all' : 'active');
          }}
          className={`glass-card rounded-2xl p-3.5 border text-left transition-all hover:scale-[1.01] ${
            statusFilter === 'active'
              ? 'border-amber-500/40 bg-amber-950/20 ring-1 ring-amber-500/30'
              : 'border-white/10'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Active in Stock</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="font-mono-num text-xl font-extrabold text-slate-100 mt-1">
            {menuStats.active} / {menuStats.total}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Live on billing POS counter</div>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="glass-card rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish, code, 0% exempt..."
              className="w-full glass-input pl-8 pr-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <CustomSelect
            value={selectedCategoryId}
            onChange={(val) => setSelectedCategoryId(val)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: `${c.icon || '🍽️'} ${c.name}` })),
            ]}
            className="w-44"
            size="sm"
          />

          {/* Veg / Non-Veg Quick Switcher */}
          <div className="flex items-center rounded-xl bg-slate-900/80 p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setVegFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                vegFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                vegFilter === 'veg' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block border border-white" />
              Veg
            </button>
            <button
              onClick={() => setVegFilter('non-veg')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                vegFilter === 'non-veg' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block border border-white" />
              Non-Veg
            </button>
          </div>

          {/* GST Slab Filter */}
          <CustomSelect
            value={gstFilter}
            onChange={(val) => setGstFilter(val)}
            options={[
              { value: 'all', label: 'All GST Slabs' },
              { value: '0', label: '0% Exempt / GST NA', badge: '0% NA', badgeColor: 'emerald' },
              { value: '5', label: '5% Food GST', badge: '5%', badgeColor: 'cyan' },
              { value: '12', label: '12% GST', badge: '12%', badgeColor: 'amber' },
              { value: '18', label: '18% GST (Beverages)', badge: '18%', badgeColor: 'rose' },
              { value: '28', label: '28% GST', badge: '28%', badgeColor: 'purple' },
            ]}
            className="w-44"
            size="sm"
          />

          {/* Stock / Active Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'In Stock (Active)', badge: 'Active', badgeColor: 'emerald' },
              { value: 'inactive', label: 'Out of Stock (Inactive)', badge: 'Inactive', badgeColor: 'rose' },
            ]}
            className="w-36"
            size="sm"
          />
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Showing {filteredProducts.length} of {products.length} items
        </div>
      </div>

      {/* Product Cards Grid with Rich Images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((item) => {
          const category = categories.find((c) => c.id === item.categoryId);
          const isZeroGst = !item.taxGstRate || item.taxGstRate === 0;
          const rateGst = Number(item.taxGstRate) || 0;
          const basePrice = rateGst > 0 ? item.sellingPrice / (1 + rateGst / 100) : item.sellingPrice;
          const gstAmount = item.sellingPrice - basePrice;

          return (
            <div
              key={item.id}
              className={`glass-card rounded-2xl overflow-hidden border transition-all space-y-3 relative group flex flex-col justify-between ${
                item.active
                  ? isZeroGst
                    ? 'border-emerald-500/25 hover:border-emerald-500/50 shadow-md'
                    : 'border-white/10 hover:border-white/20 shadow-md'
                  : 'border-rose-500/20 opacity-70'
              }`}
            >
              {/* Product Photo or Decorative Header */}
              <div className="relative h-36 w-full bg-slate-800/80 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/30 to-slate-900 text-amber-400/40">
                    <Utensils className="h-10 w-10 mb-1" />
                    <span className="text-[11px] font-medium">Patil Biryani Special</span>
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  {/* Veg / Non-Veg Indicator */}
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center border shadow-md ${
                      item.isVeg
                        ? 'border-emerald-500 bg-emerald-950/90 text-emerald-400'
                        : 'border-rose-500 bg-rose-950/90 text-rose-400'
                    }`}
                    title={item.isVeg ? 'Pure Veg' : 'Non-Veg'}
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  <span className="text-[10px] font-bold text-amber-300 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                    {category ? `${category.icon || ''} ${category.name}` : 'Biryani'}
                  </span>

                  {item.isPopular && (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-0.5">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      Popular
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    onClick={() => updateProduct(item.id, { active: !item.active })}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                      item.active
                        ? 'bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900'
                        : 'bg-rose-950/80 text-rose-400 hover:bg-rose-900'
                    }`}
                    title={item.active ? 'Mark as Out of Stock' : 'Mark as Available'}
                  >
                    {item.active ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Spicy Level Badge */}
                {item.spicyLevel && item.spicyLevel !== 'mild' && (
                  <div className="absolute bottom-2 left-2.5">
                    <span className="text-[9px] font-bold text-orange-400 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-orange-500/30 flex items-center gap-0.5">
                      <Flame className="h-2.5 w-2.5" />
                      {item.spicyLevel === 'extra_hot' ? 'Extra Hot' : item.spicyLevel === 'hot' ? 'Spicy' : 'Medium'}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3.5 pt-0 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-display text-sm font-bold text-slate-100 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400 font-medium bg-slate-800/60 px-1.5 py-0.5 rounded">
                      {item.unit}
                    </span>
                    {item.code && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{item.code}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Selling Price (MRP):</span>
                    <span className="font-mono-num font-extrabold text-emerald-400 text-base">
                      {formatINR(item.sellingPrice)}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-white/5 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Tax Type:</span>
                    {isZeroGst ? (
                      <span className="font-semibold text-emerald-400">0% Exempt (GST NA)</span>
                    ) : (
                      <span className="font-mono-num text-cyan-400">
                        Base: ₹{basePrice.toFixed(1)} + {rateGst}% GST (₹{gstAmount.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1"
                    title="Edit Item"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() =>
                      onConfirmDelete(
                        'Delete Menu Item',
                        `Are you sure you want to remove ${item.name}?`,
                        () => deleteProduct(item.id)
                      )
                    }
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                    title="Delete Item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-amber-400" />
                <span>{editingProductId ? 'Edit Menu Dish' : 'Add New Menu Dish'}</span>
              </h3>
              <button onClick={handleResetForm} className="p-1.5 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Dish / Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Special Chicken Dum Biryani"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Photo Image URL & Preset Pickers */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/50 border border-white/5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span>Dish Photo (Image URL)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full glass-input px-3 py-1.5 text-xs text-slate-200"
                />

                <div className="text-[10px] text-slate-400 pt-1">
                  <span>Quick Food Photo Presets:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {SAMPLE_IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setImageUrl(p.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          imageUrl === p.url
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-14 w-20 object-cover rounded-lg border border-white/10"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                    <div className="text-[11px] text-emerald-400 font-medium">✓ Image preview ready</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Category
                  </label>
                  <CustomSelect
                    value={categoryId}
                    onChange={(val) => setCategoryId(val)}
                    options={categories.map((c) => ({ value: c.id, label: `${c.icon || '🍽️'} ${c.name}` }))}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Portion / Unit
                  </label>
                  <CustomSelect
                    value={unit}
                    onChange={(val) => setUnit(val)}
                    options={unitsList.map((p) => ({ value: p, label: p }))}
                    size="sm"
                  />
                </div>
              </div>

              {/* Veg / Non-Veg & Spice Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Dietary Classification
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsVeg(false)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        !isVeg ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-500 border border-white" />
                      Non-Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVeg(true)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isVeg ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                      Pure Veg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Spiciness Level
                  </label>
                  <CustomSelect
                    value={spicyLevel}
                    onChange={(val) => setSpicyLevel(val as any)}
                    options={[
                      { value: 'mild', label: '🌱 Mild / Non-Spicy' },
                      { value: 'medium', label: '🌶️ Medium Spice' },
                      { value: 'hot', label: '🌶️🌶️ Spicy Kolhapuri' },
                      { value: 'extra_hot', label: '🔥 Extra Hot Masala' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Selling Price (₹ MRP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    GST Rate / Tax Slab
                  </label>
                  <CustomSelect
                    value={taxGstRate}
                    onChange={(val) => setTaxGstRate(val)}
                    options={[
                      { value: '0', label: '0% (Exempt / Nil / GST NA)' },
                      { value: '5', label: '5% GST (Restaurant Food)' },
                      { value: '12', label: '12% GST (Packaged/Special)' },
                      { value: '18', label: '18% GST (Beverages)' },
                      { value: '28', label: '28% GST (Aerated / Luxury)' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-900 border-white/20"
                  />
                  <span className="text-xs text-slate-300 font-medium">⭐ Mark as Popular / Best Seller</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpecial}
                    onChange={(e) => setIsSpecial(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-900 border-white/20"
                  />
                  <span className="text-xs text-slate-300 font-medium">✨ Chef Special Dish</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Item Code / Short Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. PB-CB"
                    className="w-full glass-input px-3 py-2 text-xs font-mono text-slate-200"
                  />
                </div>

                {editingProductId && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Price Revision Reason
                    </label>
                    <input
                      type="text"
                      value={priceChangeNote}
                      onChange={(e) => setPriceChangeNote(e.target.value)}
                      placeholder="e.g. Raw material price revision"
                      className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Description / Serving Notes
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Fragrant Basmati rice slow cooked with tender chicken and secret masala"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  {editingProductId ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                Add Menu Category
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Seafood Biryani"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Category Icon Emoji
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-950 border border-white/10">
                  {CATEGORY_EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      className={`h-8 w-8 rounded-lg text-base flex items-center justify-center transition-all ${
                        newCatIcon === emoji
                          ? 'bg-amber-500 text-slate-950 font-bold scale-110'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Category Type
                </label>
                <CustomSelect
                  value={newCatType}
                  onChange={(val) => setNewCatType(val as any)}
                  options={[
                    { value: 'Food', label: 'Food / Main Course' },
                    { value: 'Beverage', label: 'Beverage / Drinks' },
                    { value: 'Dessert', label: 'Dessert / Sweets' },
                    { value: 'Add-on', label: 'Add-on / Extra' },
                  ]}
                  size="sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Revision History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-400" />
                <span>Price Revision Audit Trail</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {priceHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No price revision history logged yet.
                </div>
              ) : (
                priceHistory.map((hist) => (
                  <div
                    key={hist.id}
                    className="glass-card rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{hist.productName}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateDisplay(hist.effectiveDate)} by {hist.changedBy}
                        {hist.note && <span className="italic text-slate-400"> • "{hist.note}"</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-slate-400 line-through">
                        {formatINR(hist.oldPrice)}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="font-mono-num font-bold text-emerald-400 text-sm">
                        {formatINR(hist.newPrice)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
