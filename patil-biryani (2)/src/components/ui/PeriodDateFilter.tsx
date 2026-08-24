import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatMonthDisplay,
  getTodayDateString,
  getYesterdayDateString,
  getCurrentMonthString,
  isDateInSelectedMonth,
  isDateBetweenRange,
} from '../../utils/formatters';

export type FilterPeriodType =
  | 'all'
  | 'this-month'
  | 'previous-month'
  | 'custom-month'
  | 'custom-range'
  | 'today'
  | 'yesterday';

export interface PeriodDateFilterProps {
  period?: FilterPeriodType;
  periodType?: FilterPeriodType;
  onPeriodChange?: (period: FilterPeriodType) => void;
  onPeriodTypeChange?: (period: FilterPeriodType) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  customStartDate?: string;
  startDate?: string;
  onCustomStartDateChange?: (date: string) => void;
  onStartDateChange?: (date: string) => void;
  customEndDate?: string;
  endDate?: string;
  onCustomEndDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  className?: string;
  title?: string;
  label?: string;
  totalCount?: number;
  filteredCount?: number;
}

export function isDateMatchingPeriod(
  dateStr: string | undefined | null,
  period: FilterPeriodType,
  selectedMonth: string,
  customStartDate?: string,
  customEndDate?: string
): boolean {
  if (!dateStr) return false;
  const currentMonthStr = getCurrentMonthString();
  const prevMonthStr = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];

  switch (period) {
    case 'all':
      return true;
    case 'this-month':
      return isDateInSelectedMonth(cleanDate, currentMonthStr);
    case 'previous-month':
      return isDateInSelectedMonth(cleanDate, prevMonthStr);
    case 'custom-month':
      return isDateInSelectedMonth(cleanDate, selectedMonth);
    case 'custom-range':
      return isDateBetweenRange(cleanDate, customStartDate || '', customEndDate || '');
    case 'today':
      return cleanDate === todayStr;
    case 'yesterday':
      return cleanDate === yesterdayStr;
    default:
      return true;
  }
}

export const PeriodDateFilter: React.FC<PeriodDateFilterProps> = ({
  period,
  periodType,
  onPeriodChange,
  onPeriodTypeChange,
  selectedMonth,
  onMonthChange,
  customStartDate,
  startDate,
  onCustomStartDateChange,
  onStartDateChange,
  customEndDate,
  endDate,
  onCustomEndDateChange,
  onEndDateChange,
  className = '',
  title,
  label,
  totalCount,
  filteredCount,
}) => {
  const currentPeriod = period || periodType || 'all';
  const handlePeriodChange = (p: FilterPeriodType) => {
    if (typeof onPeriodChange === 'function') onPeriodChange(p);
    if (typeof onPeriodTypeChange === 'function') onPeriodTypeChange(p);
  };

  const currentStartDate = customStartDate ?? startDate ?? '';
  const currentEndDate = customEndDate ?? endDate ?? '';

  const handleStartDateChange = (d: string) => {
    if (typeof onCustomStartDateChange === 'function') onCustomStartDateChange(d);
    if (typeof onStartDateChange === 'function') onStartDateChange(d);
  };

  const handleEndDateChange = (d: string) => {
    if (typeof onCustomEndDateChange === 'function') onCustomEndDateChange(d);
    if (typeof onEndDateChange === 'function') onEndDateChange(d);
  };

  const displayTitle = label || title || 'Period';

  const handlePrevMonth = () => {
    const [yStr, mStr] = (selectedMonth || getCurrentMonthString()).split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (typeof onMonthChange === 'function') {
      onMonthChange(`${y}-${String(m).padStart(2, '0')}`);
    }
    if (currentPeriod !== 'custom-month') {
      handlePeriodChange('custom-month');
    }
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = (selectedMonth || getCurrentMonthString()).split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (typeof onMonthChange === 'function') {
      onMonthChange(`${y}-${String(m).padStart(2, '0')}`);
    }
    if (currentPeriod !== 'custom-month') {
      handlePeriodChange('custom-month');
    }
  };

  const handleCurrentMonth = () => {
    if (typeof onMonthChange === 'function') {
      onMonthChange(getCurrentMonthString());
    }
    handlePeriodChange('this-month');
  };

  const periodTabs: { id: FilterPeriodType; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'this-month', label: 'This Month' },
    { id: 'previous-month', label: 'Previous Month' },
    { id: 'custom-month', label: 'Specific Month' },
    { id: 'custom-range', label: 'Custom Date Range' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
  ];

  return (
    <div className={`glass-card rounded-2xl p-4 border border-white/10 space-y-3 bg-slate-950/60 ${className}`}>
      {/* Quick Period Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            <span>{displayTitle}:</span>
          </span>
          {periodTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handlePeriodChange(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                currentPeriod === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {totalCount !== undefined && filteredCount !== undefined && (
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <span>Showing</span>
            <span className="font-bold text-cyan-400">{filteredCount}</span>
            <span>of</span>
            <span className="font-bold text-slate-200">{totalCount}</span>
            <span>records</span>
          </div>
        )}
      </div>

      {/* Specific Month Stepper (if 'custom-month') */}
      {currentPeriod === 'custom-month' && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-xs font-medium text-slate-400">Select Month:</span>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              if (typeof onMonthChange === 'function') onMonthChange(e.target.value);
              handlePeriodChange('custom-month');
            }}
            className="glass-input px-3 py-1 text-xs text-slate-100 font-bold rounded-xl border border-cyan-500/40"
          />

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold hover:bg-slate-700 border border-cyan-500/20 transition-colors"
          >
            Current Month
          </button>

          <span className="text-xs text-cyan-400 font-bold ml-1">
            Viewing {formatMonthDisplay(selectedMonth)}
          </span>
        </div>
      )}

      {/* Custom Date Range Pickers (if 'custom-range') */}
      {currentPeriod === 'custom-range' && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-xs font-medium text-slate-400">From Date:</span>
          <input
            type="date"
            value={currentStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="glass-input px-3 py-1 text-xs text-slate-100 rounded-xl"
          />
          <span className="text-xs font-medium text-slate-400">To Date:</span>
          <input
            type="date"
            value={currentEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="glass-input px-3 py-1 text-xs text-slate-100 rounded-xl"
          />
        </div>
      )}
    </div>
  );
};
