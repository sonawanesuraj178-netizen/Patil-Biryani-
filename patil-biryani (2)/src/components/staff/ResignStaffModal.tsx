import React, { useState } from 'react';
import { X, UserX, AlertTriangle, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';
import { StaffEmployee } from '../../types';
import { formatDateDisplay, getTodayDateString, formatINR } from '../../utils/formatters';
import { CustomSelect } from '../ui/CustomSelect';

interface ResignStaffModalProps {
  employee: StaffEmployee;
  onClose: () => void;
  onConfirmResign: (resignationData: {
    resignationDate: string;
    resignationReason: string;
    relievingDate: string;
    settlementNotes: string;
    settlementAmount: number;
    settlementStatus: 'Pending' | 'Settled';
  }) => void;
}

const COMMON_REASONS = [
  'Career Opportunity / Better Offer',
  'Relocating to Hometown / Family Reasons',
  'Personal / Health Reasons',
  'Higher Studies / Training',
  'End of Employment Contract',
  'Business / Starting Own Venture',
  'Other / Custom Reason',
];

export const ResignStaffModal: React.FC<ResignStaffModalProps> = ({
  employee,
  onClose,
  onConfirmResign,
}) => {
  const [resignationDate, setResignationDate] = useState(getTodayDateString());
  const [relievingDate, setRelievingDate] = useState(getTodayDateString());
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReasonDetails, setCustomReasonDetails] = useState('');
  const [settlementNotes, setSettlementNotes] = useState(
    `Full & Final settlement recorded for ${employee.name} (${employee.employeeId}).`
  );
  const [settlementAmount, setSettlementAmount] = useState('0');
  const [settlementStatus, setSettlementStatus] = useState<'Pending' | 'Settled'>('Pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReasonDetails.trim()
      ? `${selectedReason}: ${customReasonDetails.trim()}`
      : selectedReason;

    onConfirmResign({
      resignationDate,
      resignationReason: finalReason,
      relievingDate: relievingDate || resignationDate,
      settlementNotes,
      settlementAmount: parseFloat(settlementAmount) || 0,
      settlementStatus,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <UserX className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                Mark Employee Resignation
              </h3>
              <p className="text-xs text-slate-400">
                Record official offboarding &amp; preserving all historical data
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

        {/* Employee snapshot card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-200 text-sm">{employee.name}</div>
            <div className="text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="font-mono-num text-cyan-400">{employee.employeeId}</span>
              <span>•</span>
              <span>{employee.designation}</span>
              <span>•</span>
              <span>{employee.department}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">Joined On</div>
            <div className="font-bold text-slate-200">{formatDateDisplay(employee.joiningDate)}</div>
          </div>
        </div>

        {/* Data preservation reassurance note */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Historical Records Saved:</strong> All past attendance records, previous salary payments, advance history, and payslips for {employee.name} will remain permanently saved in the system.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Resignation Notice Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-rose-300 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Last Working / Relieving Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={relievingDate}
                onChange={(e) => setRelievingDate(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-amber-300 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Reason for Resignation
            </label>
            <CustomSelect
              value={selectedReason}
              onChange={(val) => setSelectedReason(val)}
              options={COMMON_REASONS.map((r) => ({ value: r, label: r }))}
              size="sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Detailed Notes / Handover Remarks (Optional)
            </label>
            <input
              type="text"
              value={customReasonDetails}
              onChange={(e) => setCustomReasonDetails(e.target.value)}
              placeholder="e.g. Relocating back to hometown; duties handed over to Chef Rohan"
              className="w-full glass-input px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Full &amp; Final Settlement Dues (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-emerald-400 font-mono-num font-bold"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Settlement Status
              </label>
              <CustomSelect
                value={settlementStatus}
                onChange={(val) => setSettlementStatus(val as 'Pending' | 'Settled')}
                options={[
                  { value: 'Pending', label: 'Pending Settlement', badge: 'Pending', badgeColor: 'amber' },
                  { value: 'Settled', label: 'Fully Settled & Paid', badge: 'Settled', badgeColor: 'emerald' },
                ]}
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
            >
              <UserX className="h-4 w-4 stroke-[2.5]" />
              <span>Confirm Resignation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
