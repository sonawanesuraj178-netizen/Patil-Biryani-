import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserX,
  UserCheck,
  CalendarCheck,
  CalendarDays,
  Calendar,
  HandCoins,
  Calculator,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Briefcase,
  Sparkles,
  RotateCcw,
  Check,
  CheckCheck,
  CheckSquare,
  Square,
  Zap,
  SlidersHorizontal,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarCheck2,
  X,
  Eye,
  Info,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Award,
  Download,
  Plus,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAppNotification } from '../context/AppNotificationContext';
import {
  formatINR,
  formatNumberIN,
  formatDateDisplay,
  formatMonthDisplay,
  getTodayDateString,
  getCurrentTimeString,
  isDateInSelectedMonth,
  isDateBetweenRange,
} from '../utils/formatters';
import {
  downloadSalarySlipPDF,
  printSalarySlipPDF,
  shareSalarySlipPDF,
  numberToIndianWords,
} from '../utils/pdfService';
import {
  StaffEmployee,
  StaffAttendance,
  StaffAdvance,
  SalaryCalculation,
  AttendanceStatus,
  SalaryType,
  AdvanceType,
  PaymentMode,
} from '../types';
import { ResignStaffModal } from '../components/staff/ResignStaffModal';
import { ViewResignationModal } from '../components/staff/ViewResignationModal';
import { CustomAttendanceModal } from '../components/staff/CustomAttendanceModal';
import { IndividualAttendanceModal } from '../components/staff/IndividualAttendanceModal';
import { RecordAttendanceModal } from '../components/staff/RecordAttendanceModal';
import { ReviseSalaryModal } from '../components/staff/ReviseSalaryModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { StaffSkeleton } from '../components/ui/Skeleton';

