import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Package,
  FileText,
  Calendar,
  Bell,
  Image,
  BarChart3,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  X,
  ExternalLink,
  Flame,
  Mail,
  FileCheck,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { AdminRole } from '../../types';

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  onClose,
  currentRoute,
  onNavigate,
  onLogout,
}) => {
  const currentUser = authService.getCurrentUser();
  const role = currentUser?.role || 'COMMITTEE_ADMIN';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navItems = [
    { label: 'Dashboard', route: '/admin', icon: LayoutDashboard, roles: ['DEVELOPER', 'SUPER_ADMIN', 'TREASURER'] },
    { label: 'Offerings', route: '/admin/donations', icon: DollarSign, roles: ['DEVELOPER', 'SUPER_ADMIN', 'TREASURER'] },
    { label: 'Official Receipts', route: '/admin/receipts', icon: FileCheck, roles: ['DEVELOPER', 'SUPER_ADMIN', 'TREASURER'] },
    { label: 'Material Seva', route: '/admin/materials', icon: Package, roles: ['DEVELOPER', 'SUPER_ADMIN', 'TREASURER'] },
    { label: 'Expenses', route: '/admin/expenses', icon: FileText, roles: ['DEVELOPER', 'SUPER_ADMIN', 'TREASURER'] },
    { label: 'Notifications', route: '/admin/notifications', icon: Bell, roles: ['DEVELOPER', 'SUPER_ADMIN', 'COMMITTEE_ADMIN', 'TREASURER'] },
    { label: 'Devotee Messages', route: '/admin/messages', icon: Mail, roles: ['DEVELOPER', 'SUPER_ADMIN', 'COMMITTEE_ADMIN'] },
    { label: 'Festival Events', route: '/admin/events', icon: Calendar, roles: ['DEVELOPER', 'SUPER_ADMIN', 'COMMITTEE_ADMIN'] },
    { label: 'Announcements', route: '/admin/announcements', icon: Bell, roles: ['DEVELOPER', 'SUPER_ADMIN', 'COMMITTEE_ADMIN'] },
    { label: 'Gallery', route: '/admin/gallery', icon: Image, roles: ['DEVELOPER', 'SUPER_ADMIN', 'COMMITTEE_ADMIN'] },
    { label: 'Reports', route: '/admin/reports', icon: BarChart3, roles: ['DEVELOPER', 'SUPER_ADMIN', 'TREASURER'] },
    { label: 'Audit Logs', route: '/admin/audit-logs', icon: ShieldCheck, roles: ['DEVELOPER', 'SUPER_ADMIN'] },
    { label: 'Users', route: '/admin/users', icon: Users, roles: ['DEVELOPER', 'SUPER_ADMIN'] },
    { label: 'Settings', route: '/admin/settings', icon: Settings, roles: ['DEVELOPER', 'SUPER_ADMIN'] },
    { label: 'Developer Suite', route: '/admin/developer', icon: Terminal, roles: ['DEVELOPER'] },
  ];

  const visibleItems = navItems.filter((i) => !i.roles || i.roles.includes(role));

  const handleSelect = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[80vw] bg-stone-900 text-stone-300 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7F1D1D] flex items-center justify-center text-amber-300">
              <Flame className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 font-serif">SRI SIDDHI VINAYAKA</div>
              <div className="text-[10px] text-stone-400">Admin Portal</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 mt-3 bg-stone-800/60 rounded-xl border border-stone-700/50 flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-full bg-amber-900/60 border border-amber-600/40 text-amber-200 flex items-center justify-center text-sm font-bold shrink-0">
            {currentUser?.name.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-stone-100 truncate">{currentUser?.name}</div>
            <div className="text-[10px] text-amber-400">{authService.getRoleLabel(role)}</div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.route === '/admin' ? currentRoute === '/admin' : currentRoute.startsWith(item.route);
            return (
              <button
                key={item.route}
                onClick={() => handleSelect(item.route)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#7F1D1D] text-white font-semibold'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t border-stone-800 mt-3">
            <button
              onClick={() => handleSelect('/')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-xs text-stone-400 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Website</span>
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-900/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
