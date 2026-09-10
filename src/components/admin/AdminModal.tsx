import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  actions?: ReactNode;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  actions,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className={`bg-white rounded-xl w-full ${maxWidthClasses[maxWidth]} my-auto shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/90 bg-stone-50/50">
            <div>
              <h3 className="text-base font-bold font-serif text-stone-900">{title}</h3>
              {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>

          {/* Modal Footer */}
          {actions && (
            <div className="flex items-center justify-end space-x-2.5 px-5 py-3.5 border-t border-stone-200/90 bg-stone-50/50">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
