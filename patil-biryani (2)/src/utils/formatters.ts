/**
 * Indian Number Formatting and Currency Helper for Patil Biryani
 */

export function formatINR(amount: number | undefined | null, includeDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formattedNumber = '';
  if (includeDecimals) {
    formattedNumber = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    // Standard integer rounding with Indian comma grouping
    const rounded = Math.round(absAmount);
    formattedNumber = rounded.toLocaleString('en-IN');
  }

  return `${isNegative ? '-₹' : '₹'}${formattedNumber}`;
}

export function formatNumberIN(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  return Number(num).toLocaleString('en-IN');
}

export function formatPercent(num: number | undefined | null, decimals = 1): string {
  if (num === undefined || num === null || isNaN(num)) {
    return '0%';
  }
  return `${Number(num).toFixed(decimals)}%`;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

import { DateFormatPattern, TimeFormatPattern } from '../types';

export function formatDateWithPattern(
  dateStr: string | undefined | null,
  pattern: DateFormatPattern = 'DD/MM/YYYY'
): string {
  if (!dateStr) return '-';
  try {
    let cleanStr = String(dateStr).trim();
    // Strip time portion if present (e.g. 2026-08-21T10:30:00Z or 2026-08-21 10:30)
    if (cleanStr.includes('T')) {
      cleanStr = cleanStr.split('T')[0];
    } else if (cleanStr.includes(' ') && (cleanStr.includes('-') || cleanStr.includes('/'))) {
      cleanStr = cleanStr.split(' ')[0];
    }

    let year = '';
    let month = '';
    let day = '';

    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        // format YYYY-MM-DD or DD-MM-YYYY
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1].padStart(2, '0');
          day = parts[2].padStart(2, '0');
        } else if (parts[2].length === 4) {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2];
        } else {
          year = parts[0].length > parts[2].length ? parts[0] : parts[2];
          month = parts[1].padStart(2, '0');
          day = (parts[0].length > parts[2].length ? parts[2] : parts[0]).padStart(2, '0');
        }
      } else if (parts.length === 2) {
        // format YYYY-MM
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = '01';
      }
    } else if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1].padStart(2, '0');
          day = parts[2].padStart(2, '0');
        } else {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2];
        }
      }
    }

    // If parsing didn't produce full parts, parse via Date object
    if (!year || !month || !day || isNaN(parseInt(year, 10)) || isNaN(parseInt(month, 10)) || isNaN(parseInt(day, 10))) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      year = String(d.getFullYear());
      month = String(d.getMonth() + 1).padStart(2, '0');
      day = String(d.getDate()).padStart(2, '0');
    }

    // Ensure full 4-digit year (prevents 26 vs 2026 cutoff issues)
    if (year.length === 2) {
      year = `20${year}`;
    }

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const mIdx = Math.max(0, Math.min(11, parseInt(month, 10) - 1));

    switch (pattern) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      case 'DD MMM YYYY':
        return `${day} ${shortMonths[mIdx]} ${year}`;
      case 'DD MMMM YYYY':
        return `${day} ${fullMonths[mIdx]} ${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  } catch {
    return String(dateStr);
  }
}

export function formatDateDisplay(dateStr: string | undefined | null, customFormat?: DateFormatPattern): string {
  if (!dateStr) return '-';
  return formatDateWithPattern(dateStr, customFormat || 'DD/MM/YYYY');
}

export function formatTimeWithPattern(
  timeStr: string | undefined | null,
  pattern: TimeFormatPattern = '12-hour'
): string {
  if (!timeStr) return '';
  try {
    const cleanStr = String(timeStr).trim();
    if (!cleanStr) return '';
    // If it's already in format like '10:30 AM' or '02:15 PM'
    if (cleanStr.includes('AM') || cleanStr.includes('PM') || cleanStr.includes('am') || cleanStr.includes('pm')) {
      if (pattern === '24-hour') {
        const parts = cleanStr.split(/[:\s]/);
        let h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        const isPM = cleanStr.toLowerCase().includes('pm');
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
      }
      return cleanStr;
    }

    // Format HH:MM
    const parts = cleanStr.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1].slice(0, 2).padStart(2, '0');
      if (isNaN(hours)) return cleanStr;
      if (pattern === '24-hour') {
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      }
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    return cleanStr;
  } catch {
    return String(timeStr);
  }
}

export function formatTimeDisplay(timeStr: string | undefined | null, customPattern?: TimeFormatPattern): string {
  if (!timeStr) return '-';
  return formatTimeWithPattern(timeStr, customPattern || '12-hour');
}

export function isDateInSelectedMonth(dateStr: string | undefined | null, targetMonth: string): boolean {
  if (!dateStr || !targetMonth) return false;
  try {
    const dStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    if (dStr.startsWith(targetMonth)) return true;
    
    // Check if dStr formatted as YYYY-MM
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      if (parts.length >= 2) {
        const ym = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        return ym === targetMonth;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function isDateBetweenRange(dateStr: string | undefined | null, startDate: string, endDate: string): boolean {
  if (!dateStr) return false;
  try {
    const dStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    if (startDate && dStr < startDate) return false;
    if (endDate && dStr > endDate) return false;
    return true;
  } catch {
    return false;
  }
}

export function formatMonthDisplay(monthStr: string | undefined): string {
  if (!monthStr) return '-';
  try {
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${months[mIdx] || parts[1]} ${parts[0]}`;
    }
    return monthStr;
  } catch {
    return monthStr;
  }
}

export function shiftDateDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

export function getDayName(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { weekday: 'long' });
  } catch {
    return '';
  }
}

export function generateId(prefix: string): string {
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${timestamp}-${randomStr}`;
}

export function extractSequenceNumber(invoiceNumber: string | undefined | null): number {
  if (!invoiceNumber) return 0;
  const match = String(invoiceNumber).match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function generateInvoiceNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const sequence = String(Math.max(1, sequenceNumber)).padStart(4, '0');
  return `PB-${year}-${sequence}`;
}
