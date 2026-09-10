import React, { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  renderMobileCard?: (item: T) => ReactNode;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  emptyState?: ReactNode;
}

export function AdminTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  emptyState,
}: AdminTableProps<T>) {
  if (data.length === 0) {
    return <>{emptyState || <div className="p-8 text-center text-sm text-stone-500">No records found.</div>}</>;
  }

  return (
    <div className="bg-white border border-stone-200/90 rounded-xl overflow-hidden shadow-xs">
      {/* Desktop Table View (md and up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              {columns.map((col) => (
                <th key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.map((item, idx) => (
              <tr
                key={keyExtractor(item)}
                className={`hover:bg-amber-50/20 transition-colors ${
                  idx % 2 === 1 ? 'bg-stone-50/30' : 'bg-white'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-3 px-4 text-stone-800 ${col.className || ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (below md) */}
      <div className="md:hidden divide-y divide-stone-200/80">
        {data.map((item) => (
          <div key={keyExtractor(item)} className="p-4 hover:bg-stone-50/40 transition-colors">
            {renderMobileCard ? (
              renderMobileCard(item)
            ) : (
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-start text-xs">
                    <span className="font-medium text-stone-500">{col.header}:</span>
                    <span className="text-right text-stone-800">{col.render(item)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50/50 text-xs text-stone-600">
          <div>
            Page <span className="font-semibold text-stone-900">{currentPage}</span> of{' '}
            <span className="font-semibold text-stone-900">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-md border border-stone-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-600"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate page numbers around currentPage
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-md font-semibold text-xs transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#7F1D1D] text-white'
                      : 'border border-stone-300 hover:bg-white text-stone-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-md border border-stone-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-stone-600"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
