export type PaymentMode = 'Cash' | 'UPI' | 'Bank' | 'Card' | 'Credit' | 'Other';
export type OrderType = 'Dine In' | 'Takeaway' | 'Delivery' | 'Other';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Pending';
export type SalaryType = 'Monthly' | 'Daily' | 'Weekly' | 'Hourly';
export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Weekly Off';
export type AdvanceType = 'Salary Advance' | 'Staff Drawing' | 'Other Advance';
export type RecoveryStatus = 'Pending' | 'Partially Recovered' | 'Fully Recovered';
export type PayableType = 'Supplier' | 'Staff' | 'Other';
export type DateFilterType = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Previous Month' | 'Custom Date';

export type DateFormatPattern =
  | 'DD/MM/YYYY'
  | 'DD-MM-YYYY'
  | 'DD MMM YYYY'
  | 'DD MMMM YYYY'
  | 'YYYY-MM-DD'
  | 'MM/DD/YYYY';

export type TimeFormatPattern = '12-hour' | '24-hour';

export type PdfPaperSize = 'thermal-80mm' | 'thermal-58mm' | 'a4' | 'a5';
export type PdfTemplateVersion = 'modern' | 'classic-thermal' | 'gst-tax' | 'minimal';
export type PdfColorTheme = 'emerald' | 'navy' | 'monochrome' | 'amber';

export interface AddressDetails {
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  district?: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
}

export interface BusinessProfile {
  name: string;
  subtitle: string;
  logoUrl?: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  landmark?: string;
  district?: string;
  city: string;
  state: string;
  country?: string;
  pinCode: string;
  mobile: string;
  altMobile: string;
  email: string;
  gstNumber: string;
  fssaiNumber: string;
  ownerName: string;
  ownerMobile: string;
  currencySymbol: string;
  footerNote: string;
  
  // Date & Time Format Settings
  dateFormat?: DateFormatPattern;
  timeFormat?: TimeFormatPattern;
  
  // PDF & Print Formatting Settings
  pdfPaperSize?: PdfPaperSize;
  pdfTemplateVersion?: PdfTemplateVersion;
  pdfColorTheme?: PdfColorTheme;
  pdfShowLogo?: boolean;
  pdfShowGst?: boolean;
  pdfShowUpiQr?: boolean;
  pdfUpiId?: string;
  pdfShowAddress?: boolean;
  pdfShowTableWaiter?: boolean;
  pdfShowCustomer?: boolean;
  pdfFooterText?: string;
  pdfTermsNote?: string;
  pdfFontScale?: 'compact' | 'standard' | 'large';

  // Opening / Base Capital Balances for Money Position
  openingBalanceCash?: number;
  openingBalanceBank?: number;
  openingBalanceUPI?: number;
  openingBalanceCard?: number;

  // Local Device Folder Backup Settings
  localBackupFolderPath?: string;
  localBackupFolderName?: string;
  autoLocalBackupEnabled?: boolean;
  localBackupIntervalMinutes?: number;
  backupOnDayClosing?: boolean;
}

export interface LocalFolderBackupConfig {
  folderName?: string;
  folderCustomPath?: string;
  autoBackupEnabled: boolean;
  backupIntervalMinutes: number; // e.g. 15, 30, 60, 120, 240, 1440
  backupOnDayClosing: boolean;
  saveLatestSnapshotMirror: boolean;
  filenamePrefix: string;
  lastBackupAt?: number;
  lastBackupFileName?: string;
  lastBackupSize?: number;
}

export interface LocalBackupFileInfo {
  name: string;
  size: number;
  lastModified: number;
  isLatestSnapshot?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  order: number;
  type?: 'Food' | 'Beverage' | 'Dessert' | 'Add-on' | 'Other';
  icon?: string;
  imageUrl?: string;
  color?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  sellingPrice: number;
  unit: string;
  taxGstRate: number; // in percentage e.g. 5
  description?: string;
  active: boolean;
  order: number;
  code?: string;
  imageUrl?: string;
  isVeg?: boolean;
  spicyLevel?: 'mild' | 'medium' | 'hot';
  isPopular?: boolean;
  isSpecial?: boolean;
  preparationTimeMinutes?: number;
}

export interface ProductPriceHistory {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  effectiveDate: string;
  changedBy: string;
  note?: string;
}

export interface RestaurantTable {
  id: string;
  name: string;
  tableNumber?: string;
  capacity: number;
  section?: string;
  status: 'Available' | 'Occupied' | 'Held' | 'Billing' | 'Paid' | 'Reserved';
  active: boolean;
  notes?: string;
  currentOrderId?: string;
}

