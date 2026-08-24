import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Utensils,
  ShoppingBag,
  Truck,
  Users,
  Percent,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  PauseCircle,
  PlayCircle,
  ArrowLeftRight,
  Layers,
  ChefHat,
  Share2,
  Download,
  LayoutGrid,
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  List,
  FolderTree,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  getTodayDateString,
  getYesterdayDateString,
  getCurrentTimeString,
  shiftDateDays,
  getDayName,
} from '../utils/formatters';
import { Invoice, InvoiceItem, OrderType, PaymentMode, Product, HeldOrder, RestaurantTable } from '../types';
import { downloadInvoicePDF, printInvoicePDF } from '../utils/pdfService';
import { CustomSelect } from '../components/ui/CustomSelect';
import { InvoicesSkeleton } from '../components/ui/Skeleton';
import { NavTabId } from '../components/Navbar';
import { PosCategoryBar, PosDietaryFilter } from '../components/pos/PosCategoryBar';
import { PosProductGrid } from '../components/pos/PosProductGrid';
import { PosCartPanel } from '../components/pos/PosCartPanel';
import { PosUpiQrModal } from '../components/pos/PosUpiQrModal';
import { PosCustomItemModal } from '../components/pos/PosCustomItemModal';

const INVOICES_DRAFT_KEY = 'patil_biryani_v1_invoices_form_draft';

export type InvoiceDatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'previous_month'
  | 'single_date'
  | 'custom_range';

interface InvoicesFormDraft {
  activeTab?: 'pos' | 'history';
  orderType?: OrderType;
  selectedTable?: string;
  selectedCustomerId?: string;
  customerName?: string;
  customerMobile?: string;
  selectedCategory?: string;
  productSearch?: string;
  dietaryFilter?: PosDietaryFilter;
  posViewMode?: 'cards' | 'compact' | 'list';
  cartItems?: InvoiceItem[];
  discountPercent?: number;
  gstExemptBilling?: boolean;
  paymentMode?: PaymentMode;
  amountPaidInput?: string;
  orderNotes?: string;
  currentHeldOrderId?: string | null;
  historySearch?: string;
  historyStatusFilter?: string;
  historyOrderTypeFilter?: string;
  historyDatePreset?: InvoiceDatePreset;
  historySingleDate?: string;
  historyStartDate?: string;
  historyEndDate?: string;
  historyViewMode?: 'list' | 'grouped_date';
  lastSaved?: string;
}

