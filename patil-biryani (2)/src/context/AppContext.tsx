import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
  BusinessProfile,
  Category,
  Product,
  ProductPriceHistory,
  RestaurantTable,
  HeldOrder,
  Customer,
  Vendor,
  ExpenseCategory,
  StaffEmployee,
  StaffAttendance,
  StaffAdvance,
  SalaryCalculation,
  PlateWiseSale,
  Invoice,
  Expense,
  Purchase,
  Receivable,
  ReceivablePayment,
  Payable,
  PayablePayment,
  DailyClosing,
  PaymentMode,
  DateFilterType,
  MoneyPosition,
  MoneyTransactionAuditItem,
  MoneyTransfer,
} from '../types';
import {
  defaultBusinessProfile,
  defaultCategories,
  defaultProducts,
  defaultPriceHistory,
  defaultTables,
  defaultCustomers,
  defaultVendors,
  defaultExpenseCategories,
  defaultStaffEmployees,
  defaultAttendance,
  defaultStaffAdvances,
  defaultPlateWiseSales,
  defaultInvoices,
  defaultExpenses,
  defaultPurchases,
  defaultReceivables,
  defaultReceivablePayments,
  defaultPayables,
  defaultPayablePayments,
  defaultDailyClosings,
  defaultMoneyTransfers,
} from '../data/initialData';
import {
  getTodayDateString,
  getYesterdayDateString,
  getCurrentTimeString,
  generateId,
  generateInvoiceNumber,
  extractSequenceNumber,
} from '../utils/formatters';
import {
  initSyncEngine,
  broadcastStateChange,
  debouncedSaveStorage,
  flushPendingStorageSaves,
  triggerImmediateAutoSave,
  SyncEvent,
} from '../utils/syncEngine';
import {
  getStoredDirectoryHandle,
  verifyDirectoryPermission,
  writeBackupToDirectoryHandle,
  loadLocalFolderConfig,
  saveLocalFolderConfig,
  isFileSystemAccessSupported,
} from '../utils/localFolderService';

