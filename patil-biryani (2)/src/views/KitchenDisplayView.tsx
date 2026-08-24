import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChefHat,
  Timer,
  Clock,
  Flame,
  UtensilsCrossed,
  Search,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Layers,
  RefreshCw,
  Eye,
  Lock,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  User,
  ShoppingBag,
  Truck,
  Grid,
  ListOrdered,
  Bell,
  ArrowUpDown,
  Check,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import { HeldOrder, InvoiceItem, OrderType } from '../types';
import { formatDateDisplay } from '../utils/formatters';

interface KitchenDisplayViewProps {
  onNavigateToPOS?: () => void;
}

// Web Audio API Chime for Complete Order confirmation
function playOrderCompletedChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('Completion chime error:', err);
  }
}

// Web Audio API Chime for New Order arrivals
function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25); // D6

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch (err) {
    console.warn('Audio chime could not play:', err);
  }
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({ onNavigateToPOS }) => {
  const { heldOrders, businessProfile, deleteHeldOrder, updateHeldOrder } = useApp();
  const { toastSuccess, toastInfo } = useAppNotification();

  // Local state for kitchen view
  const [filterType, setFilterType] = useState<'ALL' | OrderType | 'DELAYED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'items'>('oldest');
  const [viewMode, setViewMode] = useState<'grid' | 'aggregated'>('grid');
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xl'>('large');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastOrderPing, setLastOrderPing] = useState<string | null>(null);

  // Local visual item checklist per ticket (Cook strike-through without altering DB)
  // Map of orderId -> Set of item indices completed
  const [completedItemsMap, setCompletedItemsMap] = useState<Record<string, number[]>>({});

  // Real-time second ticker to recalculate elapsed time every 2 seconds
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Track previous held orders count to chime on new orders
  const prevCountRef = useRef(heldOrders.length);
  useEffect(() => {
    if (heldOrders.length > prevCountRef.current) {
      if (soundEnabled) {
        playKitchenChime();
      }
      setLastOrderPing(`New order received! Total: ${heldOrders.length} tickets`);
      const timer = setTimeout(() => setLastOrderPing(null), 4000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = heldOrders.length;
  }, [heldOrders.length, soundEnabled]);

  // Handle Complete Order (Cook finished & order ready for counter/service)
  const handleCompleteOrder = (order: HeldOrder) => {
    if (soundEnabled) {
      playOrderCompletedChime();
    }
    // Remove from local completed items map
    setCompletedItemsMap((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });

    // Remove held order from queue / table
    deleteHeldOrder(order.id);

    const titleMsg = `Order #${order.id.slice(-4).toUpperCase()} Completed!`;
    const detailMsg = `${order.tableName} (${order.orderType}) is ready for delivery/billing.`;
    setLastOrderPing(`${titleMsg} ${detailMsg}`);
    setTimeout(() => setLastOrderPing(null), 4500);

    toastSuccess(`${titleMsg} - ${detailMsg}`);
  };

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Helper to toggle visual strike-through on an item for kitchen staff
  const toggleItemDone = (orderId: string, itemIdx: number) => {
    setCompletedItemsMap((prev) => {
      const currentList = prev[orderId] || [];
      const exists = currentList.includes(itemIdx);
      const updated = exists ? currentList.filter((idx) => idx !== itemIdx) : [...currentList, itemIdx];
      return {
        ...prev,
        [orderId]: updated,
      };
    });
  };

  // Helper to mark all items done or reset on a ticket
  const toggleAllItemsOnTicket = (order: HeldOrder) => {
    setCompletedItemsMap((prev) => {
      const currentList = prev[order.id] || [];
      if (currentList.length === order.items.length) {
        // Reset
        const next = { ...prev };
        delete next[order.id];
        return next;
      } else {
        // Mark all
        return {
          ...prev,
          [order.id]: order.items.map((_, idx) => idx),
        };
      }
    });
  };

  // Calculate elapsed time in minutes & seconds string
  const getElapsedInfo = (order: HeldOrder) => {
    const orderTimestamp = new Date(order.updatedAt || order.heldAt || Date.now()).getTime();
    const diffMs = Math.max(0, currentTime - orderTimestamp);
    const totalMinutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const formatted = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    let urgency: 'normal' | 'warning' | 'urgent' = 'normal';
    if (totalMinutes >= 20) {
      urgency = 'urgent';
    } else if (totalMinutes >= 10) {
      urgency = 'warning';
    }

    return { totalMinutes, seconds, formatted, urgency };
  };

  // Filtered & Sorted orders list
  const filteredOrders = useMemo(() => {
    return heldOrders
      .filter((order) => {
        // Type filter
        if (filterType === 'DELAYED') {
          const { totalMinutes } = getElapsedInfo(order);
          if (totalMinutes < 15) return false;
        } else if (filterType !== 'ALL') {
          if (order.orderType !== filterType) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const tableMatch = order.tableName?.toLowerCase().includes(q);
          const waiterMatch = order.staffWaiter?.toLowerCase().includes(q);
          const itemMatch = order.items.some((i) => i.productName.toLowerCase().includes(q));
          const notesMatch = order.notes?.toLowerCase().includes(q);
          const tokenMatch = order.id.toLowerCase().includes(q);
          if (!tableMatch && !waiterMatch && !itemMatch && !notesMatch && !tokenMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          const tA = new Date(a.updatedAt || a.heldAt).getTime();
          const tB = new Date(b.updatedAt || b.heldAt).getTime();
          return tB - tA;
        }
        if (sortBy === 'items') {
          const totalA = a.items.reduce((sum, i) => sum + i.quantity, 0);
          const totalB = b.items.reduce((sum, i) => sum + i.quantity, 0);
          return totalB - totalA;
        }
        // default: oldest first (first in, first cook)
        const tA = new Date(a.updatedAt || a.heldAt).getTime();
        const tB = new Date(b.updatedAt || b.heldAt).getTime();
        return tA - tB;
      });
  }, [heldOrders, filterType, searchQuery, sortBy, currentTime]);

  // Aggregated Item Count (Batch Cooking summary)
  const aggregatedItems = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; category?: string; ordersCount: number }>();
    heldOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productName.trim();
        const existing = map.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.ordersCount += 1;
        } else {
          map.set(key, {
            name: item.productName,
            quantity: item.quantity,
            category: item.categoryName,
            ordersCount: 1,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [heldOrders]);

  // Counts for KPI summary bar
  const totalPendingTickets = heldOrders.length;
  const totalDishesToCook = useMemo(() => {
    return heldOrders.reduce((sum, order) => {
      return sum + order.items.reduce((iSum, item) => iSum + item.quantity, 0);
    }, 0);
  }, [heldOrders]);

  const delayedOrdersCount = useMemo(() => {
    return heldOrders.filter((order) => {
      const { totalMinutes } = getElapsedInfo(order);
      return totalMinutes >= 15;
    }).length;
  }, [heldOrders, currentTime]);

  // Typography scale CSS helper
  const getScaleClasses = () => {
    switch (fontScale) {
      case 'xl':
        return {
          title: 'text-2xl font-black',
          sub: 'text-sm',
          item: 'text-lg font-bold',
          qty: 'text-xl font-black px-3 py-1',
          time: 'text-xl font-black',
        };
      case 'large':
        return {
          title: 'text-xl font-black',
          sub: 'text-xs',
          item: 'text-base font-bold',
          qty: 'text-base font-black px-2.5 py-0.5',
          time: 'text-lg font-black',
        };
      default:
        return {
          title: 'text-lg font-bold',
          sub: 'text-xs',
          item: 'text-sm font-semibold',
          qty: 'text-sm font-bold px-2 py-0.5',
          time: 'text-base font-bold',
        };
    }
  };

  const scale = getScaleClasses();

  return (
    <div className="space-y-4">
      {/* KITCHEN DISPLAY HEADER & CONTROLS */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-slate-950/90 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-orange-500/20">
              <ChefHat className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <span>Kitchen Display System</span>
                  <span className="text-amber-400 font-mono text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                    KDS Live
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Zap className="h-3 w-3" />
                  <span>Live Cook &amp; Bump KDS</span>
                </span>
                <span>•</span>
                <span>{businessProfile.name || 'Patil Biryani'} Kitchen Queue</span>
                <span>•</span>
                <span className="font-mono text-slate-300">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Active Tickets Pill */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending Orders</div>
                <div className="text-base font-black text-slate-100 font-mono-num">{totalPendingTickets}</div>
              </div>
            </div>

            {/* Total Items / Plates to Cook */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10">
              <UtensilsCrossed className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Dishes to Cook</div>
                <div className="text-base font-black text-emerald-300 font-mono-num">{totalDishesToCook}</div>
              </div>
            </div>

            {/* Delayed Orders (>15m) */}
            {delayedOrdersCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <div>
                  <div className="text-[10px] text-rose-300 font-semibold uppercase">Delayed ({'>'}15m)</div>
                  <div className="text-base font-black text-rose-200 font-mono-num">{delayedOrdersCount}</div>
                </div>
              </div>
            )}

            {/* View Mode Toggle: Grid vs Aggregated Prep List */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View individual table order cards"
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Ticket Cards</span>
              </button>

              <button
                onClick={() => setViewMode('aggregated')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'aggregated'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View total dishes to prepare across all tickets"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>Dish Summary</span>
                {aggregatedItems.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
                    {aggregatedItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLS TOOLBAR: Filter, Font Scale, Sound, Fullscreen */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          {/* Order Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              <span>Filter:</span>
            </span>

            {[
              { id: 'ALL', label: `All Orders (${heldOrders.length})` },
              {
                id: 'Dine In',
                label: `Dine In (${heldOrders.filter((o) => o.orderType === 'Dine In').length})`,
              },
              {
                id: 'Takeaway',
                label: `Takeaway (${heldOrders.filter((o) => o.orderType === 'Takeaway').length})`,
              },
              {
                id: 'Delivery',
                label: `Delivery (${heldOrders.filter((o) => o.orderType === 'Delivery').length})`,
              },
              {
                id: 'DELAYED',
                label: `Delayed >15m (${delayedOrdersCount})`,
                alert: delayedOrdersCount > 0,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  filterType === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : tab.alert
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.id === 'DELAYED' && <AlertTriangle className="h-3 w-3 text-rose-400" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Toolbar: Search, Sort, Size, Sound, Fullscreen */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search dish / table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-36 sm:w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Order */}
            <button
              onClick={() => setSortBy((prev) => (prev === 'oldest' ? 'newest' : prev === 'newest' ? 'items' : 'oldest'))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-slate-100"
              title="Toggle sorting (Oldest first / Newest first / Most items)"
            >
              <ArrowUpDown className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Sort:</span>
              <span className="text-amber-300 capitalize">{sortBy}</span>
            </button>

            {/* Font Scaling for Large Displays */}
            <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-white/10 text-xs">
              <button
                onClick={() => setFontScale('normal')}
                className={`px-2 py-0.5 rounded-lg font-bold ${
                  fontScale === 'normal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Normal text size"
              >
                A
              </button>
              <button
                onClick={() => setFontScale('large')}
                className={`px-2 py-0.5 rounded-lg font-bold text-sm ${
                  fontScale === 'large' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Large text size"
              >
                A+
              </button>
              <button
                onClick={() => setFontScale('xl')}
                className={`px-2 py-0.5 rounded-lg font-bold text-base ${
                  fontScale === 'xl' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Extra Large (For Wall Screen / Kitchen TV)"
              >
                A++
              </button>
            </div>

            {/* Sound Notification Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playKitchenChime();
              }}
              className={`p-1.5 rounded-xl border text-xs font-semibold transition-all ${
                soundEnabled
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-white/10 text-slate-500'
              }`}
              title={soundEnabled ? 'Order Sound Alert: ON (Click to mute)' : 'Order Sound Alert: OFF (Click to unmute)'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-slate-100 hover:border-amber-500/40"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Kitchen Fullscreen Mode'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Incoming Order Flash Notification */}
        {lastOrderPing && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold animate-bounce">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-400" />
              <span>{lastOrderPing}</span>
            </div>
            <button onClick={() => setLastOrderPing(null)} className="text-emerald-400 hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {viewMode === 'aggregated' ? (
        /* BATCH COOKING / ITEM SUMMARY VIEW */
        <div className="glass-card rounded-2xl p-5 border border-white/10 bg-slate-950/80 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-amber-400" />
                <span>Aggregated Dish Prep List (Batch Cooking)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidated count of all items waiting to be prepared across all current pending tickets.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-300">
              <span className="font-bold text-amber-400">{aggregatedItems.length}</span> unique dishes •{' '}
              <span className="font-bold text-emerald-400">{totalDishesToCook}</span> total portions
            </div>
          </div>

          {aggregatedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <ChefHat className="h-12 w-12 mx-auto text-slate-600 opacity-40" />
              <p className="text-base font-bold text-slate-400">All Kitchen Orders Cleared!</p>
              <p className="text-xs text-slate-500">There are no pending dishes waiting to be cooked right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {aggregatedItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex items-center justify-between shadow-md hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="font-black text-slate-100 text-base">{item.name}</div>
                    {item.category && (
                      <span className="inline-block text-[10px] font-semibold text-slate-400 uppercase bg-slate-950 px-2 py-0.5 rounded-md border border-white/5">
                        {item.category}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400">
                      On <span className="text-amber-300 font-bold">{item.ordersCount}</span> active ticket(s)
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center pl-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xl font-black font-mono-num shadow-inner">
                      x{item.quantity}
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-1">Total Qty</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* INDIVIDUAL ORDER TICKET CARDS (KDS GRID) */
        <div>
          {filteredOrders.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/10 bg-slate-950/70 space-y-3 my-4">
              <ChefHat className="h-16 w-16 mx-auto text-emerald-400/40 animate-pulse" />
              <h3 className="text-lg font-black text-slate-200">
                {searchQuery || filterType !== 'ALL'
                  ? 'No Orders Match Your Filter'
                  : 'Kitchen Orders All Clear! 🎉'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery || filterType !== 'ALL'
                  ? 'Try clearing your search query or selecting "All Orders" to see pending tickets.'
                  : 'All kitchen tickets have been prepared or no active held orders are currently pending.'}
              </p>
              {onNavigateToPOS && (
                <div className="pt-2">
                  <button
                    onClick={onNavigateToPOS}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-white/10 inline-flex items-center gap-1.5"
                  >
                    <span>Go to POS / Live Counter</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredOrders.map((order, orderIdx) => {
                const { formatted, urgency, totalMinutes } = getElapsedInfo(order);
                const completedIndices = completedItemsMap[order.id] || [];
                const allItemsDone = completedIndices.length === order.items.length && order.items.length > 0;
                const totalItemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                // Urgency style
                const cardBorderClass =
                  allItemsDone
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : urgency === 'urgent'
                    ? 'border-rose-500/80 bg-rose-950/20 shadow-lg shadow-rose-500/10'
                    : urgency === 'warning'
                    ? 'border-amber-500/60 bg-amber-950/15'
                    : 'border-slate-800 bg-slate-900/90';

                const timerBadgeClass =
                  urgency === 'urgent'
                    ? 'bg-rose-500 text-slate-950 animate-pulse'
                    : urgency === 'warning'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200';

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border flex flex-col justify-between transition-all shadow-md overflow-hidden ${cardBorderClass}`}
                  >
                    {/* TICKET HEADER */}
                    <div className="p-3.5 border-b border-white/10 bg-slate-950/60 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-slate-100 ${scale.title}`}>{order.tableName}</span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                order.orderType === 'Dine In'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : order.orderType === 'Takeaway'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              }`}
                            >
                              {order.orderType}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400 mt-1 text-[11px]">
                            {order.staffWaiter && (
                              <span className="flex items-center gap-1 font-medium text-slate-300">
                                <User className="h-3 w-3 text-slate-400" />
                                <span>{order.staffWaiter}</span>
                              </span>
                            )}
                            {order.customerName && <span>• {order.customerName}</span>}
                            <span>• #{order.id.slice(-4).toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Live Timer Pill */}
                        <div className="flex flex-col items-end shrink-0">
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono ${scale.time} ${timerBadgeClass}`}
                          >
                            <Timer className="h-4 w-4" />
                            <span>{formatted}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Order Notes / Special Instructions if any */}
                      {order.notes && (
                        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 text-amber-200 text-xs font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span>Special Note: {order.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* TICKET ITEMS LIST */}
                    <div className="p-3.5 space-y-2 flex-1 divide-y divide-white/5">
                      {order.items.map((item, itemIdx) => {
                        const isDone = completedIndices.includes(itemIdx);

                        return (
                          <div
                            key={itemIdx}
                            onClick={() => toggleItemDone(order.id, itemIdx)}
                            className={`pt-2 first:pt-0 flex items-center justify-between gap-3 cursor-pointer select-none transition-all py-1 px-1.5 rounded-lg ${
                              isDone ? 'opacity-40 bg-emerald-950/20' : 'hover:bg-white/5'
                            }`}
                            title="Click item to mark cooked / ready"
                          >
                            <div className="flex items-start gap-2.5">
                              <button
                                type="button"
                                className="mt-0.5 text-slate-400 hover:text-emerald-400"
                              >
                                {isDone ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-500" />
                                )}
                              </button>
                              <div>
                                <div
                                  className={`text-slate-100 ${scale.item} ${
                                    isDone ? 'line-through text-slate-500' : ''
                                  }`}
                                >
                                  {item.productName}
                                </div>
                                {item.categoryName && (
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                    {item.categoryName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Large Quantity Badge */}
                            <div className="shrink-0">
                              <span
                                className={`rounded-xl font-mono-num ${scale.qty} ${
                                  isDone
                                    ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                    : 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-black'
                                }`}
                              >
                                x {item.quantity}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* TICKET FOOTER: Items Count & Cook / Complete Actions */}
                    <div className="p-3 bg-slate-950/90 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <span>{order.items.length} dishes</span> •{' '}
                        <span className="text-slate-200 font-bold">{totalItemCount} total portions</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Toggle Check All Items */}
                        <button
                          type="button"
                          onClick={() => toggleAllItemsOnTicket(order)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all text-xs ${
                            allItemsDone
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                          title={allItemsDone ? 'Uncheck all items' : 'Strike through all dishes as cooked'}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{allItemsDone ? 'Reset Items' : 'All Cooked'}</span>
                        </button>

                        {/* Bump / Complete Order Button */}
                        <button
                          type="button"
                          onClick={() => handleCompleteOrder(order)}
                          className="px-3.5 py-1.5 rounded-xl font-black flex items-center gap-1.5 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all"
                          title="Complete and bump this order off kitchen screen (ready for counter/delivery)"
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Complete Order</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
