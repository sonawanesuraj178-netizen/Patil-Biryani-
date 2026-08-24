import React, { useState } from 'react';
import { X, Calendar, Check, Zap, Clock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { StaffEmployee, AttendanceStatus, StaffAttendance } from '../../types';
import { formatDateDisplay, formatMonthDisplay, getTodayDateString } from '../../utils/formatters';

interface IndividualAttendanceModalProps {
  employee: StaffEmployee;
  initialMonth: string; // YYYY-MM
  attendanceRecords: StaffAttendance[];
  onClose: () => void;
  onSaveRecord: (
    employeeId: string,
    employeeName: string,
    status: AttendanceStatus,
    otHours: number,
    date: string
  ) => void;
  onBatchApply: (records: Omit<StaffAttendance, 'id'>[]) => void;
}

export const IndividualAttendanceModal: React.FC<IndividualAttendanceModalProps> = ({
  employee,
  initialMonth,
  attendanceRecords = [],
  onClose,
  onSaveRecord,
  onBatchApply,
}) => {
  const safeRecords = attendanceRecords || [];
  const [currentMonth, setCurrentMonth] = useState(initialMonth || getTodayDateString().substring(0, 7));

  const [yStr, mStr] = currentMonth.split('-');
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mStr, 10);
  const totalDaysInMonth = new Date(year, monthNum, 0).getDate();

  // Quick preset actions
  const handleFillMonSatPresent = () => {
    const records: Omit<StaffAttendance, 'id'>[] = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      const d = new Date(year, monthNum - 1, day);
      const isSunday = d.getDay() === 0;

      records.push({
        date: dateStr,
        employeeId: employee.id,
        employeeName: employee.name,
        inTime: isSunday ? '' : '10:00 AM',
        outTime: isSunday ? '' : '11:00 PM',
        totalHours: isSunday ? 0 : 11,
        status: isSunday ? 'Weekly Off' : 'Present',
        overtimeHours: 0,
        remarks: 'Month fill: Mon-Sat Present, Sun Off',
      });
    }
    onBatchApply(records);
  };

  const handleFillAllDaysPresent = () => {
    const records: Omit<StaffAttendance, 'id'>[] = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      records.push({
        date: dateStr,
        employeeId: employee.id,
        employeeName: employee.name,
        inTime: '10:00 AM',
        outTime: '11:00 PM',
        totalHours: 11,
        status: 'Present',
        overtimeHours: 0,
        remarks: 'Month fill: All Present',
      });
    }
    onBatchApply(records);
  };

  // Month navigation
  const handlePrevMonth = () => {
    let newY = year;
    let newM = monthNum - 1;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    setCurrentMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newY = year;
    let newM = monthNum + 1;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    setCurrentMonth(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  // Cycle status for a specific day
  const cycleStatus = (currentStatus: AttendanceStatus | undefined): AttendanceStatus => {
    const order: AttendanceStatus[] = ['Present', 'Weekly Off', 'Half Day', 'Leave', 'Absent'];
    if (!currentStatus) return 'Present';
    const idx = order.indexOf(currentStatus);
    return order[(idx + 1) % order.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Calendar className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-100">{employee.name}</h3>
                <span className="text-xs text-cyan-400 font-mono-num font-semibold">
                  ₹{employee.basicSalary.toLocaleString('en-IN')}/{employee.salaryType === 'Monthly' ? 'mo' : 'day'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Custom Attendance Editor • {employee.designation}
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

        {/* Month Selector & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-xs text-slate-100 min-w-[130px] text-center">
              {formatMonthDisplay(currentMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFillMonSatPresent}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold border border-cyan-500/30 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Fill Mon-Sat Present (Sun Off)</span>
            </button>
            <button
              onClick={handleFillAllDaysPresent}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-xs font-bold border border-emerald-500/30 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Fill All 100% Present</span>
            </button>
          </div>
        </div>

        {/* Day-by-Day Calendar Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Click any day to cycle status (P &rarr; WO &rarr; HD &rarr; L &rarr; A)</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Present (1d)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Weekly Off (1d)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Half Day (0.5d)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Absent (0d)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] uppercase font-bold text-slate-500 py-1"
              >
                {d}
              </div>
            ))}

            {/* Empty slots for first day of month */}
            {Array.from({ length: new Date(year, monthNum - 1, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 rounded-xl bg-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
              const d = new Date(year, monthNum - 1, day);
              const isSunday = d.getDay() === 0;
              const rec = safeRecords.find(
                (a) => a.employeeId === employee.id && a.date === dateStr
              );
              const status: AttendanceStatus = rec?.status || (isSunday ? 'Weekly Off' : 'Present');
              const ot = rec?.overtimeHours || 0;

              let badgeBg = 'bg-slate-900 border-white/10 text-slate-400';
              if (status === 'Present') badgeBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
              else if (status === 'Weekly Off') badgeBg = 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
              else if (status === 'Half Day') badgeBg = 'bg-amber-500/20 border-amber-500/40 text-amber-300';
              else if (status === 'Leave') badgeBg = 'bg-teal-500/20 border-teal-500/40 text-teal-300';
              else if (status === 'Absent') badgeBg = 'bg-rose-500/20 border-rose-500/40 text-rose-300';

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => {
                    const nextSt = cycleStatus(status);
                    onSaveRecord(employee.id, employee.name, nextSt, ot, dateStr);
                  }}
                  className={`p-2 rounded-2xl border text-center transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-between min-h-[58px] ${badgeBg}`}
                >
                  <div className="flex items-center justify-between w-full text-[10px] font-bold">
                    <span className="font-mono-num text-slate-300">{day}</span>
                    {ot > 0 && <span className="text-[9px] text-cyan-400 font-bold">+{ot}h</span>}
                  </div>
                  <div className="font-bold text-xs tracking-tight">
                    {status === 'Present' && 'P'}
                    {status === 'Weekly Off' && 'WO'}
                    {status === 'Half Day' && 'HD'}
                    {status === 'Leave' && 'L'}
                    {status === 'Absent' && 'A'}
                  </div>
                  <div className="text-[8.5px] opacity-75 truncate max-w-full">
                    {status}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-slate-400">Changes are saved in real-time.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