export interface HeldOrder {
  id: string;
  tableId: string;
  tableName: string;
  orderType: OrderType;
  customerName?: string;
  customerMobile?: string;
  staffWaiter?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  notes?: string;
  isGstExempt?: boolean;
  status: 'Held' | 'Active' | 'Billing' | 'Paid';
  heldAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  email?: string;
  gstNumber?: string;
  openingBalance: number;
  creditLimit: number;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  mobile: string;
  address: string;
  email?: string;
  gstNumber?: string;
  openingBalance: number;
  paymentTerms?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  categoryName?: string;
  quantity: number;
  rate: number;
  discount: number; // in percentage or fixed amount
  tax: number; // tax amount
  amount: number; // final row amount
  unit?: string;
  imageUrl?: string;
  isVeg?: boolean;
  notes?: string;
  note?: string;
  taxGstRate?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string;
  tableNumber: string;
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  staffWaiter?: string;
  orderType: OrderType;
  paymentMode: PaymentMode;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  isGstExempt?: boolean;
  createdAt: string;
}

export interface PlateWiseSaleItem {
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PlateWiseSale {
  id: string;
  date: string; // YYYY-MM-DD
  items: PlateWiseSaleItem[];
  totalPlates: number;
  totalFoodSales: number;
  totalBeverageSales: number;
  totalDessertSales: number;
  totalOtherSales: number;
  grandTotal: number;
  cashSales: number;
  upiSales: number;
  bankSales: number;
  cardSales: number;
  creditSales: number;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  categoryName: string;
  description: string;
  vendorId?: string;
  vendorName: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentStatus: 'Paid' | 'Pending';
  remarks?: string;
  createdAt: string;
}

export interface PurchaseItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  date: string; // YYYY-MM-DD
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  paymentMode: PaymentMode;
  paidAmount: number;
  balanceDue: number;
  dueDate?: string;
  remarks?: string;
  createdAt: string;
}

export interface Receivable {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  amountReceived: number;
  balance: number;
  dueDate?: string;
  status: 'Pending' | 'Partially Received' | 'Fully Received' | 'Overdue';
  remarks?: string;
  createdAt: string;
}

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  reference?: string;
  remarks?: string;
}

export interface Payable {
  id: string;
  type: PayableType;
  entityId?: string;
  entityName: string;
  referenceNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  dueDate?: string;
  status: 'Pending' | 'Partially Paid' | 'Fully Paid' | 'Overdue';
  remarks?: string;
  createdAt: string;
}

export interface PayablePayment {
  id: string;
  payableId: string;
  entityName: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  reference?: string;
  remarks?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
}

export interface StaffEmployee {
  id: string;
  employeeId: string;
  name: string;
  mobile: string;
  address: string;
  joiningDate: string;
  resignationDate?: string;
  resignationReason?: string;
  relievingDate?: string;
  settlementNotes?: string;
  settlementAmount?: number;
  settlementStatus?: 'Pending' | 'Settled';
  designation: string;
  department: string;
  salaryType: SalaryType;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bankDetails: BankDetails;
  status: 'Active' | 'Inactive' | 'Resigned';
  createdAt: string;
}

export interface StaffAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  employeeId: string;
  employeeName: string;
  inTime: string;
  outTime: string;
  totalHours: number;
  status: AttendanceStatus;
  overtimeHours: number;
  remarks?: string;
}

export interface StaffAdvance {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  type: AdvanceType;
  amount: number;
  description: string;
  paymentMode: PaymentMode;
  recoveryStatus: RecoveryStatus;
  recoveredAmount: number;
  remarks?: string;
  createdAt: string;
}