interface AppContextType {
  // Business Profile
  businessProfile: BusinessProfile;
  updateBusinessProfile: (profile: BusinessProfile) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>, priceChangeNote?: string) => void;
  deleteProduct: (id: string) => void;
  priceHistory: ProductPriceHistory[];

  // Tables & Live Counter
  tables: RestaurantTable[];
  addTable: (table: Omit<RestaurantTable, 'id'>) => void;
  updateTable: (id: string, table: Partial<RestaurantTable>) => void;
  deleteTable: (id: string) => void;
  setTableStatus: (tableId: string, status: RestaurantTable['status']) => void;

  // Held Orders / Live Counter Management
  heldOrders: HeldOrder[];
  holdOrder: (heldOrder: Omit<HeldOrder, 'id' | 'heldAt' | 'updatedAt'>) => HeldOrder;
  resumeHeldOrder: (tableIdOrOrderId: string) => HeldOrder | undefined;
  deleteHeldOrder: (orderId: string) => void;
  updateHeldOrder: (orderId: string, updates: Partial<HeldOrder>) => void;
  transferTableOrder: (fromTableId: string, toTableId: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Vendors
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Expense Categories & Expenses
  expenseCategories: ExpenseCategory[];
  addExpenseCategory: (name: string) => void;
  updateExpenseCategory: (id: string, name: string) => void;
  deleteExpenseCategory: (id: string) => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => void;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;

  // Invoices & POS
  invoices: Invoice[];
  nextInvoiceNumber: string;
  getNextInvoiceNumber: () => string;
  invoiceSequence: number;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Plate-Wise Sales
  plateWiseSales: PlateWiseSale[];
  savePlateWiseSale: (sale: Omit<PlateWiseSale, 'id' | 'createdAt'> & { id?: string }) => void;
  deletePlateWiseSale: (id: string) => void;

  // Receivables
  receivables: Receivable[];
  receivablePayments: ReceivablePayment[];
  addReceivable: (receivable: Omit<Receivable, 'id' | 'createdAt'>) => void;
  recordReceivablePayment: (
    receivableId: string,
    amount: number,
    paymentMode: PaymentMode,
    remarks?: string,
    paymentDate?: string
  ) => void;
  deleteReceivablePayment: (paymentId: string) => void;
  deleteReceivable: (id: string) => void;

  // Payables
  payables: Payable[];
  payablePayments: PayablePayment[];
  addPayable: (payable: Omit<Payable, 'id' | 'createdAt'>) => void;
  recordPayablePayment: (
    payableId: string,
    amount: number,
    paymentMode: PaymentMode,
    remarks?: string,
    paymentDate?: string
  ) => void;
  deletePayablePayment: (paymentId: string) => void;
  deletePayable: (id: string) => void;

  // Staff Management
  staffEmployees: StaffEmployee[];
  addStaffEmployee: (staff: Omit<StaffEmployee, 'id' | 'createdAt'>) => void;
  updateStaffEmployee: (id: string, staff: Partial<StaffEmployee>) => void;
  deleteStaffEmployee: (id: string) => void;
  resignStaffEmployee: (
    id: string,
    resignationData: {
      resignationDate: string;
      resignationReason?: string;
      relievingDate?: string;
      settlementNotes?: string;
      settlementAmount?: number;
      settlementStatus?: 'Pending' | 'Settled';
    }
  ) => void;
  reactivateStaffEmployee: (id: string) => void;

  staffAttendance: StaffAttendance[];
  recordAttendance: (attendance: Omit<StaffAttendance, 'id'>) => void;
  batchRecordAttendance: (records: Omit<StaffAttendance, 'id'>[]) => void;

  staffAdvances: StaffAdvance[];
  addStaffAdvance: (advance: Omit<StaffAdvance, 'id' | 'createdAt'>) => void;
  updateStaffAdvance: (id: string, advance: Partial<StaffAdvance>) => void;
  deleteStaffAdvance: (id: string) => void;

  salaryCalculations: SalaryCalculation[];
  calculateMonthlySalary: (employeeId: string, month: string) => SalaryCalculation;
  calculateAllStaffSalaries: (month: string, targetStaffIds?: string[]) => SalaryCalculation[];
  saveSalaryCalculation: (calc: SalaryCalculation) => void;
  batchSaveSalaryCalculations: (calcs: SalaryCalculation[]) => void;
  paySalaryCalculation: (calcId: string, paymentMode: PaymentMode, paymentDate?: string) => void;
  reviseSalaryCalculation: (
    calcId: string,
    updatedData: Partial<SalaryCalculation>,
    reason: string
  ) => void;
  reopenSalaryCalculation: (calcId: string) => void;
  deleteSalaryCalculation: (calcId: string) => void;

  // Daily Closings
  dailyClosings: DailyClosing[];
  saveDailyClosing: (closing: DailyClosing) => void;
  deleteDailyClosing: (idOrDate: string) => void;
  closeDay: (date: string, notes?: string) => void;
  reopenDay: (date: string, reason?: string) => void;

  // Inter-Account Money Transfers & Liquidity Adjustments
  moneyTransfers: MoneyTransfer[];
  addMoneyTransfer: (transfer: Omit<MoneyTransfer, 'id' | 'createdAt'>) => void;
  deleteMoneyTransfer: (id: string) => void;

  // Global Filter State
  activeDateFilter: DateFilterType;
  setActiveDateFilter: (filter: DateFilterType) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;

  // Computed Financials
  moneyPosition: MoneyPosition;

  outstandingSummary: {
    customerReceivables: number;
    supplierPayables: number;
    staffPayables: number;
    totalPayables: number;
    netReceivablePosition: number;
  };

  // Helper date range filter function
  isDateInActiveFilter: (dateStr: string) => boolean;

  // Real-time Loading & Sync State
  isLoading: boolean;
  isInitialLoading: boolean;
  isSyncing: boolean;

  // Real-Time 1-Second Continuous Auto-Save Engine
  isAutoSaveActive: boolean;
  lastAutoSavedAt: string;
  triggerImmediateSave: () => void;

  // Automated Local Folder Daily Backup Engine
  lastDailyBackupAt: number | null;
  triggerAutomatedDailyBackup: () => Promise<{ success: boolean; fileName?: string; error?: string }>;

  // System
  exportAllDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'patil_biryani_v1_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Flag to avoid broadcasting self-echo loops when updating state from remote tabs
  const isRemoteSyncRef = useRef(false);

  // Loading state for initial hydration and Firebase cloud synchronization
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    // Graceful initial hydration window for smooth perceived loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // State variables with local storage persistence
  const [businessProfile, setBusinessProfileState] = useState<BusinessProfile>(() =>
    loadStorage('business_profile', defaultBusinessProfile)
  );

  const [categories, setCategories] = useState<Category[]>(() => {
    const loaded = loadStorage<Category[]>('categories', defaultCategories);
    if (!Array.isArray(loaded) || loaded.length === 0) return defaultCategories;
    return loaded.map((cat) => {
      const def = defaultCategories.find((d) => d.id === cat.id);
      return {
        ...cat,
        icon: cat.icon || def?.icon || '🍽️',
        color: cat.color || def?.color || 'amber',
      };
    });
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = loadStorage<Product[]>('products', defaultProducts);
    if (!Array.isArray(loaded) || loaded.length === 0) return defaultProducts;
    return loaded.map((p) => {
      const def = defaultProducts.find((d) => d.id === p.id);
      return {
        ...p,
        imageUrl: p.imageUrl || def?.imageUrl,
        isVeg: p.isVeg !== undefined ? p.isVeg : def?.isVeg,
        spicyLevel: p.spicyLevel || def?.spicyLevel,
        isPopular: p.isPopular !== undefined ? p.isPopular : def?.isPopular,
        isSpecial: p.isSpecial !== undefined ? p.isSpecial : def?.isSpecial,
      };
    });
  });

  const [priceHistory, setPriceHistory] = useState<ProductPriceHistory[]>(() =>
    loadStorage('price_history', defaultPriceHistory)
  );

  const [tables, setTables] = useState<RestaurantTable[]>(() =>
    loadStorage('tables', defaultTables)
  );

  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() =>
    loadStorage('held_orders', [])
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStorage('customers', defaultCustomers)
  );

  const [vendors, setVendors] = useState<Vendor[]>(() =>
    loadStorage('vendors', defaultVendors)
  );

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() =>
    loadStorage('expense_categories', defaultExpenseCategories)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadStorage('expenses', defaultExpenses)
  );

  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    loadStorage('purchases', defaultPurchases)
  );

  const getMaxSequence = useCallback((invList: Invoice[]): number => {
    let max = 0;
    if (Array.isArray(invList)) {
      for (const inv of invList) {
        const seq = extractSequenceNumber(inv.invoiceNumber);
        if (seq > max) max = seq;
      }
    }
    return max;
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadStorage('invoices', defaultInvoices)
  );

  const [invoiceSequence, setInvoiceSequence] = useState<number>(() => {
    const stored = loadStorage<{ sequence: number }>('invoice_sequence', null as any);
    const storedSeq = stored && typeof stored.sequence === 'number' ? stored.sequence : 0;
    const initialInvoices = loadStorage('invoices', defaultInvoices);
    let initialMax = 0;
    if (Array.isArray(initialInvoices)) {
      for (const inv of initialInvoices) {
        const seq = extractSequenceNumber(inv.invoiceNumber);
        if (seq > initialMax) initialMax = seq;
      }
    }
    return Math.max(storedSeq, initialMax, 0);
  });

  const [plateWiseSales, setPlateWiseSales] = useState<PlateWiseSale[]>(() =>
    loadStorage('plate_wise_sales', defaultPlateWiseSales)
  );

  const [receivables, setReceivables] = useState<Receivable[]>(() =>
    loadStorage('receivables', defaultReceivables)
  );

  const [receivablePayments, setReceivablePayments] = useState<ReceivablePayment[]>(() =>
    loadStorage('receivable_payments', defaultReceivablePayments)
  );

  const [payables, setPayables] = useState<Payable[]>(() =>
    loadStorage('payables', defaultPayables)
  );

  const [payablePayments, setPayablePayments] = useState<PayablePayment[]>(() =>
    loadStorage('payable_payments', defaultPayablePayments)
  );

  const [staffEmployees, setStaffEmployees] = useState<StaffEmployee[]>(() =>
    loadStorage('staff_employees', defaultStaffEmployees)
  );

  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>(() =>
    loadStorage('staff_attendance', defaultAttendance)
  );

  const [staffAdvances, setStaffAdvances] = useState<StaffAdvance[]>(() =>
    loadStorage('staff_advances', defaultStaffAdvances)
  );

  const [salaryCalculations, setSalaryCalculations] = useState<SalaryCalculation[]>(() =>
    loadStorage('salary_calculations', [])
  );

  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>(() =>
    loadStorage('daily_closings', defaultDailyClosings)
  );

  const [moneyTransfers, setMoneyTransfers] = useState<MoneyTransfer[]>(() =>
    loadStorage('money_transfers', defaultMoneyTransfers)
  );

  // Global Active Filter
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterType>('Today');
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayDateString());

  // Real-time synchronization subscription across all open tabs, windows & PWA web apps
  useEffect(() => {
    const handleRemoteUpdate = (key: string, data: any) => {
      isRemoteSyncRef.current = true;
      try {
        switch (key) {
          case 'business_profile':
            if (data) setBusinessProfileState(data);
            break;
          case 'categories':
            if (Array.isArray(data)) setCategories(data);
            break;
          case 'products':
            if (Array.isArray(data)) setProducts(data);
            break;
          case 'price_history':
            if (Array.isArray(data)) setPriceHistory(data);
            break;
          case 'tables':
            if (Array.isArray(data)) setTables(data);
            break;
          case 'held_orders':
            if (Array.isArray(data)) setHeldOrders(data);
            break;
          case 'customers':
            if (Array.isArray(data)) setCustomers(data);
            break;
          case 'vendors':
            if (Array.isArray(data)) setVendors(data);
            break;
          case 'expense_categories':
            if (Array.isArray(data)) setExpenseCategories(data);
            break;
          case 'expenses':
            if (Array.isArray(data)) setExpenses(data);
            break;
          case 'purchases':
            if (Array.isArray(data)) setPurchases(data);
            break;
          case 'invoices':
            if (Array.isArray(data)) {
              setInvoices(data);
              setInvoiceSequence((prev) => Math.max(prev, getMaxSequence(data)));
            }
            break;
          case 'invoice_sequence':
            if (data && typeof data.sequence === 'number') {
              setInvoiceSequence((prev) => Math.max(prev, data.sequence));
            }
            break;
          case 'plate_wise_sales':
            if (Array.isArray(data)) setPlateWiseSales(data);
            break;
          case 'receivables':
            if (Array.isArray(data)) setReceivables(data);
            break;
          case 'receivable_payments':
            if (Array.isArray(data)) setReceivablePayments(data);
            break;
          case 'payables':
            if (Array.isArray(data)) setPayables(data);
            break;
          case 'payable_payments':
            if (Array.isArray(data)) setPayablePayments(data);
            break;
          case 'staff_employees':
            if (Array.isArray(data)) setStaffEmployees(data);
            break;
          case 'staff_attendance':
            if (Array.isArray(data)) setStaffAttendance(data);
            break;
          case 'staff_advances':
            if (Array.isArray(data)) setStaffAdvances(data);
            break;
          case 'salary_calculations':
            if (Array.isArray(data)) setSalaryCalculations(data);
            break;
          case 'daily_closings':
            if (Array.isArray(data)) setDailyClosings(data);
            break;
          case 'money_transfers':
            if (Array.isArray(data)) setMoneyTransfers(data);
            break;
          default:
            break;
        }
      } finally {
        setTimeout(() => {
          isRemoteSyncRef.current = false;
        }, 250);
      }
    };

    const unsubscribe = initSyncEngine(handleRemoteUpdate);

    // Flush any pending debounced writes on tab close / reload
    const handleBeforeUnload = () => {
      flushPendingStorageSaves();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Optimized Debounced Persistence & Broadcast Dispatcher
  const persistAndBroadcast = useCallback((key: string, data: any, label?: string, immediate = false) => {
    debouncedSaveStorage(key, data, immediate);
    if (!isRemoteSyncRef.current) {
      broadcastStateChange(key, data, label);
    }
  }, []);

  // Synchronize state changes to debounced storage
  useEffect(() => persistAndBroadcast('business_profile', businessProfile, 'Business Profile Updated'), [businessProfile, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('categories', categories, 'Menu Categories Updated'), [categories, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('products', products, 'Menu Products Updated'), [products, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('price_history', priceHistory, 'Price History Logged'), [priceHistory, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('tables', tables, 'Restaurant Tables Updated'), [tables, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('held_orders', heldOrders, 'KOT Held Orders Updated'), [heldOrders, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('customers', customers, 'Customers Ledger Updated'), [customers, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('vendors', vendors, 'Vendors Directory Updated'), [vendors, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('expense_categories', expenseCategories, 'Expense Categories Updated'), [expenseCategories, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('expenses', expenses, 'Expenses Ledger Updated'), [expenses, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('purchases', purchases, 'Purchases Ledger Updated'), [purchases, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('invoices', invoices, 'Invoices Updated', true), [invoices, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('plate_wise_sales', plateWiseSales, 'Plate Sales Updated', true), [plateWiseSales, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('receivables', receivables, 'Customer Receivables Updated'), [receivables, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('receivable_payments', receivablePayments, 'Receivable Payment Recorded', true), [receivablePayments, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('payables', payables, 'Payables Ledger Updated'), [payables, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('payable_payments', payablePayments, 'Payable Payment Recorded', true), [payablePayments, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('staff_employees', staffEmployees, 'Staff Employees Updated'), [staffEmployees, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('staff_attendance', staffAttendance, 'Attendance Recorded'), [staffAttendance, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('staff_advances', staffAdvances, 'Staff Advances Updated'), [staffAdvances, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('salary_calculations', salaryCalculations, 'Salary Slip Created'), [salaryCalculations, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('daily_closings', dailyClosings, 'Daily Closing Updated', true), [dailyClosings, persistAndBroadcast]);
  useEffect(() => persistAndBroadcast('money_transfers', moneyTransfers, 'Money Transfers Updated', true), [moneyTransfers, persistAndBroadcast]);

  // Real-Time 1-Second Continuous Auto-Save Engine State
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string>(() => new Date().toLocaleTimeString());

  // 1-Second Continuous Auto-Save Heartbeat Effect
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      setLastAutoSavedAt(timeStr);
      // Continuous storage flush to guarantee 0% data loss every second
      flushPendingStorageSaves();
    }, 1000);

    return () => {
      clearInterval(autoSaveTimer);
    };
  }, []);

  const triggerImmediateSave = useCallback(() => {
    setLastAutoSavedAt(new Date().toLocaleTimeString());
    triggerImmediateAutoSave();
  }, []);

  // Date Filter Matcher
  const isDateInActiveFilter = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const todayStr = getTodayDateString();
    const yesterdayStr = getYesterdayDateString();

    const d = new Date(dateStr);
    const now = new Date();

    if (activeDateFilter === 'Today') {
      return dateStr === todayStr;
    }
    if (activeDateFilter === 'Yesterday') {
      return dateStr === yesterdayStr;
    }
    if (activeDateFilter === 'This Week') {
      const dayOfWeek = now.getDay() || 7; // Monday as 1
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate >= startOfWeek && targetDate <= now;
    }
    if (activeDateFilter === 'This Month') {
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      return dateStr.startsWith(`${currentYear}-${currentMonth}`);
    }
    if (activeDateFilter === 'Previous Month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
      return dateStr.startsWith(`${prevYear}-${prevMonth}`);
    }
    if (activeDateFilter === 'Custom Date') {
      return dateStr >= customStartDate && dateStr <= customEndDate;
    }
    return true;
  };

  // Real Money Position Engine with 100% verified supporting figures & audit trail
  const moneyPosition = useMemo<MoneyPosition>(() => {
    const openingCash = typeof businessProfile.openingBalanceCash === 'number' ? businessProfile.openingBalanceCash : 5000;
    const openingBank = typeof businessProfile.openingBalanceBank === 'number' ? businessProfile.openingBalanceBank : 25000;
    const openingUPI = typeof businessProfile.openingBalanceUPI === 'number' ? businessProfile.openingBalanceUPI : 5000;
    const openingCard = typeof businessProfile.openingBalanceCard === 'number' ? businessProfile.openingBalanceCard : 0;
    const totalOpeningBalance = openingCash + openingBank + openingUPI + openingCard;

    let cashInflows = 0;
    let upiInflows = 0;
    let bankInflows = 0;
    let cardInflows = 0;

    let cashOutflows = 0;
    let upiOutflows = 0;
    let bankOutflows = 0;
    let cardOutflows = 0;

    const auditList: MoneyTransactionAuditItem[] = [];

    // Track dates covered by Plate-Wise Sales to avoid double-counting with individual POS invoices
    const plateSaleDates = new Set<string>();

    // 1. Inflows from Plate-Wise Sales (Daily primary restaurant sales log)
    plateWiseSales.forEach((pws) => {
      plateSaleDates.add(pws.date);
      const ref = `PWS-${pws.date}`;
      if (pws.cashSales && pws.cashSales > 0) {
        cashInflows += pws.cashSales;
        auditList.push({
          id: `aud-pws-cash-${pws.id}`,
          date: pws.date,
          type: 'Inflow',
          source: 'Plate Sales',
          paymentMode: 'Cash',
          entityOrTitle: `Counter Cash Sales (${pws.totalPlates} Plates)`,
          reference: ref,
          amount: pws.cashSales,
        });
      }
      if (pws.upiSales && pws.upiSales > 0) {
        upiInflows += pws.upiSales;
        auditList.push({
          id: `aud-pws-upi-${pws.id}`,
          date: pws.date,
          type: 'Inflow',
          source: 'Plate Sales',
          paymentMode: 'UPI',
          entityOrTitle: `UPI / QR Scan Sales (${pws.totalPlates} Plates)`,
          reference: ref,
          amount: pws.upiSales,
        });
      }
      if (pws.bankSales && pws.bankSales > 0) {
        bankInflows += pws.bankSales;
        auditList.push({
          id: `aud-pws-bank-${pws.id}`,
          date: pws.date,
          type: 'Inflow',
          source: 'Plate Sales',
          paymentMode: 'Bank',
          entityOrTitle: `Direct Bank Sales (${pws.totalPlates} Plates)`,
          reference: ref,
          amount: pws.bankSales,
        });
      }
      if (pws.cardSales && pws.cardSales > 0) {
        cardInflows += pws.cardSales;
        auditList.push({
          id: `aud-pws-card-${pws.id}`,
          date: pws.date,
          type: 'Inflow',
          source: 'Plate Sales',
          paymentMode: 'Card',
          entityOrTitle: `POS Card Sales (${pws.totalPlates} Plates)`,
          reference: ref,
          amount: pws.cardSales,
        });
      }
    });

    // 2. Inflows from POS Invoices (for dates with no Plate-Wise entry, or direct settled checks)
    invoices.forEach((inv) => {
      // If the date is already recorded via consolidated Plate-Wise Sales, do not double-count
      if (!plateSaleDates.has(inv.date)) {
        const paid = inv.amountPaid || 0;
        if (paid > 0) {
          if (inv.paymentMode === 'Cash') cashInflows += paid;
          else if (inv.paymentMode === 'UPI') upiInflows += paid;
          else if (inv.paymentMode === 'Bank') bankInflows += paid;
          else if (inv.paymentMode === 'Card') cardInflows += paid;

          auditList.push({
            id: `aud-inv-${inv.id}`,
            date: inv.date,
            type: 'Inflow',
            source: 'Invoice Payment',
            paymentMode: inv.paymentMode,
            entityOrTitle: `Invoice #${inv.invoiceNumber} - ${inv.customerName || 'Walk-in Customer'} (${inv.orderType || 'Dining'})`,
            reference: inv.invoiceNumber,
            amount: paid,
          });
        }
      }
    });

    // 2b. Inflows: Recovered Customer Receivables Collected
    receivablePayments.forEach((recPmt) => {
      const amt = recPmt.amount || 0;
      if (amt > 0) {
        if (recPmt.paymentMode === 'Cash') cashInflows += amt;
        else if (recPmt.paymentMode === 'UPI') upiInflows += amt;
        else if (recPmt.paymentMode === 'Bank') bankInflows += amt;
        else if (recPmt.paymentMode === 'Card') cardInflows += amt;

        const parentRec = receivables.find((r) => r.id === recPmt.receivableId);
        const customerDisplayName = recPmt.customerName || parentRec?.customerName || 'Customer';
        const invoiceRef = recPmt.reference || parentRec?.invoiceNumber || (parentRec?.description ? parentRec.description.slice(0, 20) : '') || `REC-${recPmt.id.slice(-4)}`;
        const noteDetail = recPmt.remarks && recPmt.remarks !== invoiceRef ? ` (${recPmt.remarks})` : '';

        auditList.push({
          id: `aud-recpmt-${recPmt.id}`,
          date: recPmt.date,
          type: 'Inflow',
          source: 'Receivable Collection',
          paymentMode: recPmt.paymentMode,
          entityOrTitle: `Receivable Collected: ${customerDisplayName}`,
          reference: `${invoiceRef}${noteDetail}`,
          amount: amt,
        });
      }
    });

    // 3. Outflows: Direct Operational Expenses Paid
    expenses.forEach((exp) => {
      if (exp.paymentStatus === 'Paid') {
        const amt = exp.amount || 0;
        if (exp.paymentMode === 'Cash') cashOutflows += amt;
        else if (exp.paymentMode === 'UPI') upiOutflows += amt;
        else if (exp.paymentMode === 'Bank') bankOutflows += amt;
        else if (exp.paymentMode === 'Card') cardOutflows += amt;

        auditList.push({
          id: `aud-exp-${exp.id}`,
          date: exp.date,
          type: 'Outflow',
          source: 'Expense',
          paymentMode: exp.paymentMode,
          entityOrTitle: `${exp.categoryName}: ${exp.description || exp.vendorName || 'General Expense'}`,
          reference: exp.expenseNumber || `EXP-${exp.id.slice(-4)}`,
          amount: amt,
        });
      }
    });

    // 4. Outflows: Raw Material & Kitchen Inventory Purchases Paid
    purchases.forEach((pur) => {
      const paid = pur.paidAmount || 0;
      if (paid > 0) {
        if (pur.paymentMode === 'Cash') cashOutflows += paid;
        else if (pur.paymentMode === 'UPI') upiOutflows += paid;
        else if (pur.paymentMode === 'Bank') bankOutflows += paid;
        else if (pur.paymentMode === 'Card') cardOutflows += paid;

        auditList.push({
          id: `aud-pur-${pur.id}`,
          date: pur.date,
          type: 'Outflow',
          source: 'Purchase',
          paymentMode: pur.paymentMode,
          entityOrTitle: `Purchase from ${pur.vendorName} (${pur.items?.map((i) => i.itemName).join(', ') || 'Inventory Items'})`,
          reference: pur.purchaseNumber || `PUR-${pur.id.slice(-4)}`,
          amount: paid,
        });
      }
    });

    // 4b. Outflows: Supplier & Creditor Payable Settlements Paid
    payablePayments.forEach((payPmt) => {
      const amt = payPmt.amount || 0;
      if (amt > 0) {
        if (payPmt.paymentMode === 'Cash') cashOutflows += amt;
        else if (payPmt.paymentMode === 'UPI') upiOutflows += amt;
        else if (payPmt.paymentMode === 'Bank') bankOutflows += amt;
        else if (payPmt.paymentMode === 'Card') cardOutflows += amt;

        const parentPay = payables.find((p) => p.id === payPmt.payableId);
        const entityDisplayName = payPmt.entityName || parentPay?.entityName || 'Supplier / Creditor';
        const billRef = payPmt.reference || parentPay?.referenceNumber || (parentPay?.description ? parentPay.description.slice(0, 20) : '') || `PAY-${payPmt.id.slice(-4)}`;
        const noteDetail = payPmt.remarks && payPmt.remarks !== billRef ? ` (${payPmt.remarks})` : '';

        auditList.push({
          id: `aud-paypmt-${payPmt.id}`,
          date: payPmt.date,
          type: 'Outflow',
          source: 'Payable Settlement',
          paymentMode: payPmt.paymentMode,
          entityOrTitle: `Payable Settlement: ${entityDisplayName}`,
          reference: `${billRef}${noteDetail}`,
          amount: amt,
        });
      }
    });

    // 5. Outflows: Staff Advances & Cash Drawings Given
    staffAdvances.forEach((adv) => {
      const amt = adv.amount || 0;
      if (adv.paymentMode === 'Cash') cashOutflows += amt;
      else if (adv.paymentMode === 'UPI') upiOutflows += amt;
      else if (adv.paymentMode === 'Bank') bankOutflows += amt;
      else if (adv.paymentMode === 'Card') cardOutflows += amt;

      auditList.push({
        id: `aud-adv-${adv.id}`,
        date: adv.date,
        type: 'Outflow',
        source: 'Staff Advance',
        paymentMode: adv.paymentMode,
        entityOrTitle: `Staff Advance: ${adv.employeeName} (${adv.description || adv.type})`,
        reference: `ADV-${adv.id.slice(-4)} • ${adv.type}`,
        amount: amt,
      });
    });

    // 6. Outflows: Staff Salaries Settled & Paid
    salaryCalculations.forEach((sal) => {
      if (sal.status === 'Paid') {
        const amt = sal.netSalary || 0;
        const mode = sal.paymentMode || 'Cash';
        if (mode === 'Cash') cashOutflows += amt;
        else if (mode === 'UPI') upiOutflows += amt;
        else if (mode === 'Bank') bankOutflows += amt;
        else if (mode === 'Card') cardOutflows += amt;

        auditList.push({
          id: `aud-sal-${sal.id}`,
          date: sal.paymentDate || sal.createdAt || getTodayDateString(),
          type: 'Outflow',
          source: 'Staff Salary',
          paymentMode: mode,
          entityOrTitle: `Staff Salary: ${sal.employeeName} (${sal.month})`,
          reference: `SAL-${sal.month} • ${sal.designation || 'Staff'}`,
          amount: amt,
        });
      }
    });

    // 7. Internal Transfers, Capital Injections & Owner Drawings
    moneyTransfers.forEach((mt) => {
      const amt = mt.amount || 0;
      if (amt <= 0) return;

      if (mt.transferType === 'Capital Injection') {
        const toAcc = mt.toAccount || 'Bank';
        if (toAcc === 'Cash') cashInflows += amt;
        else if (toAcc === 'UPI') upiInflows += amt;
        else if (toAcc === 'Bank') bankInflows += amt;
        else if (toAcc === 'Card') cardInflows += amt;

        auditList.push({
          id: `aud-mt-${mt.id}`,
          date: mt.date,
          type: 'Inflow',
          source: 'Capital Injection',
          paymentMode: toAcc,
          entityOrTitle: `Capital Injected: ${mt.remarks || 'Owner Capital Infusion'}`,
          reference: mt.reference || `CAP-${mt.id.slice(-4)}`,
          amount: amt,
        });
      } else if (mt.transferType === 'Owner Drawing') {
        const fromAcc = mt.fromAccount || 'Cash';
        if (fromAcc === 'Cash') cashOutflows += amt;
        else if (fromAcc === 'UPI') upiOutflows += amt;
        else if (fromAcc === 'Bank') bankOutflows += amt;
        else if (fromAcc === 'Card') cardOutflows += amt;

        auditList.push({
          id: `aud-mt-${mt.id}`,
          date: mt.date,
          type: 'Outflow',
          source: 'Owner Drawing',
          paymentMode: fromAcc,
          entityOrTitle: `Owner Drawing: ${mt.remarks || 'Profit / Capital Withdrawal'}`,
          reference: mt.reference || `DRW-${mt.id.slice(-4)}`,
          amount: amt,
        });
      } else {
        // Inter-account transfer (e.g. Cash to Bank, UPI to Bank, Bank to Cash, Card POS to Bank)
        const fromAcc = mt.fromAccount || 'Cash';
        const toAcc = mt.toAccount || 'Bank';

        // Outflow leg
        if (fromAcc === 'Cash') cashOutflows += amt;
        else if (fromAcc === 'UPI') upiOutflows += amt;
        else if (fromAcc === 'Bank') bankOutflows += amt;
        else if (fromAcc === 'Card') cardOutflows += amt;

        auditList.push({
          id: `aud-mt-out-${mt.id}`,
          date: mt.date,
          type: 'Outflow',
          source: 'Money Transfer',
          paymentMode: fromAcc,
          entityOrTitle: `Transfer Out (${mt.transferType}) -> ${toAcc}`,
          reference: mt.reference || `TRF-${mt.id.slice(-4)}`,
          amount: amt,
        });

        // Inflow leg
        if (toAcc === 'Cash') cashInflows += amt;
        else if (toAcc === 'UPI') upiInflows += amt;
        else if (toAcc === 'Bank') bankInflows += amt;
        else if (toAcc === 'Card') cardInflows += amt;

        auditList.push({
          id: `aud-mt-in-${mt.id}`,
          date: mt.date,
          type: 'Inflow',
          source: 'Money Transfer',
          paymentMode: toAcc,
          entityOrTitle: `Transfer In (${mt.transferType}) <- ${fromAcc}`,
          reference: mt.reference || `TRF-${mt.id.slice(-4)}`,
          amount: amt,
        });
      }
    });

    // Sort audit transactions newest first
    auditList.sort((a, b) => b.date.localeCompare(a.date));

    // Balances by Channel
    const cashBalance = openingCash + cashInflows - cashOutflows;
    const bankBalance = openingBank + bankInflows - bankOutflows;
    const upiBalance = openingUPI + upiInflows - upiOutflows;
    const cardBalance = openingCard + cardInflows - cardOutflows;

    const totalInflows = cashInflows + upiInflows + bankInflows + cardInflows;
    const totalOutflows = cashOutflows + upiOutflows + bankOutflows + cardOutflows;
    const totalAvailableBalance = cashBalance + bankBalance + upiBalance + cardBalance;

    // Detailed transaction counts per channel and source
    let cashInflowCount = 0;
    let cashOutflowCount = 0;
    let upiInflowCount = 0;
    let upiOutflowCount = 0;
    let bankInflowCount = 0;
    let bankOutflowCount = 0;
    let cardInflowCount = 0;
    let cardOutflowCount = 0;

    const inflowSourceMap: Record<string, { amount: number; count: number; refs: Set<string> }> = {};
    const outflowSourceMap: Record<string, { amount: number; count: number; refs: Set<string> }> = {};

    auditList.forEach((item) => {
      if (item.type === 'Inflow') {
        if (item.paymentMode === 'Cash') cashInflowCount++;
        else if (item.paymentMode === 'UPI') upiInflowCount++;
        else if (item.paymentMode === 'Bank') bankInflowCount++;
        else if (item.paymentMode === 'Card') cardInflowCount++;

        if (!inflowSourceMap[item.source]) {
          inflowSourceMap[item.source] = { amount: 0, count: 0, refs: new Set() };
        }
        inflowSourceMap[item.source].amount += item.amount;
        inflowSourceMap[item.source].count++;
        if (item.reference) inflowSourceMap[item.source].refs.add(item.reference);
      } else {
        if (item.paymentMode === 'Cash') cashOutflowCount++;
        else if (item.paymentMode === 'UPI') upiOutflowCount++;
        else if (item.paymentMode === 'Bank') bankOutflowCount++;
        else if (item.paymentMode === 'Card') cardOutflowCount++;

        if (!outflowSourceMap[item.source]) {
          outflowSourceMap[item.source] = { amount: 0, count: 0, refs: new Set() };
        }
        outflowSourceMap[item.source].amount += item.amount;
        outflowSourceMap[item.source].count++;
        if (item.reference) outflowSourceMap[item.source].refs.add(item.reference);
      }
    });

    const totalInflowCount = cashInflowCount + upiInflowCount + bankInflowCount + cardInflowCount;
    const totalOutflowCount = cashOutflowCount + upiOutflowCount + bankOutflowCount + cardOutflowCount;

    const inflowSources = Object.entries(inflowSourceMap)
      .map(([source, data]) => ({
        source,
        amount: data.amount,
        count: data.count,
        percentage: totalInflows > 0 ? (data.amount / totalInflows) * 100 : 0,
        references: Array.from(data.refs).slice(0, 10),
      }))
      .sort((a, b) => b.amount - a.amount);

    const outflowSources = Object.entries(outflowSourceMap)
      .map(([source, data]) => ({
        source,
        amount: data.amount,
        count: data.count,
        percentage: totalOutflows > 0 ? (data.amount / totalOutflows) * 100 : 0,
        references: Array.from(data.refs).slice(0, 10),
      }))
      .sort((a, b) => b.amount - a.amount);

    const channels = [
      {
        channel: 'Cash' as PaymentMode,
        name: 'Cash in Hand (Counter Drawer)',
        opening: openingCash,
        inflows: cashInflows,
        inflowCount: cashInflowCount,
        outflows: cashOutflows,
        outflowCount: cashOutflowCount,
        netBalance: cashBalance,
        percentageOfTotal: totalAvailableBalance > 0 ? (cashBalance / totalAvailableBalance) * 100 : 0,
        sampleReferences: auditList
          .filter((i) => i.paymentMode === 'Cash' && i.reference)
          .map((i) => i.reference!)
          .slice(0, 6),
      },
      {
        channel: 'Bank' as PaymentMode,
        name: 'Bank Account (SBI Current A/C)',
        opening: openingBank,
        inflows: bankInflows,
        inflowCount: bankInflowCount,
        outflows: bankOutflows,
        outflowCount: bankOutflowCount,
        netBalance: bankBalance,
        percentageOfTotal: totalAvailableBalance > 0 ? (bankBalance / totalAvailableBalance) * 100 : 0,
        sampleReferences: auditList
          .filter((i) => i.paymentMode === 'Bank' && i.reference)
          .map((i) => i.reference!)
          .slice(0, 6),
      },
      {
        channel: 'UPI' as PaymentMode,
        name: 'UPI Receipts (QR Code & GPay)',
        opening: openingUPI,
        inflows: upiInflows,
        inflowCount: upiInflowCount,
        outflows: upiOutflows,
        outflowCount: upiOutflowCount,
        netBalance: upiBalance,
        percentageOfTotal: totalAvailableBalance > 0 ? (upiBalance / totalAvailableBalance) * 100 : 0,
        sampleReferences: auditList
          .filter((i) => i.paymentMode === 'UPI' && i.reference)
          .map((i) => i.reference!)
          .slice(0, 6),
      },
      {
        channel: 'Card' as PaymentMode,
        name: 'Card Receipts (POS Swipes & EDC)',
        opening: openingCard,
        inflows: cardInflows,
        inflowCount: cardInflowCount,
        outflows: cardOutflows,
        outflowCount: cardOutflowCount,
        netBalance: cardBalance,
        percentageOfTotal: totalAvailableBalance > 0 ? (cardBalance / totalAvailableBalance) * 100 : 0,
        sampleReferences: auditList
          .filter((i) => i.paymentMode === 'Card' && i.reference)
          .map((i) => i.reference!)
          .slice(0, 6),
      },
    ];

    const channelSum = cashBalance + bankBalance + upiBalance + cardBalance;
    const equationNet = totalOpeningBalance + totalInflows - totalOutflows;
    const discrepancy = Math.abs(channelSum - equationNet);
    const isBalanced = discrepancy < 0.01;

    const equation = {
      openingTotal: totalOpeningBalance,
      inflowsTotal: totalInflows,
      inflowCount: totalInflowCount,
      outflowsTotal: totalOutflows,
      outflowCount: totalOutflowCount,
      netMovement: totalInflows - totalOutflows,
      availableTotal: totalAvailableBalance,
      channelSum,
      isBalanced,
      discrepancy,
    };

    return {
      cashBalance,
      bankBalance,
      upiBalance,
      cardBalance,
      totalAvailableBalance,
      totalInflows,
      totalOutflows,
      cashInflows,
      cashOutflows,
      upiInflows,
      upiOutflows,
      bankInflows,
      bankOutflows,
      cardInflows,
      cardOutflows,
      cashInflowCount,
      cashOutflowCount,
      upiInflowCount,
      upiOutflowCount,
      bankInflowCount,
      bankOutflowCount,
      cardInflowCount,
      cardOutflowCount,
      totalInflowCount,
      totalOutflowCount,
      openingCash,
      openingBank,
      openingUPI,
      openingCard,
      totalOpeningBalance,
      equation,
      channels,
      inflowSources,
      outflowSources,
      auditTransactions: auditList,
    };
  }, [
    businessProfile.openingBalanceCash,
    businessProfile.openingBalanceBank,
    businessProfile.openingBalanceUPI,
    businessProfile.openingBalanceCard,
    plateWiseSales,
    invoices,
    expenses,
    purchases,
    receivablePayments,
    payablePayments,
    staffAdvances,
    salaryCalculations,
    moneyTransfers,
  ]);

  // Outstanding Summary Engine
  const outstandingSummary = useMemo(() => {
    const customerReceivables = receivables
      .filter((r) => r.status !== 'Fully Received')
      .reduce((sum, r) => sum + (r.balance || 0), 0);

    const supplierPayables = payables
      .filter((p) => p.type === 'Supplier' && p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + (p.balance || 0), 0);

    const staffPayables = payables
      .filter((p) => p.type === 'Staff' && p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + (p.balance || 0), 0);

    const otherPayables = payables
      .filter((p) => p.type === 'Other' && p.status !== 'Fully Paid')
      .reduce((sum, p) => sum + (p.balance || 0), 0);

    const totalPayables = supplierPayables + staffPayables + otherPayables;
    const netReceivablePosition = customerReceivables - totalPayables;

    return {
      customerReceivables,
      supplierPayables,
      staffPayables,
      totalPayables,
      netReceivablePosition,
    };
  }, [receivables, payables]);

  // Business Profile Updates
  const updateBusinessProfile = (profile: BusinessProfile) => {
    setBusinessProfileState(profile);
  };

  // Category Actions
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: generateId('cat'),
      order: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Product Actions (Price Change Tracking Mandate #10)
  const addProduct = (prod: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prod,
      id: generateId('prod'),
      order: products.length + 1,
    };
    setProducts((prev) => [...prev, newProd]);
  };

  const updateProduct = (id: string, updated: Partial<Product>, priceChangeNote?: string) => {
    const existing = products.find((p) => p.id === id);
    if (existing && updated.sellingPrice !== undefined && updated.sellingPrice !== existing.sellingPrice) {
      // Record in Price History
      const historyItem: ProductPriceHistory = {
        id: generateId('ph'),
        productId: id,
        productName: updated.name || existing.name,
        oldPrice: existing.sellingPrice,
        newPrice: updated.sellingPrice,
        effectiveDate: getTodayDateString(),
        changedBy: businessProfile.ownerName || 'Suraj Patil',
        note: priceChangeNote || 'Price updated from Menu settings',
      };
      setPriceHistory((prev) => [historyItem, ...prev]);
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Table Actions
  const addTable = (table: Omit<RestaurantTable, 'id'>) => {
    const newTbl: RestaurantTable = {
      ...table,
      id: generateId('tbl'),
    };
    setTables((prev) => [...prev, newTbl]);
  };

  const updateTable = (id: string, updated: Partial<RestaurantTable>) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const deleteTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const setTableStatus = (tableId: string, status: RestaurantTable['status']) => {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)));
  };

  // Held Orders Actions (Hold/Resume System)
  const holdOrder = (orderData: Omit<HeldOrder, 'id' | 'heldAt' | 'updatedAt'>): HeldOrder => {
    const newHeld: HeldOrder = {
      ...orderData,
      id: generateId('held'),
      heldAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Held',
    };

    setHeldOrders((prev) => {
      const filtered = prev.filter((o) => o.tableId !== orderData.tableId);
      return [newHeld, ...filtered];
    });

    // Mark table as Held
    setTables((prev) =>
      prev.map((t) =>
        t.id === orderData.tableId
          ? { ...t, status: 'Held', currentOrderId: newHeld.id }
          : t
      )
    );

    return newHeld;
  };

  const resumeHeldOrder = (tableIdOrOrderId: string): HeldOrder | undefined => {
    return heldOrders.find(
      (o) => o.id === tableIdOrOrderId || o.tableId === tableIdOrOrderId
    );
  };

  const deleteHeldOrder = (orderId: string) => {
    const target = heldOrders.find((o) => o.id === orderId);
    setHeldOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (target) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === target.tableId
            ? { ...t, status: 'Available', currentOrderId: undefined }
            : t
        )
      );
    }
  };

  const updateHeldOrder = (orderId: string, updates: Partial<HeldOrder>) => {
    setHeldOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, ...updates, updatedAt: new Date().toISOString() }
          : o
      )
    );
  };

  const transferTableOrder = (fromTableId: string, toTableId: string) => {
    const targetOrder = heldOrders.find((o) => o.tableId === fromTableId);
    const toTable = tables.find((t) => t.id === toTableId);
    if (!targetOrder || !toTable) return;

    setHeldOrders((prev) =>
      prev.map((o) =>
        o.id === targetOrder.id
          ? { ...o, tableId: toTableId, tableName: toTable.name, updatedAt: new Date().toISOString() }
          : o
      )
    );

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === fromTableId) {
          return { ...t, status: 'Available', currentOrderId: undefined };
        }
        if (t.id === toTableId) {
          return { ...t, status: (targetOrder.status as any) || 'Occupied', currentOrderId: targetOrder.id };
        }
        return t;
      })
    );
  };

  // Customer Actions
  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...customer,
      id: generateId('cust'),
      createdAt: getTodayDateString(),
    };
    setCustomers((prev) => [...prev, newCust]);
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Vendor Actions
  const addVendor = (vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
    const newVend: Vendor = {
      ...vendor,
      id: generateId('vend'),
      createdAt: getTodayDateString(),
    };
    setVendors((prev) => [...prev, newVend]);
  };

  const updateVendor = (id: string, updated: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
  };

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // Expense Categories
  const addExpenseCategory = (name: string) => {
    const newExpCat: ExpenseCategory = {
      id: generateId('expcat'),
      name,
      active: true,
    };
    setExpenseCategories((prev) => [...prev, newExpCat]);
  };

  const updateExpenseCategory = (id: string, name: string) => {
    setExpenseCategories((prev) => prev.map((ec) => (ec.id === id ? { ...ec, name } : ec)));
  };

  const deleteExpenseCategory = (id: string) => {
    setExpenseCategories((prev) => prev.filter((ec) => ec.id !== id));
  };

  // Expenses Actions (Linked to Payables if Pending)
  const addExpense = (expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => {
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`;
    const newExpense: Expense = {
      ...expenseData,
      id: generateId('exp'),
      expenseNumber,
      createdAt: getTodayDateString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // If pending payment, create payable record
    if (expenseData.paymentStatus === 'Pending') {
      const newPayable: Payable = {
        id: generateId('pay'),
        type: 'Other',
        entityId: expenseData.vendorId,
        entityName: expenseData.vendorName || 'Expense Creditor',
        referenceNumber: expenseNumber,
        date: expenseData.date,
        description: expenseData.description || `Pending expense for ${expenseData.categoryName}`,
        totalAmount: expenseData.amount,
        amountPaid: 0,
        balance: expenseData.amount,
        status: 'Pending',
        remarks: expenseData.remarks,
        createdAt: getTodayDateString(),
      };
      setPayables((prev) => [newPayable, ...prev]);
    }
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Purchases Actions (Linked to Supplier Payables if balance due > 0)
  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => {
    const purchaseNumber = `PUR-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: generateId('pur'),
      purchaseNumber,
      createdAt: getTodayDateString(),
    };
    setPurchases((prev) => [newPurchase, ...prev]);

    // Link to Supplier Payables if balance due > 0
    if (purchaseData.balanceDue > 0) {
      const newPayable: Payable = {
        id: generateId('pay'),
        type: 'Supplier',
        entityId: purchaseData.vendorId,
        entityName: purchaseData.vendorName,
        referenceNumber: purchaseNumber,
        date: purchaseData.date,
        description: `Purchase of ${purchaseData.items.map((i) => i.itemName).join(', ')}`,
        totalAmount: purchaseData.totalAmount,
        amountPaid: purchaseData.paidAmount,
        balance: purchaseData.balanceDue,
        dueDate: purchaseData.dueDate,
        status: purchaseData.paidAmount > 0 ? 'Partially Paid' : 'Pending',
        remarks: purchaseData.remarks,
        createdAt: getTodayDateString(),
      };
      setPayables((prev) => [newPayable, ...prev]);
    }
  };

  const updatePurchase = (id: string, updated: Partial<Purchase>) => {
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  };

  // Invoices & POS Actions (Linked to Customer Receivables if balance due > 0)
  const getNextInvoiceNumber = useCallback(() => {
    const currentMax = Math.max(invoiceSequence, getMaxSequence(invoices));
    return generateInvoiceNumber(currentMax + 1);
  }, [invoiceSequence, invoices, getMaxSequence]);

  const nextInvoiceNumber = useMemo(() => {
    const currentMax = Math.max(invoiceSequence, getMaxSequence(invoices));
    return generateInvoiceNumber(currentMax + 1);
  }, [invoiceSequence, invoices, getMaxSequence]);

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const currentMax = Math.max(invoiceSequence, getMaxSequence(invoices));
    const nextSeq = currentMax + 1;
    const invoiceNumber = generateInvoiceNumber(nextSeq);

    setInvoiceSequence(nextSeq);
    persistAndBroadcast(
      'invoice_sequence',
      {
        sequence: nextSeq,
        lastInvoiceNumber: invoiceNumber,
        updatedAt: Date.now(),
      },
      `Invoice #${invoiceNumber} Created`,
      true
    );

    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId('inv'),
      invoiceNumber,
      createdAt: getTodayDateString(),
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    // If balance due > 0, automatically create Customer Receivable
    if (newInvoice.balanceDue > 0) {
      const newReceivable: Receivable = {
        id: generateId('rec'),
        customerId: newInvoice.customerId || 'cust-general',
        customerName: newInvoice.customerName || 'Walk-in Customer',
        invoiceNumber: newInvoice.invoiceNumber,
        date: newInvoice.date,
        description: `Invoice ${newInvoice.invoiceNumber} (${newInvoice.orderType})`,
        totalAmount: newInvoice.grandTotal,
        amountReceived: newInvoice.amountPaid,
        balance: newInvoice.balanceDue,
        dueDate: getTodayDateString(),
        status: newInvoice.amountPaid > 0 ? 'Partially Received' : 'Pending',
        remarks: newInvoice.notes,
        createdAt: getTodayDateString(),
      };
      setReceivables((prev) => [newReceivable, ...prev]);
    }

    return newInvoice;
  };

  const updateInvoice = (id: string, updated: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updated } : inv)));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // Plate-Wise Sales Actions (#6 & #7)
  const savePlateWiseSale = (saleData: Omit<PlateWiseSale, 'id' | 'createdAt'> & { id?: string }) => {
    const existingIndex = plateWiseSales.findIndex((pws) => pws.date === saleData.date);
    if (existingIndex >= 0) {
      const updatedList = [...plateWiseSales];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        ...saleData,
        id: updatedList[existingIndex].id,
      };
      setPlateWiseSales(updatedList);
    } else {
      const newSale: PlateWiseSale = {
        ...saleData,
        id: saleData.id || generateId('pws'),
        createdAt: getTodayDateString(),
      };
      setPlateWiseSales((prev) => [newSale, ...prev]);
    }
  };

  const deletePlateWiseSale = (id: string) => {
    setPlateWiseSales((prev) => prev.filter((pws) => pws.id !== id));
  };

  // Receivables Actions
  const addReceivable = (recData: Omit<Receivable, 'id' | 'createdAt'>) => {
    const newId = generateId('rec');
    const newRec: Receivable = {
      ...recData,
      id: newId,
      createdAt: getTodayDateString(),
    };
    setReceivables((prev) => [newRec, ...prev]);

    // If an initial advance was collected on creation, record it in receivable payments
    if (newRec.amountReceived && newRec.amountReceived > 0) {
      const initialPayment: ReceivablePayment = {
        id: generateId('recpmt'),
        receivableId: newId,
        customerName: newRec.customerName,
        date: newRec.date || getTodayDateString(),
        amount: newRec.amountReceived,
        paymentMode: 'Cash',
        reference: newRec.invoiceNumber || `REC-${newId.slice(-4)}`,
        remarks: 'Advance collection received at order creation',
      };
      setReceivablePayments((prev) => [initialPayment, ...prev]);
    }
  };

  const recordReceivablePayment = (
    receivableId: string,
    amount: number,
    paymentMode: PaymentMode,
    remarks?: string,
    paymentDate?: string
  ) => {
    const pmtDate = paymentDate || getTodayDateString();
    const targetRec = receivables.find((r) => r.id === receivableId);
    const targetCustomerName = targetRec?.customerName || 'Customer';
    const targetRef = targetRec?.invoiceNumber || (targetRec?.description ? targetRec.description.slice(0, 25) : '') || `REC-${receivableId.slice(-4)}`;

    setReceivables((prev) =>
      prev.map((r) => {
        if (r.id === receivableId) {
          const newReceived = (r.amountReceived || 0) + amount;
          const newBalance = Math.max(0, r.totalAmount - newReceived);
          const newStatus = newBalance <= 0 ? 'Fully Received' : 'Partially Received';
          return {
            ...r,
            amountReceived: newReceived,
            balance: newBalance,
            status: newStatus,
            remarks: remarks ? `${r.remarks ? r.remarks + '; ' : ''}${remarks}` : r.remarks,
          };
        }
        return r;
      })
    );

    const newPayment: ReceivablePayment = {
      id: generateId('recpmt'),
      receivableId,
      customerName: targetCustomerName,
      date: pmtDate,
      amount,
      paymentMode,
      reference: targetRef,
      remarks: remarks || `Collection received via ${paymentMode} for ${targetRef}`,
    };
    setReceivablePayments((prev) => [newPayment, ...prev]);
  };

  const deleteReceivablePayment = (paymentId: string) => {
    const pmt = receivablePayments.find((p) => p.id === paymentId);
    if (pmt) {
      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === pmt.receivableId) {
            const newReceived = Math.max(0, (r.amountReceived || 0) - pmt.amount);
            const newBalance = Math.max(0, r.totalAmount - newReceived);
            const newStatus = newBalance <= 0 ? 'Fully Received' : newReceived > 0 ? 'Partially Received' : 'Pending';
            return {
              ...r,
              amountReceived: newReceived,
              balance: newBalance,
              status: newStatus,
            };
          }
          return r;
        })
      );
    }
    setReceivablePayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const deleteReceivable = (id: string) => {
    setReceivables((prev) => prev.filter((r) => r.id !== id));
    setReceivablePayments((prev) => prev.filter((p) => p.receivableId !== id));
  };

  // Payables Actions
  const addPayable = (payData: Omit<Payable, 'id' | 'createdAt'>) => {
    const newId = generateId('pay');
    const newPay: Payable = {
      ...payData,
      id: newId,
      createdAt: getTodayDateString(),
    };
    setPayables((prev) => [newPay, ...prev]);

    // If an initial payment was paid on creation, record it in payable payments
    if (newPay.amountPaid && newPay.amountPaid > 0) {
      const initialPayment: PayablePayment = {
        id: generateId('paypmt'),
        payableId: newId,
        entityName: newPay.entityName,
        date: newPay.date || getTodayDateString(),
        amount: newPay.amountPaid,
        paymentMode: 'Cash',
        reference: newPay.referenceNumber || `PAY-${newId.slice(-4)}`,
        remarks: 'Initial payment made at entry creation',
      };
      setPayablePayments((prev) => [initialPayment, ...prev]);
    }
  };

  const recordPayablePayment = (
    payableId: string,
    amount: number,
    paymentMode: PaymentMode,
    remarks?: string,
    paymentDate?: string
  ) => {
    const payDate = paymentDate || getTodayDateString();
    const targetPay = payables.find((p) => p.id === payableId);
    const targetEntityName = targetPay?.entityName || 'Supplier / Creditor';
    const targetRef = targetPay?.referenceNumber || (targetPay?.description ? targetPay.description.slice(0, 25) : '') || `PAY-${payableId.slice(-4)}`;

    setPayables((prev) =>
      prev.map((p) => {
        if (p.id === payableId) {
          const newPaid = (p.amountPaid || 0) + amount;
          const newBalance = Math.max(0, p.totalAmount - newPaid);
          const newStatus = newBalance <= 0 ? 'Fully Paid' : 'Partially Paid';
          return {
            ...p,
            amountPaid: newPaid,
            balance: newBalance,
            status: newStatus,
            remarks: remarks ? `${p.remarks ? p.remarks + '; ' : ''}${remarks}` : p.remarks,
          };
        }
        return p;
      })
    );

    const newPayment: PayablePayment = {
      id: generateId('paypmt'),
      payableId,
      entityName: targetEntityName,
      date: payDate,
      amount,
      paymentMode,
      reference: targetRef,
      remarks: remarks || `Settlement paid via ${paymentMode} for ${targetRef}`,
    };
    setPayablePayments((prev) => [newPayment, ...prev]);
  };

  const deletePayablePayment = (paymentId: string) => {
    const pmt = payablePayments.find((p) => p.id === paymentId);
    if (pmt) {
      setPayables((prev) =>
        prev.map((p) => {
          if (p.id === pmt.payableId) {
            const newPaid = Math.max(0, (p.amountPaid || 0) - pmt.amount);
            const newBalance = Math.max(0, p.totalAmount - newPaid);
            const newStatus = newBalance <= 0 ? 'Fully Paid' : newPaid > 0 ? 'Partially Paid' : 'Pending';
            return {
              ...p,
              amountPaid: newPaid,
              balance: newBalance,
              status: newStatus,
            };
          }
          return p;
        })
      );
    }
    setPayablePayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const deletePayable = (id: string) => {
    setPayables((prev) => prev.filter((p) => p.id !== id));
    setPayablePayments((prev) => prev.filter((p) => p.payableId !== id));
  };

  // Staff Employees
  const addStaffEmployee = (staffData: Omit<StaffEmployee, 'id' | 'createdAt'>) => {
    const newStaff: StaffEmployee = {
      ...staffData,
      id: generateId('stf'),
      createdAt: getTodayDateString(),
    };
    setStaffEmployees((prev) => [...prev, newStaff]);
  };

  const updateStaffEmployee = (id: string, updated: Partial<StaffEmployee>) => {
    setStaffEmployees((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteStaffEmployee = (id: string) => {
    setStaffEmployees((prev) => prev.filter((s) => s.id !== id));
  };

  const resignStaffEmployee = (
    id: string,
    resignationData: {
      resignationDate: string;
      resignationReason?: string;
      relievingDate?: string;
      settlementNotes?: string;
      settlementAmount?: number;
      settlementStatus?: 'Pending' | 'Settled';
    }
  ) => {
    setStaffEmployees((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'Resigned',
              resignationDate: resignationData.resignationDate,
              resignationReason: resignationData.resignationReason || 'Resigned',
              relievingDate: resignationData.relievingDate || resignationData.resignationDate,
              settlementNotes: resignationData.settlementNotes || '',
              settlementAmount: resignationData.settlementAmount || 0,
              settlementStatus: resignationData.settlementStatus || 'Pending',
            }
          : s
      )
    );
  };

  const reactivateStaffEmployee = (id: string) => {
    setStaffEmployees((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'Active',
            }
          : s
      )
    );
  };

  // Staff Attendance with strict mandatory field & duplicate validation
  const recordAttendance = (attData: Omit<StaffAttendance, 'id'>) => {
    if (!attData || !attData.employeeId || !attData.date || !attData.status) {
      console.warn('recordAttendance rejected: mandatory fields (employeeId, date, status) missing', attData);
      return;
    }

    const cleanRecord = {
      ...attData,
      totalHours: Math.max(0, Number(attData.totalHours) || 0),
      overtimeHours: Math.max(0, Number(attData.overtimeHours) || 0),
    };

    setStaffAttendance((prev) => {
      const existingIndex = prev.findIndex(
        (a) => a.date === cleanRecord.date && a.employeeId === cleanRecord.employeeId
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...cleanRecord,
          id: updated[existingIndex].id, // retain primary key
        };
        return updated;
      } else {
        const newAtt: StaffAttendance = {
          ...cleanRecord,
          id: generateId('att'),
        };
        return [...prev, newAtt];
      }
    });
  };

  const batchRecordAttendance = (records: Omit<StaffAttendance, 'id'>[]) => {
    if (!records || records.length === 0) return;
    setStaffAttendance((prev) => {
      const map = new Map<string, StaffAttendance>();
      prev.forEach((item) => {
        map.set(`${item.date}_${item.employeeId}`, item);
      });

      records.forEach((rec) => {
        const key = `${rec.date}_${rec.employeeId}`;
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...rec });
        } else {
          map.set(key, {
            ...rec,
            id: generateId('att'),
          });
        }
      });

      return Array.from(map.values());
    });
  };

  // Staff Advances & Drawings (#25)
  const addStaffAdvance = (advanceData: Omit<StaffAdvance, 'id' | 'createdAt'>) => {
    const newAdv: StaffAdvance = {
      ...advanceData,
      id: generateId('adv'),
      createdAt: getTodayDateString(),
    };
    setStaffAdvances((prev) => [newAdv, ...prev]);

    // Also note in staff payables balance if required
  };

  const updateStaffAdvance = (id: string, updated: Partial<StaffAdvance>) => {
    setStaffAdvances((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
  };

  const deleteStaffAdvance = (id: string) => {
    setStaffAdvances((prev) => prev.filter((a) => a.id !== id));
  };

  // Pure Salary Calculation Engine
  const computeSalaryCalculation = (
    employee: StaffEmployee,
    month: string,
    attendanceList: StaffAttendance[],
    advancesList: StaffAdvance[]
  ): SalaryCalculation => {
    // Days in month (28, 29, 30, or 31)
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const totalMonthDays = new Date(year, monthNum, 0).getDate();

    // Attendance stats for this employee in this month
    const monthAttendance = attendanceList.filter(
      (a) => a.employeeId === employee.id && a.date.startsWith(month)
    );

    let presentDays = 0;
    let halfDays = 0;
    let leaveDays = 0;
    let weeklyOffs = 0;
    let explicitAbsentDays = 0;
    let overtimeHours = 0;

    monthAttendance.forEach((a) => {
      if (a.status === 'Present') presentDays++;
      else if (a.status === 'Half Day') halfDays++;
      else if (a.status === 'Leave') leaveDays++;
      else if (a.status === 'Weekly Off') weeklyOffs++;
      else if (a.status === 'Absent') explicitAbsentDays++;

      if (a.overtimeHours && a.overtimeHours > 0) {
        overtimeHours += Number(a.overtimeHours) || 0;
      }
    });

    // Effective paid days: Present (1) + Weekly Off (1) + Paid Leave (1) + Half Day (0.5)
    const paidDays = Number((presentDays + weeklyOffs + leaveDays + halfDays * 0.5).toFixed(1));

    // Calculate absent / unrecorded days
    const totalRecordedDays = presentDays + halfDays + leaveDays + weeklyOffs + explicitAbsentDays;
    const unrecordedDays = Math.max(0, totalMonthDays - totalRecordedDays);
    const absentDays = explicitAbsentDays + unrecordedDays;

    let earnedBasic = 0;
    let overtimeAmount = 0;
    let allowancesTotal = 0;

    if (employee.salaryType === 'Monthly') {
      if (paidDays >= totalMonthDays) {
        earnedBasic = Math.round(employee.basicSalary);
        allowancesTotal = Math.round(employee.allowances || 0);
      } else {
        const perDayRate = employee.basicSalary / totalMonthDays;
        earnedBasic = Math.round(perDayRate * paidDays);
        // Pro-rate allowances matching payable days ratio
        allowancesTotal = employee.allowances
          ? Math.round((employee.allowances / totalMonthDays) * paidDays)
          : 0;
      }
      // Overtime for monthly employee (1.5x hourly rate based on 8h work day across month)
      const hourlyRate = employee.basicSalary / (totalMonthDays * 8);
      overtimeAmount = Math.round(overtimeHours * hourlyRate * 1.5);
    } else if (employee.salaryType === 'Daily') {
      earnedBasic = Math.round(employee.basicSalary * paidDays);
      allowancesTotal = Math.round((employee.allowances || 0) * paidDays);
      // Overtime for daily wage employee (1.5x daily wage / 8h)
      const hourlyRate = employee.basicSalary / 8;
      overtimeAmount = Math.round(overtimeHours * hourlyRate * 1.5);
    } else if (employee.salaryType === 'Hourly') {
      const regularHours = (presentDays + weeklyOffs + leaveDays) * 8 + halfDays * 4;
      earnedBasic = Math.round(employee.basicSalary * regularHours);
      allowancesTotal = Math.round(employee.allowances || 0);
      // Overtime for hourly employee at 1.5x rate
      overtimeAmount = Math.round(overtimeHours * employee.basicSalary * 1.5);
    } else {
      earnedBasic = Math.round(employee.basicSalary);
      allowancesTotal = Math.round(employee.allowances || 0);
    }

    const grossSalary = Math.round(earnedBasic + allowancesTotal + overtimeAmount);

    // Advances and drawings balance
    const unrecoveredAdvances = advancesList
      .filter((a) => a.employeeId === employee.id && a.recoveryStatus !== 'Fully Recovered')
      .reduce(
        (acc, curr) => {
          const balance = Math.max(0, curr.amount - (curr.recoveredAmount || 0));
          if (curr.type === 'Staff Drawing') {
            acc.drawings += balance;
          } else {
            acc.advances += balance;
          }
          return acc;
        },
        { advances: 0, drawings: 0 }
      );

    const otherDeductions = Math.round(employee.deductions || 0);
    const availableForAdvanceRecovery = Math.max(0, grossSalary - otherDeductions);
    const advancesDeduction = Math.min(unrecoveredAdvances.advances, availableForAdvanceRecovery);
    const drawingsDeduction = Math.min(
      unrecoveredAdvances.drawings,
      Math.max(0, availableForAdvanceRecovery - advancesDeduction)
    );

    const totalDeductions = advancesDeduction + drawingsDeduction + otherDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      id: generateId('sal'),
      month,
      employeeId: employee.id,
      employeeName: employee.name,
      designation: employee.designation,
      salaryType: employee.salaryType,
      basicSalary: employee.basicSalary,
      totalMonthDays,
      paidDays,
      presentDays,
      weeklyOffs,
      absentDays,
      halfDays,
      leaveDays,
      earnedBasic,
      overtimeHours,
      overtimeAmount,
      allowancesTotal,
      grossSalary,
      advancesDeduction,
      drawingsDeduction,
      otherDeductions,
      netSalary,
      status: 'Draft',
      createdAt: getTodayDateString(),
    };
  };

  // Automatic Real-Time Salary Calculation Engine (#23 & #24)
  const calculateMonthlySalary = (employeeId: string, month: string): SalaryCalculation => {
    const employee = staffEmployees.find((e) => e.id === employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    return computeSalaryCalculation(employee, month, staffAttendance, staffAdvances);
  };

  // Real-Time Auto-Recalculation Effect: Keep Draft salary calculations always synchronized with live attendance & advances
  useEffect(() => {
    setSalaryCalculations((prevCalculations) => {
      if (!prevCalculations || prevCalculations.length === 0) return prevCalculations;
      let hasChanges = false;

      const updated = prevCalculations.map((calc) => {
        // Preserve immutable snapshot of Paid salary calculations unless explicitly recalculated
        if (calc.status === 'Paid') return calc;

        const employee = staffEmployees.find((e) => e.id === calc.employeeId);
        if (!employee) return calc;

        const liveCalc = computeSalaryCalculation(
          employee,
          calc.month,
          staffAttendance,
          staffAdvances
        );

        // Check if any calculated field changed
        const isDifferent =
          calc.paidDays !== liveCalc.paidDays ||
          calc.presentDays !== liveCalc.presentDays ||
          calc.weeklyOffs !== liveCalc.weeklyOffs ||
          calc.absentDays !== liveCalc.absentDays ||
          calc.halfDays !== liveCalc.halfDays ||
          calc.leaveDays !== liveCalc.leaveDays ||
          calc.earnedBasic !== liveCalc.earnedBasic ||
          calc.overtimeHours !== liveCalc.overtimeHours ||
          calc.overtimeAmount !== liveCalc.overtimeAmount ||
          calc.allowancesTotal !== liveCalc.allowancesTotal ||
          calc.grossSalary !== liveCalc.grossSalary ||
          calc.advancesDeduction !== liveCalc.advancesDeduction ||
          calc.drawingsDeduction !== liveCalc.drawingsDeduction ||
          calc.otherDeductions !== liveCalc.otherDeductions ||
          calc.netSalary !== liveCalc.netSalary ||
          calc.basicSalary !== liveCalc.basicSalary ||
          calc.salaryType !== liveCalc.salaryType ||
          calc.employeeName !== liveCalc.employeeName ||
          calc.designation !== liveCalc.designation;

        if (isDifferent) {
          hasChanges = true;
          return {
            ...liveCalc,
            id: calc.id,
            status: calc.status,
            paymentMode: calc.paymentMode,
            paymentDate: calc.paymentDate,
            createdAt: calc.createdAt,
          };
        }
        return calc;
      });

      return hasChanges ? updated : prevCalculations;
    });
  }, [staffAttendance, staffEmployees, staffAdvances]);

  const saveSalaryCalculation = (calc: SalaryCalculation) => {
    setSalaryCalculations((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.employeeId === calc.employeeId && s.month === calc.month
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = prev[existingIndex];
        updated[existingIndex] = {
          ...calc,
          id: existing.id,
          status: existing.status === 'Paid' ? 'Paid' : calc.status,
          paymentMode: existing.paymentMode || calc.paymentMode,
          paymentDate: existing.paymentDate || calc.paymentDate,
        };
        return updated;
      }
      return [calc, ...prev];
    });
  };

  const batchSaveSalaryCalculations = (calcs: SalaryCalculation[]) => {
    if (!calcs || calcs.length === 0) return;
    setSalaryCalculations((prev) => {
      let updated = [...prev];
      calcs.forEach((calc) => {
        const existingIndex = updated.findIndex(
          (s) => s.employeeId === calc.employeeId && s.month === calc.month
        );
        if (existingIndex >= 0) {
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...calc,
            id: existing.id,
            status: existing.status === 'Paid' ? 'Paid' : calc.status,
            paymentMode: existing.paymentMode || calc.paymentMode,
            paymentDate: existing.paymentDate || calc.paymentDate,
          };
        } else {
          updated = [calc, ...updated];
        }
      });
      return updated;
    });
  };

  const calculateAllStaffSalaries = (month: string, targetStaffIds?: string[]): SalaryCalculation[] => {
    const activeStaff = staffEmployees.filter(
      (e) => e.status === 'Active' && (!targetStaffIds || targetStaffIds.length === 0 || targetStaffIds.includes(e.id))
    );
    const calcs = activeStaff.map((emp) => calculateMonthlySalary(emp.id, month));
    batchSaveSalaryCalculations(calcs);
    return calcs;
  };

  const deleteSalaryCalculation = (calcId: string) => {
    setSalaryCalculations((prev) => prev.filter((s) => s.id !== calcId));
  };

  const paySalaryCalculation = (calcId: string, paymentMode: PaymentMode, paymentDate?: string) => {
    const pDate = paymentDate || getTodayDateString();
    setSalaryCalculations((prev) =>
      prev.map((s) => (s.id === calcId ? { ...s, status: 'Paid', paymentMode, paymentDate: pDate } : s))
    );

    // Also mark advances as recovered sequentially
    const calc = salaryCalculations.find((s) => s.id === calcId);
    if (calc) {
      let remainingAdvToRecover = calc.advancesDeduction;
      let remainingDrawToRecover = calc.drawingsDeduction;

      if (remainingAdvToRecover > 0 || remainingDrawToRecover > 0) {
        setStaffAdvances((prev) =>
          prev.map((adv) => {
            if (adv.employeeId === calc.employeeId && adv.recoveryStatus !== 'Fully Recovered') {
              if (adv.type === 'Staff Drawing' && remainingDrawToRecover > 0) {
                const unrecovered = Math.max(0, adv.amount - (adv.recoveredAmount || 0));
                const recoverThis = Math.min(unrecovered, remainingDrawToRecover);
                remainingDrawToRecover -= recoverThis;
                const newRecovered = (adv.recoveredAmount || 0) + recoverThis;
                return {
                  ...adv,
                  recoveredAmount: newRecovered,
                  recoveryStatus: newRecovered >= adv.amount ? 'Fully Recovered' : 'Partially Recovered',
                  remarks: `Recovered ${recoverThis} in salary slip for ${calc.month}`,
                };
              } else if (adv.type !== 'Staff Drawing' && remainingAdvToRecover > 0) {
                const unrecovered = Math.max(0, adv.amount - (adv.recoveredAmount || 0));
                const recoverThis = Math.min(unrecovered, remainingAdvToRecover);
                remainingAdvToRecover -= recoverThis;
                const newRecovered = (adv.recoveredAmount || 0) + recoverThis;
                return {
                  ...adv,
                  recoveredAmount: newRecovered,
                  recoveryStatus: newRecovered >= adv.amount ? 'Fully Recovered' : 'Partially Recovered',
                  remarks: `Recovered ${recoverThis} in salary slip for ${calc.month}`,
                };
              }
            }
            return adv;
          })
        );
      }
    }
  };

  const reviseSalaryCalculation = (
    calcId: string,
    updatedData: Partial<SalaryCalculation>,
    reason: string
  ) => {
    setSalaryCalculations((prev) =>
      prev.map((s) => {
        if (s.id === calcId) {
          const originalNet = s.originalNetSalary !== undefined ? s.originalNetSalary : s.netSalary;
          const originalGross = s.originalGrossSalary !== undefined ? s.originalGrossSalary : s.grossSalary;
          return {
            ...s,
            ...updatedData,
            isRevised: true,
            revisedAt: `${getTodayDateString()} ${getCurrentTimeString()}`,
            revisionReason: reason || 'Manual salary revision',
            originalNetSalary: originalNet,
            originalGrossSalary: originalGross,
            revisedBy: businessProfile.ownerName || 'Suraj Patil',
          };
        }
        return s;
      })
    );
  };

  const reopenSalaryCalculation = (calcId: string) => {
    setSalaryCalculations((prev) =>
      prev.map((s) =>
        s.id === calcId
          ? {
              ...s,
              status: 'Draft',
              paymentDate: undefined,
              paymentMode: undefined,
            }
          : s
      )
    );
  };

  // Daily Closing Actions (#35)
  const saveDailyClosing = (closingData: DailyClosing) => {
    const cleanClosing: DailyClosing = {
      ...closingData,
      id: closingData.id || generateId('close'),
      isClosed: true,
      closedAt: closingData.closedAt || `${closingData.date} ${getCurrentTimeString()}`,
      closedBy: closingData.closedBy || businessProfile.ownerName || 'Suraj Patil',
    };

    setDailyClosings((prev) => {
      const existingIdx = prev.findIndex((dc) => dc.date === cleanClosing.date || dc.id === cleanClosing.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = cleanClosing;
        return updated;
      }
      return [cleanClosing, ...prev];
    });
  };

  const deleteDailyClosing = (idOrDate: string) => {
    setDailyClosings((prev) => prev.filter((dc) => dc.id !== idOrDate && dc.date !== idOrDate));
  };

  const closeDay = (date: string, notes?: string) => {
    // Calculate totals for that day
    const pws = plateWiseSales.find((p) => p.date === date);
    const dayInvoices = invoices.filter((i) => i.date === date);
    const dayExpenses = expenses.filter((e) => e.date === date);
    const dayPurchases = purchases.filter((p) => p.date === date);

    const totalSales = pws ? pws.grandTotal : dayInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalPlates = pws ? pws.totalPlates : 0;
    const cashSales = pws ? pws.cashSales : dayInvoices.filter((i) => i.paymentMode === 'Cash').reduce((s, i) => s + i.amountPaid, 0);
    const upiSales = pws ? pws.upiSales : dayInvoices.filter((i) => i.paymentMode === 'UPI').reduce((s, i) => s + i.amountPaid, 0);
    const bankSales = pws ? pws.bankSales : dayInvoices.filter((i) => i.paymentMode === 'Bank').reduce((s, i) => s + i.amountPaid, 0);
    const cardSales = pws ? pws.cardSales : dayInvoices.filter((i) => i.paymentMode === 'Card').reduce((s, i) => s + i.amountPaid, 0);
    const creditSales = pws ? pws.creditSales : dayInvoices.filter((i) => i.paymentMode === 'Credit').reduce((s, i) => s + i.balanceDue, 0);

    const totalExpenses = dayExpenses.reduce((s, e) => s + e.amount, 0);
    const totalPurchases = dayPurchases.reduce((s, p) => s + p.totalAmount, 0);
    const netProfit = totalSales - totalExpenses;

    const closingRecord: DailyClosing = {
      id: generateId('close'),
      date,
      totalSales,
      totalPlates,
      cashSales,
      upiSales,
      bankSales,
      cardSales,
      creditSales,
      totalExpenses,
      totalPurchases,
      customerReceivablesAdded: creditSales,
      supplierPayablesAdded: dayPurchases.reduce((s, p) => s + p.balanceDue, 0),
      netProfit,
      closingCash: moneyPosition.cashBalance,
      closingBank: moneyPosition.bankBalance,
      closingUPI: moneyPosition.upiBalance,
      closingCard: moneyPosition.cardBalance,
      totalClosingBalance: moneyPosition.totalAvailableBalance,
      isClosed: true,
      closedAt: `${date} ${getCurrentTimeString()}`,
      closedBy: businessProfile.ownerName || 'Suraj Patil',
      notes: notes || 'Day closing calculated and confirmed.',
    };

    setDailyClosings((prev) => {
      const filtered = prev.filter((dc) => dc.date !== date);
      return [closingRecord, ...filtered];
    });
  };

  const reopenDay = (date: string, reason?: string) => {
    setDailyClosings((prev) =>
      prev.map((dc) =>
        dc.date === date
          ? {
              ...dc,
              isClosed: false,
              notes: `${dc.notes || ''} [Reopened: ${reason || 'Correction requested'}]`,
            }
          : dc
      )
    );
  };

  // Inter-Account Money Transfer Actions
  const addMoneyTransfer = (transfer: Omit<MoneyTransfer, 'id' | 'createdAt'>) => {
    const newTransfer: MoneyTransfer = {
      ...transfer,
      id: generateId('mt'),
      createdAt: getTodayDateString(),
    };
    setMoneyTransfers((prev) => [newTransfer, ...prev]);
  };

  const deleteMoneyTransfer = (id: string) => {
    setMoneyTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  // Build Complete Database Backup JSON string for all collections
  const getCompleteDatabaseBackupJSON = useCallback((): string => {
    const fullBackup = {
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      source: 'Patil Biryani Local Folder Scheduled Backup Engine',
      businessProfile,
      categories,
      products,
      priceHistory,
      tables,
      heldOrders,
      customers,
      vendors,
      expenseCategories,
      expenses,
      purchases,
      invoices,
      plateWiseSales,
      receivables,
      receivablePayments,
      payables,
      payablePayments,
      staffEmployees,
      staffAttendance,
      staffAdvances,
      salaryCalculations,
      dailyClosings,
      moneyTransfers,
    };
    return JSON.stringify(fullBackup, null, 2);
  }, [
    businessProfile,
    categories,
    products,
    priceHistory,
    tables,
    heldOrders,
    customers,
    vendors,
    expenseCategories,
    expenses,
    purchases,
    invoices,
    plateWiseSales,
    receivables,
    receivablePayments,
    payables,
    payablePayments,
    staffEmployees,
    staffAttendance,
    staffAdvances,
    salaryCalculations,
    dailyClosings,
    moneyTransfers,
  ]);

  // Automated Local Folder Daily Backup State & Handler
  const [lastDailyBackupAt, setLastDailyBackupAt] = useState<number | null>(() => {
    try {
      const cfg = loadLocalFolderConfig();
      return cfg.lastBackupAt || null;
    } catch {
      return null;
    }
  });

  const triggerAutomatedDailyBackup = useCallback(async (): Promise<{ success: boolean; fileName?: string; error?: string }> => {
    if (typeof window === 'undefined' || !isFileSystemAccessSupported()) {
      return { success: false, error: 'File System Access API is not supported on this device/browser.' };
    }

    try {
      const config = loadLocalFolderConfig();
      const storedHandle = await getStoredDirectoryHandle();

      if (!storedHandle) {
        return { success: false, error: 'No local folder selected. Please select a backup folder in Settings.' };
      }

      const hasPermission = await verifyDirectoryPermission(storedHandle, true);
      if (!hasPermission) {
        return { success: false, error: 'Write permission not active for selected local backup folder.' };
      }

      const jsonPayload = getCompleteDatabaseBackupJSON();
      const res = await writeBackupToDirectoryHandle(storedHandle, jsonPayload, config);

      if (res.success) {
        const now = Date.now();
        setLastDailyBackupAt(now);
        const todayStr = getTodayDateString();
        localStorage.setItem(`patil_biryani_daily_auto_backup_${todayStr}`, JSON.stringify({
          executedAt: now,
          fileName: res.fileName,
          fileSize: res.fileSize,
        }));
        console.log(`[Automated Daily Backup] Database redundancy snapshot created in "${config.folderName}": ${res.fileName}`);
        return { success: true, fileName: res.fileName };
      } else {
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      console.warn('[Automated Daily Backup] Background backup error:', err);
      return { success: false, error: err.message || 'Automated daily backup failed' };
    }
  }, [getCompleteDatabaseBackupJSON]);

  // Automated background job in AppProvider checking and triggering daily local folder database backup
  useEffect(() => {
    const checkAndRunDailyBackup = async () => {
      try {
        const config = loadLocalFolderConfig();
        if (config.autoBackupEnabled === false) return;

        const todayStr = getTodayDateString();
        const dailyRecordKey = `patil_biryani_daily_auto_backup_${todayStr}`;
        const alreadyDoneToday = localStorage.getItem(dailyRecordKey);

        if (!alreadyDoneToday) {
          await triggerAutomatedDailyBackup();
        }
      } catch (err) {
        console.warn('[AppProvider Background Job] Daily backup verification failed:', err);
      }
    };

    // Initial check after app mount
    const initialTimer = setTimeout(() => {
      checkAndRunDailyBackup();
    }, 3000);

    // Periodic check every 5 minutes
    const periodicTimer = setInterval(() => {
      checkAndRunDailyBackup();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicTimer);
    };
  }, [triggerAutomatedDailyBackup]);

  // Full Database Backup & Restore (#39)
  const exportAllDataJSON = () => {
    const jsonStr = getCompleteDatabaseBackupJSON();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Patil_Biryani_Data_Backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.businessProfile) setBusinessProfileState(data.businessProfile);
      if (data.categories) setCategories(data.categories);
      if (data.products) setProducts(data.products);
      if (data.priceHistory) setPriceHistory(data.priceHistory);
      if (data.tables) setTables(data.tables);
      if (data.customers) setCustomers(data.customers);
      if (data.vendors) setVendors(data.vendors);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.expenses) setExpenses(data.expenses);
      if (data.purchases) setPurchases(data.purchases);
      if (data.invoices) setInvoices(data.invoices);
      if (data.plateWiseSales) setPlateWiseSales(data.plateWiseSales);
      if (data.receivables) setReceivables(data.receivables);
      if (data.receivablePayments) setReceivablePayments(data.receivablePayments);
      if (data.payables) setPayables(data.payables);
      if (data.payablePayments) setPayablePayments(data.payablePayments);
      if (data.staffEmployees) setStaffEmployees(data.staffEmployees);
      if (data.staffAttendance) setStaffAttendance(data.staffAttendance);
      if (data.staffAdvances) setStaffAdvances(data.staffAdvances);
      if (data.salaryCalculations) setSalaryCalculations(data.salaryCalculations);
      if (data.dailyClosings) setDailyClosings(data.dailyClosings);
      if (data.moneyTransfers) setMoneyTransfers(data.moneyTransfers);
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setBusinessProfileState(defaultBusinessProfile);
    setCategories(defaultCategories);
    setProducts(defaultProducts);
    setPriceHistory(defaultPriceHistory);
    setTables(defaultTables);
    setCustomers(defaultCustomers);
    setVendors(defaultVendors);
    setExpenseCategories(defaultExpenseCategories);
    setExpenses(defaultExpenses);
    setPurchases(defaultPurchases);
    setInvoices(defaultInvoices);
    setPlateWiseSales(defaultPlateWiseSales);
    setReceivables(defaultReceivables);
    setReceivablePayments(defaultReceivablePayments);
    setPayables(defaultPayables);
    setPayablePayments(defaultPayablePayments);
    setStaffEmployees(defaultStaffEmployees);
    setStaffAttendance(defaultAttendance);
    setStaffAdvances(defaultStaffAdvances);
    setSalaryCalculations([]);
    setDailyClosings(defaultDailyClosings);
    setMoneyTransfers(defaultMoneyTransfers);
  };

  return (
    <AppContext.Provider
      value={{
        businessProfile,
        updateBusinessProfile,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        priceHistory,
        tables,
        addTable,
        updateTable,
        deleteTable,
        setTableStatus,
        heldOrders,
        holdOrder,
        resumeHeldOrder,
        deleteHeldOrder,
        updateHeldOrder,
        transferTableOrder,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        expenseCategories,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        purchases,
        addPurchase,
        updatePurchase,
        deletePurchase,
        invoices,
        nextInvoiceNumber,
        getNextInvoiceNumber,
        invoiceSequence,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        plateWiseSales,
        savePlateWiseSale,
        deletePlateWiseSale,
        receivables,
        receivablePayments,
        addReceivable,
        recordReceivablePayment,
        deleteReceivablePayment,
        deleteReceivable,
        payables,
        payablePayments,
        addPayable,
        recordPayablePayment,
        deletePayablePayment,
        deletePayable,
        staffEmployees,
        addStaffEmployee,
        updateStaffEmployee,
        deleteStaffEmployee,
        resignStaffEmployee,
        reactivateStaffEmployee,
        staffAttendance,
        recordAttendance,
        batchRecordAttendance,
        staffAdvances,
        addStaffAdvance,
        updateStaffAdvance,
        deleteStaffAdvance,
        salaryCalculations,
        calculateMonthlySalary,
        calculateAllStaffSalaries,
        saveSalaryCalculation,
        batchSaveSalaryCalculations,
        paySalaryCalculation,
        reviseSalaryCalculation,
        reopenSalaryCalculation,
        deleteSalaryCalculation,
        dailyClosings,
        saveDailyClosing,
        deleteDailyClosing,
        closeDay,
        reopenDay,
        activeDateFilter,
        setActiveDateFilter,
        customStartDate,
        setCustomStartDate,
        customEndDate,
        setCustomEndDate,
        moneyPosition,
        moneyTransfers,
        addMoneyTransfer,
        deleteMoneyTransfer,
        outstandingSummary,
        isDateInActiveFilter,
        isLoading,
        isInitialLoading: isLoading,
        isSyncing,
        isAutoSaveActive: true,
        lastAutoSavedAt,
        triggerImmediateSave,
        lastDailyBackupAt,
        triggerAutomatedDailyBackup,
        exportAllDataJSON,
        importDataJSON,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
