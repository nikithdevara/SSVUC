import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonValue?: string;
  onReasonChange?: (val: string) => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  requireReason = false,
  reasonPlaceholder = 'Please specify the audit reason...',
  reasonValue = '',
  onReasonChange,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-700',
          btn: 'bg-red-700 hover:bg-red-800 text-white',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-800',
          btn: 'bg-amber-700 hover:bg-amber-800 text-white',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-700',
          btn: 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold',
        };
      default:
        return {
          iconBg: 'bg-stone-100 text-stone-700',
          btn: 'bg-[#7F1D1D] hover:bg-[#991B1B] text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-xl max-w-md w-full my-auto p-5 sm:p-6 shadow-2xl border border-stone-200 relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-full shrink-0 ${styles.iconBg}`}>
              {variant === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 pr-4">
              <h3 className="text-base font-bold font-serif text-stone-900">{title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          {requireReason && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Audit Justification / Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reasonValue}
                onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={2}
                className="w-full text-xs rounded-lg border border-stone-300 p-2.5 focus:border-[#7F1D1D] focus:ring-1 focus:ring-[#7F1D1D] outline-hidden"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end space-x-2.5 mt-6 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={requireReason && !reasonValue.trim()}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${styles.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
