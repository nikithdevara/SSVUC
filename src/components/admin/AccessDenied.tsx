import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { authService } from '../../services/authService';

interface AccessDeniedProps {
  onNavigate: (route: string) => void;
  requiredPermission?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onNavigate, requiredPermission }) => {
  const currentUser = authService.getCurrentUser();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold font-serif text-stone-900 mb-2">Access Restricted</h2>
      <p className="text-xs sm:text-sm text-stone-600 max-w-md mb-4 leading-relaxed">
        Your current account role (
        <span className="font-semibold text-stone-900 uppercase">{currentUser?.role.replace('_', ' ')}</span>
        ) does not hold authorization to access this administrative module.
        {requiredPermission && (
          <span className="block mt-1 font-mono text-[11px] text-stone-400">
            Required Permission: {requiredPermission}
          </span>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => onNavigate('/admin')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-black text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={() => {
            authService.logout();
            onNavigate('/admin/login');
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-stone-500" />
          <span>Switch Account</span>
        </button>
      </div>
    </div>
  );
};
