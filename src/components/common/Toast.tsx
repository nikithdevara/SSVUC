import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold animate-in slide-in-from-top-4 duration-200 ${
              t.type === 'error'
                ? 'bg-red-900 text-white border-red-700 shadow-red-950/40'
                : t.type === 'info'
                ? 'bg-[#292524] text-[#FEF08A] border-[#C9972B] shadow-black/40'
                : 'bg-[#14532D] text-white border-emerald-600 shadow-emerald-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'error' ? (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-300" />
              ) : t.type === 'info' ? (
                <Info className="w-5 h-5 shrink-0 text-[#F59E0B]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
              )}
              <span className="leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1.5 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (message: string) => {
        console.log('Toast:', message);
      },
    };
  }
  return context;
};