export interface SalaryCalculation {
  id: string;
  month: string; // YYYY-MM
  employeeId: string;
  employeeName: string;
  designation: string;
  salaryType: SalaryType;
  basicSalary: number;
  totalMonthDays: number;
  paidDays: number;
  presentDays: number;
  weeklyOffs: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  earnedBasic: number;
  overtimeHours: number;
  overtimeAmount: number;
  allowancesTotal: number;
  grossSalary: number;
  advancesDeduction: number;
  drawingsDeduction: number;
  otherDeductions: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Paid';
  paymentDate?: string;
  paymentMode?: PaymentMode;
  remarks?: string;
  isRevised?: boolean;
  revisedAt?: string;
  revisionReason?: string;
  originalNetSalary?: number;
  originalGrossSalary?: number;
  revisedBy?: string;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash?: number;
  totalSales: number;
  totalPlates: number;
  cashSales: number;
  upiSales: number;
  bankSales: number;
  cardSales: number;
  creditSales: number;
  actualUpiSettled?: number;
  upiDifference?: number;
  cashExpenses?: number;
  onlineExpenses?: number;
  totalExpenses: number;
  cashAdvances?: number;
  cashPurchases?: number;
  totalPurchases: number;
  otherCashInflows?: number;
  customerReceivablesAdded: number;
  supplierPayablesAdded: number;
  netProfit: number;
  expectedCash?: number;
  actualCash?: number;
  cashDifference?: number;
  status?: 'Balanced' | 'Excess' | 'Shortage';
  denominations?: {
    n500?: number;
    n200?: number;
    n100?: number;
    n50?: number;
    n20?: number;
    n10?: number;
    n5?: number;
    n2?: number;
    n1?: number;
    coins?: number;
  };
  closingCash: number;
  closingBank: number;
  closingUPI: number;
  closingCard: number;
  totalClosingBalance: number;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRangeText: string;
  reportType: 'summary' | 'detailed';
  groupBy: 'none' | 'date' | 'category' | 'product' | 'paymentMode' | 'customer' | 'vendor';
  includeBusinessDetails: boolean;
  includeOwnerDetails: boolean;
  includeSummaryCards: boolean;
  selectedFields: string[];
}

export interface ExcelExportOptions {
  fileName: string;
  sheetName: string;
  dateRangeText: string;
  reportType: 'summary' | 'detailed';
  groupBy: 'none' | 'date' | 'category' | 'product' | 'paymentMode' | 'customer' | 'vendor';
  selectedColumns: string[];
  filterCategory?: string;
  filterPaymentMode?: string;
}

export type MoneyTransferType =
  | 'Cash to Bank Deposit'
  | 'Bank to Cash Withdrawal'
  | 'UPI to Bank Settlement'
  | 'Card POS to Bank Settlement'
  | 'Capital Injection'
  | 'Owner Drawing'
  | 'Inter-Account Transfer';

export interface MoneyTransfer {
  id: string;
  date: string;
  fromAccount?: PaymentMode;
  toAccount?: PaymentMode;
  amount: number;
  transferType: MoneyTransferType;
  reference?: string;
  remarks?: string;
  createdAt: string;
}

export interface MoneyTransactionAuditItem {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  source:
    | 'Plate Sales'
    | 'Invoice Payment'
    | 'Receivable Collection'
    | 'Expense'
    | 'Purchase'
    | 'Staff Advance'
    | 'Staff Salary'
    | 'Payable Settlement'
    | 'Money Transfer'
    | 'Capital Injection'
    | 'Owner Drawing';
  paymentMode: PaymentMode;
  entityOrTitle: string;
  reference?: string;
  amount: number;
}

export interface MoneyPositionSourceBreakdown {
  source: string;
  amount: number;
  count: number;
  percentage: number;
  references: string[];
}

export interface MoneyPositionChannelBreakdown {
  channel: PaymentMode;
  name: string;
  opening: number;
  inflows: number;
  inflowCount: number;
  outflows: number;
  outflowCount: number;
  netBalance: number;
  percentageOfTotal: number;
  sampleReferences: string[];
}

export interface MoneyPositionEquation {
  openingTotal: number;
  inflowsTotal: number;
  inflowCount: number;
  outflowsTotal: number;
  outflowCount: number;
  netMovement: number;
  availableTotal: number;
  channelSum: number;
  isBalanced: boolean;
  discrepancy: number;
}

export interface MoneyPosition {
  cashBalance: number;
  bankBalance: number;
  upiBalance: number;
  cardBalance: number;
  totalAvailableBalance: number;

  // Aggregate Figures
  totalInflows: number;
  totalOutflows: number;
  cashInflows: number;
  cashOutflows: number;
  upiInflows: number;
  upiOutflows: number;
  bankInflows: number;
  bankOutflows: number;
  cardInflows: number;
  cardOutflows: number;

  // Transaction counts per channel
  cashInflowCount: number;
  cashOutflowCount: number;
  upiInflowCount: number;
  upiOutflowCount: number;
  bankInflowCount: number;
  bankOutflowCount: number;
  cardInflowCount: number;
  cardOutflowCount: number;
  totalInflowCount: number;
  totalOutflowCount: number;

  // Configured Starting Opening Capital
  openingCash: number;
  openingBank: number;
  openingUPI: number;
  openingCard: number;
  totalOpeningBalance: number;

  // Formulated Equations & Source Breakdowns with full references
  equation: MoneyPositionEquation;
  channels: MoneyPositionChannelBreakdown[];
  inflowSources: MoneyPositionSourceBreakdown[];
  outflowSources: MoneyPositionSourceBreakdown[];

  // Fully Supported Itemized Audit Records
  auditTransactions: MoneyTransactionAuditItem[];
}


