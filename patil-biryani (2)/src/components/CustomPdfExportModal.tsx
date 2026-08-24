import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  X,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Table,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessProfile, PDFExportOptions } from '../types';
import { generateCustomPDF, ExportRowData } from '../utils/exportUtils';
import { CustomSelect } from './ui/CustomSelect';
import { AppModal } from './ui/AppModal';

interface CustomPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  dateRangeText: string;
  defaultRows: ExportRowData[];
  businessProfile: BusinessProfile;
  summaryTotals?: Record<string, number | string>;
}

export const CustomPdfExportModal: React.FC<CustomPdfExportModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  dateRangeText,
  defaultRows,
  businessProfile,
  summaryTotals,
}) => {
  // Dynamically extract all unique column keys from defaultRows
  const dynamicFields = useMemo(() => {
    if (!defaultRows || defaultRows.length === 0) {
      return [
        { id: 'date', label: 'Date', default: true },
        { id: 'product', label: 'Product / Dish', default: true },
        { id: 'category', label: 'Category', default: true },
        { id: 'quantity', label: 'Plates Sold', default: true },
        { id: 'rate', label: 'Rate (₹)', default: true },
        { id: 'amount', label: 'Total Amount (₹)', default: true },
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

    // Format human-friendly labels
    return keys.map((key) => {
      let label = key;
      // If camelCase or PascalCase, insert space
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

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [includeBusinessDetails, setIncludeBusinessDetails] = useState(true);
  const [includeOwnerDetails, setIncludeOwnerDetails] = useState(true);
  const [includeSummaryCards, setIncludeSummaryCards] = useState(true);
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('detailed');
  const [groupBy, setGroupBy] = useState<'none' | 'date' | 'category' | 'product' | 'paymentMode' | 'customer' | 'vendor'>('none');
  const [showPreview, setShowPreview] = useState(false);
  const [customReportTitle, setCustomReportTitle] = useState(reportTitle);

  // Sync selected fields whenever dynamic fields change or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFields(dynamicFields.map((f) => f.id));
      setCustomReportTitle(reportTitle);
    }
  }, [isOpen, dynamicFields, reportTitle]);

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.length > 1
          ? prev.filter((id) => id !== fieldId)
          : prev
        : [...prev, fieldId]
    );
  };

  const selectAll = () => {
    setSelectedFields(dynamicFields.map((f) => f.id));
  };

  const clearAll = () => {
    if (dynamicFields.length > 0) {
      setSelectedFields([dynamicFields[0].id]);
    }
  };

  // Build active Column Headers for Table
  const activeColumns = useMemo(() => {
    return selectedFields.map((fId) => {
      const field = dynamicFields.find((f) => f.id === fId);
      return {
        header: field ? field.label : fId,
        dataKey: fId,
      };
    });
  }, [selectedFields, dynamicFields]);

  const handleExportPDF = () => {
    const options: PDFExportOptions = {
      title: customReportTitle || reportTitle,
      subtitle: `${reportType === 'summary' ? 'Summary Analysis' : 'Detailed Report'} • Period: ${dateRangeText}${
        groupBy !== 'none' ? ` • Grouped: ${groupBy}` : ''
      }`,
      dateRangeText,
      reportType,
      groupBy,
      includeBusinessDetails,
      includeOwnerDetails,
      includeSummaryCards,
      selectedFields,
    };

    generateCustomPDF(options, activeColumns, defaultRows, businessProfile, summaryTotals);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title="Customize PDF Export"
      subtitle={`${reportTitle} • ${dateRangeText}`}
      icon={FileText}
      iconColorClass="from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-950/30"
      headerActions={
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {defaultRows.length} Rows Available
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-4 w-4 text-cyan-400" />
            <span>{showPreview ? 'Hide Preview' : 'Preview Table'}</span>
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
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>Download {reportType === 'summary' ? 'Summary' : 'Detailed'} PDF</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
              {/* Report Title & Subheading customizer */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Report Header Title</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Customizes PDF top banner</span>
                </div>
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={(e) => setCustomReportTitle(e.target.value)}
                  placeholder="Enter custom PDF report title..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Report Structure & Grouping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Report Format */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Report Structure</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReportType('detailed')}
                      className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                        reportType === 'detailed'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      Detailed Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('summary')}
                      className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                        reportType === 'summary'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      Summary Mode
                    </button>
                  </div>
                </div>

                {/* Group By */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Group Records By</span>
                  </div>
                  <CustomSelect
                    value={groupBy}
                    onChange={(val) => setGroupBy(val)}
                    options={[
                      { value: 'none', label: 'No Grouping (Flat Table)' },
                      { value: 'date', label: 'Group by Date' },
                      { value: 'category', label: 'Group by Category' },
                      { value: 'product', label: 'Group by Dish / Item' },
                      { value: 'paymentMode', label: 'Group by Payment Mode' },
                      { value: 'customer', label: 'Group by Customer' },
                      { value: 'vendor', label: 'Group by Vendor / Supplier' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              {/* Branding and Metadata Toggles */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  PDF Branding & Header Inclusions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeBusinessDetails}
                      onChange={(e) => setIncludeBusinessDetails(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Patil Biryani Header & GST</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeOwnerDetails}
                      onChange={(e) => setIncludeOwnerDetails(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Owner Info & Timestamp</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeSummaryCards}
                      onChange={(e) => setIncludeSummaryCards(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span>Top Key Metric Cards</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Field Selectors with Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Table className="h-3.5 w-3.5 text-emerald-400" />
                    <span>
                      Columns to Include in PDF ({selectedFields.length} of {dynamicFields.length})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-semibold text-emerald-400 hover:underline"
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
                  {dynamicFields.map((field) => {
                    const isSelected = selectedFields.includes(field.id);
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => toggleField(field.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-all ${
                          isSelected
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/10'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                        <span className="truncate font-medium">{field.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Drawer */}
              {showPreview && (
                <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Live PDF Table Preview ({defaultRows.length} Rows)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Hide Preview
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-48 rounded-xl border border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead className="border-b border-slate-800 text-slate-300 bg-slate-900 font-bold sticky top-0">
                        <tr>
                          {activeColumns.map((col) => (
                            <th key={col.dataKey} className="p-2.5 whitespace-nowrap">
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300 bg-slate-950/60">
                        {defaultRows.slice(0, 6).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            {activeColumns.map((col) => (
                              <td key={col.dataKey} className="p-2.5 whitespace-nowrap font-mono-num">
                                {r[col.dataKey] !== undefined ? String(r[col.dataKey]) : (r[col.header] !== undefined ? String(r[col.header]) : '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {defaultRows.length === 0 && (
                          <tr>
                            <td colSpan={activeColumns.length || 1} className="p-4 text-center text-slate-500">
                              No records found for the current filter.
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

