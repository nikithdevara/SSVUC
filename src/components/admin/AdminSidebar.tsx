import React from 'react';
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
  ExternalLink,
  Flame,
  CreditCard,
  FileCheck,
  Mail,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { AdminRole } from '../../types';

interface AdminSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

interface NavItem {
  label: string;
  route: string;
  icon: React.ElementType;
  requiredRole?: AdminRole[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentRoute,
  onNavigate,
  onLogout,
}) => {
  const currentUser = authService.getCurrentUser();
  const role = currentUser?.role || 'COMMITTEE_ADMIN';

  // Role-based navigation items list per Section 71
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin',
      icon: LayoutDashboard,
      requiredRole: ['SUPER_ADMIN', 'TREASURER'],
    },
    {
      label: 'Offerings',
      route: '/admin/donations',
      icon: DollarSign,
      requiredRole: ['SUPER_ADMIN', 'TREASURER'],
    },
    {
      label: 'Official Receipts',
      route: '/admin/receipts',
      icon: FileCheck,
      requiredRole: ['SUPER_ADMIN', 'TREASURER'],
    },

    {
      label: 'Material Seva',
      route: '/admin/materials',
      icon: Package,
      requiredRole: ['SUPER_ADMIN', 'TREASURER'],
    },
    {
      label: 'Expenses',
      route: '/admin/expenses',
      icon: FileText,
      requiredRole: ['SUPER_ADMIN', 'TREASURER'],
    },
    {
      label: 'Notifications',
      route: '/admin/notifications',
      icon: Bell,
      requiredRole: ['SUPER_ADMIN', 'COMMITTEE_ADMIN', 'TREASURER'],
    },
    {
      label: 'Devotee Messages',
      route: '/admin/messages',
      icon: Mail,
      requiredRole: ['SUPER_ADMIN', 'COMMITTEE_ADMIN'],
    },
    {
      label: 'Festival Events',
      route: '/admin/events',
      icon: Calendar,
      requiredRole: ['SUPER_ADMIN', 'COMMITTEE_ADMIN'],
    },
    {
      label: 'Announcements',
      route: '/admin/announcements',
      icon: Bell,
      requiredRole: ['SUPER_ADMIN', 'COMMITTEE_ADMIN'],
    },
    {
      label: 'Gallery',
      route: '/admin/gallery',
      icon: Image,
      requiredRole: ['SUPER_ADMIN', 'COMMITTEE_ADMIN'],
    },
    {
      label: 'Reports & Audits',
      route: '/admin/reports',
      icon: BarChart3,
      requiredRole: ['SUPER_ADMIN', 'TREASURER'],
    },
    {
      label: 'Audit Logs',
      route: '/admin/audit-logs',
      icon: ShieldCheck,
      requiredRole: ['SUPER_ADMIN'],
    },
    {
      label: 'Admin Users',
      route: '/admin/users',
      icon: Users,
      requiredRole: ['SUPER_ADMIN'],
    },
    {
      label: 'Settings',
      route: '/admin/settings',
      icon: Settings,
      requiredRole: ['SUPER_ADMIN'],
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.requiredRole || item.requiredRole.includes(role)
  );

  const isActive = (route: string) => {
    if (route === '/admin') return currentRoute === '/admin';
    return currentRoute.startsWith(route);
  };

  return (
    <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col h-screen shrink-0 border-r border-stone-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7F1D1D] flex items-center justify-center text-amber-300 shadow-xs border border-amber-500/30">
            <Flame className="w-5 h-5 fill-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 font-serif tracking-wide leading-tight">
              SRI SIDDHI VINAYAKA
            </div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-sans">
              Admin Portal
            </div>
          </div>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
          Demo
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Management
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-[#7F1D1D] text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-stone-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          External
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800/50 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-stone-500" />
          <span>View Public Website</span>
        </button>
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/50">
        <div className="flex items-center space-x-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-900/60 border border-amber-600/40 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0">
            {currentUser?.name.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-stone-200 truncate leading-tight">
              {currentUser?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-amber-400 truncate">
              {authService.getRoleLabel(role)}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-900/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
