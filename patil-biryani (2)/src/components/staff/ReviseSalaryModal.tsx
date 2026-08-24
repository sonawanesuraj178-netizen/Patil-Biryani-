import React, { useState } from 'react';
import {
  Edit3,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { SalaryCalculation, StaffEmployee, PaymentMode } from '../../types';
import {
  formatINR,
  formatMonthDisplay,
  formatDateDisplay,
  getTodayDateString,
} from '../../utils/formatters';
import { CustomSelect } from '../ui/CustomSelect';

interface ReviseSalaryModalProps {
  salary: SalaryCalculation;
  employee?: StaffEmployee;
  onClose: () => void;
  onRevise: (revisedData: Partial<SalaryCalculation>, reason: string) => void;
  onReopenDraft: () => void;
}

export const ReviseSalaryModal: React.FC<ReviseSalaryModalProps> = ({
  salary,
  employee,
  onClose,
  onRevise,
  onReopenDraft,
}) => {
  // Original baseline values
  const origGross = salary.originalGrossSalary ?? salary.grossSalary;
  const origNet = salary.originalNetSalary ?? salary.netSalary;
  const origEarnedBasic = salary.earnedBasic ?? (salary.grossSalary - (salary.allowancesTotal || 0) - (salary.overtimeAmount || 0));

  // Form states
  const [paidDays, setPaidDays] = useState(String(salary.paidDays ?? salary.totalMonthDays));
  const [totalMonthDays, setTotalMonthDays] = useState(String(salary.totalMonthDays ?? 30));
  const [presentDays, setPresentDays] = useState(String(salary.presentDays ?? salary.paidDays));
  const [weeklyOffs, setWeeklyOffs] = useState(String(salary.weeklyOffs ?? 0));
  const [leaveDays, setLeaveDays] = useState(String(salary.leaveDays ?? 0));

  // Earnings
  const [earnedBasic, setEarnedBasic] = useState(String(origEarnedBasic));
  const [overtimeHours, setOvertimeHours] = useState(String(salary.overtimeHours || 0));
  const [overtimeAmount, setOvertimeAmount] = useState(String(salary.overtimeAmount || 0));
  const [allowancesTotal, setAllowancesTotal] = useState(String(salary.allowancesTotal || 0));

  // Deductions
  const [advancesDeduction, setAdvancesDeduction] = useState(String(salary.advancesDeduction || 0));
  const [drawingsDeduction, setDrawingsDeduction] = useState(String(salary.drawingsDeduction || 0));
  const [otherDeductions, setOtherDeductions] = useState(String(salary.otherDeductions || 0));

  // Payment info & Reason
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(salary.paymentMode || 'Bank');
  const [paymentDate, setPaymentDate] = useState(salary.paymentDate || getTodayDateString());
  const [revisionReason, setRevisionReason] = useState(salary.revisionReason || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Calculations
  const numEarnedBasic = parseFloat(earnedBasic) || 0;
  const numOtAmount = parseFloat(overtimeAmount) || 0;
  const numAllowances = parseFloat(allowancesTotal) || 0;

  const revisedGross = Math.round(numEarnedBasic + numOtAmount + numAllowances);

  const numAdvances = parseFloat(advancesDeduction) || 0;
  const numDrawings = parseFloat(drawingsDeduction) || 0;
  const numOther = parseFloat(otherDeductions) || 0;

  const revisedTotalDeductions = Math.round(numAdvances + numDrawings + numOther);
  const revisedNet = Math.max(0, Math.round(revisedGross - revisedTotalDeductions));
  const netDifference = revisedNet - origNet;

  // Auto calculate OT Amount if hourly rate changes
  const handleOtHoursChange = (hoursVal: string) => {
    setOvertimeHours(hoursVal);
    const hrs = parseFloat(hoursVal) || 0;
    if (hrs >= 0 && employee) {
      const days = parseInt(totalMonthDays, 10) || 30;
      const dailyRate = employee.salaryType === 'Daily' ? employee.basicSalary : employee.basicSalary / days;
      const hourlyRate = dailyRate / 11;
      const otRate = hourlyRate * 1.5;
      setOvertimeAmount(String(Math.round(hrs * otRate)));
    }
  };

  // Auto calculate basic if paid days change
  const handlePaidDaysChange = (pDaysVal: string) => {
    setPaidDays(pDaysVal);
    const pDays = parseFloat(pDaysVal) || 0;
    const mDays = parseInt(totalMonthDays, 10) || 30;
    if (pDays >= 0 && employee) {
      if (employee.salaryType === 'Monthly') {
        const perDay = employee.basicSalary / mDays;
        setEarnedBasic(String(Math.round(perDay * pDays)));
      } else {
        setEarnedBasic(String(Math.round(employee.basicSalary * pDays)));
      }
    }
  };

  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason.trim()) {
      setErrorMessage('Please provide a reason for revising this paid salary.');
      return;
    }

    const payload: Partial<SalaryCalculation> = {
      paidDays: parseFloat(paidDays) || 0,
      totalMonthDays: parseInt(totalMonthDays, 10) || 30,
      presentDays: parseFloat(presentDays) || 0,
      weeklyOffs: parseFloat(weeklyOffs) || 0,
      leaveDays: parseFloat(leaveDays) || 0,
      earnedBasic: numEarnedBasic,
      overtimeHours: parseFloat(overtimeHours) || 0,
      overtimeAmount: numOtAmount,
      allowancesTotal: numAllowances,
      grossSalary: revisedGross,
      advancesDeduction: numAdvances,
      drawingsDeduction: numDrawings,
      otherDeductions: numOther,
      netSalary: revisedNet,
      paymentMode,
      paymentDate,
    };

    onRevise(payload, revisionReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card w-full max-w-3xl rounded-3xl p-6 border border-cyan-500/30 bg-slate-900 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Edit3 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Revise Paid Salary Calculation</span>
                  {salary.isRevised && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Previously Revised
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Staff: <strong className="text-slate-200">{salary.employeeName}</strong> ({salary.designation}) • Month:{' '}
                  <strong className="text-cyan-300">{formatMonthDisplay(salary.month)}</strong>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Previous vs Revised Live Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Original Net Paid
            </span>
            <div className="font-mono-num text-lg font-extrabold text-slate-300">
              {formatINR(origNet)}
            </div>
            <div className="text-[10px] text-slate-500">Gross: {formatINR(origGross)}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
            <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider">
              New Revised Net
            </span>
            <div className="font-mono-num text-xl font-black text-cyan-400">
              {formatINR(revisedNet)}
            </div>
            <div className="text-[10px] text-cyan-200/70">
              Gross: {formatINR(revisedGross)} • Ded: -{formatINR(revisedTotalDeductions)}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-2xl border space-y-1 ${
              netDifference === 0
                ? 'bg-slate-950/60 border-white/10'
                : netDifference > 0
                ? 'bg-emerald-950/40 border-emerald-500/30'
                : 'bg-rose-950/40 border-rose-500/30'
            }`}
          >
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
              <span>Disbursement Adjustment</span>
              {netDifference > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : netDifference < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              ) : null}
            </span>
            <div
              className={`font-mono-num text-lg font-extrabold ${
                netDifference === 0
                  ? 'text-slate-300'
                  : netDifference > 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {netDifference > 0
                ? `+${formatINR(netDifference)} (Extra to Pay)`
                : netDifference < 0
                ? `-${formatINR(Math.abs(netDifference))} (Recovery/Excess)`
                : '₹0 (No Net Difference)'}
            </div>
            <div className="text-[10px] text-slate-500">Difference from original</div>
          </div>
        </div>

        {salary.isRevised && salary.revisedAt && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
            <Clock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Last Revised on {formatDateDisplay(salary.revisedAt)}:</strong> &quot;
              {salary.revisionReason || 'Salary adjustments'}&quot;
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitRevision} className="space-y-4">
          {/* Section 1: Attendance & Days */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>1. Attendance Days Adjustment</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Paid Days
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  value={paidDays}
                  onChange={(e) => handlePaidDaysChange(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Present Days
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  value={presentDays}
                  onChange={(e) => setPresentDays(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Weekly Offs
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={weeklyOffs}
                  onChange={(e) => setWeeklyOffs(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Month Total Days
                </label>
                <input
                  type="number"
                  min="28"
                  max="31"
                  value={totalMonthDays}
                  onChange={(e) => setTotalMonthDays(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Earnings */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>2. Earnings & Allowances (A)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Earned Basic Salary (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={earnedBasic}
                  onChange={(e) => setEarnedBasic(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Overtime (Hours & ₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Hrs"
                    value={overtimeHours}
                    onChange={(e) => handleOtHoursChange(e.target.value)}
                    className="w-20 glass-input px-2 py-2 text-xs text-slate-100"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="₹ Amount"
                    value={overtimeAmount}
                    onChange={(e) => setOvertimeAmount(e.target.value)}
                    className="flex-1 glass-input px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Food & Travel Allowances (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={allowancesTotal}
                  onChange={(e) => setAllowancesTotal(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Deductions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>3. Deductions & Advances (B)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Salary Advance Recovered (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={advancesDeduction}
                  onChange={(e) => setAdvancesDeduction(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-rose-300 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Staff Drawings Deductions (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={drawingsDeduction}
                  onChange={(e) => setDrawingsDeduction(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-rose-300"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Other Deductions (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs text-rose-300"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Revision Reason & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Reason for Salary Revision <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Corrected 2 missing OT hours, added incentive bonus, advance adjustment"
                value={revisionReason}
                onChange={(e) => {
                  setRevisionReason(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full glass-input px-3 py-2 text-xs text-slate-100 border-cyan-500/40"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Payment Mode
              </label>
              <CustomSelect
                value={paymentMode}
                onChange={(val) => setPaymentMode(val as PaymentMode)}
                options={[
                  { value: 'Bank', label: 'Bank Transfer' },
                  { value: 'UPI', label: 'UPI / QR' },
                  { value: 'Cash', label: 'Cash Payment' },
                ]}
                size="sm"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onReopenDraft}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-white/10 transition-colors"
              title="Reset salary status to Draft to allow recalculation from live attendance"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>Unlock & Reset to Draft</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Revised Salary</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
