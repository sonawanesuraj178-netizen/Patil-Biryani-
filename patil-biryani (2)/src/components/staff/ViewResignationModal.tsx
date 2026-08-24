import React from 'react';
import { X, UserX, UserCheck, Calendar, FileText, CheckCircle2, AlertCircle, ShieldCheck, Printer } from 'lucide-react';
import { StaffEmployee, SalaryCalculation, StaffAdvance } from '../../types';
import { formatDateDisplay, formatINR } from '../../utils/formatters';

interface ViewResignationModalProps {
  employee: StaffEmployee;
  salaryHistory: SalaryCalculation[];
  advancesHistory: StaffAdvance[];
  onClose: () => void;
  onReactivate: (emp: StaffEmployee) => void;
}

export const ViewResignationModal: React.FC<ViewResignationModalProps> = ({
  employee,
  salaryHistory = [],
  advancesHistory = [],
  onClose,
  onReactivate,
}) => {
  const safeSalaries = salaryHistory || [];
  const safeAdvances = advancesHistory || [];
  const empSalaries = safeSalaries.filter((s) => s.employeeId === employee.id);
  const empAdvances = safeAdvances.filter((a) => a.employeeId === employee.id);
  const totalPaidEarnings = empSalaries
    .filter((s) => s.status === 'Paid')
    .reduce((sum, s) => sum + s.netSalary, 0);
  const totalAdvancesTaken = empAdvances.reduce((sum, a) => sum + a.amount, 0);

  // Tenure calculation
  const calculateTenure = () => {
    if (!employee.joiningDate) return 'N/A';
    const start = new Date(employee.joiningDate);
    const end = employee.relievingDate || employee.resignationDate
      ? new Date(employee.relievingDate || employee.resignationDate!)
      : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    if (months === 0) return `${diffDays} days`;
    return `${months} month${months > 1 ? 's' : ''} ${remainingDays > 0 ? `${remainingDays}d` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <UserX className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-100">
                  {employee.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Resigned Employee
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {employee.employeeId} • {employee.designation} ({employee.department})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tenure & Resignation Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Joining Date</span>
            <div className="font-bold text-slate-200">{formatDateDisplay(employee.joiningDate)}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Resignation Date</span>
            <div className="font-bold text-rose-400">{formatDateDisplay(employee.resignationDate)}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Last Working Day</span>
            <div className="font-bold text-amber-300">{formatDateDisplay(employee.relievingDate || employee.resignationDate)}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Tenure</span>
            <div className="font-bold text-cyan-400">{calculateTenure()}</div>
          </div>
        </div>

        {/* Resignation Reason and Settlement */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Reason for Leaving / Resignation
            </span>
            <div className="font-medium text-slate-200 mt-0.5">
              {employee.resignationReason || 'Personal Reasons / Career Transition'}
            </div>
          </div>

          {employee.settlementNotes && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Handover &amp; Settlement Notes
              </span>
              <div className="text-slate-300 mt-0.5">{employee.settlementNotes}</div>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Final Settlement Amount
              </span>
              <span className="text-sm font-black font-mono-num text-emerald-400">
                {formatINR(employee.settlementAmount || 0)}
              </span>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  employee.settlementStatus === 'Settled'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {employee.settlementStatus === 'Settled' ? '✓ Settlement Completed' : '⌛ Settlement Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Historical Records Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Historical Salary Slips</div>
            <div className="font-bold text-slate-200 font-mono-num">{empSalaries.length} Slips Generated</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Lifetime Net Earnings Disbursed</div>
            <div className="font-bold text-emerald-400 font-mono-num">{formatINR(totalPaidEarnings)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">Total Advances Taken</div>
            <div className="font-bold text-amber-400 font-mono-num">{formatINR(totalAdvancesTaken)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={() => {
              onReactivate(employee);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold border border-emerald-500/30 transition-all"
          >
            <UserCheck className="h-4 w-4" />
            <span>Re-hire / Re-activate Staff</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
