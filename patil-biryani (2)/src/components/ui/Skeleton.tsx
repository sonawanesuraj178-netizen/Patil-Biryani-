import React from 'react';
import { Sparkles, Loader2, Receipt, Wallet, Users, LayoutGrid, Calendar } from 'lucide-react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'emerald' | 'subtle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'default',
  ...props
}) => {
  const variantClass =
    variant === 'emerald'
      ? 'animate-shimmer-emerald bg-emerald-950/30 border border-emerald-500/15'
      : variant === 'subtle'
      ? 'animate-shimmer bg-slate-800/30'
      : 'animate-shimmer bg-slate-800/60';

  return (
    <div
      className={`rounded-xl ${variantClass} ${className}`}
      {...props}
    />
  );
};

// Skeleton for top summary/KPI cards
export const MetricCardSkeleton: React.FC<{ count?: number; columns?: string }> = ({
  count = 4,
  columns = 'grid-cols-2 lg:grid-cols-4',
}) => {
  return (
    <div className={`grid ${columns} gap-3 sm:gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-white/5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-32 rounded-lg" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for Table rows
export const TableSkeleton: React.FC<{
  columns?: number;
  rows?: number;
  showHeader?: boolean;
}> = ({ columns = 5, rows = 6, showHeader = true }) => {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {showHeader && (
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-lg" />
            <Skeleton className="h-5 w-40 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/60">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <th key={colIdx} className="px-4 py-3.5">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/[0.02] transition-colors">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3.5">
                    <Skeleton
                      className={`h-4 rounded-md ${
                        colIdx === 0
                          ? 'w-24'
                          : colIdx === columns - 1
                          ? 'w-16 ml-auto'
                          : colIdx === 1
                          ? 'w-36'
                          : 'w-28'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Comprehensive Skeleton for InvoicesView (POS and History)
export const InvoicesSkeleton: React.FC<{ activeTab?: 'pos' | 'history' }> = ({
  activeTab = 'pos',
}) => {
  return (
    <div className="space-y-6 pb-16 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-white/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-8 w-56 sm:w-72 rounded-xl" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>

      {activeTab === 'pos' ? (
        /* POS Layout Skeleton */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Menu Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Dine in / Table Selector Skeleton */}
            <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-3 border border-white/10">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-8 w-36 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-9 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
              </div>
            </div>

            {/* Category Pills & Search */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-xl" />
              ))}
            </div>

            {/* Dish Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-3.5 space-y-3 border border-white/5"
                >
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-7 w-16 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Live Bill / Cart Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel-elevated rounded-3xl p-5 space-y-4 border border-white/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-lg" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>

              {/* Cart items */}
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5"
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16 rounded-lg" />
                      <Skeleton className="h-4 w-12 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation breakdown */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-lg" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Invoices Layout Skeleton */
        <div className="space-y-6">
          <MetricCardSkeleton count={4} />

          {/* Search and Filters bar */}
          <div className="glass-panel rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Skeleton className="h-9 min-w-[200px] flex-1 sm:flex-none rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>

          <TableSkeleton columns={7} rows={6} />
        </div>
      )}
    </div>
  );
};

// Comprehensive Skeleton for ExpensesView
export const ExpensesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-white/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-36 rounded-md" />
          </div>
          <Skeleton className="h-8 w-60 sm:w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>

      {/* Expense KPI Metrics Cards */}
      <MetricCardSkeleton count={4} />

      {/* Category Pills Strip */}
      <div className="glass-panel rounded-2xl p-3 flex items-center gap-2 overflow-x-auto border border-white/5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-8 w-24 shrink-0 rounded-xl" />
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Skeleton className="h-9 min-w-[200px] flex-1 sm:flex-none rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Expense Table List */}
      <TableSkeleton columns={7} rows={6} />
    </div>
  );
};

// Comprehensive Skeleton for StaffView
export const StaffSkeleton: React.FC<{ activeTab?: string }> = ({
  activeTab = 'employees',
}) => {
  return (
    <div className="space-y-6 pb-16 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-white/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
          <Skeleton className="h-8 w-64 sm:w-80 rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>

      {/* Staff KPI Metrics Cards */}
      <MetricCardSkeleton count={4} />

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['Staff Directory', 'Daily Attendance', 'Staff Advances', 'Salary & Payroll'].map(
          (_, idx) => (
            <Skeleton key={idx} className="h-10 w-36 shrink-0 rounded-2xl" />
          )
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Skeleton className="h-9 min-w-[220px] flex-1 sm:flex-none rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Staff Cards Grid or Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl p-5 space-y-4 border border-white/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// General Data View Skeleton for other views
export const DataViewSkeleton: React.FC<{
  title?: string;
  subtitle?: string;
  metricCount?: number;
  columns?: number;
  rows?: number;
}> = ({
  title = 'Loading Data...',
  subtitle = 'Fetching real-time records from Firebase Cloud Firestore',
  metricCount = 4,
  columns = 6,
  rows = 6,
}) => {
  return (
    <div className="space-y-6 pb-16 animate-pulse">
      {/* Header */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-white/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-8 w-60 rounded-xl" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-2xl" />
          <Skeleton className="h-10 w-28 rounded-2xl" />
        </div>
      </div>

      {metricCount > 0 && <MetricCardSkeleton count={metricCount} />}

      <TableSkeleton columns={columns} rows={rows} />
    </div>
  );
};