interface StaffViewProps {
  onOpenPdfExport: (reportTitle: string, rows: any[], totals?: Record<string, number | string>) => void;
  onOpenExcelExport: (reportTitle: string, rows: any[]) => void;
  onConfirmDelete: (title: string, message: string, onConfirm: () => void) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  onOpenPdfExport,
  onOpenExcelExport,
  onConfirmDelete,
}) => {
  const {
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
    businessProfile,
    isLoading,
  } = useApp();
  const { showToast } = useAppNotification();

  // Sub-tabs: 'employees' | 'attendance' | 'advances' | 'payroll'
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'attendance' | 'advances' | 'payroll'>('employees');

  // Modals state
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [viewSalarySlip, setViewSalarySlip] = useState<SalaryCalculation | null>(null);
  const [auditSalarySlip, setAuditSalarySlip] = useState<SalaryCalculation | null>(null);
  const [revisingSalary, setRevisingSalary] = useState<SalaryCalculation | null>(null);

  // Resignation & Custom Attendance Modals
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState<'All' | 'Active' | 'Resigned'>('Active');
  const [resigningEmp, setResigningEmp] = useState<StaffEmployee | null>(null);
  const [viewResignationEmp, setViewResignationEmp] = useState<StaffEmployee | null>(null);
  const [showCustomAttendanceModal, setShowCustomAttendanceModal] = useState(false);
  const [individualAttEmp, setIndividualAttEmp] = useState<StaffEmployee | null>(null);
  
  // Dedicated Single Record Attendance Modal State
  const [showRecordAttendanceModal, setShowRecordAttendanceModal] = useState(false);
  const [recordAttInitialRecord, setRecordAttInitialRecord] = useState<StaffAttendance | null>(null);
  const [recordAttInitialEmpId, setRecordAttInitialEmpId] = useState<string>('');
  const [recordAttInitialDate, setRecordAttInitialDate] = useState<string>(getTodayDateString());

  const handleOpenRecordAttendance = (empId?: string, dateStr?: string, record?: StaffAttendance) => {
    setRecordAttInitialRecord(record || null);
    setRecordAttInitialEmpId(empId || '');
    setRecordAttInitialDate(dateStr || (attendanceViewMode === 'daily' ? selectedAttendanceDate : getTodayDateString()));
    setShowRecordAttendanceModal(true);
  };

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState(getTodayDateString());
  const [empDesignation, setEmpDesignation] = useState('Biryani Master / Chef');
  const [empDepartment, setEmpDepartment] = useState('Kitchen');
  const [empSalaryType, setEmpSalaryType] = useState<SalaryType>('Monthly');
  const [empBasicSalary, setEmpBasicSalary] = useState('22000');
  const [empAllowances, setEmpAllowances] = useState('0');
  const [empDeductions, setEmpDeductions] = useState('0');
  const [empBankName, setEmpBankName] = useState('');
  const [empAccountNumber, setEmpAccountNumber] = useState('');
  const [empIfsc, setEmpIfsc] = useState('');
  const [empUpi, setEmpUpi] = useState('');

  // Attendance Register State
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(getTodayDateString());
  const [attendanceViewMode, setAttendanceViewMode] = useState<'monthly_matrix' | 'daily'>('monthly_matrix');
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthSearchQuery, setMonthSearchQuery] = useState('');
  const [quickCellPopover, setQuickCellPopover] = useState<{
    empId: string;
    empName: string;
    date: string;
    status: AttendanceStatus;
    otHours: number;
  } | null>(null);

  // Bulk Attendance Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [bulkSelectedStaff, setBulkSelectedStaff] = useState<string[]>([]);
  const [bulkPattern, setBulkPattern] = useState<'all_present' | 'present_mon_sat' | 'custom_range'>('present_mon_sat');
  const [bulkCustomStart, setBulkCustomStart] = useState(1);
  const [bulkCustomEnd, setBulkCustomEnd] = useState(31);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('Present');
  const [bulkSundayStatus, setBulkSundayStatus] = useState<AttendanceStatus>('Weekly Off');
  const [bulkInTime, setBulkInTime] = useState('10:00 AM');
  const [bulkOutTime, setBulkOutTime] = useState('11:00 PM');
  const [bulkHours, setBulkHours] = useState(11);
  const [bulkOT, setBulkOT] = useState(0);

  // User feedback toast message
  const [attendanceFeedback, setAttendanceFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setAttendanceFeedback(msg);
    setTimeout(() => {
      setAttendanceFeedback((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Advance Form State
  const [advanceEmpId, setAdvanceEmpId] = useState('');
  const [advanceDate, setAdvanceDate] = useState(getTodayDateString());
  const [advanceType, setAdvanceType] = useState<AdvanceType>('Salary Advance');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [advancePaymentMode, setAdvancePaymentMode] = useState<PaymentMode>('Cash');

  // Advance Date & Month Filter State
  const [advanceFilterPeriod, setAdvanceFilterPeriod] = useState<
    'all' | 'this-month' | 'previous-month' | 'custom-month' | 'custom-range' | 'today' | 'yesterday'
  >('all');
  const [advanceSelectedMonth, setAdvanceSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [advanceCustomStartDate, setAdvanceCustomStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [advanceCustomEndDate, setAdvanceCustomEndDate] = useState(getTodayDateString());
  const [advanceStaffFilter, setAdvanceStaffFilter] = useState<string>('all');
  const [advanceTypeFilter, setAdvanceTypeFilter] = useState<string>('all');
  const [advanceRecoveryFilter, setAdvanceRecoveryFilter] = useState<string>('all');
  const [advanceSearchQuery, setAdvanceSearchQuery] = useState<string>('');

  // Payroll / Salary Engine State
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedPayrollEmpId, setSelectedPayrollEmpId] = useState<string>('all');

  // Pay Salary State
  const [payingSalaryId, setPayingSalaryId] = useState<string | null>(null);
  const [salaryPayMode, setSalaryPayMode] = useState<PaymentMode>('Bank');

  // Open Edit Employee
  const handleOpenEditEmp = (emp: StaffEmployee) => {
    setEditingEmployeeId(emp.id);
    setEmpName(emp.name || '');
    setEmpMobile(emp.mobile || '');
    setEmpAddress(emp.address || '');
    setEmpJoiningDate(emp.joiningDate || getTodayDateString());
    setEmpDesignation(emp.designation || 'Biryani Master / Chef');
    setEmpDepartment(emp.department || 'Kitchen');
    setEmpSalaryType(emp.salaryType || 'Monthly');
    setEmpBasicSalary(emp.basicSalary?.toString() || '0');
    setEmpAllowances(emp.allowances?.toString() || '0');
    setEmpDeductions(emp.deductions?.toString() || '0');
    setEmpBankName(emp.bankDetails?.bankName || '');
    setEmpAccountNumber(emp.bankDetails?.accountNumber || '');
    setEmpIfsc(emp.bankDetails?.ifscCode || '');
    setEmpUpi(emp.bankDetails?.upiId || '');
    setShowAddEmployeeModal(true);
  };

  const handleResetEmpForm = () => {
    setEditingEmployeeId(null);
    setEmpName('');
    setEmpMobile('');
    setEmpAddress('');
    setEmpJoiningDate(getTodayDateString());
    setEmpDesignation('Biryani Master / Chef');
    setEmpDepartment('Kitchen');
    setEmpSalaryType('Monthly');
    setEmpBasicSalary('20000');
    setEmpAllowances('0');
    setEmpDeductions('0');
    setEmpBankName('');
    setEmpAccountNumber('');
    setEmpIfsc('');
    setEmpUpi('');
    setShowAddEmployeeModal(false);
  };

  const handleSubmitEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const basic = parseFloat(empBasicSalary);
    if (isNaN(basic) || basic <= 0) {
      showToast('Please enter a valid basic salary amount.', 'warning');
      return;
    }

    const allow = parseFloat(empAllowances) || 0;
    const ded = parseFloat(empDeductions) || 0;

    if (editingEmployeeId) {
      updateStaffEmployee(editingEmployeeId, {
        name: empName.trim(),
        mobile: empMobile.trim(),
        address: empAddress.trim(),
        joiningDate: empJoiningDate,
        designation: empDesignation.trim(),
        department: empDepartment.trim(),
        salaryType: empSalaryType,
        basicSalary: basic,
        allowances: allow,
        deductions: ded,
        bankDetails: {
          bankName: empBankName.trim(),
          accountNumber: empAccountNumber.trim(),
          ifscCode: empIfsc.trim(),
          upiId: empUpi.trim(),
        },
      });
      showToast(`Updated staff details for ${empName.trim()}`, 'success');
    } else {
      const empIdCode = `EMP-${String(staffEmployees.length + 1).padStart(3, '0')}`;
      addStaffEmployee({
        employeeId: empIdCode,
        name: empName.trim(),
        mobile: empMobile.trim(),
        address: empAddress.trim(),
        joiningDate: empJoiningDate,
        designation: empDesignation.trim(),
        department: empDepartment.trim(),
        salaryType: empSalaryType,
        basicSalary: basic,
        allowances: allow,
        deductions: ded,
        bankDetails: {
          bankName: empBankName.trim(),
          accountNumber: empAccountNumber.trim(),
          ifscCode: empIfsc.trim(),
          upiId: empUpi.trim(),
        },
        status: 'Active',
      });
      showToast(`Registered staff member ${empName.trim()}`, 'success');
    }

    handleResetEmpForm();
  };

  // Mark Daily Attendance
  const handleSetAttendanceStatus = (empId: string, empName: string, status: AttendanceStatus, otHours = 0, date = selectedAttendanceDate) => {
    recordAttendance({
      date,
      employeeId: empId,
      employeeName: empName,
      inTime: '10:00 AM',
      outTime: '11:00 PM',
      totalHours: status === 'Weekly Off' || status === 'Absent' ? 0 : 11,
      status,
      overtimeHours: otHours,
    });
  };

  // 1-Click: Mark All Active Staff Present on Selected Date
  const handleMarkAllPresent = () => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');
    if (activeStaff.length === 0) {
      showFeedback('No active staff members found.');
      return;
    }
    const records = activeStaff.map((emp) => ({
      date: selectedAttendanceDate,
      employeeId: emp.id,
      employeeName: emp.name,
      inTime: '10:00 AM',
      outTime: '11:00 PM',
      totalHours: 11,
      status: 'Present' as AttendanceStatus,
      overtimeHours: 0,
    }));
    batchRecordAttendance(records);
    showFeedback(`Marked all ${records.length} staff members Present for ${formatDateDisplay(selectedAttendanceDate)}.`);
  };

  // 1-Click: Quick Fill Whole Month Present for All Active Staff
  const handleQuickFillMonthPresent = (targetMonth: string, sundaysAsWeeklyOff = true) => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');
    if (activeStaff.length === 0) {
      showFeedback('No active staff members found.');
      return;
    }
    const [yStr, mStr] = targetMonth.split('-');
    const year = parseInt(yStr, 10);
    const monthNum = parseInt(mStr, 10);
    const totalDays = new Date(year, monthNum, 0).getDate();

    const records: Omit<StaffAttendance, 'id'>[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${targetMonth}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, monthNum - 1, day).getDay(); // 0 is Sunday
      const status: AttendanceStatus = (sundaysAsWeeklyOff && dayOfWeek === 0) ? 'Weekly Off' : 'Present';

      activeStaff.forEach((emp) => {
        records.push({
          date: dateStr,
          employeeId: emp.id,
          employeeName: emp.name,
          inTime: '10:00 AM',
          outTime: '11:00 PM',
          totalHours: status === 'Weekly Off' ? 0 : 11,
          status,
          overtimeHours: 0,
        });
      });
    }

    batchRecordAttendance(records);
    showFeedback(`Successfully marked whole month attendance (${records.length} records for ${activeStaff.length} staff) in ${formatMonthDisplay(targetMonth)}.`);
  };

  // 1-Click: Quick Fill Month for Single Employee
  const handleFillSingleStaffMonth = (empId: string, month: string, sundaysOff = true) => {
    const emp = staffEmployees.find((e) => e.id === empId);
    if (!emp) return;

    const [yStr, mStr] = month.split('-');
    const year = parseInt(yStr, 10);
    const monthNum = parseInt(mStr, 10);
    const totalDays = new Date(year, monthNum, 0).getDate();

    const records: Omit<StaffAttendance, 'id'>[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
      const status: AttendanceStatus = (sundaysOff && dayOfWeek === 0) ? 'Weekly Off' : 'Present';

      records.push({
        date: dateStr,
        employeeId: emp.id,
        employeeName: emp.name,
        inTime: '10:00 AM',
        outTime: '11:00 PM',
        totalHours: status === 'Weekly Off' ? 0 : 11,
        status,
        overtimeHours: 0,
      });
    }
    batchRecordAttendance(records);
    showFeedback(`Filled ${totalDays} days attendance for ${emp.name} in ${formatMonthDisplay(month)}.`);
  };

  // 1-Click: Mark All Staff Present on specific single date (from table header click)
  const handleFillDayPresent = (dateStr: string) => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');
    if (activeStaff.length === 0) return;
    const records = activeStaff.map((emp) => ({
      date: dateStr,
      employeeId: emp.id,
      employeeName: emp.name,
      inTime: '10:00 AM',
      outTime: '11:00 PM',
      totalHours: 11,
      status: 'Present' as AttendanceStatus,
      overtimeHours: 0,
    }));
    batchRecordAttendance(records);
    showFeedback(`Marked all ${activeStaff.length} active staff Present for ${formatDateDisplay(dateStr)}.`);
  };

  // Bulk Present Toggle (Marks all active employees as Present or Toggles Off for target date)
  const handleToggleBulkPresentForDate = (dateStr: string) => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');
    if (activeStaff.length === 0) {
      showFeedback('No active staff members found.');
      return;
    }
    const allPresent = activeStaff.every((emp) => {
      const rec = staffAttendance.find((a) => a.date === dateStr && a.employeeId === emp.id);
      return rec && rec.status === 'Present';
    });

    if (allPresent) {
      // Toggle off -> switch to Weekly Off / Unmark
      const records = activeStaff.map((emp) => ({
        date: dateStr,
        employeeId: emp.id,
        employeeName: emp.name,
        inTime: '10:00 AM',
        outTime: '11:00 PM',
        totalHours: 0,
        status: 'Weekly Off' as AttendanceStatus,
        overtimeHours: 0,
      }));
      batchRecordAttendance(records);
      showFeedback(`Bulk Present toggled OFF: Set active staff to Weekly Off on ${formatDateDisplay(dateStr)}.`);
    } else {
      // Toggle on -> Mark all Present
      const records = activeStaff.map((emp) => ({
        date: dateStr,
        employeeId: emp.id,
        employeeName: emp.name,
        inTime: '10:00 AM',
        outTime: '11:00 PM',
        totalHours: 11,
        status: 'Present' as AttendanceStatus,
        overtimeHours: 0,
      }));
      batchRecordAttendance(records);
      showFeedback(`Bulk Present toggled ON: Marked all ${records.length} active staff Present on ${formatDateDisplay(dateStr)}.`);
    }
  };

  // Navigation helpers for Monthly Attendance Grid
  const handlePrevMonth = () => {
    const [yStr, mStr] = attendanceMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setAttendanceMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = attendanceMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setAttendanceMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    const d = new Date();
    setAttendanceMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Apply Advanced Bulk Attendance
  const handleApplyBulkMonthAttendance = () => {
    const activeStaffList = staffEmployees.filter((e) => e.status === 'Active');
    const targetStaffIds = bulkSelectedStaff.length > 0
      ? bulkSelectedStaff
      : activeStaffList.map((e) => e.id);

    const activeStaff = staffEmployees.filter((e) => targetStaffIds.includes(e.id));
    if (activeStaff.length === 0) {
      showToast('Please select at least one staff member.', 'warning');
      return;
    }

    const [yStr, mStr] = bulkMonth.split('-');
    const year = parseInt(yStr, 10);
    const monthNum = parseInt(mStr, 10);
    const totalDays = new Date(year, monthNum, 0).getDate();

    const startDay = bulkPattern === 'custom_range' ? Math.max(1, Math.min(bulkCustomStart, totalDays)) : 1;
    const endDay = bulkPattern === 'custom_range' ? Math.max(startDay, Math.min(bulkCustomEnd, totalDays)) : totalDays;

    const records: Omit<StaffAttendance, 'id'>[] = [];

    for (let day = startDay; day <= endDay; day++) {
      const dateStr = `${bulkMonth}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
      let status: AttendanceStatus = bulkStatus;

      if (bulkPattern === 'present_mon_sat') {
        status = dayOfWeek === 0 ? bulkSundayStatus : bulkStatus;
      }

      activeStaff.forEach((emp) => {
        records.push({
          date: dateStr,
          employeeId: emp.id,
          employeeName: emp.name,
          inTime: bulkInTime,
          outTime: bulkOutTime,
          totalHours: status === 'Weekly Off' || status === 'Absent' ? 0 : bulkHours,
          status,
          overtimeHours: bulkOT,
        });
      });
    }

    batchRecordAttendance(records);
    setShowBulkModal(false);
    showFeedback(`Bulk attendance applied: ${records.length} records saved for ${activeStaff.length} staff across ${endDay - startDay + 1} days in ${formatMonthDisplay(bulkMonth)}.`);
  };

  // Submit Advance
  const handleSubmitAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(advanceAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid advance amount.', 'warning');
      return;
    }
    const emp = staffEmployees.find((e) => e.id === advanceEmpId);
    if (!emp) {
      showToast('Please select an employee.', 'warning');
      return;
    }

    addStaffAdvance({
      date: advanceDate || getTodayDateString(),
      employeeId: emp.id,
      employeeName: emp.name,
      type: advanceType,
      amount: amt,
      description: advanceDescription.trim() || `${advanceType} requested by staff`,
      paymentMode: advancePaymentMode,
      recoveryStatus: 'Pending',
      recoveredAmount: 0,
    });

    setShowAdvanceModal(false);
    setAdvanceEmpId('');
    setAdvanceDate(getTodayDateString());
    setAdvanceAmount('');
    setAdvanceDescription('');
    showFeedback(`Issued ${advanceType} of ${formatINR(amt)} to ${emp.name} for ${formatDateDisplay(advanceDate || getTodayDateString())}.`);
  };

  // Month navigation helpers for Advance & Drawings filter
  const handleAdvancePrevMonth = () => {
    const [yStr, mStr] = advanceSelectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setAdvanceSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    setAdvanceFilterPeriod('custom-month');
  };

  const handleAdvanceNextMonth = () => {
    const [yStr, mStr] = advanceSelectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setAdvanceSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
    setAdvanceFilterPeriod('custom-month');
  };

  const handleAdvanceCurrentMonth = () => {
    const d = new Date();
    const curMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setAdvanceSelectedMonth(curMonth);
    setAdvanceFilterPeriod('this-month');
  };

  // Filtered Staff Advances & Drawings with Date / Month wise precision
  const filteredStaffAdvances = useMemo(() => {
    const currentMonthStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const prevMonthStr = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const todayStr = getTodayDateString();
    const yesterdayStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    return staffAdvances.filter((adv) => {
      // 1. Period / Date / Month Filter
      if (advanceFilterPeriod === 'this-month') {
        if (!isDateInSelectedMonth(adv.date, currentMonthStr)) return false;
      } else if (advanceFilterPeriod === 'previous-month') {
        if (!isDateInSelectedMonth(adv.date, prevMonthStr)) return false;
      } else if (advanceFilterPeriod === 'custom-month') {
        if (!isDateInSelectedMonth(adv.date, advanceSelectedMonth)) return false;
      } else if (advanceFilterPeriod === 'custom-range') {
        if (!isDateBetweenRange(adv.date, advanceCustomStartDate, advanceCustomEndDate)) return false;
      } else if (advanceFilterPeriod === 'today') {
        if (adv.date !== todayStr) return false;
      } else if (advanceFilterPeriod === 'yesterday') {
        if (adv.date !== yesterdayStr) return false;
      }

      // 2. Staff filter
      if (advanceStaffFilter !== 'all' && adv.employeeId !== advanceStaffFilter) {
        return false;
      }

      // 3. Type filter
      if (advanceTypeFilter !== 'all' && adv.type !== advanceTypeFilter) {
        return false;
      }

      // 4. Recovery status filter
      if (advanceRecoveryFilter !== 'all' && adv.recoveryStatus !== advanceRecoveryFilter) {
        return false;
      }

      // 5. Search Query
      if (advanceSearchQuery.trim()) {
        const q = advanceSearchQuery.toLowerCase();
        const matchName = (adv.employeeName || '').toLowerCase().includes(q);
        const matchDesc = (adv.description || '').toLowerCase().includes(q);
        const matchMode = (adv.paymentMode || '').toLowerCase().includes(q);
        const matchType = (adv.type || '').toLowerCase().includes(q);
        const matchAmt = String(adv.amount).includes(q);
        if (!matchName && !matchDesc && !matchMode && !matchType && !matchAmt) return false;
      }

      return true;
    });
  }, [
    staffAdvances,
    advanceFilterPeriod,
    advanceSelectedMonth,
    advanceCustomStartDate,
    advanceCustomEndDate,
    advanceStaffFilter,
    advanceTypeFilter,
    advanceRecoveryFilter,
    advanceSearchQuery,
  ]);

  // Statistics for Filtered Advances & Drawings
  const advanceStats = useMemo(() => {
    const totalIssued = filteredStaffAdvances.reduce((sum, a) => sum + a.amount, 0);
    const totalRecovered = filteredStaffAdvances.reduce((sum, a) => sum + (a.recoveredAmount || 0), 0);
    const totalPending = filteredStaffAdvances
      .filter((a) => a.recoveryStatus !== 'Fully Recovered')
      .reduce((sum, a) => sum + Math.max(0, a.amount - (a.recoveredAmount || 0)), 0);
    const totalDrawings = filteredStaffAdvances
      .filter((a) => a.type === 'Staff Drawing')
      .reduce((sum, a) => sum + a.amount, 0);
    const totalSalaryAdvances = filteredStaffAdvances
      .filter((a) => a.type === 'Salary Advance')
      .reduce((sum, a) => sum + a.amount, 0);

    return {
      count: filteredStaffAdvances.length,
      totalIssued,
      totalRecovered,
      totalPending,
      totalDrawings,
      totalSalaryAdvances,
    };
  }, [filteredStaffAdvances]);

  // Export Filtered Advances to PDF
  const handleExportAdvancesPDF = () => {
    const periodLabel =
      advanceFilterPeriod === 'custom-month'
        ? formatMonthDisplay(advanceSelectedMonth)
        : advanceFilterPeriod === 'custom-range'
        ? `${formatDateDisplay(advanceCustomStartDate)} to ${formatDateDisplay(advanceCustomEndDate)}`
        : advanceFilterPeriod;

    const rows = filteredStaffAdvances.map((adv, idx) => ({
      transactionId: `ADV-${idx + 1}`,
      date: formatDateDisplay(adv.date),
      employeeName: adv.employeeName,
      type: adv.type,
      description: adv.description || '-',
      paymentMode: adv.paymentMode,
      amount: formatINR(adv.amount),
      recoveredAmount: formatINR(adv.recoveredAmount || 0),
      balance: formatINR(Math.max(0, adv.amount - (adv.recoveredAmount || 0))),
      recoveryStatus: adv.recoveryStatus,
    }));

    onOpenPdfExport(
      `Staff Advances & Drawings Report (${periodLabel})`,
      rows,
      {
        'Total Advances & Drawings': formatINR(advanceStats.totalIssued),
        'Total Recovered': formatINR(advanceStats.totalRecovered),
        'Pending Recovery Balance': formatINR(advanceStats.totalPending),
        'Total Records': advanceStats.count,
      }
    );
  };

  // Export Filtered Advances to Excel
  const handleExportAdvancesExcel = () => {
    const periodLabel =
      advanceFilterPeriod === 'custom-month'
        ? advanceSelectedMonth
        : advanceFilterPeriod === 'custom-range'
        ? `${advanceCustomStartDate}_to_${advanceCustomEndDate}`
        : advanceFilterPeriod;

    const rows = filteredStaffAdvances.map((adv, idx) => ({
      ID: `ADV-${idx + 1}`,
      Date: formatDateDisplay(adv.date),
      'Staff Name': adv.employeeName,
      Type: adv.type,
      Description: adv.description || '-',
      'Payment Mode': adv.paymentMode,
      'Amount (₹)': adv.amount,
      'Recovered Amount (₹)': adv.recoveredAmount || 0,
      'Pending Balance (₹)': Math.max(0, adv.amount - (adv.recoveredAmount || 0)),
      'Recovery Status': adv.recoveryStatus,
    }));

    onOpenExcelExport(`Staff_Advances_Drawings_${periodLabel}`, rows);
  };

  // Run Monthly Salary Calculation Engine (Atomic Batch Calculation for All or Selected Staff)
  const handleCalculatePayroll = (empIdToCalc?: string) => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');
    if (activeStaff.length === 0) {
      showFeedback('No active staff members found.');
      return;
    }

    const targetId = empIdToCalc !== undefined ? empIdToCalc : selectedPayrollEmpId;
    const targetStaff =
      targetId === 'all'
        ? activeStaff
        : activeStaff.filter((e) => e.id === targetId);

    if (targetStaff.length === 0) {
      showFeedback('Selected staff member not found among active staff.');
      return;
    }

    const calcs = targetStaff.map((emp) => calculateMonthlySalary(emp.id, payrollMonth));
    batchSaveSalaryCalculations(calcs);

    if (targetId === 'all') {
      showFeedback(`Calculated & refreshed payroll for all ${calcs.length} active staff members for ${formatMonthDisplay(payrollMonth)}.`);
    } else {
      showFeedback(`Calculated & refreshed payroll for ${targetStaff[0].name} for ${formatMonthDisplay(payrollMonth)}.`);
    }
  };

  // Filtered & Real-Time Live Payroll Calculations
  const currentMonthCalculations = useMemo(() => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');

    // Live calculation for all active staff (reconciling with any saved Paid or Draft records)
    const staffCalculations = activeStaff.map((emp) => {
      const stored = salaryCalculations.find(
        (s) => s.employeeId === emp.id && s.month === payrollMonth
      );
      if (stored) {
        if (stored.status === 'Paid') {
          return stored;
        }
        // If Draft, dynamically compute real-time salary so attendance changes reflect instantly
        const live = calculateMonthlySalary(emp.id, payrollMonth);
        return {
          ...live,
          id: stored.id,
          status: 'Draft' as const,
          paymentMode: stored.paymentMode,
          paymentDate: stored.paymentDate,
          createdAt: stored.createdAt,
        };
      }
      // If not yet saved in state, compute live real-time draft on the fly
      return calculateMonthlySalary(emp.id, payrollMonth);
    });

    // Also include any resigned/inactive staff calculations already saved for this month
    const extraCalculations = salaryCalculations.filter(
      (s) => s.month === payrollMonth && !activeStaff.some((e) => e.id === s.employeeId)
    );

    return [...staffCalculations, ...extraCalculations];
  }, [staffEmployees, salaryCalculations, payrollMonth, staffAttendance, staffAdvances, calculateMonthlySalary]);

  // Active Staff whose calculation has not been explicitly saved to database
  const unsavedPayrollStaff = useMemo(() => {
    const activeStaff = staffEmployees.filter((e) => e.status === 'Active');
    return activeStaff.filter(
      (emp) => !salaryCalculations.some((c) => c.employeeId === emp.id && c.month === payrollMonth)
    );
  }, [staffEmployees, salaryCalculations, payrollMonth]);

  const payrollTotals = useMemo(() => {
    return currentMonthCalculations.reduce(
      (acc, s) => {
        acc.gross += s.grossSalary;
        acc.deductions += s.advancesDeduction + s.drawingsDeduction + s.otherDeductions;
        acc.net += s.netSalary;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0 }
    );
  }, [currentMonthCalculations]);

  // Live synced slips for printable slip and audit breakdown modals
  const activeViewSlip = useMemo(() => {
    if (!viewSalarySlip) return null;
    const found = currentMonthCalculations.find(
      (c) => c.id === viewSalarySlip.id || (c.employeeId === viewSalarySlip.employeeId && c.month === viewSalarySlip.month)
    );
    return found || viewSalarySlip;
  }, [viewSalarySlip, currentMonthCalculations]);

  const activeAuditSlip = useMemo(() => {
    if (!auditSalarySlip) return null;
    const found = currentMonthCalculations.find(
      (c) => c.id === auditSalarySlip.id || (c.employeeId === auditSalarySlip.employeeId && c.month === auditSalarySlip.month)
    );
    return found || auditSalarySlip;
  }, [auditSalarySlip, currentMonthCalculations]);

  if (isLoading) {
    return <StaffSkeleton activeTab={activeSubTab} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black tracking-wide text-slate-100 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-cyan-400" />
            <span>Staff & Payroll Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Employees roster, daily attendance register, advances/drawings & automated salary slip calculations
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="glass rounded-xl p-1 flex items-center flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'employees'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff Directory ({staffEmployees.length})
          </button>
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'attendance'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setActiveSubTab('advances')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'advances'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Advances & Drawings
          </button>
          <button
            onClick={() => setActiveSubTab('payroll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'payroll'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly Salary Engine
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: EMPLOYEES DIRECTORY */}
      {activeSubTab === 'employees' && (() => {
        const activeCount = staffEmployees.filter((e) => e.status === 'Active').length;
        const resignedCount = staffEmployees.filter((e) => e.status === 'Resigned').length;

        const displayedEmployees = staffEmployees.filter((emp) => {
          if (employeeFilterStatus === 'Active') return emp.status === 'Active';
          if (employeeFilterStatus === 'Resigned') return emp.status === 'Resigned';
          return true;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-white/10 shadow-inner">
                <button
                  onClick={() => setEmployeeFilterStatus('Active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    employeeFilterStatus === 'Active'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active Staff ({activeCount})
                </button>
                <button
                  onClick={() => setEmployeeFilterStatus('Resigned')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    employeeFilterStatus === 'Resigned'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Resigned Staff ({resignedCount})
                </button>
                <button
                  onClick={() => setEmployeeFilterStatus('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    employeeFilterStatus === 'All'
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({staffEmployees.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCustomAttendanceModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 shadow-md"
                  title="Open Custom Attendance Setup"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Custom Attendance Setup</span>
                </button>

                <button
                  onClick={() => {
                    handleResetEmpForm();
                    setShowAddEmployeeModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  <UserPlus className="h-4 w-4 stroke-[2.5]" />
                  <span>Add New Staff</span>
                </button>
              </div>
            </div>

            {displayedEmployees.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <p className="text-sm font-semibold">No {employeeFilterStatus.toLowerCase()} staff members found.</p>
                {employeeFilterStatus === 'Resigned' && (
                  <p className="text-xs text-slate-500">
                    When employees leave, clicking &quot;Mark Resigned&quot; keeps their entire salary and attendance history safe.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedEmployees.map((emp) => {
                  const isResigned = emp.status === 'Resigned';

                  return (
                    <div
                      key={emp.id}
                      className={`glass-card rounded-2xl p-4 border space-y-3 relative group transition-all ${
                        isResigned
                          ? 'border-amber-500/30 bg-slate-900/60'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono-num font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                            {emp.employeeId}
                          </span>
                          <h3 className="font-display text-base font-bold text-slate-100 mt-1">
                            {emp.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            {emp.designation} • {emp.department}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            emp.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Salary Model:</span>
                          <span className="font-semibold text-slate-200">
                            {emp.salaryType} ({formatINR(emp.basicSalary)})
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Contact:</span>
                          <span className="text-slate-300">{emp.mobile}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Joined:</span>
                          <span className="text-slate-300">{formatDateDisplay(emp.joiningDate)}</span>
                        </div>

                        {isResigned && (
                          <>
                            <div className="flex justify-between text-amber-300 font-medium border-t border-white/5 pt-1">
                              <span>Resigned On:</span>
                              <span>{formatDateDisplay(emp.resignationDate)}</span>
                            </div>
                            {emp.resignationReason && (
                              <div className="text-[11px] text-slate-400 truncate">
                                <span className="text-slate-500">Reason:</span> {emp.resignationReason}
                              </div>
                            )}
                          </>
                        )}

                        {emp.bankDetails?.upiId && (
                          <div className="flex justify-between text-slate-400">
                            <span>UPI:</span>
                            <span className="font-mono-num text-cyan-400">{emp.bankDetails.upiId}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          {isResigned ? (
                            <>
                              <button
                                onClick={() => setViewResignationEmp(emp)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[11px] font-bold border border-amber-500/30 transition-colors"
                                title="View Resignation & Settlement Details"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  reactivateStaffEmployee(emp.id);
                                  showFeedback(`Re-activated ${emp.name} to Active staff list.`);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-bold border border-emerald-500/30 transition-colors"
                                title="Reactivate Staff"
                              >
                                <UserCheck className="h-3 w-3" />
                                <span>Rehire</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setIndividualAttEmp(emp)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[11px] font-bold border border-cyan-500/30 transition-colors"
                                title="Custom Attendance Calendar"
                              >
                                <Calendar className="h-3 w-3" />
                                <span>Attendance</span>
                              </button>
                              <button
                                onClick={() => setResigningEmp(emp)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-slate-950 text-[11px] font-bold border border-rose-500/30 transition-colors"
                                title="Mark as Resigned (Preserves History)"
                              >
                                <UserX className="h-3 w-3" />
                                <span>Resign</span>
                              </button>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditEmp(emp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Edit Employee"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() =>
                              onConfirmDelete(
                                'Remove Staff Employee',
                                `Are you sure you want to permanently delete ${emp.name}? Tip: If the employee resigned, mark them as 'Resigned' instead to preserve historical records.`,
                                () => deleteStaffEmployee(emp.id)
                              )
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                            title="Delete Staff"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* SUB-TAB 2: ATTENDANCE REGISTER & MONTHLY MANAGER */}
      {activeSubTab === 'attendance' && (() => {
        const todayStr = getTodayDateString();
        const activeEmployees = staffEmployees.filter((e) => e.status === 'Active');
        const activeTargetDate = attendanceViewMode === 'daily' ? selectedAttendanceDate : todayStr;
        const presentActiveCount = activeEmployees.filter((emp) => {
          const r = staffAttendance.find((a) => a.date === activeTargetDate && a.employeeId === emp.id);
          return r && r.status === 'Present';
        }).length;
        const isAllPresentOnTarget = activeEmployees.length > 0 && presentActiveCount === activeEmployees.length;

        // Month parsing
        const [yStr, mStr] = attendanceMonth.split('-');
        const year = parseInt(yStr, 10);
        const monthNum = parseInt(mStr, 10);
        const totalDaysInMonth = new Date(year, monthNum, 0).getDate();
        const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

        // Filter employees for monthly grid
        const filteredEmployees = staffEmployees.filter((emp) => {
          if (!monthSearchQuery.trim()) return true;
          const q = monthSearchQuery.toLowerCase();
          return (
            emp.name.toLowerCase().includes(q) ||
            emp.designation.toLowerCase().includes(q) ||
            emp.employeeId.toLowerCase().includes(q) ||
            emp.department.toLowerCase().includes(q)
          );
        });

        return (
          <div className="space-y-4">
            {/* Feedback banner */}
            {attendanceFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>{attendanceFeedback}</span>
                </div>
                <button
                  onClick={() => setAttendanceFeedback(null)}
                  className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-0.5"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Top Control Bar with Bulk Present Toggle & View Modes */}
            <div className="glass-card rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 shadow-xl">
              {/* Left: View Mode Switch & Navigation */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Segmented Mode Switch */}
                <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-white/10 shadow-inner">
                  <button
                    onClick={() => setAttendanceViewMode('monthly_matrix')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      attendanceViewMode === 'monthly_matrix'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Monthly Grid (All Staff)</span>
                  </button>
                  <button
                    onClick={() => setAttendanceViewMode('daily')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      attendanceViewMode === 'daily'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Daily Register</span>
                  </button>
                </div>

                {/* Date / Month Controls */}
                {attendanceViewMode === 'monthly_matrix' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <input
                      type="month"
                      value={attendanceMonth}
                      onChange={(e) => setAttendanceMonth(e.target.value)}
                      className="glass-input px-3 py-1.5 text-xs text-slate-200 font-bold"
                    />
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCurrentMonth}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-cyan-400 border border-cyan-500/20"
                    >
                      Current
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Date:</span>
                    <input
                      type="date"
                      value={selectedAttendanceDate}
                      onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                      className="glass-input px-3 py-1.5 text-xs text-slate-200 font-bold"
                    />
                    <button
                      onClick={() => setSelectedAttendanceDate(todayStr)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-cyan-400"
                    >
                      Today
                    </button>
                  </div>
                )}
              </div>

              {/* Right: BULK PRESENT TOGGLE & Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* INTERACTIVE BULK PRESENT TOGGLE SWITCH */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-inner">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAllPresentOnTarget ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                      Bulk Present ({attendanceViewMode === 'daily' ? formatDateDisplay(selectedAttendanceDate) : 'Today'})
                    </span>
                    <span className="text-[9.5px] font-mono-num text-slate-400">
                      {isAllPresentOnTarget
                        ? `All ${activeEmployees.length} Staff Present`
                        : `${presentActiveCount}/${activeEmployees.length} Present`}
                    </span>
                  </div>

                  {/* Toggle Switch Button */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAllPresentOnTarget}
                    onClick={() => handleToggleBulkPresentForDate(activeTargetDate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAllPresentOnTarget
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={
                      isAllPresentOnTarget
                        ? 'Click to toggle Bulk Present off'
                        : `Click to mark all ${activeEmployees.length} active staff Present for ${formatDateDisplay(activeTargetDate)}`
                    }
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isAllPresentOnTarget ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Validated Single Entry Button */}
                <button
                  onClick={() => handleOpenRecordAttendance()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 transition-transform active:scale-95"
                  title="Log single attendance entry with duplicate checking & mandatory field validation"
                >
                  <UserCheck className="h-4 w-4 stroke-[2.5]" />
                  <span>Record Attendance</span>
                </button>

                {/* Fill Whole Month Present Button */}
                <button
                  onClick={() => {
                    const target = attendanceViewMode === 'daily'
                      ? selectedAttendanceDate.substring(0, 7)
                      : attendanceMonth;
                    handleQuickFillMonthPresent(target, true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 transition-transform active:scale-95"
                  title="Fill whole month present with Sundays as Weekly Off"
                >
                  <Zap className="h-4 w-4 fill-slate-950" />
                  <span>Fill Whole Month</span>
                </button>

                {/* Advanced Bulk Attendance Tool */}
                <button
                  onClick={() => {
                    setBulkMonth(
                      attendanceViewMode === 'daily'
                        ? selectedAttendanceDate.substring(0, 7)
                        : attendanceMonth
                    );
                    setBulkSelectedStaff(activeEmployees.map((e) => e.id));
                    setShowBulkModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-transform active:scale-95"
                  title="Open Advanced Bulk Attendance Tool"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Bulk Tool</span>
                </button>
              </div>
            </div>

            {/* VIEW MODE 1: MONTHLY ATTENDANCE SHEET (SCROLLABLE GRID VIEW) */}
            {attendanceViewMode === 'monthly_matrix' && (
              <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl space-y-3 p-4">
                {/* Header with Search and Status Legend */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative w-56 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search staff in monthly grid..."
                        value={monthSearchQuery}
                        onChange={(e) => setMonthSearchQuery(e.target.value)}
                        className="w-full glass-input pl-9 pr-3 py-1.5 text-xs text-slate-200 rounded-xl"
                      />
                      {monthSearchQuery && (
                        <button
                          onClick={() => setMonthSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 hidden md:inline">
                      Showing {filteredEmployees.length} of {staffEmployees.length} staff
                    </span>
                  </div>

                  {/* Interactive Status Legend */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-300">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/30 text-emerald-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> P (Present)
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-500/30 text-cyan-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm" /> WO (Weekly Off)
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-500/30 text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> HD (Half Day)
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-500/30 text-rose-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" /> A (Absent)
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-500/30 text-purple-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm" /> L (Leave)
                    </span>
                  </div>
                </div>

                {/* SCROLLABLE GRID CONTAINER WITH STICKY HEADERS AND COLUMNS */}
                <div className="overflow-x-auto overflow-y-auto max-h-[620px] rounded-2xl border border-white/10 bg-slate-950/50 scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse min-w-max">
                    <thead className="bg-slate-950/95 text-slate-400 uppercase text-[9.5px] tracking-wider font-bold sticky top-0 z-30 backdrop-blur-md border-b border-white/10">
                      <tr>
                        {/* Sticky Employee Name Column */}
                        <th className="px-3.5 py-3 sticky left-0 z-40 bg-slate-950 min-w-[150px] border-r border-white/10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                          Staff Member
                        </th>

                        {/* All Days 1..31 Columns */}
                        {daysArray.map((day) => {
                          const dateObj = new Date(year, monthNum - 1, day);
                          const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dateObj.getDay()];
                          const isSun = dateObj.getDay() === 0;
                          const dateStr = `${attendanceMonth}-${String(day).padStart(2, '0')}`;
                          const isCurrentToday = dateStr === todayStr;

                          return (
                            <th
                              key={day}
                              onClick={() => handleFillDayPresent(dateStr)}
                              title={`Click to mark all staff Present on ${formatDateDisplay(dateStr)}`}
                              className={`px-1 py-2 text-center min-w-[32px] border-r border-white/5 cursor-pointer transition-colors group ${
                                isCurrentToday
                                  ? 'bg-cyan-950/80 text-cyan-300 ring-1 ring-cyan-500/50'
                                  : isSun
                                  ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                                  : 'hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="font-mono-num font-black text-[11px] group-hover:text-emerald-400 transition-colors">
                                {day}
                              </div>
                              <div
                                className={`text-[8.5px] ${
                                  isSun
                                    ? 'font-black text-amber-400'
                                    : isCurrentToday
                                    ? 'font-black text-cyan-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {dayName}
                              </div>
                            </th>
                          );
                        })}

                        {/* Monthly Summary Columns */}
                        <th className="px-2 py-3 text-center bg-emerald-950/50 text-emerald-400 min-w-[46px] border-l border-white/10" title="Present Days">
                          P
                        </th>
                        <th className="px-2 py-3 text-center bg-cyan-950/50 text-cyan-400 min-w-[46px]" title="Weekly Offs">
                          WO
                        </th>
                        <th className="px-2 py-3 text-center bg-amber-950/50 text-amber-400 min-w-[46px]" title="Half Days">
                          HD
                        </th>
                        <th className="px-2 py-3 text-center bg-rose-950/50 text-rose-400 min-w-[46px]" title="Absent Days">
                          A
                        </th>
                        <th className="px-2 py-3 text-center bg-purple-950/50 text-purple-400 min-w-[46px]" title="Paid Leaves">
                          L
                        </th>
                        <th className="px-2 py-3 text-center bg-blue-950/50 text-blue-300 min-w-[52px]" title="Total Overtime Hours">
                          OT (h)
                        </th>
                        <th className="px-2.5 py-3 text-center bg-teal-950/60 text-teal-300 min-w-[62px] font-black" title="Effective Payable Days">
                          Pay Days
                        </th>
                        <th className="px-3 py-3 text-center min-w-[105px]">
                          Quick Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={totalDaysInMonth + 9} className="px-4 py-12 text-center text-slate-500">
                            No employees found matching &quot;{monthSearchQuery}&quot;.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const empRecords = staffAttendance.filter(
                            (a) => a.employeeId === emp.id && a.date.startsWith(attendanceMonth)
                          );
                          let presentCount = 0;
                          let offCount = 0;
                          let absentCount = 0;
                          let halfCount = 0;
                          let leaveCount = 0;
                          let totalOT = 0;

                          empRecords.forEach((r) => {
                            if (r.status === 'Present') presentCount++;
                            else if (r.status === 'Weekly Off') offCount++;
                            else if (r.status === 'Absent') absentCount++;
                            else if (r.status === 'Half Day') halfCount++;
                            else if (r.status === 'Leave') leaveCount++;
                            if (r.overtimeHours) totalOT += r.overtimeHours;
                          });

                          const payableDays = presentCount + offCount + leaveCount + halfCount * 0.5;

                          return (
                            <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors group">
                              {/* Sticky Employee Name Column */}
                              <td className="px-3.5 py-2.5 sticky left-0 z-20 bg-slate-900/95 border-r border-white/10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                                <div className="font-bold text-slate-100 truncate max-w-[140px]" title={emp.name}>
                                  {emp.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400">
                                  <span className="font-mono-num text-cyan-400">{emp.employeeId}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[80px]">{emp.designation}</span>
                                </div>
                              </td>

                              {/* Days 1..31 Cells */}
                              {daysArray.map((day) => {
                                const dateStr = `${attendanceMonth}-${String(day).padStart(2, '0')}`;
                                const record = staffAttendance.find(
                                  (a) => a.date === dateStr && a.employeeId === emp.id
                                );
                                const status = record?.status;
                                const otHours = record?.overtimeHours || 0;
                                const dateObj = new Date(year, monthNum - 1, day);
                                const isSun = dateObj.getDay() === 0;
                                const isCurrentToday = dateStr === todayStr;

                                const nextStatusMap: Record<string, AttendanceStatus> = {
                                  'Present': 'Weekly Off',
                                  'Weekly Off': 'Half Day',
                                  'Half Day': 'Absent',
                                  'Absent': 'Leave',
                                  'Leave': 'Present',
                                };

                                return (
                                  <td
                                    key={day}
                                    onClick={() => {
                                      const nextStatus = status
                                        ? nextStatusMap[status]
                                        : isSun
                                        ? 'Weekly Off'
                                        : 'Present';
                                      handleSetAttendanceStatus(emp.id, emp.name, nextStatus, otHours, dateStr);
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      setQuickCellPopover({
                                        empId: emp.id,
                                        empName: emp.name,
                                        date: dateStr,
                                        status: status || (isSun ? 'Weekly Off' : 'Present'),
                                        otHours,
                                      });
                                    }}
                                    className={`p-1 text-center border-r border-white/5 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
                                      isCurrentToday
                                        ? 'bg-cyan-950/30'
                                        : isSun
                                        ? 'bg-amber-950/15'
                                        : ''
                                    }`}
                                    title={`${emp.name} on ${formatDateDisplay(dateStr)}: ${
                                      status || 'Not Marked'
                                    }${otHours > 0 ? ` (+${otHours}h OT)` : ''} (Click to cycle status, right-click for options)`}
                                  >
                                    <div className="flex flex-col items-center justify-center">
                                      {status === 'Present' && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] shadow-sm">
                                          P
                                        </span>
                                      )}
                                      {status === 'Weekly Off' && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 font-black text-[9px] shadow-sm">
                                          WO
                                        </span>
                                      )}
                                      {status === 'Half Day' && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[9px] shadow-sm">
                                          HD
                                        </span>
                                      )}
                                      {status === 'Absent' && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500 text-white font-black text-[10px] shadow-sm">
                                          A
                                        </span>
                                      )}
                                      {status === 'Leave' && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-purple-500 text-white font-black text-[10px] shadow-sm">
                                          L
                                        </span>
                                      )}
                                      {!status && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/80 text-slate-500 font-bold text-[10px] hover:bg-slate-700 hover:text-slate-300">
                                          -
                                        </span>
                                      )}
                                      {otHours > 0 && (
                                        <span className="text-[8px] font-mono-num font-black text-cyan-300 mt-0.5 leading-none">
                                          +{otHours}h
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Summary Counters */}
                              <td className="px-2 py-2 text-center font-bold text-emerald-400 bg-emerald-950/25 font-mono-num border-l border-white/10">
                                {presentCount}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-cyan-400 bg-cyan-950/25 font-mono-num">
                                {offCount}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-amber-400 bg-amber-950/25 font-mono-num">
                                {halfCount}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-rose-400 bg-rose-950/25 font-mono-num">
                                {absentCount}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-purple-400 bg-purple-950/25 font-mono-num">
                                {leaveCount}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-blue-300 bg-blue-950/25 font-mono-num">
                                {totalOT > 0 ? `${totalOT}h` : '-'}
                              </td>
                              <td className="px-2.5 py-2 text-center font-black text-teal-300 bg-teal-950/40 font-mono-num text-[11.5px]">
                                {payableDays}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setIndividualAttEmp(emp)}
                                    className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-[10.5px] border border-cyan-500/30 shadow transition-transform active:scale-95 flex items-center gap-1"
                                    title="Open individual monthly attendance editor"
                                  >
                                    <Calendar className="h-3 w-3" />
                                    <span>Custom</span>
                                  </button>
                                  <button
                                    onClick={() => handleFillSingleStaffMonth(emp.id, attendanceMonth, true)}
                                    className="px-2 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[10.5px] shadow transition-transform active:scale-95"
                                    title="Fill entire month present for this employee"
                                  >
                                    Fill Month
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Tip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>
                      <strong className="text-slate-300">Quick Tips:</strong> Click any cell to cycle status (P → WO → HD → A → L). Click any day column header to mark all staff Present for that date.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setBulkMonth(attendanceMonth);
                      setBulkSelectedStaff(activeEmployees.map((e) => e.id));
                      setShowBulkModal(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                  >
                    Configure Advanced Patterns & Date Ranges →
                  </button>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: DAILY ATTENDANCE REGISTER */}
            {attendanceViewMode === 'daily' && (
              <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-slate-950/40">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">
                      Daily Attendance for {formatDateDisplay(selectedAttendanceDate)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Set individual arrival status, hours, and daily overtime for each staff member
                    </p>
                  </div>
                  <button
                    onClick={handleMarkAllPresent}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark All Present ({activeEmployees.length})</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3.5">Staff Name</th>
                        <th className="px-4 py-3.5">Role</th>
                        <th className="px-4 py-3.5">Salary Type</th>
                        <th className="px-4 py-3.5 text-center">Status on {formatDateDisplay(selectedAttendanceDate)}</th>
                        <th className="px-4 py-3.5 text-center">Overtime (Hrs)</th>
                        <th className="px-4 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {staffEmployees.map((emp) => {
                        const record = staffAttendance.find(
                          (a) => a.date === selectedAttendanceDate && a.employeeId === emp.id
                        );
                        const currentStatus = record?.status || 'Present';
                        const currentOT = record?.overtimeHours || 0;

                        return (
                          <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-200">{emp.name}</div>
                              <div className="text-[10px] font-mono-num text-slate-500">{emp.employeeId}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{emp.designation}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono-num">
                              {emp.salaryType} ({formatINR(emp.basicSalary)})
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                                {(['Present', 'Half Day', 'Absent', 'Weekly Off', 'Leave'] as AttendanceStatus[]).map(
                                  (status) => {
                                    const isSel = currentStatus === status;
                                    return (
                                      <button
                                        key={status}
                                        onClick={() =>
                                          handleSetAttendanceStatus(emp.id, emp.name, status, currentOT)
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                          isSel
                                            ? status === 'Present'
                                              ? 'bg-emerald-500 text-slate-950 font-black shadow'
                                              : status === 'Half Day'
                                              ? 'bg-amber-500 text-slate-950 font-black shadow'
                                              : status === 'Absent'
                                              ? 'bg-rose-500 text-white font-black shadow'
                                              : status === 'Weekly Off'
                                              ? 'bg-cyan-500 text-slate-950 font-black shadow'
                                              : 'bg-purple-500 text-white font-black shadow'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                      >
                                        {status}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="12"
                                value={currentOT || ''}
                                onChange={(e) =>
                                  handleSetAttendanceStatus(
                                    emp.id,
                                    emp.name,
                                    currentStatus,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-16 glass-input px-2 py-1 text-center text-xs font-mono-num text-cyan-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleOpenRecordAttendance(emp.id, selectedAttendanceDate, record)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 mx-auto"
                                title="Open full validated attendance form"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Cell Popover / Modal for custom cell edit */}
            {quickCellPopover && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                <div className="w-full max-w-sm rounded-3xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{quickCellPopover.empName}</h4>
                      <p className="text-xs text-slate-400">{formatDateDisplay(quickCellPopover.date)}</p>
                    </div>
                    <button
                      onClick={() => setQuickCellPopover(null)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-300 block">Attendance Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Present', 'Weekly Off', 'Half Day', 'Absent', 'Leave'] as AttendanceStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            handleSetAttendanceStatus(
                              quickCellPopover.empId,
                              quickCellPopover.empName,
                              st,
                              quickCellPopover.otHours,
                              quickCellPopover.date
                            );
                            setQuickCellPopover(null);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                            quickCellPopover.status === st
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                              : 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Overtime Hours</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={quickCellPopover.otHours || ''}
                        onChange={(e) =>
                          setQuickCellPopover({
                            ...quickCellPopover,
                            otHours: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        className="w-full glass-input px-3 py-1.5 text-xs text-cyan-400 font-mono-num font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const cell = quickCellPopover;
                        setQuickCellPopover(null);
                        const rec = staffAttendance.find(
                          (a) => a.date === cell.date && a.employeeId === cell.empId
                        );
                        handleOpenRecordAttendance(cell.empId, cell.date, rec);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold underline"
                    >
                      Detailed Form →
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuickCellPopover(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          handleSetAttendanceStatus(
                            quickCellPopover.empId,
                            quickCellPopover.empName,
                            quickCellPopover.status,
                            quickCellPopover.otHours,
                            quickCellPopover.date
                          );
                          setQuickCellPopover(null);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* SUB-TAB 3: ADVANCES & DRAWINGS */}
      {activeSubTab === 'advances' && (
        <div className="space-y-4">
          {/* Top Actions & Summary Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <HandCoins className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Staff Advances & Drawings Ledger</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Track salary advances and personal staff drawings with month-wise filtering & automated payroll deduction.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportAdvancesPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                title="Export Advances & Drawings to PDF"
              >
                <FileText className="h-3.5 w-3.5 text-rose-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportAdvancesExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                title="Export Advances & Drawings to Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdvanceDate(getTodayDateString());
                  setShowAdvanceModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-opacity"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Issue Advance / Drawing</span>
              </button>
            </div>
          </div>

          {/* KPI STATS CARDS FOR FILTERED ADVANCES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Issued ({advanceFilterPeriod === 'custom-month' ? formatMonthDisplay(advanceSelectedMonth) : advanceFilterPeriod})
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-cyan-300 mt-1">
                {formatINR(advanceStats.totalIssued)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{advanceStats.count} entries recorded</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Staff Drawings Only
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-purple-300 mt-1">
                {formatINR(advanceStats.totalDrawings)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Owner / Staff drawings</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Recovered
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-emerald-400 mt-1">
                {formatINR(advanceStats.totalRecovered)}
              </div>
              <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Deducted from payroll</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 bg-slate-950/50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Recovery Balance
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono-num text-amber-400 mt-1">
                {formatINR(advanceStats.totalPending)}
              </div>
              <span className="text-[10px] text-amber-500/80 mt-0.5 block">To be recovered</span>
            </div>
          </div>

          {/* DATE & MONTH WISE FILTER BAR */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-950/60">
            {/* Quick Period Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>Period:</span>
              </span>
              {(
                [
                  { id: 'all', label: 'All Time' },
                  { id: 'this-month', label: 'This Month' },
                  { id: 'previous-month', label: 'Previous Month' },
                  { id: 'custom-month', label: 'Specific Month' },
                  { id: 'custom-range', label: 'Custom Date Range' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAdvanceFilterPeriod(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    advanceFilterPeriod === tab.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Specific Month Selector (if 'custom-month' or month navigation) */}
            {advanceFilterPeriod === 'custom-month' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-medium text-slate-400">Select Month:</span>
                <button
                  type="button"
                  onClick={handleAdvancePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <input
                  type="month"
                  value={advanceSelectedMonth}
                  onChange={(e) => {
                    setAdvanceSelectedMonth(e.target.value);
                    setAdvanceFilterPeriod('custom-month');
                  }}
                  className="glass-input px-3 py-1 text-xs text-slate-100 font-bold rounded-xl border border-cyan-500/40"
                />

                <button
                  type="button"
                  onClick={handleAdvanceNextMonth}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleAdvanceCurrentMonth}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold hover:bg-slate-700 border border-cyan-500/20"
                >
                  Current Month
                </button>

                <span className="text-xs text-cyan-400 font-bold ml-1">
                  Viewing {formatMonthDisplay(advanceSelectedMonth)}
                </span>
              </div>
            )}

            {/* Custom Date Range Pickers (if 'custom-range') */}
            {advanceFilterPeriod === 'custom-range' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-medium text-slate-400">From Date:</span>
                <input
                  type="date"
                  value={advanceCustomStartDate}
                  onChange={(e) => setAdvanceCustomStartDate(e.target.value)}
                  className="glass-input px-3 py-1 text-xs text-slate-100 rounded-xl"
                />
                <span className="text-xs font-medium text-slate-400">To Date:</span>
                <input
                  type="date"
                  value={advanceCustomEndDate}
                  onChange={(e) => setAdvanceCustomEndDate(e.target.value)}
                  className="glass-input px-3 py-1 text-xs text-slate-100 rounded-xl"
                />
              </div>
            )}

            {/* Secondary Filters: Staff, Type, Status, and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-white/5">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Staff Member
                </label>
                <CustomSelect
                  value={advanceStaffFilter}
                  onChange={(val) => setAdvanceStaffFilter(val)}
                  options={[
                    { value: 'all', label: 'All Staff Members' },
                    ...staffEmployees.map((emp) => ({
                      value: emp.id,
                      label: emp.name,
                      sublabel: emp.designation,
                    })),
                  ]}
                  size="sm"
                  searchable
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Advance / Drawing Type
                </label>
                <CustomSelect
                  value={advanceTypeFilter}
                  onChange={(val) => setAdvanceTypeFilter(val)}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'Salary Advance', label: 'Salary Advance' },
                    { value: 'Staff Drawing', label: 'Staff Drawing' },
                    { value: 'Other Advance', label: 'Other Advance' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Recovery Status
                </label>
                <CustomSelect
                  value={advanceRecoveryFilter}
                  onChange={(val) => setAdvanceRecoveryFilter(val)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'Pending', label: 'Pending Recovery', badge: 'Pending', badgeColor: 'amber' },
                    { value: 'Partially Recovered', label: 'Partially Recovered', badge: 'Partial', badgeColor: 'cyan' },
                    { value: 'Fully Recovered', label: 'Fully Recovered', badge: 'Recovered', badgeColor: 'emerald' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Search Records
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={advanceSearchQuery}
                    onChange={(e) => setAdvanceSearchQuery(e.target.value)}
                    placeholder="Search name, remarks, mode..."
                    className="w-full glass-input pl-8 pr-2.5 py-1.5 text-xs text-slate-200 rounded-xl"
                  />
                  {advanceSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAdvanceSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCES & DRAWINGS TABLE (DESKTOP & TABLET) */}
          <div className="glass-card rounded-3xl overflow-hidden border border-white/10 bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap min-w-[110px]">Date</th>
                    <th className="px-4 py-3.5">Staff Member</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Description / Purpose</th>
                    <th className="px-4 py-3.5">Payment Mode</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Amount</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Recovered</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Balance</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono-num">
                  {filteredStaffAdvances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-500 font-sans">
                        No advances or drawings found for the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStaffAdvances.map((adv) => {
                      const balance = Math.max(0, adv.amount - (adv.recoveredAmount || 0));
                      return (
                        <tr key={adv.id} className="hover:bg-slate-850/60 transition-colors">
                          <td className="px-4 py-3 text-slate-200 font-mono-num font-semibold whitespace-nowrap min-w-[110px]">
                            {formatDateDisplay(adv.date)}
                          </td>
                          <td className="px-4 py-3 font-sans font-bold text-slate-100 whitespace-nowrap">
                            {adv.employeeName}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                adv.type === 'Staff Drawing'
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                              }`}
                            >
                              {adv.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-sans text-slate-300 max-w-xs truncate">
                            {adv.description || '-'}
                          </td>
                          <td className="px-4 py-3 font-sans">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                              {adv.paymentMode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-sm text-cyan-300 whitespace-nowrap">
                            {formatINR(adv.amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-xs text-emerald-400 whitespace-nowrap">
                            {formatINR(adv.recoveredAmount || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-xs text-amber-400 whitespace-nowrap">
                            {formatINR(balance)}
                          </td>
                          <td className="px-4 py-3 text-center font-sans">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                adv.recoveryStatus === 'Fully Recovered'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : adv.recoveryStatus === 'Partially Recovered'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {adv.recoveryStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onConfirmDelete(
                                  'Delete Advance Record',
                                  `Delete ${adv.type} of ${formatINR(adv.amount)} for ${adv.employeeName} dated ${formatDateDisplay(adv.date)}?`,
                                  () => deleteStaffAdvance(adv.id)
                                )
                              }
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MONTHLY SALARY CALCULATION ENGINE */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-4">
          {/* Controls Header */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Salary Month:</span>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="glass-input px-3 py-1.5 text-xs text-slate-200 font-bold text-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 whitespace-nowrap">Target Staff:</span>
                <CustomSelect
                  value={selectedPayrollEmpId}
                  onChange={(val) => setSelectedPayrollEmpId(val)}
                  options={[
                    {
                      value: 'all',
                      label: `All Active Staff (${staffEmployees.filter((e) => e.status === 'Active').length} staff)`,
                    },
                    ...staffEmployees
                      .filter((e) => e.status === 'Active')
                      .map((emp) => ({
                        value: emp.id,
                        label: emp.name,
                        sublabel: emp.designation,
                      })),
                  ]}
                  className="w-56"
                  size="sm"
                  searchable
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCalculatePayroll(selectedPayrollEmpId)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02]"
              >
                <Calculator className="h-4 w-4 stroke-[2.5]" />
                <span>
                  {selectedPayrollEmpId === 'all'
                    ? `Calculate All Active Staff (${staffEmployees.filter((e) => e.status === 'Active').length})`
                    : 'Calculate Selected Staff'}
                </span>
              </button>

              {selectedPayrollEmpId !== 'all' && (
                <button
                  onClick={() => handleCalculatePayroll('all')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                  title="Calculate all active staff at once"
                >
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Calculate All ({staffEmployees.filter((e) => e.status === 'Active').length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time sync & Draft Notice Banner */}
          <div className="glass-card rounded-2xl p-3.5 border border-emerald-500/20 bg-emerald-500/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                <strong>Real-Time Attendance Sync Active:</strong> Salary figures, overtime amounts, and deductions automatically update live with every attendance mark.
              </span>
            </div>
            {unsavedPayrollStaff.length > 0 && (
              <button
                onClick={() => handleCalculatePayroll('all')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                title="Save calculations to payroll register"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Save All Calculations ({unsavedPayrollStaff.length} unrecorded)</span>
              </button>
            )}
          </div>

          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Total Gross Salary</div>
              <div className="font-mono-num text-2xl font-extrabold text-slate-100 mt-1">
                {formatINR(payrollTotals.gross)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {currentMonthCalculations.length} staff calculated • Basic + OT + Allowances
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Total Advance & Other Deductions</div>
              <div className="font-mono-num text-2xl font-extrabold text-amber-400 mt-1">
                {formatINR(payrollTotals.deductions)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Salary advances recovered</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <div className="text-[11px] font-semibold text-slate-400">Net Payable Salary</div>
              <div className="font-mono-num text-2xl font-extrabold text-emerald-400 mt-1">
                {formatINR(payrollTotals.net)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Net staff disbursement</div>
            </div>
          </div>

          {/* Calculations Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3.5">Staff & Model</th>
                    <th className="px-4 py-3.5 text-center">Paid / Month Days</th>
                    <th className="px-4 py-3.5 text-right">Earned Basic</th>
                    <th className="px-4 py-3.5 text-right">OT & Allowances</th>
                    <th className="px-4 py-3.5 text-right">Gross Salary (A)</th>
                    <th className="px-4 py-3.5 text-right">Deductions (B)</th>
                    <th className="px-4 py-3.5 text-right">Net Payable (A-B)</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentMonthCalculations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        <div className="max-w-md mx-auto space-y-3">
                          <p className="text-slate-400 text-sm">
                            No salary calculations generated yet for {formatMonthDisplay(payrollMonth)}.
                          </p>
                          <button
                            onClick={() => handleCalculatePayroll('all')}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25"
                          >
                            <Calculator className="h-4 w-4 stroke-[2.5]" />
                            <span>Calculate All Active Staff ({staffEmployees.filter((e) => e.status === 'Active').length})</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentMonthCalculations.map((sal) => {
                      const totalDed = sal.advancesDeduction + sal.drawingsDeduction + sal.otherDeductions;
                      const emp = staffEmployees.find((e) => e.id === sal.employeeId);
                      const baseDisplay = sal.salaryType === 'Monthly' 
                        ? `₹${sal.basicSalary.toLocaleString('en-IN')}/mo`
                        : `₹${sal.basicSalary.toLocaleString('en-IN')}/day`;
                      
                      return (
                        <tr key={sal.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-200">{sal.employeeName}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>{sal.designation}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-cyan-400 font-mono-num font-semibold">{baseDisplay}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="font-mono-num font-bold text-slate-200 text-xs">
                              {sal.paidDays} / {sal.totalMonthDays}d
                            </div>
                            <div className="text-[9.5px] text-slate-400">
                              {sal.presentDays !== undefined ? `P:${sal.presentDays} WO:${sal.weeklyOffs || 0}` : `${sal.paidDays} Paid`}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num font-semibold text-slate-200">
                            {formatINR(sal.earnedBasic ?? (sal.grossSalary - sal.allowancesTotal - sal.overtimeAmount))}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num">
                            <div className="text-slate-200 font-semibold">
                              +{formatINR((sal.overtimeAmount || 0) + (sal.allowancesTotal || 0))}
                            </div>
                            <div className="text-[9.5px] text-slate-400">
                              {sal.overtimeHours > 0 ? `OT: ${sal.overtimeHours}h ` : ''}
                              {sal.allowancesTotal > 0 ? `Allw: ₹${sal.allowancesTotal}` : ''}
                              {!sal.overtimeHours && !sal.allowancesTotal ? '-' : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-100">
                            {formatINR(sal.grossSalary)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num">
                            <div className={`font-semibold ${totalDed > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                              {totalDed > 0 ? `-${formatINR(totalDed)}` : '₹0'}
                            </div>
                            <div className="text-[9.5px] text-slate-400">
                              {sal.advancesDeduction > 0 ? `Adv: ₹${sal.advancesDeduction} ` : ''}
                              {sal.drawingsDeduction > 0 ? `Draw: ₹${sal.drawingsDeduction}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-num font-black text-emerald-400 text-sm">
                            {formatINR(sal.netSalary)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sal.status === 'Paid'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {sal.status}
                              </span>
                              {sal.isRevised && (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  title={`Salary Revised: ${sal.revisionReason || 'Adjusted'}`}
                                >
                                  Revised
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Recalculate single staff */}
                              <button
                                onClick={() => handleCalculatePayroll(sal.employeeId)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400"
                                title="Recalculate salary for this staff member"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => setAuditSalarySlip(sal)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white"
                                title="View Detailed Audit & Formula Breakdown"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {sal.status !== 'Paid' ? (
                                <button
                                  onClick={() => {
                                    saveSalaryCalculation(sal);
                                    setPayingSalaryId(sal.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-bold border border-emerald-500/30"
                                >
                                  Pay Salary
                                </button>
                              ) : (
                                <button
                                  onClick={() => setRevisingSalary(sal)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[11px] font-bold border border-cyan-500/30 transition-all shadow-sm"
                                  title="Revise earnings, attendance days, overtime or deductions for this paid salary"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Revise</span>
                                </button>
                              )}

                              <button
                                onClick={() => setViewSalarySlip(sal)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-white"
                                title="View & Print Official Pay Slip"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              {sal.status !== 'Paid' && (
                                <button
                                  onClick={() =>
                                    onConfirmDelete(
                                      `Delete salary calculation draft for ${sal.employeeName}?`,
                                      () => deleteSalaryCalculation(sal.id)
                                    )
                                  }
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                                  title="Delete Draft"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                {editingEmployeeId ? 'Edit Employee Details' : 'Register New Staff Member'}
              </h3>
              <button onClick={handleResetEmpForm} className="p-1.5 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEmployee} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Staff Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="e.g. Anand Kulkarni"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Mobile Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={empMobile}
                    onChange={(e) => setEmpMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Joining Date <span className="text-rose-400">* (Mandatory)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={empJoiningDate}
                    onChange={(e) => setEmpJoiningDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-cyan-300 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={empAddress}
                    onChange={(e) => setEmpAddress(e.target.value)}
                    placeholder="e.g. Shahupuri, Kolhapur"
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Designation
                  </label>
                  <CustomSelect
                    value={empDesignation}
                    onChange={(val) => setEmpDesignation(val)}
                    options={[
                      { value: 'Head Chef / Dum Master', label: 'Head Chef / Dum Master' },
                      { value: 'Assistant Cook', label: 'Assistant Cook' },
                      { value: 'Table Captain', label: 'Table Captain' },
                      { value: 'Waiter / Server', label: 'Waiter / Server' },
                      { value: 'Kitchen Helper', label: 'Kitchen Helper' },
                      { value: 'Cashier & Billing', label: 'Cashier & Billing' },
                      { value: 'Restaurant Manager', label: 'Restaurant Manager' },
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Department
                  </label>
                  <CustomSelect
                    value={empDepartment}
                    onChange={(val) => setEmpDepartment(val)}
                    options={[
                      { value: 'Kitchen', label: 'Kitchen' },
                      { value: 'Dining Service', label: 'Dining Service' },
                      { value: 'Counter & Billing', label: 'Counter & Billing' },
                      { value: 'Management', label: 'Management' },
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Salary Type
                  </label>
                  <CustomSelect
                    value={empSalaryType}
                    onChange={(val) => setEmpSalaryType(val as SalaryType)}
                    options={[
                      { value: 'Monthly', label: 'Monthly' },
                      { value: 'Daily', label: 'Daily' },
                      { value: 'Hourly', label: 'Hourly' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Basic Salary (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={empBasicSalary}
                    onChange={(e) => setEmpBasicSalary(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-cyan-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Allowances (₹)
                  </label>
                  <input
                    type="number"
                    value={empAllowances}
                    onChange={(e) => setEmpAllowances(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Fixed Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={empDeductions}
                    onChange={(e) => setEmpDeductions(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-slate-200"
                  />
                </div>
              </div>

              {/* Bank & UPI */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300">Bank & UPI Payment Details</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. SBI, HDFC)"
                    value={empBankName}
                    onChange={(e) => setEmpBankName(e.target.value)}
                    className="glass-input px-3 py-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={empAccountNumber}
                    onChange={(e) => setEmpAccountNumber(e.target.value)}
                    className="glass-input px-3 py-2 text-xs text-slate-200 font-mono-num"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={empIfsc}
                    onChange={(e) => setEmpIfsc(e.target.value)}
                    className="glass-input px-3 py-2 text-xs text-slate-200 uppercase font-mono-num"
                  />
                  <input
                    type="text"
                    placeholder="UPI ID (e.g. mobile@upi)"
                    value={empUpi}
                    onChange={(e) => setEmpUpi(e.target.value)}
                    className="glass-input px-3 py-2 text-xs text-cyan-400 font-mono-num"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetEmpForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-base text-slate-100">
                Issue Staff Advance / Drawing
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdvance} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Select Staff Member
                  </label>
                  <CustomSelect
                    value={advanceEmpId}
                    onChange={(val) => setAdvanceEmpId(val)}
                    options={[
                      { value: '', label: 'Select staff...' },
                      ...staffEmployees.map((e) => ({
                        value: e.id,
                        label: e.name,
                        sublabel: e.designation,
                      })),
                    ]}
                    size="sm"
                    searchable
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    value={advanceDate}
                    onChange={(e) => setAdvanceDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Advance Type
                  </label>
                  <CustomSelect
                    value={advanceType}
                    onChange={(val) => setAdvanceType(val as AdvanceType)}
                    options={[
                      { value: 'Salary Advance', label: 'Salary Advance' },
                      { value: 'Staff Drawing', label: 'Staff Drawing' },
                      { value: 'Other Advance', label: 'Other Advance' },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="e.g. 3000"
                    className="w-full glass-input px-3 py-2 text-xs font-mono-num text-cyan-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Payment Mode
                </label>
                <CustomSelect
                  value={advancePaymentMode}
                  onChange={(val) => setAdvancePaymentMode(val as PaymentMode)}
                  options={[
                    { value: 'Cash', label: 'Cash Payment' },
                    { value: 'UPI', label: 'UPI / QR' },
                    { value: 'Bank', label: 'Bank Transfer' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={advanceDescription}
                  onChange={(e) => setAdvanceDescription(e.target.value)}
                  placeholder="e.g. Medical emergency advance"
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs"
                >
                  Issue Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ATTENDANCE & WHOLE MONTH MANAGER MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-100">
                    Bulk Attendance Manager
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mark attendance for whole month or custom date range in 1 click
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Month & Pattern */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Select Target Month
                  </label>
                  <input
                    type="month"
                    value={bulkMonth}
                    onChange={(e) => setBulkMonth(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Attendance Pattern Mode
                  </label>
                  <CustomSelect
                    value={bulkPattern}
                    onChange={(val) => setBulkPattern(val as any)}
                    options={[
                      { value: 'present_mon_sat', label: 'Mon - Sat Present (Sundays Weekly Off)' },
                      { value: 'all_present', label: 'All 30/31 Days 100% Present' },
                      { value: 'custom_range', label: 'Custom Day Range (e.g. Day 1 to 15)' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Custom Range Settings if enabled */}
              {bulkPattern === 'custom_range' && (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Start Day (1..31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={bulkCustomStart}
                      onChange={(e) => setBulkCustomStart(parseInt(e.target.value, 10) || 1)}
                      className="w-full glass-input px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">End Day (1..31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={bulkCustomEnd}
                      onChange={(e) => setBulkCustomEnd(parseInt(e.target.value, 10) || 31)}
                      className="w-full glass-input px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Staff Employees Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">
                    Target Staff Members ({bulkSelectedStaff.length === 0 ? staffEmployees.filter(e => e.status === 'Active').length : bulkSelectedStaff.length} / {staffEmployees.filter(e => e.status === 'Active').length} Selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkSelectedStaff(staffEmployees.filter(e => e.status === 'Active').map(e => e.id))}
                      className="text-[10.5px] font-bold text-cyan-400 hover:text-cyan-300"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setBulkSelectedStaff([])}
                      className="text-[10.5px] font-bold text-slate-400 hover:text-slate-300"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-white/5">
                  {staffEmployees.filter(e => e.status === 'Active').map((emp) => {
                    const isChecked = bulkSelectedStaff.length === 0 || bulkSelectedStaff.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        onClick={() => {
                          if (bulkSelectedStaff.length === 0) {
                            setBulkSelectedStaff(staffEmployees.filter(e => e.status === 'Active' && e.id !== emp.id).map(e => e.id));
                          } else if (bulkSelectedStaff.includes(emp.id)) {
                            setBulkSelectedStaff(bulkSelectedStaff.filter(id => id !== emp.id));
                          } else {
                            setBulkSelectedStaff([...bulkSelectedStaff, emp.id]);
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-500/30 text-slate-200'
                            : 'bg-slate-900/40 border-transparent text-slate-400'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${
                          isChecked ? 'bg-cyan-500 text-slate-950' : 'border border-slate-600'
                        }`}>
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-[11px] truncate">{emp.name}</div>
                          <div className="text-[9.5px] text-slate-400">{emp.designation}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status & Overtime config */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Working Days Status</label>
                  <CustomSelect
                    value={bulkStatus}
                    onChange={(val) => setBulkStatus(val as AttendanceStatus)}
                    options={[
                      { value: 'Present', label: 'Present (Full Day)', badge: 'Present', badgeColor: 'emerald' },
                      { value: 'Half Day', label: 'Half Day', badge: 'Half Day', badgeColor: 'amber' },
                      { value: 'Leave', label: 'Leave', badge: 'Leave', badgeColor: 'purple' },
                      { value: 'Weekly Off', label: 'Weekly Off', badge: 'Off', badgeColor: 'blue' },
                      { value: 'Absent', label: 'Absent', badge: 'Absent', badgeColor: 'rose' },
                    ]}
                    size="sm"
                  />
                </div>

                {bulkPattern === 'present_mon_sat' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Sunday Status</label>
                    <CustomSelect
                      value={bulkSundayStatus}
                      onChange={(val) => setBulkSundayStatus(val as AttendanceStatus)}
                      options={[
                        { value: 'Weekly Off', label: 'Weekly Off (Paid)', badge: 'Off', badgeColor: 'blue' },
                        { value: 'Present', label: 'Present', badge: 'Present', badgeColor: 'emerald' },
                        { value: 'Absent', label: 'Absent', badge: 'Absent', badgeColor: 'rose' },
                      ]}
                      size="sm"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Daily Overtime (Hrs)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={bulkOT}
                    onChange={(e) => setBulkOT(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input px-2.5 py-1.5 text-xs text-slate-200 font-mono-num"
                  />
                </div>
              </div>

              {/* Dynamic Live Summary Box */}
              {(() => {
                const [yStr, mStr] = bulkMonth.split('-');
                const year = parseInt(yStr, 10);
                const monthNum = parseInt(mStr, 10);
                const totalDays = new Date(year, monthNum, 0).getDate();
                const startDay = bulkPattern === 'custom_range' ? Math.max(1, Math.min(bulkCustomStart, totalDays)) : 1;
                const endDay = bulkPattern === 'custom_range' ? Math.max(startDay, Math.min(bulkCustomEnd, totalDays)) : totalDays;
                const daysCount = endDay - startDay + 1;
                const staffCount = (bulkSelectedStaff.length > 0 ? bulkSelectedStaff : staffEmployees.filter(e => e.status === 'Active')).length;
                const totalRecords = daysCount * staffCount;

                return (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 space-y-1.5">
                    <div className="font-bold flex items-center justify-between text-xs text-cyan-300">
                      <span>Live Generation Summary</span>
                      <span className="font-mono-num font-black text-sm">{totalRecords} Records</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Applying to <span className="font-bold text-white">{staffCount} staff</span> across <span className="font-bold text-white">{daysCount} days</span> ({formatMonthDisplay(bulkMonth)}) with <span className="font-bold text-emerald-400">{bulkPattern === 'present_mon_sat' ? 'Mon-Sat Present & Sundays Off' : bulkStatus}</span>.
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkMonthAttendance}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Apply Bulk Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Salary Confirm Modal */}
      {payingSalaryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-slate-100">
              Confirm Salary Disbursement
            </h3>
            <p className="text-xs text-slate-300">
              Marking this salary as Paid will automatically recover advances and update business cash/bank outflows.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Disbursement Payment Mode
              </label>
              <CustomSelect
                value={salaryPayMode}
                onChange={(val) => setSalaryPayMode(val as PaymentMode)}
                options={[
                  { value: 'Bank', label: 'Bank Transfer / NEFT / IMPS' },
                  { value: 'UPI', label: 'UPI / QR' },
                  { value: 'Cash', label: 'Cash Payment' },
                ]}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setPayingSalaryId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  paySalaryCalculation(payingSalaryId, salaryPayMode);
                  setPayingSalaryId(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Salary Slip Modal */}
      {viewSalarySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 no-print">
              <span className="font-bold text-sm text-slate-200">Staff Pay Slip</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    downloadSalarySlipPDF(
                      viewSalarySlip,
                      staffEmployees.find((e) => e.id === viewSalarySlip.employeeId),
                      businessProfile
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow"
                  title="Download PDF"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() =>
                    printSalarySlipPDF(
                      viewSalarySlip,
                      staffEmployees.find((e) => e.id === viewSalarySlip.employeeId),
                      businessProfile
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
                  title="Print Salary Slip"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() =>
                    shareSalarySlipPDF(
                      viewSalarySlip,
                      staffEmployees.find((e) => e.id === viewSalarySlip.employeeId),
                      businessProfile
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow"
                  title="Share Slip"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
                <button onClick={() => setViewSalarySlip(null)} className="p-1.5 text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div className="printable-document bg-white text-slate-900 p-6 rounded-xl font-sans text-xs space-y-4 shadow-xl border border-slate-200">
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <div className="text-lg font-black tracking-wider uppercase font-display text-slate-900">
                  {businessProfile.name || 'PATIL BIRYANI'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {businessProfile.addressLine1}, {businessProfile.city}
                </div>
                <div className="inline-block px-3 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold tracking-wide mt-1">
                  PAYSLIP FOR THE MONTH OF {viewSalarySlip.month}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-slate-200 pb-3">
                <div><span className="font-bold text-slate-600">Employee Name:</span> <span className="font-semibold text-slate-900">{viewSalarySlip.employeeName}</span></div>
                <div><span className="font-bold text-slate-600">Designation:</span> <span className="text-slate-900">{viewSalarySlip.designation}</span></div>
                <div><span className="font-bold text-slate-600">Salary Model:</span> <span className="text-slate-900">{viewSalarySlip.salaryType}</span></div>
                <div><span className="font-bold text-slate-600">Joining Date:</span> <span className="text-slate-900">{formatDateDisplay(staffEmployees.find((e) => e.id === viewSalarySlip.employeeId)?.joiningDate)}</span></div>
                <div><span className="font-bold text-slate-600">Paid Days:</span> <span className="text-slate-900">{viewSalarySlip.paidDays} / {viewSalarySlip.totalMonthDays} Days</span></div>
                <div><span className="font-bold text-slate-600">Status:</span> <span className="font-semibold text-emerald-700">{viewSalarySlip.status} {viewSalarySlip.paymentMode ? `(${viewSalarySlip.paymentMode})` : ''}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-slate-200 pb-3">
                {/* Earnings */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
                    <span>EARNINGS</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Basic Earned:</span>
                    <span className="font-medium text-slate-900">₹{(viewSalarySlip.grossSalary - viewSalarySlip.allowancesTotal - viewSalarySlip.overtimeAmount).toLocaleString('en-IN')}</span>
                  </div>
                  {viewSalarySlip.overtimeAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Overtime ({viewSalarySlip.overtimeHours}h):</span>
                      <span className="font-medium text-slate-900">₹{viewSalarySlip.overtimeAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {viewSalarySlip.allowancesTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Allowances:</span>
                      <span className="font-medium text-slate-900">₹{viewSalarySlip.allowancesTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-emerald-700">
                    <span>Total Earnings (A):</span>
                    <span>₹{viewSalarySlip.grossSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex justify-between">
                    <span>DEDUCTIONS</span>
                    <span>AMOUNT</span>
                  </div>
                  {viewSalarySlip.advancesDeduction > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Advances Recovered:</span>
                      <span className="font-medium">₹{viewSalarySlip.advancesDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {viewSalarySlip.drawingsDeduction > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Staff Drawings:</span>
                      <span className="font-medium">₹{viewSalarySlip.drawingsDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {viewSalarySlip.otherDeductions > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Other Deductions:</span>
                      <span className="font-medium">₹{viewSalarySlip.otherDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-rose-700">
                    <span>Total Deductions (B):</span>
                    <span>₹{(viewSalarySlip.advancesDeduction + viewSalarySlip.drawingsDeduction + viewSalarySlip.otherDeductions).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-lg font-black text-sm">
                <span className="text-emerald-900 font-bold">NET SALARY PAYABLE (A - B):</span>
                <span className="text-emerald-700 font-mono text-base font-black">₹{viewSalarySlip.netSalary.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-slate-500 border-t border-slate-200">
                <div>Employer Signature: __________________</div>
                <div>Employee Signature: __________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Calculation & Audit Formula Inspector Modal */}
      {auditSalarySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Calculator className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold text-slate-100">
                    Salary Calculation Audit & Formula Breakdown
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Verified calculation engine breakdown for <strong className="text-slate-200">{auditSalarySlip.employeeName}</strong> ({auditSalarySlip.designation}) — {formatMonthDisplay(auditSalarySlip.month)}
                </p>
              </div>
              <button
                onClick={() => setAuditSalarySlip(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Attendance & Model Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="glass rounded-xl p-3 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Salary Model</span>
                <div className="font-bold text-cyan-400">{auditSalarySlip.salaryType} Wage</div>
                <div className="text-[10px] text-slate-500 font-mono-num">
                  {auditSalarySlip.salaryType === 'Monthly' 
                    ? `₹${auditSalarySlip.basicSalary.toLocaleString('en-IN')}/mo` 
                    : `₹${auditSalarySlip.basicSalary.toLocaleString('en-IN')}/day`}
                </div>
              </div>

              <div className="glass rounded-xl p-3 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Paid Days</span>
                <div className="font-bold text-slate-100 font-mono-num">
                  {auditSalarySlip.paidDays} / {auditSalarySlip.totalMonthDays} Days
                </div>
                <div className="text-[10px] text-emerald-400">
                  {((auditSalarySlip.paidDays / auditSalarySlip.totalMonthDays) * 100).toFixed(0)}% Attendance
                </div>
              </div>

              <div className="glass rounded-xl p-3 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Attendance Breakdown</span>
                <div className="text-[11px] text-slate-300 font-mono-num">
                  P: {auditSalarySlip.presentDays ?? '-'} | WO: {auditSalarySlip.weeklyOffs ?? '-'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono-num">
                  Leave: {auditSalarySlip.leaveDays ?? 0} | HD: {auditSalarySlip.halfDays ?? 0}
                </div>
              </div>

              <div className="glass rounded-xl p-3 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment Status</span>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    auditSalarySlip.status === 'Paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {auditSalarySlip.status}
                  </span>
                </div>
                {auditSalarySlip.paymentMode && (
                  <div className="text-[10px] text-slate-400">Via {auditSalarySlip.paymentMode}</div>
                )}
              </div>
            </div>

            {/* Formula Step-by-Step Breakdown */}
            <div className="glass rounded-2xl p-4 border border-white/10 space-y-3 text-xs">
              <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>1. Earnings Calculation (A)</span>
                <span className="text-emerald-400 font-mono-num font-bold">
                  {formatINR(auditSalarySlip.grossSalary)}
                </span>
              </div>

              <div className="space-y-2 text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">Basic Earned:</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {auditSalarySlip.salaryType === 'Monthly'
                        ? `(₹${auditSalarySlip.basicSalary.toLocaleString('en-IN')} ÷ ${auditSalarySlip.totalMonthDays}) × ${auditSalarySlip.paidDays} paid days`
                        : `₹${auditSalarySlip.basicSalary.toLocaleString('en-IN')}/day × ${auditSalarySlip.paidDays} days`}
                    </span>
                  </div>
                  <div className="font-mono-num font-bold text-slate-100">
                    {formatINR(auditSalarySlip.earnedBasic ?? (auditSalarySlip.grossSalary - auditSalarySlip.allowancesTotal - auditSalarySlip.overtimeAmount))}
                  </div>
                </div>

                {auditSalarySlip.overtimeHours > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">Overtime Pay (1.5x):</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {auditSalarySlip.overtimeHours} hrs @ 1.5x hourly rate
                      </span>
                    </div>
                    <div className="font-mono-num font-bold text-cyan-400">
                      +{formatINR(auditSalarySlip.overtimeAmount)}
                    </div>
                  </div>
                )}

                {auditSalarySlip.allowancesTotal > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">Allowances (Pro-rated):</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Food / Travel allowance
                      </span>
                    </div>
                    <div className="font-mono-num font-bold text-cyan-400">
                      +{formatINR(auditSalarySlip.allowancesTotal)}
                    </div>
                  </div>
                )}
              </div>

              {/* Deductions Step */}
              <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center justify-between pt-2">
                <span>2. Deductions Recovered (B)</span>
                <span className="text-rose-400 font-mono-num font-bold">
                  -{formatINR(auditSalarySlip.advancesDeduction + auditSalarySlip.drawingsDeduction + auditSalarySlip.otherDeductions)}
                </span>
              </div>

              <div className="space-y-2 text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">Salary Advances Recovered:</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      Auto-deducted from pending advance slips
                    </span>
                  </div>
                  <div className="font-mono-num font-bold text-rose-400">
                    {auditSalarySlip.advancesDeduction > 0 ? `-${formatINR(auditSalarySlip.advancesDeduction)}` : '₹0'}
                  </div>
                </div>

                {auditSalarySlip.drawingsDeduction > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">Staff Drawings / Personal Food:</span>
                    </div>
                    <div className="font-mono-num font-bold text-rose-400">
                      -{formatINR(auditSalarySlip.drawingsDeduction)}
                    </div>
                  </div>
                )}

                {auditSalarySlip.otherDeductions > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">Other Deductions:</span>
                    </div>
                    <div className="font-mono-num font-bold text-rose-400">
                      -{formatINR(auditSalarySlip.otherDeductions)}
                    </div>
                  </div>
                )}
              </div>

              {/* Net Payable Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    NET PAYABLE DISBURSEMENT (A - B)
                  </span>
                  <span className="text-[11px] text-emerald-300 font-medium">
                    {numberToIndianWords(auditSalarySlip.netSalary)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono-num text-2xl font-black text-emerald-400">
                    {formatINR(auditSalarySlip.netSalary)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bank Details & Actions */}
            {(() => {
              const emp = staffEmployees.find((e) => e.id === auditSalarySlip.employeeId);
              return (
                <div className="glass rounded-xl p-3 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Disbursement Account</span>
                    <div className="text-slate-200">
                      {emp?.bankDetails?.bankName ? (
                        <span>{emp.bankDetails.bankName} • A/C: {emp.bankDetails.accountNumber || 'N/A'} • IFSC: {emp.bankDetails.ifscCode || 'N/A'}</span>
                      ) : emp?.bankDetails?.upiId ? (
                        <span>UPI: {emp.bankDetails.upiId}</span>
                      ) : (
                        <span className="text-slate-500">Cash Disbursal (No bank info registered)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {auditSalarySlip.status !== 'Paid' ? (
                      <button
                        onClick={() => {
                          setPayingSalaryId(auditSalarySlip.id);
                          setAuditSalarySlip(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                      >
                        Disburse & Pay Salary
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const target = auditSalarySlip;
                          setAuditSalarySlip(null);
                          setRevisingSalary(target);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Revise Salary</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const target = auditSalarySlip;
                        setAuditSalarySlip(null);
                        setViewSalarySlip(target);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Payslip</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Resign Staff Modal */}
      {resigningEmp && (
        <ResignStaffModal
          employee={resigningEmp}
          onClose={() => setResigningEmp(null)}
          onConfirmResign={(data) => {
            resignStaffEmployee(resigningEmp.id, data);
            setResigningEmp(null);
            showFeedback(`${resigningEmp.name} marked as Resigned. All records preserved.`);
          }}
        />
      )}

      {/* View Resignation & Settlement Details Modal */}
      {viewResignationEmp && (
        <ViewResignationModal
          employee={viewResignationEmp}
          salaryHistory={salaryCalculations}
          advancesHistory={staffAdvances}
          onClose={() => setViewResignationEmp(null)}
          onReactivate={(emp) => {
            reactivateStaffEmployee(emp.id);
            setViewResignationEmp(null);
            showFeedback(`${emp.name} reactivated as active staff.`);
          }}
        />
      )}

      {/* Custom & Bulk Attendance Wizard Modal */}
      {showCustomAttendanceModal && (
        <CustomAttendanceModal
          staffEmployees={staffEmployees}
          onClose={() => setShowCustomAttendanceModal(false)}
          onApplyAttendance={(records) => {
            batchRecordAttendance(records);
            setShowCustomAttendanceModal(false);
            showFeedback(`Custom attendance pattern applied for ${records.length} records!`);
          }}
        />
      )}

      {/* Dedicated Single Record Attendance Modal with validation & duplicate prevention */}
      {showRecordAttendanceModal && (
        <RecordAttendanceModal
          staffEmployees={staffEmployees}
          attendanceRecords={staffAttendance}
          initialEmployeeId={recordAttInitialEmpId}
          initialDate={recordAttInitialDate}
          initialRecord={recordAttInitialRecord}
          onClose={() => {
            setShowRecordAttendanceModal(false);
            setRecordAttInitialRecord(null);
            setRecordAttInitialEmpId('');
          }}
          onSave={(record) => {
            recordAttendance(record);
            showFeedback(`Saved attendance for ${record.employeeName} on ${formatDateDisplay(record.date)} (${record.status}).`);
          }}
        />
      )}

      {/* Individual Employee Monthly Attendance Calendar Modal */}
      {individualAttEmp && (
        <IndividualAttendanceModal
          employee={individualAttEmp}
          initialMonth={attendanceMonth}
          attendanceRecords={staffAttendance}
          onClose={() => setIndividualAttEmp(null)}
          onSaveRecord={(empId, empName, status, ot, date) => {
            recordAttendance({
              employeeId: empId,
              employeeName: empName,
              status,
              overtimeHours: ot,
              date,
              inTime: '10:00 AM',
              outTime: '11:00 PM',
              totalHours: status === 'Weekly Off' || status === 'Absent' ? 0 : 11,
              remarks: 'Individual attendance calendar update',
            });
          }}
          onBatchApply={(records) => {
            batchRecordAttendance(records);
            showFeedback(`Updated attendance records for ${individualAttEmp.name}.`);
          }}
        />
      )}

      {/* Revise Paid Salary Modal */}
      {revisingSalary && (
        <ReviseSalaryModal
          salary={revisingSalary}
          employee={staffEmployees.find((e) => e.id === revisingSalary.employeeId)}
          onClose={() => setRevisingSalary(null)}
          onRevise={(revisedData, reason) => {
            reviseSalaryCalculation(revisingSalary.id, revisedData, reason);
            setRevisingSalary(null);
            showFeedback(`Salary for ${revisingSalary.employeeName} revised and saved.`);
          }}
          onReopenDraft={() => {
            reopenSalaryCalculation(revisingSalary.id);
            setRevisingSalary(null);
            showFeedback(`Salary for ${revisingSalary.employeeName} unlocked and reset to Draft.`);
          }}
        />
      )}
    </div>
  );
};
