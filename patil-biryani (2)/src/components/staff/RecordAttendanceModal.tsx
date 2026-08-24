import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  FileText,
  ShieldAlert,
  Edit3,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { StaffEmployee, AttendanceStatus, StaffAttendance } from '../../types';
import { formatDateDisplay, getTodayDateString } from '../../utils/formatters';
import { CustomSelect } from '../ui/CustomSelect';

interface RecordAttendanceModalProps {
  staffEmployees: StaffEmployee[];
  attendanceRecords: StaffAttendance[];
  initialEmployeeId?: string;
  initialDate?: string;
  initialRecord?: StaffAttendance | null;
  onClose: () => void;
  onSave: (record: Omit<StaffAttendance, 'id'>, isOverwrite?: boolean) => void;
}

export const RecordAttendanceModal: React.FC<RecordAttendanceModalProps> = ({
  staffEmployees = [],
  attendanceRecords = [],
  initialEmployeeId = '',
  initialDate = '',
  initialRecord = null,
  onClose,
  onSave,
}) => {
  const activeStaff = useMemo(
    () => staffEmployees.filter((e) => e.status === 'Active'),
    [staffEmployees]
  );

  // Form states
  const [employeeId, setEmployeeId] = useState<string>(() => {
    if (initialRecord) return initialRecord.employeeId;
    if (initialEmployeeId) return initialEmployeeId;
    return activeStaff.length > 0 ? activeStaff[0].id : '';
  });

  const [date, setDate] = useState<string>(() => {
    if (initialRecord) return initialRecord.date;
    if (initialDate) return initialDate;
    return getTodayDateString();
  });

  const [status, setStatus] = useState<AttendanceStatus>(() => {
    if (initialRecord) return initialRecord.status;
    return 'Present';
  });

  const [inTime, setInTime] = useState<string>(() => {
    if (initialRecord) return initialRecord.inTime || '10:00 AM';
    return '10:00 AM';
  });

  const [outTime, setOutTime] = useState<string>(() => {
    if (initialRecord) return initialRecord.outTime || '11:00 PM';
    return '11:00 PM';
  });

  const [totalHours, setTotalHours] = useState<string>(() => {
    if (initialRecord) return initialRecord.totalHours !== undefined ? initialRecord.totalHours.toString() : '11';
    return '11';
  });

  const [overtimeHours, setOvertimeHours] = useState<string>(() => {
    if (initialRecord) return initialRecord.overtimeHours !== undefined ? initialRecord.overtimeHours.toString() : '0';
    return '0';
  });

  const [remarks, setRemarks] = useState<string>(() => {
    if (initialRecord) return initialRecord.remarks || '';
    return '';
  });

  // Overwrite permission toggle when duplicate is detected
  const [allowOverwrite, setAllowOverwrite] = useState<boolean>(false);

  // Validation Error States
  const [errors, setErrors] = useState<{
    employeeId?: string;
    date?: string;
    status?: string;
    inTime?: string;
    outTime?: string;
    totalHours?: string;
    overtimeHours?: string;
    duplicate?: string;
  }>({});

  const [submitted, setSubmitted] = useState<boolean>(false);

  // Selected employee object
  const selectedEmployee = useMemo(
    () => staffEmployees.find((e) => e.id === employeeId),
    [staffEmployees, employeeId]
  );

  // Check for Duplicate Entry
  const existingRecord = useMemo(() => {
    if (!employeeId || !date) return null;
    return attendanceRecords.find(
      (a) =>
        a.employeeId === employeeId &&
        a.date === date &&
        (!initialRecord || a.id !== initialRecord.id)
    );
  }, [attendanceRecords, employeeId, date, initialRecord]);

  // Adjust default hours/times based on status change
  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Present') {
      if (!inTime) setInTime('10:00 AM');
      if (!outTime) setOutTime('11:00 PM');
      setTotalHours('11');
    } else if (newStatus === 'Half Day') {
      if (!inTime) setInTime('10:00 AM');
      if (!outTime) setOutTime('04:00 PM');
      setTotalHours('5.5');
    } else if (newStatus === 'Weekly Off' || newStatus === 'Absent' || newStatus === 'Leave') {
      setInTime('');
      setOutTime('');
      setTotalHours('0');
      setOvertimeHours('0');
    }
  };

  // Populate from existing duplicate if user chooses to load
  const handleLoadExistingData = () => {
    if (!existingRecord) return;
    setStatus(existingRecord.status);
    setInTime(existingRecord.inTime || '');
    setOutTime(existingRecord.outTime || '');
    setTotalHours((existingRecord.totalHours ?? 0).toString());
    setOvertimeHours((existingRecord.overtimeHours ?? 0).toString());
    setRemarks(existingRecord.remarks || '');
    setAllowOverwrite(true);
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors: typeof errors = {};

    // 1. Mandatory Employee Validation
    if (!employeeId || employeeId.trim() === '') {
      newErrors.employeeId = 'Staff member selection is mandatory.';
    }

    // 2. Mandatory Date Validation
    if (!date || date.trim() === '') {
      newErrors.date = 'Attendance date is mandatory.';
    } else {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        newErrors.date = 'Please enter a valid date in YYYY-MM-DD format.';
      }
    }

    // 3. Mandatory Status Validation
    if (!status) {
      newErrors.status = 'Attendance status is mandatory.';
    }

    // 4. In Time / Out Time check for Present / Half Day
    if (status === 'Present' || status === 'Half Day') {
      if (!inTime || inTime.trim() === '') {
        newErrors.inTime = 'In-Time is mandatory for Present / Half Day status.';
      }
      if (!outTime || outTime.trim() === '') {
        newErrors.outTime = 'Out-Time is mandatory for Present / Half Day status.';
      }
    }

    // 5. Total Hours Validation
    const parsedHours = parseFloat(totalHours);
    if (isNaN(parsedHours) || parsedHours < 0) {
      newErrors.totalHours = 'Total hours must be a valid number ≥ 0.';
    } else if (parsedHours > 24) {
      newErrors.totalHours = 'Total hours cannot exceed 24 hours in a single day.';
    }

    // 6. Overtime Hours Validation
    const parsedOT = parseFloat(overtimeHours);
    if (isNaN(parsedOT) || parsedOT < 0) {
      newErrors.overtimeHours = 'Overtime hours must be a valid number ≥ 0.';
    } else if (parsedOT > 24) {
      newErrors.overtimeHours = 'Overtime hours cannot exceed 24 hours.';
    }

    // 7. Duplicate Entry Prevention
    if (existingRecord && !allowOverwrite && !initialRecord) {
      newErrors.duplicate = `Duplicate attendance record detected! An entry for ${
        selectedEmployee?.name || 'this staff member'
      } on ${formatDateDisplay(date)} already exists (${existingRecord.status}). Enable "Allow overwrite" to replace it.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Re-run validation on change if already submitted
  useEffect(() => {
    if (submitted) {
      validateForm();
    }
  }, [employeeId, date, status, inTime, outTime, totalHours, overtimeHours, allowOverwrite, existingRecord, submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const isValid = validateForm();
    if (!isValid) return;

    if (!selectedEmployee) {
      setErrors((prev) => ({ ...prev, employeeId: 'Please select a valid staff employee.' }));
      return;
    }

    const finalRecord: Omit<StaffAttendance, 'id'> = {
      date,
      employeeId,
      employeeName: selectedEmployee.name,
      status,
      inTime: inTime.trim(),
      outTime: outTime.trim(),
      totalHours: parseFloat(totalHours) || 0,
      overtimeHours: parseFloat(overtimeHours) || 0,
      remarks: remarks.trim(),
    };

    onSave(finalRecord, allowOverwrite || !!initialRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {initialRecord ? <Edit3 className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100">
                {initialRecord ? 'Edit Attendance Record' : 'Record Staff Attendance'}
              </h3>
              <p className="text-xs text-slate-400">
                Validated single entry with duplicate prevention & mandatory checks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Error Banner if validation fails */}
        {submitted && Object.keys(errors).length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Please fix the following validation errors before saving:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/90 pl-1">
              {errors.employeeId && <li>{errors.employeeId}</li>}
              {errors.date && <li>{errors.date}</li>}
              {errors.status && <li>{errors.status}</li>}
              {errors.inTime && <li>{errors.inTime}</li>}
              {errors.outTime && <li>{errors.outTime}</li>}
              {errors.totalHours && <li>{errors.totalHours}</li>}
              {errors.overtimeHours && <li>{errors.overtimeHours}</li>}
              {errors.duplicate && <li>{errors.duplicate}</li>}
            </ul>
          </div>
        )}

        {/* Real-time DUPLICATE ENTRY ALERT BANNER */}
        {existingRecord && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-2.5 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-300">
                  Duplicate Entry Warning: Record already exists!
                </div>
                <p className="text-[11.5px] text-amber-200/90 leading-relaxed">
                  <strong>{selectedEmployee?.name}</strong> already has attendance recorded on{' '}
                  <strong>{formatDateDisplay(date)}</strong> with status{' '}
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/30 font-bold text-amber-200">
                    {existingRecord.status}
                  </span>
                  {existingRecord.overtimeHours > 0 && ` (+${existingRecord.overtimeHours}h OT)`}.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={allowOverwrite}
                  onChange={(e) => setAllowOverwrite(e.target.checked)}
                  className="rounded border-amber-500 text-cyan-500 focus:ring-cyan-500 h-4 w-4 bg-slate-900"
                />
                <span>Allow overwrite / update existing record for this date</span>
              </label>

              <button
                type="button"
                onClick={handleLoadExistingData}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Load existing data into form →
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Staff Selection & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Staff Employee Field (MANDATORY) */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
                <span>
                  Staff Member <span className="text-rose-400 font-black">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Mandatory</span>
              </label>
              <CustomSelect
                value={employeeId}
                onChange={(val) => {
                  setEmployeeId(val);
                  setAllowOverwrite(false);
                }}
                disabled={!!initialRecord}
                options={[
                  { value: '', label: '-- Select Staff Member --' },
                  ...activeStaff.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                    sublabel: `${emp.employeeId} • ${emp.designation}`,
                  })),
                ]}
                searchable
                error={errors.employeeId}
                size="sm"
              />
              {errors.employeeId && (
                <p className="text-[10.5px] text-rose-400 mt-1 font-semibold">{errors.employeeId}</p>
              )}
            </div>

            {/* Attendance Date Field (MANDATORY) */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-1">
                <span>
                  Attendance Date <span className="text-rose-400 font-black">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Mandatory</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setAllowOverwrite(false);
                  }}
                  disabled={!!initialRecord}
                  className={`w-full glass-input px-3 py-2 text-xs text-slate-200 font-bold transition-colors ${
                    errors.date ? 'border-rose-500 focus:border-rose-500 bg-rose-950/20' : ''
                  }`}
                />
              </div>
              {errors.date && (
                <p className="text-[10.5px] text-rose-400 mt-1 font-semibold">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Row 2: Attendance Status Pills (MANDATORY) */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-2">
              <span>
                Attendance Status <span className="text-rose-400 font-black">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Select today&apos;s shift status
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(
                [
                  { key: 'Present', label: 'Present', color: 'bg-emerald-500 text-slate-950', border: 'border-emerald-500' },
                  { key: 'Half Day', label: 'Half Day', color: 'bg-amber-500 text-slate-950', border: 'border-amber-500' },
                  { key: 'Weekly Off', label: 'Weekly Off', color: 'bg-cyan-500 text-slate-950', border: 'border-cyan-500' },
                  { key: 'Leave', label: 'Leave', color: 'bg-purple-500 text-white', border: 'border-purple-500' },
                  { key: 'Absent', label: 'Absent', color: 'bg-rose-500 text-white', border: 'border-rose-500' },
                ] as const
              ).map((st) => {
                const isSelected = status === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => handleStatusChange(st.key)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center border ${
                      isSelected
                        ? `${st.color} ${st.border} shadow-lg shadow-black/40 font-black scale-[1.02]`
                        : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
            {errors.status && (
              <p className="text-[10.5px] text-rose-400 mt-1 font-semibold">{errors.status}</p>
            )}
          </div>

          {/* Row 3: Timings (In / Out) & Total Hours */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Shift Timing & Working Hours</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* In Time */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  In-Time {status === 'Present' || status === 'Half Day' ? <span className="text-rose-400">*</span> : ''}
                </label>
                <input
                  type="text"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="10:00 AM"
                  disabled={status === 'Absent' || status === 'Weekly Off' || status === 'Leave'}
                  className={`w-full glass-input px-3 py-1.5 text-xs text-slate-200 font-mono-num ${
                    errors.inTime ? 'border-rose-500 bg-rose-950/20' : ''
                  }`}
                />
                {errors.inTime && (
                  <p className="text-[10px] text-rose-400 mt-0.5">{errors.inTime}</p>
                )}
              </div>

              {/* Out Time */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Out-Time {status === 'Present' || status === 'Half Day' ? <span className="text-rose-400">*</span> : ''}
                </label>
                <input
                  type="text"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="11:00 PM"
                  disabled={status === 'Absent' || status === 'Weekly Off' || status === 'Leave'}
                  className={`w-full glass-input px-3 py-1.5 text-xs text-slate-200 font-mono-num ${
                    errors.outTime ? 'border-rose-500 bg-rose-950/20' : ''
                  }`}
                />
                {errors.outTime && (
                  <p className="text-[10px] text-rose-400 mt-0.5">{errors.outTime}</p>
                )}
              </div>

              {/* Total Hours */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Total Working Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={totalHours}
                  onChange={(e) => setTotalHours(e.target.value)}
                  placeholder="11"
                  className={`w-full glass-input px-3 py-1.5 text-xs text-cyan-400 font-bold font-mono-num ${
                    errors.totalHours ? 'border-rose-500 bg-rose-950/20' : ''
                  }`}
                />
                {errors.totalHours && (
                  <p className="text-[10px] text-rose-400 mt-0.5">{errors.totalHours}</p>
                )}
              </div>
            </div>

            {/* Overtime Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Overtime (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  placeholder="0"
                  className={`w-full glass-input px-3 py-1.5 text-xs text-amber-400 font-bold font-mono-num ${
                    errors.overtimeHours ? 'border-rose-500 bg-rose-950/20' : ''
                  }`}
                />
                {errors.overtimeHours && (
                  <p className="text-[10px] text-rose-400 mt-0.5">{errors.overtimeHours}</p>
                )}
              </div>

              <div>
                <label className="text-[10.5px] font-semibold text-slate-400 block mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Covered evening rush, banquet shift"
                  className="w-full glass-input px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!existingRecord && !allowOverwrite && !initialRecord}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
                existingRecord && !allowOverwrite && !initialRecord
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/25 active:scale-95'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {initialRecord || allowOverwrite
                  ? 'Save & Update Attendance'
                  : 'Save Attendance Record'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
