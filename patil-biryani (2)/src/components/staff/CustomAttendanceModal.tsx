import React, { useState } from 'react';
import { X, Calendar, Check, SlidersHorizontal, CheckSquare, Square, Zap, Clock } from 'lucide-react';
import { StaffEmployee, AttendanceStatus, StaffAttendance } from '../../types';
import { formatDateDisplay, formatMonthDisplay } from '../../utils/formatters';
import { CustomSelect } from '../ui/CustomSelect';
import { useAppNotification } from '../../context/AppNotificationContext';

interface CustomAttendanceModalProps {
  staffEmployees: StaffEmployee[];
  onClose: () => void;
  onApplyAttendance: (records: Omit<StaffAttendance, 'id'>[]) => void;
}

const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export const CustomAttendanceModal: React.FC<CustomAttendanceModalProps> = ({
  staffEmployees = [],
  onClose,
  onApplyAttendance,
}) => {
  const { showToast } = useAppNotification();
  const safeStaffList = staffEmployees || [];
  const activeStaff = safeStaffList.filter((e) => e.status === 'Active');

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    activeStaff.map((e) => e.id)
  );

  // Date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // Preset Mode
  const [presetPattern, setPresetPattern] = useState<'mon_sat' | 'all_days' | 'weekdays' | 'custom_days'>('mon_sat');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  // Working day status & rules
  const [workingStatus, setWorkingStatus] = useState<AttendanceStatus>('Present');
  const [sundayStatus, setSundayStatus] = useState<AttendanceStatus>('Weekly Off');
  const [inTime, setInTime] = useState('10:00 AM');
  const [outTime, setOutTime] = useState('11:00 PM');
  const [dailyHours, setDailyHours] = useState(11);
  const [dailyOT, setDailyOT] = useState(0);

  // Toggle staff selection
  const handleToggleStaff = (id: string) => {
    if (selectedStaffIds.includes(id)) {
      setSelectedStaffIds(selectedStaffIds.filter((item) => item !== id));
    } else {
      setSelectedStaffIds([...selectedStaffIds, id]);
    }
  };

  const handleSelectAllStaff = () => {
    setSelectedStaffIds(activeStaff.map((e) => e.id));
  };

  const handleClearAllStaff = () => {
    setSelectedStaffIds([]);
  };

  // Toggle custom weekday
  const handleToggleWeekday = (dayId: number) => {
    if (selectedWeekdays.includes(dayId)) {
      setSelectedWeekdays(selectedWeekdays.filter((d) => d !== dayId));
    } else {
      setSelectedWeekdays([...selectedWeekdays, dayId]);
    }
  };

  // Calculate live preview statistics
  const previewStats = () => {
    if (!startDate || !endDate) return { totalDays: 0, workingDays: 0, offDays: 0, totalRecords: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return { totalDays: 0, workingDays: 0, offDays: 0, totalRecords: 0 };

    let totalDays = 0;
    let workingDays = 0;
    let offDays = 0;
    const curr = new Date(start);

    while (curr <= end) {
      totalDays++;
      const dayOfWeek = curr.getDay(); // 0 is Sun

      if (presetPattern === 'mon_sat') {
        if (dayOfWeek === 0) offDays++;
        else workingDays++;
      } else if (presetPattern === 'all_days') {
        workingDays++;
      } else if (presetPattern === 'weekdays') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) workingDays++;
        else offDays++;
      } else if (presetPattern === 'custom_days') {
        if (selectedWeekdays.includes(dayOfWeek)) workingDays++;
        else offDays++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    const staffCount = selectedStaffIds.length;
    const totalRecords = (workingDays + offDays) * staffCount;

    return { totalDays, workingDays, offDays, totalRecords };
  };

  const stats = previewStats();

  const handleApply = () => {
    if (selectedStaffIds.length === 0) {
      showToast('Please select at least one staff member.', 'warning');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      showToast('Start date must be before or equal to End date.', 'warning');
      return;
    }

    const records: Omit<StaffAttendance, 'id'>[] = [];
    const targetStaff = activeStaff.filter((e) => selectedStaffIds.includes(e.id));
    const curr = new Date(start);

    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dayOfWeek = curr.getDay();

      let shouldRecord = false;
      let status: AttendanceStatus = workingStatus;
      let ot = dailyOT;

      if (presetPattern === 'mon_sat') {
        shouldRecord = true;
        if (dayOfWeek === 0) {
          status = sundayStatus;
          ot = 0;
        }
      } else if (presetPattern === 'all_days') {
        shouldRecord = true;
      } else if (presetPattern === 'weekdays') {
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          shouldRecord = true;
        } else {
          shouldRecord = true;
          status = 'Weekly Off';
          ot = 0;
        }
      } else if (presetPattern === 'custom_days') {
        if (selectedWeekdays.includes(dayOfWeek)) {
          shouldRecord = true;
        } else {
          shouldRecord = true;
          status = 'Weekly Off';
          ot = 0;
        }
      }

      if (shouldRecord) {
        targetStaff.forEach((emp) => {
          records.push({
            date: dateStr,
            employeeId: emp.id,
            employeeName: emp.name,
            inTime,
            outTime,
            totalHours: status === 'Weekly Off' || status === 'Absent' ? 0 : dailyHours,
            status,
            overtimeHours: status === 'Weekly Off' || status === 'Absent' ? 0 : ot,
            remarks: 'Custom batch attendance wizard',
          });
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    onApplyAttendance(records);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <SlidersHorizontal className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                Custom Attendance Setup &amp; Bulk Present
              </h3>
              <p className="text-xs text-slate-400">
                Quickly fill monthly attendance patterns, custom date ranges, and weekly off rules
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

        {/* Step 1: Staff Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              1. Select Staff Members ({selectedStaffIds.length}/{activeStaff.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllStaff}
                className="text-[10px] font-bold text-cyan-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-600 text-xs">•</span>
              <button
                type="button"
                onClick={handleClearAllStaff}
                className="text-[10px] font-bold text-slate-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-2xl bg-slate-950/60 border border-white/5">
            {activeStaff.map((emp) => {
              const isChecked = selectedStaffIds.includes(emp.id);
              return (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => handleToggleStaff(emp.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                    isChecked
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-slate-200 shadow-sm'
                      : 'bg-slate-900/40 border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <div className="truncate text-xs">
                    <div className="font-bold truncate">{emp.name}</div>
                    <div className="text-[9.5px] text-slate-400 truncate">{emp.designation}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Date Range */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            2. Date Range
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-cyan-300 font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full glass-input px-3 py-2 text-xs text-cyan-300 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Pattern & Rules */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            3. Working Days Pattern
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'mon_sat', label: 'Mon-Sat Present', desc: 'Sundays as Weekly Off' },
              { id: 'all_days', label: 'All 7 Days', desc: 'Everyday Present' },
              { id: 'weekdays', label: 'Mon to Fri Only', desc: 'Sat & Sun Off' },
              { id: 'custom_days', label: 'Custom Days', desc: 'Select Weekdays' },
            ].map((pat) => (
              <button
                type="button"
                key={pat.id}
                onClick={() => setPresetPattern(pat.id as any)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  presetPattern === pat.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-slate-100 shadow-md'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold">{pat.label}</div>
                <div className="text-[9.5px] text-slate-400">{pat.desc}</div>
              </button>
            ))}
          </div>

          {/* Custom Weekday checkboxes if custom_days */}
          {presetPattern === 'custom_days' && (
            <div className="flex flex-wrap gap-2 pt-1">
              {WEEKDAYS.map((w) => {
                const isDaySelected = selectedWeekdays.includes(w.id);
                return (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() => handleToggleWeekday(w.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isDaySelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 4: Status Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Working Days Status</label>
            <CustomSelect
              value={workingStatus}
              onChange={(val) => setWorkingStatus(val as AttendanceStatus)}
              options={[
                { value: 'Present', label: 'Present (Full Day)', badge: 'Present', badgeColor: 'emerald' },
                { value: 'Half Day', label: 'Half Day', badge: 'Half Day', badgeColor: 'amber' },
                { value: 'Leave', label: 'Paid Leave', badge: 'Leave', badgeColor: 'purple' },
                { value: 'Absent', label: 'Absent', badge: 'Absent', badgeColor: 'rose' },
              ]}
              size="sm"
            />
          </div>

          {presetPattern === 'mon_sat' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Sunday Status</label>
              <CustomSelect
                value={sundayStatus}
                onChange={(val) => setSundayStatus(val as AttendanceStatus)}
                options={[
                  { value: 'Weekly Off', label: 'Weekly Off (Paid)', badge: 'Off', badgeColor: 'blue' },
                  { value: 'Present', label: 'Present (Working)', badge: 'Present', badgeColor: 'emerald' },
                  { value: 'Absent', label: 'Absent (Unpaid)', badge: 'Absent', badgeColor: 'rose' },
                ]}
                size="sm"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Daily Overtime (Hours)</label>
            <input
              type="number"
              min="0"
              max="12"
              value={dailyOT}
              onChange={(e) => setDailyOT(parseFloat(e.target.value) || 0)}
              className="w-full glass-input px-2.5 py-1.5 text-xs text-cyan-400 font-mono-num font-bold"
            />
          </div>
        </div>

        {/* Live Preview Summary Box */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 space-y-1.5">
          <div className="font-bold flex items-center justify-between text-xs text-cyan-300">
            <span>Live Generation Preview</span>
            <span className="font-mono-num font-black text-sm">{stats.totalRecords} Records</span>
          </div>
          <div className="text-[11px] text-slate-300">
            Applying across <strong className="text-white">{selectedStaffIds.length} staff</strong> for <strong className="text-white">{stats.totalDays} total days</strong> ({stats.workingDays} working days &bull; {stats.offDays} weekly off days).
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            <Zap className="h-4 w-4 stroke-[2.5]" />
            <span>Apply Custom Attendance Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
