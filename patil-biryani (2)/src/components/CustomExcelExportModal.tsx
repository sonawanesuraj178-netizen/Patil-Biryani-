import React, { useState, useMemo, useEffect } from 'react';
import { Table, Download, Eye, X, CheckSquare, Square, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessProfile, ExcelExportOptions } from '../types';
import { generateCustomExcel, ExportRowData } from '../utils/exportUtils';
import { CustomSelect } from './ui/CustomSelect';
import { AppModal } from './ui/AppModal';

interface CustomExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  dateRangeText: string;
  defaultRows: ExportRowData[];
  businessProfile: BusinessProfile;
  categoriesList?: string[];
  paymentModesList?: string[];
}

export const CustomExcelExportModal: React.FC<CustomExcelExportModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  dateRangeText,
  defaultRows,
  businessProfile,
  categoriesList = [],
  paymentModesList = ['Cash', 'UPI', 'Bank', 'Card', 'Credit'],
}) => {
  // Dynamically extract all unique columns from defaultRows
  const dynamicColumns = useMemo(() => {
    if (!defaultRows || defaultRows.length === 0) {
      return [
        { id: 'date', label: 'Date', default: true },
        { id: 'product', label: 'Product / Item Name', default: true },
        { id: 'category', label: 'Category', default: true },
        { id: 'quantity', label: 'Quantity / Plates', default: true },
        { id: 'rate', label: 'Rate (₹)', default: true },
        { id: 'amount', label: 'Amount (₹)', default: true },
        { id: 'paymentMode', label: 'Payment Mode', default: true },
      ];
    }

    const keySet = new Set<string>();
    defaultRows.forEach((row) => {
      if (typeof row === 'object' && row !== null) {
        Object.keys(row).forEach((k) => keySet.add(k));
      }
    });

    const keys = Array.from(keySet);

    return keys.map((key) => {
      let label = key;
      if (!key.includes(' ') && !key.includes('-') && !key.includes('_')) {
        label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      }
      return {
        id: key,
        label,
        default: true,
      };
    });
  }, [defaultRows]);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'category' | 'product' | 'paymentMode' | 'customer' | 'vendor'>('none');
  const [showPreview, setShowPreview] = useState(false);
  const [customSheetName, setCustomSheetName] = useState(reportTitle);

  // Sync selected columns whenever dynamic columns change or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColumns(dynamicColumns.map((c) => c.id));
      setCustomSheetName(reportTitle);
    }
  }, [isOpen, dynamicColumns, reportTitle]);

  const toggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId)
        ? prev.length > 1
          ? prev.filter((id) => id !== colId)
          : prev
        : [...prev, colId]
    );
  };

  const selectAll = () => {
    setSelectedColumns(dynamicColumns.map((c) => c.id));
  };

  const clearAll = () => {
    if (dynamicColumns.length > 0) {
      setSelectedColumns([dynamicColumns[0].id]);
    }
  };

  // Filtered rows for export
  const processedRows = useMemo(() => {
    return defaultRows.filter((row) => {
      if (filterCategory !== 'all') {
        const cat = row.category || row.Category;
        if (cat && cat !== filterCategory) return false;
      }
      if (filterPaymentMode !== 'all') {
        const pm = row.paymentMode || row.payment_mode || row['Payment Mode'];
        if (pm && pm !== filterPaymentMode) return false;
      }
      return true;
    });
  }, [defaultRows, filterCategory, filterPaymentMode]);

  const handleExportExcel = () => {
    const options: ExcelExportOptions = {
      fileName: `PatilBiryani_${(customSheetName || reportTitle).replace(/\s+/g, '_')}`,
      sheetName: (customSheetName || reportTitle).substring(0, 30),
      dateRangeText,
      reportType: 'detailed',
      groupBy,
      selectedColumns,
      filterCategory: filterCategory !== 'all' ? filterCategory : undefined,
      filterPaymentMode: filterPaymentMode !== 'all' ? filterPaymentMode : undefined,
    };

    generateCustomExcel(options, processedRows, businessProfile);
    onClose();
  };

  const activeHeaders = useMemo(() => {
    return selectedColumns.map((colId) => {
      const col = dynamicColumns.find((c) => c.id === colId);
      return { id: colId, label: col ? col.label : colId };
    });
  }, [selectedColumns, dynamicColumns]);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title="Customize Excel Export (.xlsx)"
      subtitle={`${reportTitle} • ${dateRangeText}`}
      icon={Table}
      iconColorClass="from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30 shadow-teal-950/30"
      headerActions={
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
          {processedRows.length} Rows
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-4 w-4 text-teal-400" />
            <span>{showPreview ? 'Hide Preview' : 'Preview Excel Table'}</span>
          </button>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
              {/* Sheet Title */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Excel Workbook / Sheet Title</span>
                </label>
                <input
                  type="text"
                  value={customSheetName}
                  onChange={(e) => setCustomSheetName(e.target.value)}
                  placeholder="Enter sheet title..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category Filter */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Filter className="h-3 w-3 text-emerald-400" />
                    <span>Filter Category</span>
                  </label>
                  <CustomSelect
                    value={filterCategory}
                    onChange={(val) => setFilterCategory(val)}
                    options={[
                      { value: 'all', label: 'All Categories' },
                      ...categoriesList.map((c) => ({ value: c, label: c })),
                    ]}
                    size="sm"
                  />
                </div>

                {/* Payment Mode Filter */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Filter Payment Mode
                  </label>
                  <CustomSelect
                    value={filterPaymentMode}
                    onChange={(val) => setFilterPaymentMode(val)}
                    options={[
                      { value: 'all', label: 'All Payment Modes' },
                      ...paymentModesList.map((pm) => ({ value: pm, label: pm })),
                    ]}
                    size="sm"
                  />
                </div>

                {/* Grouping */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3 w-3 text-teal-400" />
                    <span>Grouping Layout</span>
                  </label>
                  <CustomSelect
                    value={groupBy}
                    onChange={(val) => setGroupBy(val)}
                    options={[
                      { value: 'none', label: 'Standard Flat List' },
                      { value: 'date', label: 'Date-wise' },
                      { value: 'category', label: 'Category-wise' },
                      { value: 'product', label: 'Product-wise' },
                      { value: 'paymentMode', label: 'Payment Mode-wise' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Column Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Columns to Export ({selectedColumns.length} of {dynamicColumns.length})
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-semibold text-teal-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[11px] font-semibold text-slate-400 hover:underline"
                    >
                      Reset Minimum
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {dynamicColumns.map((col) => {
                    const isSelected = selectedColumns.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => toggleColumn(col.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-all ${
                          isSelected
                            ? 'border-teal-500/40 bg-teal-500/10 text-teal-300 shadow-sm shadow-teal-500/10'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-teal-400 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                        <span className="truncate font-medium">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              {showPreview && (
                <div className="rounded-2xl border border-teal-500/30 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Excel Data Preview ({processedRows.length} Rows)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-48 rounded-xl border border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead className="border-b border-slate-800 text-slate-300 bg-slate-900 font-bold sticky top-0">
                        <tr>
                          {activeHeaders.map((col) => (
                            <th key={col.id} className="p-2.5 whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300 bg-slate-950/60">
                        {processedRows.slice(0, 6).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            {activeHeaders.map((col) => (
                              <td key={col.id} className="p-2.5 whitespace-nowrap font-mono-num">
                                {r[col.id] !== undefined ? String(r[col.id]) : (r[col.label] !== undefined ? String(r[col.label]) : '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {processedRows.length === 0 && (
                          <tr>
                            <td colSpan={activeHeaders.length || 1} className="p-4 text-center text-slate-500">
                              No records found matching filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
      </div>
    </AppModal>
  );
};
