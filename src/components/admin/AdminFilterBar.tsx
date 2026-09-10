import React, { ReactNode } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface AdminFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  actions?: ReactNode;
  totalResults?: number;
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records by name, ID or details...',
  filters,
  activeFilterCount = 0,
  onClearFilters,
  actions,
  totalResults,
}) => {
  return (
    <div className="bg-white border border-stone-200/90 rounded-xl p-3.5 mb-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:border-[#7F1D1D] focus:ring-1 focus:ring-[#7F1D1D] outline-hidden transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns & Filters */}
        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters}

            {activeFilterCount > 0 && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center px-2.5 py-1.5 text-xs text-stone-600 hover:text-[#7F1D1D] hover:bg-red-50 rounded-lg border border-dashed border-stone-300 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Reset ({activeFilterCount})
              </button>
            )}
          </div>
        )}

        {/* Additional actions (e.g. Export, Add) */}
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {totalResults !== undefined && (
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>
            Showing <strong className="text-stone-700">{totalResults}</strong> matching record{totalResults !== 1 ? 's' : ''}
          </span>
          {activeFilterCount > 0 && (
            <span className="flex items-center text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium">
              <Filter className="w-2.5 h-2.5 mr-1" />
              {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
