import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, FolderSearch } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-dashed border-stone-200 rounded-xl my-4">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3.5">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-stone-800 font-serif">{title}</h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] text-white hover:bg-[#991B1B] shadow-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface AdminLoadingStateProps {
  message?: string;
  rows?: number;
}

export const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({
  message = 'Loading administrative records...',
  rows = 5,
}) => {
  return (
    <div className="space-y-3 p-4 bg-white border border-stone-200 rounded-xl">
      <div className="flex items-center space-x-2 text-xs text-stone-500 font-medium py-1">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7F1D1D]" />
        <span>{message}</span>
      </div>
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-10 bg-stone-100/90 rounded-md animate-pulse w-full"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
};

interface AdminErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const AdminErrorState: React.FC<AdminErrorStateProps> = ({
  title = 'Administrative Error',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 bg-red-50/70 border border-red-200 rounded-xl my-4 text-center">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 mx-auto mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-red-900">{title}</h3>
      <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-md bg-red-700 text-white hover:bg-red-800 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1.5" />
          Retry Operation
        </button>
      )}
    </div>
  );
};