function getStoredInvoicesDraft(): InvoicesFormDraft {
  try {
    const raw = localStorage.getItem(INVOICES_DRAFT_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load invoices draft from localStorage', err);
  }
  return {};
}

interface InvoicesViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
  onNavigate?: (tab: NavTabId) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
  onNavigate,
}) => {
  const {
    invoices,
    nextInvoiceNumber,
    addInvoice,
    deleteInvoice,
    products,
    categories,
    tables,
    setTableStatus,
    heldOrders,
    holdOrder,
    resumeHeldOrder,
    deleteHeldOrder,
    updateHeldOrder,
    transferTableOrder,
    customers,
    businessProfile,
    isDateInActiveFilter,
    isLoading,
  } = useApp();
  const { showToast, confirmAction } = useAppNotification();

  const initialDraft = useMemo(() => getStoredInvoicesDraft(), []);

  // Mode: 'pos' (create invoice) or 'history' (view invoices)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>(() => initialDraft.activeTab || 'pos');

  // POS State
  const [orderType, setOrderType] = useState<OrderType>(() => initialDraft.orderType || 'Dine In');
  const [selectedTable, setSelectedTable] = useState<string>(() => initialDraft.selectedTable || 'Table 1');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => initialDraft.selectedCustomerId || '');
  const [customerName, setCustomerName] = useState<string>(() =>
    initialDraft.customerName !== undefined ? initialDraft.customerName : 'Walk-in Customer'
  );
  const [customerMobile, setCustomerMobile] = useState<string>(() => initialDraft.customerMobile || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => initialDraft.selectedCategory || 'all');
  const [dietaryFilter, setDietaryFilter] = useState<PosDietaryFilter>(() => initialDraft.dietaryFilter || 'all');
  const [posViewMode, setPosViewMode] = useState<'cards' | 'compact' | 'list'>(
    () => initialDraft.posViewMode || 'cards'
  );
  const [productSearch, setProductSearch] = useState<string>(() => initialDraft.productSearch || '');

  // Cart / Order Items
  const [cartItems, setCartItems] = useState<InvoiceItem[]>(() =>
    Array.isArray(initialDraft.cartItems) ? initialDraft.cartItems : []
  );
  const [discountPercent, setDiscountPercent] = useState<number>(() =>
    typeof initialDraft.discountPercent === 'number' ? initialDraft.discountPercent : 0
  );
  const [gstExemptBilling, setGstExemptBilling] = useState<boolean>(() =>
    Boolean(initialDraft.gstExemptBilling)
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(() => initialDraft.paymentMode || 'UPI');
  const [amountPaidInput, setAmountPaidInput] = useState<string>(() => initialDraft.amountPaidInput || '');
  const [orderNotes, setOrderNotes] = useState<string>(() => initialDraft.orderNotes || '');
  const [currentHeldOrderId, setCurrentHeldOrderId] = useState<string | null>(() => initialDraft.currentHeldOrderId || null);

  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => initialDraft.lastSaved || null);
  const [hasDraftRestored, setHasDraftRestored] = useState<boolean>(
    () => !!(initialDraft.cartItems && initialDraft.cartItems.length > 0)
  );

  // Modals
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewKOT, setViewKOT] = useState<HeldOrder | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferFromTableId, setTransferFromTableId] = useState<string>('');
  const [transferToTableId, setTransferToTableId] = useState<string>('');
  const [showTablesOverviewModal, setShowTablesOverviewModal] = useState<boolean>(false);
  const [showUpiQrModal, setShowUpiQrModal] = useState<boolean>(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState<boolean>(false);

  // Invoices List Filter & Date-Wise Search State
  const [historySearch, setHistorySearch] = useState<string>(() => initialDraft.historySearch || '');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>(() => initialDraft.historyStatusFilter || 'all');
  const [historyOrderTypeFilter, setHistoryOrderTypeFilter] = useState<string>(() => initialDraft.historyOrderTypeFilter || 'all');
  const [historyDatePreset, setHistoryDatePreset] = useState<InvoiceDatePreset>(
    () => initialDraft.historyDatePreset || 'all'
  );
  const [historySingleDate, setHistorySingleDate] = useState<string>(
    () => initialDraft.historySingleDate || getTodayDateString()
  );
  const [historyStartDate, setHistoryStartDate] = useState<string>(() => initialDraft.historyStartDate || '');
  const [historyEndDate, setHistoryEndDate] = useState<string>(
    () => initialDraft.historyEndDate || getTodayDateString()
  );
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'grouped_date'>(
    () => initialDraft.historyViewMode || 'list'
  );
  const [collapsedDateGroups, setCollapsedDateGroups] = useState<Record<string, boolean>>({});

  // Continuous 1-Second Auto-Save Function for Order Drafts
  const performOrderDraftSave = useCallback(() => {
    try {
      const isCartActive =
        cartItems.length > 0 ||
        (customerName && customerName !== 'Walk-in Customer') ||
        customerMobile ||
        discountPercent > 0 ||
        orderNotes ||
        amountPaidInput ||
        selectedCustomerId ||
        currentHeldOrderId;

      const hasHistoryFilters =
        historySearch ||
        historyStatusFilter !== 'all' ||
        historyOrderTypeFilter !== 'all' ||
        historyDatePreset !== 'all';

      if (
        isCartActive ||
        hasHistoryFilters ||
        productSearch ||
        selectedCategory !== 'all' ||
        dietaryFilter !== 'all' ||
        posViewMode !== 'cards' ||
        selectedTable !== 'Table 1' ||
        orderType !== 'Dine In'
      ) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const draft: InvoicesFormDraft = {
          activeTab,
          orderType,
          selectedTable,
          selectedCustomerId,
          customerName,
          customerMobile,
          selectedCategory,
          dietaryFilter,
          posViewMode,
          productSearch,
          cartItems,
          discountPercent,
          gstExemptBilling,
          paymentMode,
          amountPaidInput,
          orderNotes,
          currentHeldOrderId,
          historySearch,
          historyStatusFilter,
          historyOrderTypeFilter,
          historyDatePreset,
          historySingleDate,
          historyStartDate,
          historyEndDate,
          historyViewMode,
          lastSaved: timeStr,
        };
        localStorage.setItem(INVOICES_DRAFT_KEY, JSON.stringify(draft));
        setLastSavedTime(timeStr);
      } else {
        localStorage.removeItem(INVOICES_DRAFT_KEY);
        setLastSavedTime(null);
      }
    } catch (err) {
      console.error('Failed to auto-save invoices draft to localStorage', err);
    }
  }, [
    activeTab,
    orderType,
    selectedTable,
    selectedCustomerId,
    customerName,
    customerMobile,
    selectedCategory,
    dietaryFilter,
    posViewMode,
    productSearch,
    cartItems,
    discountPercent,
    gstExemptBilling,
    paymentMode,
    amountPaidInput,
    orderNotes,
    currentHeldOrderId,
    historySearch,
    historyStatusFilter,
    historyOrderTypeFilter,
    historyDatePreset,
    historySingleDate,
    historyStartDate,
    historyEndDate,
    historyViewMode,
  ]);

  // Immediate auto-save upon user interactions
  useEffect(() => {
    performOrderDraftSave();
  }, [performOrderDraftSave]);

  // Continuous 1-Second Recurring Auto-Save Heartbeat & Lifecycle Flush for Order Drafts
  useEffect(() => {
    const timer = setInterval(() => {
      performOrderDraftSave();
    }, 1000);

    const handleFlush = () => {
      performOrderDraftSave();
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
  }, [performOrderDraftSave]);

  // Keyboard Shortcuts Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F2' && activeTab === 'pos') {
        e.preventDefault();
        handleGenerateInvoice(true);
      } else if (e.key === 'F3' && activeTab === 'pos') {
        e.preventDefault();
        handleHoldCurrentOrder();
      } else if (e.key === 'F4' && activeTab === 'pos') {
        e.preventDefault();
        handleResetCart();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search dish"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Filtered Products for POS catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }

      // Dietary / Special Filter
      if (dietaryFilter === 'veg' && !p.isVeg) return false;
      if (dietaryFilter === 'non-veg' && p.isVeg) return false;
      if (dietaryFilter === 'popular' && !p.isPopular) return false;
      if (dietaryFilter === 'spicy' && (!p.spicyLevel || p.spicyLevel === 'mild')) return false;

      // Text search
      if (productSearch) {
        const q = productSearch.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code ? p.code.toLowerCase().includes(q) : false;
        const matchUnit = p.unit.toLowerCase().includes(q);
        const matchPrice = p.sellingPrice.toString().includes(q);
        return matchName || matchCode || matchUnit || matchPrice;
      }

      return true;
    });
  }, [products, selectedCategory, dietaryFilter, productSearch]);

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const productGst = typeof product.taxGstRate === 'number' ? product.taxGstRate : 5;
      const rateForTax = gstExemptBilling ? 0 : productGst;
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + 1;
        const sub = newQty * current.rate;
        const tax = (sub * rateForTax) / 100;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          tax,
          amount: sub + tax,
        };
        return updated;
      } else {
        const cat = categories.find((c) => c.id === product.categoryId);
        const sub = product.sellingPrice;
        const tax = (sub * rateForTax) / 100;
        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          categoryName: cat?.name || 'General',
          quantity: 1,
          rate: product.sellingPrice,
          unit: product.unit,
          discount: 0,
          tax,
          amount: sub + tax,
        };
        return [...prev, newItem];
      }
    });
  };

  // Add Open / Custom Item to Cart
  const handleAddCustomItem = (newItem: InvoiceItem) => {
    setCartItems((prev) => [...prev, newItem]);
    showToast(`Added custom item "${newItem.productName}" to order`, 'success');
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const sub = newQty * item.rate;
            const product = products.find((p) => p.id === productId);
            const productGst = typeof product?.taxGstRate === 'number' ? product.taxGstRate : 5;
            const rateForTax = gstExemptBilling ? 0 : productGst;
            const tax = (sub * rateForTax) / 100;
            return {
              ...item,
              quantity: newQty,
              tax,
              amount: sub + tax,
            };
          }
          return item;
        })
        .filter(Boolean) as InvoiceItem[];
    });
  };

  // Remove Item from Cart
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Update Item Cooking Note
  const handleUpdateItemNote = (productId: string, note: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, note: note || undefined } : item))
    );
  };

  // Toggle GST Exemption and immediately recalculate current cart items
  const handleToggleGstExempt = (exempt: boolean) => {
    setGstExemptBilling(exempt);
    setCartItems((prev) =>
      prev.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const productGst = typeof prod?.taxGstRate === 'number' ? prod.taxGstRate : 5;
        const rateForTax = exempt ? 0 : productGst;
        const sub = item.quantity * item.rate;
        const tax = (sub * rateForTax) / 100;
        return {
          ...item,
          tax,
          amount: sub + tax,
        };
      })
    );
  };

  // Calculations for current Cart
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  }, [cartItems]);

  const cartDiscountAmount = useMemo(() => {
    return Math.round((cartSubtotal * (discountPercent || 0)) / 100);
  }, [cartSubtotal, discountPercent]);

  const taxableAmount = cartSubtotal - cartDiscountAmount;

  const cartTax = useMemo(() => {
    if (gstExemptBilling || cartItems.length === 0) return 0;
    const discountMultiplier = cartSubtotal > 0 ? 1 - (discountPercent || 0) / 100 : 1;
    return Math.round(
      cartItems.reduce((sum, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const rate = typeof prod?.taxGstRate === 'number' ? prod.taxGstRate : 5;
        const itemTaxable = item.quantity * item.rate * discountMultiplier;
        return sum + (itemTaxable * rate) / 100;
      }, 0)
    );
  }, [gstExemptBilling, cartItems, cartSubtotal, discountPercent, products]);

  const cartGrandTotal = taxableAmount + cartTax;

  const effectiveAmountPaid = useMemo(() => {
    if (amountPaidInput === '') return cartGrandTotal;
    const parsed = parseFloat(amountPaidInput);
    return isNaN(parsed) ? 0 : parsed;
  }, [amountPaidInput, cartGrandTotal]);

  const cartBalanceDue = Math.max(0, cartGrandTotal - effectiveAmountPaid);

  // Handle Customer Selection
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === '') {
      setCustomerName('Walk-in Customer');
      setCustomerMobile('');
    } else {
      const cust = customers.find((c) => c.id === custId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerMobile(cust.mobile);
      }
    }
  };

  // Reset Cart
  const handleResetCart = () => {
    setCartItems([]);
    setDiscountPercent(0);
    setAmountPaidInput('');
    setOrderNotes('');
    setCurrentHeldOrderId(null);
    setSelectedCustomerId('');
    setCustomerName('Walk-in Customer');
    setCustomerMobile('');
    setHasDraftRestored(false);
    try {
      localStorage.removeItem(INVOICES_DRAFT_KEY);
      setLastSavedTime(null);
    } catch (err) {
      console.error('Failed to clear draft from localStorage', err);
    }
  };

  // Hold Current Active Order
  const handleHoldCurrentOrder = () => {
    if (cartItems.length === 0) {
      showToast('Cannot hold an empty order. Please select at least one item.', 'warning');
      return;
    }

    const matchedTable = tables.find((t) => t.name === selectedTable) || tables[0];
    const tableId = matchedTable ? matchedTable.id : 'tbl-1';
    const tableName = matchedTable ? matchedTable.name : selectedTable;

    const normalizedItems = cartItems.map((item) => ({
      ...item,
      tax: gstExemptBilling ? 0 : item.tax,
      amount: gstExemptBilling ? item.quantity * item.rate : item.amount,
    }));

    const held = holdOrder({
      tableId,
      tableName,
      customerName: customerName.trim() || 'Walk-in Guest',
      customerMobile: customerMobile.trim() || undefined,
      orderType,
      items: normalizedItems,
      subtotal: cartSubtotal,
      discount: cartDiscountAmount,
      tax: gstExemptBilling ? 0 : cartTax,
      grandTotal: cartGrandTotal,
      isGstExempt: gstExemptBilling,
      notes: orderNotes.trim() || undefined,
      status: 'Held',
    });

    handleResetCart();
    showToast(`Order held for ${tableName} (${held.items.length} items)`, 'info');
  };

  // Resume a Held Order
  const handleResumeOrder = async (held: HeldOrder) => {
    // If current cart has unsaved items, warn
    if (cartItems.length > 0) {
      const confirmSwap = await confirmAction({
        title: 'Replace Current Cart?',
        message: 'You have items in your current cart. Resuming this held order will replace current items. Continue?',
        confirmText: 'Resume Order',
        type: 'warning',
      });
      if (!confirmSwap) return;
    }

    setSelectedTable(held.tableName);
    setOrderType(held.orderType);
    setCustomerName(held.customerName || 'Walk-in Customer');
    setCustomerMobile(held.customerMobile || '');
    setCartItems(held.items);
    setOrderNotes(held.notes || '');
    setDiscountPercent(0);
    setAmountPaidInput('');
    setCurrentHeldOrderId(held.id);

    // Restore GST exemption setting
    if (held.isGstExempt !== undefined) {
      setGstExemptBilling(held.isGstExempt);
    } else if (held.tax === 0) {
      setGstExemptBilling(true);
    } else {
      setGstExemptBilling(false);
    }

    // Set Table status to Billing
    setTableStatus(held.tableId, 'Billing');
    showToast(`Resumed order for ${held.tableName}`, 'success');
  };

  // Kitchen Order Ticket (KOT)
  const handleOpenKOT = (heldOrCart?: HeldOrder) => {
    if (heldOrCart) {
      setViewKOT(heldOrCart);
    } else if (cartItems.length > 0) {
      const matchedTable = tables.find((t) => t.name === selectedTable) || tables[0];
      const kotData: HeldOrder = {
        id: currentHeldOrderId || `kot-${Date.now()}`,
        tableId: matchedTable ? matchedTable.id : 'tbl-1',
        tableName: orderType === 'Dine In' ? selectedTable : orderType,
        customerName: customerName.trim() || 'Guest',
        orderType,
        items: cartItems.map((item) => ({
          ...item,
          tax: gstExemptBilling ? 0 : item.tax,
          amount: gstExemptBilling ? item.quantity * item.rate : item.amount,
        })),
        subtotal: cartSubtotal,
        discount: cartDiscountAmount,
        tax: gstExemptBilling ? 0 : cartTax,
        grandTotal: cartGrandTotal,
        isGstExempt: gstExemptBilling,
        notes: orderNotes.trim() || undefined,
        heldAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Held',
      };
      setViewKOT(kotData);
    } else {
      showToast('Cart is empty. Please add items before printing KOT.', 'warning');
    }
  };

  // Execute Table Transfer
  const handleExecuteTransfer = () => {
    if (!transferFromTableId || !transferToTableId) {
      showToast('Please select both source and destination tables.', 'warning');
      return;
    }
    if (transferFromTableId === transferToTableId) {
      showToast('Source and destination tables must be different.', 'warning');
      return;
    }

    transferTableOrder(transferFromTableId, transferToTableId);
    setShowTransferModal(false);
    setTransferFromTableId('');
    setTransferToTableId('');
    showToast('Table order transferred successfully.', 'success');
  };

  // Submit / Generate Invoice
  const handleGenerateInvoice = (shouldPrint = false) => {
    if (cartItems.length === 0) {
      showToast('Please add at least one dish to the invoice.', 'warning');
      return;
    }

    const normalizedItems = cartItems.map((item) => ({
      ...item,
      tax: gstExemptBilling ? 0 : item.tax,
      amount: gstExemptBilling ? item.quantity * item.rate : item.amount,
    }));

    const newInvoice = addInvoice({
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      tableNumber: orderType === 'Dine In' ? selectedTable : orderType,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerMobile: customerMobile.trim() || undefined,
      orderType,
      paymentMode,
      paymentStatus: cartBalanceDue <= 0 ? 'Paid' : effectiveAmountPaid > 0 ? 'Partial' : 'Unpaid',
      items: normalizedItems,
      subtotal: cartSubtotal,
      discount: cartDiscountAmount,
      tax: gstExemptBilling ? 0 : cartTax,
      grandTotal: cartGrandTotal,
      amountPaid: effectiveAmountPaid,
      balanceDue: cartBalanceDue,
      isGstExempt: gstExemptBilling,
      notes: orderNotes.trim() || undefined,
    });

    // If this was a held order, remove it and free up the table
    if (currentHeldOrderId) {
      deleteHeldOrder(currentHeldOrderId);
    } else {
      const matchedTable = tables.find((t) => t.name === selectedTable);
      if (matchedTable) {
        setTableStatus(matchedTable.id, 'Available');
      }
    }

    handleResetCart();
    if (shouldPrint) {
      setViewInvoice(newInvoice);
    } else {
      setActiveTab('history');
      showToast(`Bill #${newInvoice.invoiceNumber} created successfully!`, 'success');
    }
  };

  // Filtered Invoices History with date-wise search and presets
  const filteredInvoices = useMemo(() => {
    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();
    const now = new Date();

    return invoices.filter((inv) => {
      // 1. Date Preset Filtering
      if (historyDatePreset === 'today') {
        if (inv.date !== todayStr) return false;
      } else if (historyDatePreset === 'yesterday') {
        if (inv.date !== yesterdayStr) return false;
      } else if (historyDatePreset === 'this_week') {
        const dayOfWeek = now.getDay() || 7; // Monday as 1
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const targetDate = new Date(inv.date);
        targetDate.setHours(0, 0, 0, 0);
        if (targetDate < startOfWeek || targetDate > now) return false;
      } else if (historyDatePreset === 'this_month') {
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        if (!inv.date.startsWith(`${currentYear}-${currentMonth}`)) return false;
      } else if (historyDatePreset === 'previous_month') {
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
        if (!inv.date.startsWith(`${prevYear}-${prevMonth}`)) return false;
      } else if (historyDatePreset === 'single_date') {
        if (historySingleDate && inv.date !== historySingleDate) return false;
      } else if (historyDatePreset === 'custom_range') {
        if (historyStartDate && inv.date < historyStartDate) return false;
        if (historyEndDate && inv.date > historyEndDate) return false;
      }

      // 2. Global Date Filter from AppContext
      if (!isDateInActiveFilter(inv.date)) return false;

      // 3. Status Filter
      if (historyStatusFilter !== 'all' && inv.paymentStatus !== historyStatusFilter) {
        return false;
      }

      // 4. Order Type Filter
      if (historyOrderTypeFilter !== 'all' && inv.orderType !== historyOrderTypeFilter) {
        return false;
      }

      // 5. Text Search (Invoice #, Customer name, mobile, item names, table, notes)
      if (historySearch) {
        const q = historySearch.toLowerCase().trim();
        const matchInvNo = inv.invoiceNumber.toLowerCase().includes(q);
        const matchCustomer = inv.customerName.toLowerCase().includes(q);
        const matchMobile = inv.customerMobile ? inv.customerMobile.includes(q) : false;
        const matchTable = inv.tableNumber ? inv.tableNumber.toLowerCase().includes(q) : false;
        const matchDate = inv.date.includes(q) || formatDateDisplay(inv.date).toLowerCase().includes(q);
        const matchItems = inv.items.some((it) => it.productName.toLowerCase().includes(q));
        const matchNotes = inv.notes ? inv.notes.toLowerCase().includes(q) : false;
        const matchPayMode = inv.paymentMode.toLowerCase().includes(q);

        return (
          matchInvNo ||
          matchCustomer ||
          matchMobile ||
          matchTable ||
          matchDate ||
          matchItems ||
          matchNotes ||
          matchPayMode
        );
      }

      return true;
    });
  }, [
    invoices,
    historyDatePreset,
    historySingleDate,
    historyStartDate,
    historyEndDate,
    isDateInActiveFilter,
    historyStatusFilter,
    historyOrderTypeFilter,
    historySearch,
  ]);

  // Group filtered invoices by date
  const groupedInvoicesByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        invoices: Invoice[];
        totalSales: number;
        totalPaid: number;
        totalDue: number;
      }
    >();

    filteredInvoices.forEach((inv) => {
      const existing = map.get(inv.date);
      if (existing) {
        existing.invoices.push(inv);
        existing.totalSales += inv.grandTotal;
        existing.totalPaid += inv.amountPaid;
        existing.totalDue += inv.balanceDue;
      } else {
        map.set(inv.date, {
          date: inv.date,
          invoices: [inv],
          totalSales: inv.grandTotal,
          totalPaid: inv.amountPaid,
          totalDue: inv.balanceDue,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filteredInvoices]);

  // Summary Metrics of filtered items
  const historyTotals = useMemo(() => {
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalDue = filteredInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => sum + inv.tax, 0);
    return { totalSales, totalPaid, totalDue, totalTax };
  }, [filteredInvoices]);

  const toggleDateGroup = (date: string) => {
    setCollapsedDateGroups((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const handleResetFilters = () => {
    setHistorySearch('');
    setHistoryStatusFilter('all');
    setHistoryOrderTypeFilter('all');
    setHistoryDatePreset('all');
    setHistoryStartDate('');
    setHistoryEndDate(getTodayDateString());
    setHistorySingleDate(getTodayDateString());
  };

  const isAnyFilterActive =
    historySearch !== '' ||
    historyStatusFilter !== 'all' ||
    historyOrderTypeFilter !== 'all' ||
    historyDatePreset !== 'all';

  const getExportDateRangeTitle = () => {
    if (historyDatePreset === 'today') return `Today (${formatDateDisplay(getTodayDateString())})`;
    if (historyDatePreset === 'yesterday') return `Yesterday (${formatDateDisplay(getYesterdayDateString())})`;
    if (historyDatePreset === 'this_week') return 'This Week';
    if (historyDatePreset === 'this_month') return 'This Month';
    if (historyDatePreset === 'previous_month') return 'Last Month';
    if (historyDatePreset === 'single_date' && historySingleDate) return `Date: ${formatDateDisplay(historySingleDate)}`;
    if (historyDatePreset === 'custom_range' && historyStartDate && historyEndDate)
      return `${formatDateDisplay(historyStartDate)} to ${formatDateDisplay(historyEndDate)}`;
    return 'All Records';
  };

  if (isLoading) {
    return <InvoicesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-amber-400" />
            <span>POS Billing & Invoices</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fast touch-screen restaurant ordering, live bill calculation, food photo selection, and instant thermal printing
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Held Orders Quick Drawer Button */}
          {heldOrders.length > 0 && (
            <button
              onClick={() => setShowTablesOverviewModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm animate-pulse"
            >
              <PauseCircle className="h-4 w-4 text-amber-400" />
              <span>
                {heldOrders.length} Held {heldOrders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </button>
          )}

          {/* Table Transfer Button */}
          <button
            onClick={() => setShowTransferModal(true)}
            className="glass px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
            title="Transfer order between tables"
          >
            <ArrowLeftRight className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Transfer Table</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center rounded-2xl bg-slate-950 p-1 border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pos'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Live POS Counter
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📜 Invoices History ({invoices.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'pos' ? (
        /* LIVE POS COUNTER INTERFACE (7 Cols Menu + 5 Cols Cart) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Order Type Bar, Customer, Categories & Food Menu Grid (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Order Metadata Strip: Dine In / Takeaway / Delivery & Table Selection */}
              <div className="glass-card rounded-3xl p-4 border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Order Type Buttons */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-white/10">
                    {(['Dine In', 'Takeaway', 'Delivery'] as OrderType[]).map((type) => {
                      const isSel = orderType === type;
                      const Icon = type === 'Dine In' ? Utensils : type === 'Takeaway' ? ShoppingBag : Truck;
                      return (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isSel
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dine In Table Selector */}
                  {orderType === 'Dine In' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Table:</span>
                      <CustomSelect
                        value={selectedTable}
                        onChange={(val) => setSelectedTable(val)}
                        options={tables.map((t) => ({
                          value: t.name,
                          label: `${t.name} (${t.capacity}p)`,
                          badge: t.status,
                          badgeColor: t.status === 'Available' ? 'emerald' : t.status === 'Occupied' ? 'rose' : 'amber',
                        }))}
                        className="w-40"
                        size="sm"
                      />
                    </div>
                  )}

                  {/* Customer Quick Selector */}
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] justify-end">
                    <span className="text-xs font-semibold text-slate-400">Customer:</span>
                    <CustomSelect
                      value={selectedCustomerId}
                      onChange={(val) => handleSelectCustomer(val)}
                      options={[
                        { value: '', label: 'Walk-in Guest' },
                        ...customers.map((c) => ({
                          value: c.id,
                          label: `${c.name} (${c.mobile})`,
                        })),
                      ]}
                      className="w-48"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Optional Custom Name / Mobile for Walk-ins */}
                {selectedCustomerId === '' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                    <div>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Guest Name (e.g. Rahul Patil)"
                        className="w-full glass-input text-xs px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full glass-input text-xs px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced POS Category & Dietary Bar */}
              <PosCategoryBar
                categories={categories}
                products={products}
                selectedCategoryId={selectedCategory}
                onSelectCategory={(id) => setSelectedCategory(id)}
                dietaryFilter={dietaryFilter}
                onSelectDietaryFilter={(filter) => setDietaryFilter(filter)}
                searchQuery={productSearch}
                onSearchChange={(q) => setProductSearch(q)}
                posViewMode={posViewMode}
                onChangeViewMode={(mode) => setPosViewMode(mode)}
              />

              {/* Visual Food Product Grid / Cards / Compact / List */}
              <PosProductGrid
                products={filteredProducts}
                categories={categories}
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                viewMode={posViewMode}
              />
            </div>

            {/* Right Column: Live Bill / Cart Summary (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <PosCartPanel
                nextInvoiceNumber={nextInvoiceNumber}
                orderType={orderType}
                selectedTable={selectedTable}
                customerName={customerName}
                lastSavedTime={lastSavedTime}
                hasDraftRestored={hasDraftRestored}
                cartItems={cartItems}
                cartSubtotal={cartSubtotal}
                discountPercent={discountPercent}
                setDiscountPercent={(val) => setDiscountPercent(val)}
                gstExemptBilling={gstExemptBilling}
                onToggleGstExempt={handleToggleGstExempt}
                cartTax={cartTax}
                cartGrandTotal={cartGrandTotal}
                paymentMode={paymentMode}
                setPaymentMode={(mode) => setPaymentMode(mode)}
                amountPaidInput={amountPaidInput}
                setAmountPaidInput={(val) => setAmountPaidInput(val)}
                cartBalanceDue={cartBalanceDue}
                orderNotes={orderNotes}
                setOrderNotes={(notes) => setOrderNotes(notes)}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateItemNote={handleUpdateItemNote}
                onResetCart={handleResetCart}
                onOpenCustomItemModal={() => setShowCustomItemModal(true)}
                onOpenUpiQrModal={() => setShowUpiQrModal(true)}
                onHoldOrder={handleHoldCurrentOrder}
                onOpenKOT={() => handleOpenKOT()}
                onSaveOrder={handleGenerateInvoice}
              />
            </div>
          </div>
        </div>
      ) : (
        /* INVOICES HISTORY INTERFACE WITH DATE-WISE SEARCH & FILTERING */
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed Volume</div>
                <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                  {getExportDateRangeTitle()}
                </div>
              </div>
              <div className="font-mono-num text-2xl font-black text-amber-400 mt-2">
                {formatINR(historyTotals.totalSales)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>
                  {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice record' : 'invoice records'} found
                </span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Amount Collected</div>
              <div className="font-mono-num text-2xl font-black text-emerald-400 mt-2">
                {formatINR(historyTotals.totalPaid)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Settled via Cash, UPI & Cards</span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Receivables</div>
              <div className="font-mono-num text-2xl font-black text-rose-400 mt-2">
                {formatINR(historyTotals.totalDue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${historyTotals.totalDue > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <span>{historyTotals.totalDue > 0 ? 'Pending customer balance' : 'All accounts fully settled'}</span>
              </div>
            </div>
          </div>

          {/* Unified Invoice & Date Search Control Center */}
          <div className="glass-card rounded-3xl p-4 border border-white/10 space-y-3.5 shadow-xl">
            {/* Row 1: Search, Filter Dropdowns, Mode Toggle & Exports */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left Group: Search Bar & Filters */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by date (YYYY-MM-DD, Aug), invoice #, customer, dish..."
                    className="w-full glass-input pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 rounded-xl"
                  />
                  {historySearch && (
                    <button
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
                      title="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <CustomSelect
                  value={historyStatusFilter}
                  onChange={(val) => setHistoryStatusFilter(val)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'Paid', label: 'Paid', badge: 'Paid', badgeColor: 'emerald' },
                    { value: 'Partial', label: 'Partial', badge: 'Partial', badgeColor: 'amber' },
                    { value: 'Unpaid', label: 'Unpaid', badge: 'Unpaid', badgeColor: 'rose' },
                  ]}
                  className="w-32"
                  size="sm"
                />

                {/* Order Type Filter */}
                <CustomSelect
                  value={historyOrderTypeFilter}
                  onChange={(val) => setHistoryOrderTypeFilter(val)}
                  options={[
                    { value: 'all', label: 'All Order Types' },
                    { value: 'Dine In', label: 'Dine In' },
                    { value: 'Takeaway', label: 'Takeaway' },
                    { value: 'Delivery', label: 'Delivery' },
                  ]}
                  className="w-36"
                  size="sm"
                />

                {/* Reset Filters Button */}
                {isAnyFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
                    title="Reset all search and date filters"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Right Group: View Mode Switcher & Exports */}
              <div className="flex items-center gap-2.5">
                {/* View Mode Toggle: List vs Grouped by Date */}
                <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setHistoryViewMode('list')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      historyViewMode === 'list'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="List View"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setHistoryViewMode('grouped_date')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      historyViewMode === 'grouped_date'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Group by Date"
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                    <span>By Date</span>
                  </button>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      onOpenPdfExport(
                        `Patil Biryani - Invoices Register (${getExportDateRangeTitle()})`,
                        filteredInvoices.map((inv) => ({
                          'Invoice #': inv.invoiceNumber,
                          Date: inv.date,
                          Table: inv.tableNumber,
                          Customer: inv.customerName,
                          Type: inv.orderType,
                          Subtotal: inv.subtotal,
                          Tax: inv.tax,
                          GrandTotal: inv.grandTotal,
                          Paid: inv.amountPaid,
                          Due: inv.balanceDue,
                          Mode: inv.paymentMode,
                          Status: inv.paymentStatus,
                        })),
                        {
                          'Total Sales': formatINR(historyTotals.totalSales),
                          'Total Collected': formatINR(historyTotals.totalPaid),
                          'Total Outstanding': formatINR(historyTotals.totalDue),
                        }
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors shadow-sm"
                    title="Export filtered invoices to PDF"
                  >
                    <FileText className="h-3.5 w-3.5 text-rose-400" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() =>
                      onOpenExcelExport(
                        `Patil_Biryani_Invoices_${getExportDateRangeTitle().replace(/[\s\(\)\/]/g, '_')}`,
                        filteredInvoices.map((inv) => ({
                          'Invoice Number': inv.invoiceNumber,
                          Date: inv.date,
                          Time: inv.time,
                          Table: inv.tableNumber,
                          Customer: inv.customerName,
                          Mobile: inv.customerMobile || '',
                          'Order Type': inv.orderType,
                          'Payment Mode': inv.paymentMode,
                          'Payment Status': inv.paymentStatus,
                          Subtotal: inv.subtotal,
                          Discount: inv.discount,
                          Tax: inv.tax,
                          'Grand Total': inv.grandTotal,
                          'Amount Paid': inv.amountPaid,
                          'Balance Due': inv.balanceDue,
                        }))
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors shadow-sm"
                    title="Export filtered invoices to Excel"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Integrated Date Presets & Custom Pickers Shelf */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              {/* Presets Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs text-slate-400 font-bold mr-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  <span>Date:</span>
                </div>
                {(
                  [
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'previous_month', label: 'Last Month' },
                    { id: 'single_date', label: 'Pick Single Date' },
                    { id: 'custom_range', label: 'Date Range' },
                  ] as { id: InvoiceDatePreset; label: string }[]
                ).map((preset) => {
                  const isActive = historyDatePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setHistoryDatePreset(preset.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Pickers for Single Date or Date Range */}
              {historyDatePreset === 'single_date' && (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="text-xs text-slate-400 font-semibold">Select Date:</span>
                  <input
                    type="date"
                    value={historySingleDate}
                    onChange={(e) => setHistorySingleDate(e.target.value)}
                    className="glass-input px-2.5 py-1 text-xs font-mono text-slate-100 rounded-xl"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistorySingleDate(shiftDateDays(historySingleDate, -1))}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Previous Day"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setHistorySingleDate(shiftDateDays(historySingleDate, 1))}
                      className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Next Day"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {historyDatePreset === 'custom_range' && (
                <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-200">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">From:</span>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="glass-input px-2.5 py-1 text-xs font-mono text-slate-100 rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">To:</span>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="glass-input px-2.5 py-1 text-xs font-mono text-slate-100 rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Table: Grouped by Date or Standard Flat List */}
          {filteredInvoices.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <Receipt className="h-12 w-12 text-slate-600 mx-auto" />
              <div className="font-semibold text-slate-300 text-base">No invoice records found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders match your selected search criteria or date preset. Try adjusting your filters above.
              </p>
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          ) : historyViewMode === 'grouped_date' ? (
            /* GROUPED BY DATE VIEW */
            <div className="space-y-4">
              {groupedInvoicesByDate.map((group) => {
                const isCollapsed = collapsedDateGroups[group.date];
                return (
                  <div
                    key={group.date}
                    className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-lg"
                  >
                    {/* Date Section Header */}
                    <div
                      onClick={() => toggleDateGroup(group.date)}
                      className="p-4 bg-slate-900/90 hover:bg-slate-850 cursor-pointer flex flex-wrap items-center justify-between gap-3 border-b border-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-sm text-slate-100">
                              {formatDateDisplay(group.date)}
                            </h4>
                            <span className="text-xs text-slate-400 font-normal">
                              ({getDayName(group.date)})
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                              {group.invoices.length} {group.invoices.length === 1 ? 'bill' : 'bills'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                            <span>
                              Total Sales:{' '}
                              <strong className="text-amber-400 font-mono-num">{formatINR(group.totalSales)}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Collected:{' '}
                              <strong className="text-emerald-400 font-mono-num">{formatINR(group.totalPaid)}</strong>
                            </span>
                            {group.totalDue > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 font-semibold font-mono-num">
                                  Due: {formatINR(group.totalDue)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">
                          {isCollapsed ? 'Show Details' : 'Hide Details'}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Table for this Date */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-white/5">
                            <tr>
                              <th className="py-2.5 px-4">Invoice #</th>
                              <th className="py-2.5 px-4">Time</th>
                              <th className="py-2.5 px-4">Table / Type</th>
                              <th className="py-2.5 px-4">Customer</th>
                              <th className="py-2.5 px-4">Items Summary</th>
                              <th className="py-2.5 px-4 text-right">Grand Total</th>
                              <th className="py-2.5 px-4 text-center">Status</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-200">
                            {group.invoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-4 font-mono-num font-bold text-amber-400">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="py-3 px-4 text-slate-400">{inv.time}</td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-slate-200">{inv.tableNumber}</span>
                                  <span className="text-[10px] text-slate-400 block">{inv.orderType}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-200">{inv.customerName}</div>
                                  {inv.customerMobile && (
                                    <div className="text-[10px] text-slate-400 font-mono-num">
                                      {inv.customerMobile}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                                  {inv.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                                </td>
                                <td className="py-3 px-4 text-right font-mono-num font-extrabold text-slate-100">
                                  {formatINR(inv.grandTotal)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      inv.paymentStatus === 'Paid'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : inv.paymentStatus === 'Partial'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}
                                  >
                                    {inv.paymentStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setViewInvoice(inv)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                      title="View / Print Bill"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => downloadInvoicePDF(inv, businessProfile)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300"
                                      title="Download PDF"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        onConfirmDelete(
                                          'Delete Invoice Record',
                                          `Are you sure you want to permanently delete Bill #${inv.invoiceNumber}?`,
                                          () => deleteInvoice(inv.id)
                                        )
                                      }
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                                      title="Delete Invoice"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT LIST VIEW */
            <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Table / Type</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Dishes Ordered</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono-num font-bold text-amber-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{formatDateDisplay(inv.date)}</div>
                          <div className="text-[10px] text-slate-400">{inv.time}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200">{inv.tableNumber}</span>
                          <span className="text-[10px] text-slate-400 block">{inv.orderType}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{inv.customerName}</div>
                          {inv.customerMobile && (
                            <div className="text-[10px] text-slate-400 font-mono-num">
                              {inv.customerMobile}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                          {inv.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-slate-400">
                          {formatINR(inv.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num font-extrabold text-amber-400 text-sm">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.paymentStatus === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : inv.paymentStatus === 'Partial'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewInvoice(inv)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="View & Print Bill"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => downloadInvoicePDF(inv, businessProfile)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300"
                              title="Download PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                onConfirmDelete(
                                  'Delete Invoice Record',
                                  `Are you sure you want to permanently delete Bill #${inv.invoiceNumber}?`,
                                  () => deleteInvoice(inv.id)
                                )
                              }
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Counter UPI QR Modal */}
      <PosUpiQrModal
        isOpen={showUpiQrModal}
        onClose={() => setShowUpiQrModal(false)}
        amount={cartGrandTotal}
        invoiceNumber={nextInvoiceNumber}
        upiId={businessProfile.pdfUpiId || 'patilbiryani@upi'}
        businessName={businessProfile.name || 'Patil Biryani'}
      />

      {/* Custom Open Item Modal */}
      <PosCustomItemModal
        isOpen={showCustomItemModal}
        onClose={() => setShowCustomItemModal(false)}
        onAddCustomItem={handleAddCustomItem}
      />

      {/* Table Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-cyan-400" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  Transfer Table Order
                </h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Source Table (Current Order)
                </label>
                <CustomSelect
                  value={transferFromTableId}
                  onChange={(val) => setTransferFromTableId(val)}
                  options={[
                    { value: '', label: 'Select source occupied table' },
                    ...tables
                      .filter((t) => t.status !== 'Available')
                      .map((t) => ({
                        value: t.id,
                        label: `${t.name} (${t.status})`,
                      })),
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Destination Table (Transfer To)
                </label>
                <CustomSelect
                  value={transferToTableId}
                  onChange={(val) => setTransferToTableId(val)}
                  options={[
                    { value: '', label: 'Select destination table' },
                    ...tables
                      .filter((t) => t.id !== transferFromTableId)
                      .map((t) => ({
                        value: t.id,
                        label: `${t.name} (${t.capacity} Seater - ${t.status})`,
                      })),
                  ]}
                  size="sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold text-xs"
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Orders / Tables Overview Drawer Modal */}
      {showTablesOverviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-amber-400" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  Active Held Orders & Dining Tables
                </h3>
              </div>
              <button
                onClick={() => setShowTablesOverviewModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
              {tables.map((tbl) => {
                const heldForThisTable = heldOrders.find((h) => h.tableId === tbl.id || h.tableName === tbl.name);

                return (
                  <div
                    key={tbl.id}
                    className={`glass-card rounded-2xl p-4 border transition-all ${
                      tbl.status === 'Available'
                        ? 'border-emerald-500/20 bg-emerald-950/10'
                        : tbl.status === 'Occupied'
                        ? 'border-rose-500/30 bg-rose-950/20'
                        : 'border-amber-500/30 bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-100">{tbl.name}</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tbl.status === 'Available'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tbl.status === 'Occupied'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {tbl.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-2 space-y-1">
                      <div>
                        {tbl.capacity} Seater {tbl.section ? `• ${tbl.section}` : ''}
                      </div>
                      {heldForThisTable && (
                        <div className="text-amber-300 font-semibold text-[11px] pt-1">
                          Held: {heldForThisTable.items.length} dishes • {formatINR(heldForThisTable.grandTotal)}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 mt-3 flex items-center gap-1.5">
                      {heldForThisTable ? (
                        <button
                          onClick={() => {
                            handleResumeOrder(heldForThisTable);
                            setShowTablesOverviewModal(false);
                          }}
                          className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md"
                        >
                          Resume Order ({formatINR(heldForThisTable.grandTotal)})
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTable(tbl.name);
                            setOrderType('Dine In');
                            setShowTablesOverviewModal(false);
                          }}
                          className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs"
                        >
                          Select Table
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Order Ticket (KOT) Modal */}
      {viewKOT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-slate-100">Kitchen Order Ticket</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      console.warn('Print error', e);
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print KOT</span>
                </button>
                <button
                  onClick={() => setViewKOT(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable KOT Slip */}
            <div className="printable-document bg-white text-slate-950 p-4 rounded-xl font-mono text-xs space-y-3 shadow-lg">
              <div className="text-center border-b-2 border-dashed border-slate-400 pb-2">
                <div className="text-sm font-black uppercase">PATIL BIRYANI - KITCHEN TICKET</div>
                <div className="text-[11px] font-bold mt-1">
                  Table: <span className="text-sm underline">{viewKOT.tableName}</span> ({viewKOT.orderType})
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Guest: {viewKOT.customerName} • {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Items List */}
              <table className="w-full text-left text-xs border-b-2 border-dashed border-slate-400 pb-2">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="py-1">Dish Item</th>
                    <th className="py-1 text-center w-16">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewKOT.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-bold">
                        <div>{it.productName}</div>
                        {it.note && <div className="text-[10px] font-normal text-rose-700 italic">👉 Note: {it.note}</div>}
                      </td>
                      <td className="py-1.5 text-center text-sm font-black">{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {viewKOT.notes && (
                <div className="p-2 rounded bg-slate-100 border border-slate-300 text-[10px] text-slate-800">
                  <strong>Instructions:</strong> {viewKOT.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Thermal Receipt Modal */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
              <div className="font-display font-bold text-sm text-slate-200">Invoice Receipt</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadInvoicePDF(viewInvoice, businessProfile)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 shadow"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF Bill</span>
                </button>
                <button
                  onClick={() => printInvoicePDF(viewInvoice, businessProfile)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Thermal Print</span>
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="printable-document bg-white text-slate-900 p-5 rounded-2xl font-mono text-[12px] space-y-3.5 leading-tight shadow-xl border border-gray-200">
              {/* Header */}
              <div className="print-header text-center space-y-1 border-b border-dashed border-gray-300 pb-3">
                <div className="text-base font-black tracking-wider uppercase font-display text-slate-950">
                  {businessProfile.name || 'PATIL BIRYANI'}
                </div>
                {businessProfile.subtitle && (
                  <div className="text-[10px] text-gray-600 italic">{businessProfile.subtitle}</div>
                )}
                <div className="text-[10px] text-gray-700">
                  {businessProfile.addressLine1}
                  {businessProfile.city ? `, ${businessProfile.city}` : ''}
                  {businessProfile.pinCode ? ` - ${businessProfile.pinCode}` : ''}
                </div>
                <div className="text-[10px] text-gray-700">
                  Phone: <span className="font-bold">{businessProfile.mobile}</span>
                  {businessProfile.altMobile && ` | ${businessProfile.altMobile}`}
                </div>
                {businessProfile.gstNumber && (
                  <div className="text-[10px] font-bold text-slate-800">GSTIN: {businessProfile.gstNumber}</div>
                )}
                {businessProfile.fssaiNumber && (
                  <div className="text-[10px] text-gray-600">FSSAI Lic: {businessProfile.fssaiNumber}</div>
                )}
              </div>

              {/* Body Content */}
              <div className="print-body space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-gray-300 pb-2.5">
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-gray-500 font-sans text-[10px] uppercase font-bold mr-1">Bill No:</span>
                      <span className="font-bold text-slate-900">{viewInvoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-sans text-[10px] uppercase font-bold mr-1">Table:</span>
                      <span className="font-semibold text-slate-800">{viewInvoice.tableNumber}</span>
                      <span className="text-[10px] text-gray-500 ml-1">({viewInvoice.orderType})</span>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div>
                      <span className="text-gray-500 font-sans text-[10px] uppercase font-bold mr-1">Date:</span>
                      <span className="font-semibold text-slate-900">{formatDateDisplay(viewInvoice.date)}</span>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {getDayName(viewInvoice.date) && <span>{getDayName(viewInvoice.date).slice(0, 3)}, </span>}
                      <span>{viewInvoice.time}</span>
                    </div>
                  </div>
                </div>

                {viewInvoice.customerName && viewInvoice.customerName !== 'Walk-in Customer' && (
                  <div className="flex justify-between items-center text-[11px] border-b border-dashed border-gray-300 pb-2">
                    <div>
                      <span className="text-gray-500 font-sans text-[10px] uppercase font-bold mr-1">Customer:</span>
                      <span className="font-bold text-slate-900">{viewInvoice.customerName}</span>
                    </div>
                    {viewInvoice.customerMobile && (
                      <div className="text-right font-mono text-[10px] text-gray-700">
                        Mob: {viewInvoice.customerMobile}
                      </div>
                    )}
                  </div>
                )}

                {/* Items Table */}
                <table className="print-table w-full text-left text-[11px] border-b border-dashed border-gray-300 pb-2">
                  <thead>
                    <tr className="border-b border-gray-300 text-gray-600 text-[10px] uppercase font-bold">
                      <th className="py-1.5 w-[50%]">Item</th>
                      <th className="py-1.5 w-[15%] text-center">Qty</th>
                      <th className="py-1.5 w-[15%] text-right">Rate</th>
                      <th className="py-1.5 w-[20%] text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 font-sans text-[11px] text-slate-900">{it.productName}</td>
                        <td className="py-1 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="py-1 text-right text-gray-600">₹{it.rate}</td>
                        <td className="py-1 text-right font-bold text-slate-950">₹{it.quantity * it.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="print-totals space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{viewInvoice.subtotal}</span>
                </div>
                {viewInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{viewInvoice.discount}</span>
                  </div>
                )}
                {viewInvoice.tax > 0 ? (
                  <div className="flex justify-between text-gray-700">
                    <span>GST ({businessProfile.gstRate || 5}%):</span>
                    <span className="font-bold">₹{viewInvoice.tax}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-500 italic text-[10px]">
                    <span>GST (Tax):</span>
                    <span>Exempted (0%)</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-sm border-t-2 border-b-2 border-dashed border-gray-400 py-1.5 my-1.5 text-slate-950">
                  <span className="font-sans tracking-wide">GRAND TOTAL:</span>
                  <span>{formatINR(viewInvoice.grandTotal)}</span>
                </div>

                <div className="flex justify-between text-gray-700 pt-0.5">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase text-slate-900">{viewInvoice.paymentMode}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-emerald-700">₹{viewInvoice.amountPaid}</span>
                </div>
                {viewInvoice.balanceDue > 0 ? (
                  <div className="flex justify-between text-rose-700 font-black">
                    <span>Balance Due:</span>
                    <span>₹{viewInvoice.balanceDue}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-700 text-[10px] font-bold">
                    <span>Payment Status:</span>
                    <span>PAID IN FULL</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="print-footer text-center text-[10px] text-gray-600 border-t border-dashed border-gray-300 pt-3 space-y-0.5">
                <div className="font-bold text-slate-900 tracking-wider">
                  {businessProfile.footerNote || 'THANK YOU! VISIT AGAIN'}
                </div>
                <div className="text-gray-500 italic">Taste the Authentic Aroma of Patil Biryani</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
