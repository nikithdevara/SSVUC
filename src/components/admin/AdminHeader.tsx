import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Shield,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { AdminNotificationDropdown } from './AdminNotificationDropdown';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  pageTitle?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onOpenSidebar,
  onOpenSearch,
  onNavigate,
  onLogout,
  pageTitle = 'Overview',
}) => {
  const currentUser = authService.getCurrentUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-stone-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Sri Siddhi Vinayaka Utsav
          </span>
          <h2 className="text-sm font-bold text-stone-900 font-serif -mt-0.5">
            {pageTitle}
          </h2>
        </div>

        {/* Small logo for mobile */}
        <div className="flex sm:hidden items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-[#7F1D1D] flex items-center justify-center text-amber-300">
            <Flame className="w-4 h-4 fill-amber-300" />
          </div>
          <span className="text-xs font-bold font-serif text-stone-900">Admin Portal</span>
        </div>
      </div>

      {/* Right: Quick Search + Notifications + Profile Card */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 text-xs transition-colors border border-stone-200/60"
          title="Quick Command Search"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Quick Search...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 bg-white rounded border border-stone-300 text-[10px] font-mono text-stone-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Notification Popover */}
        <AdminNotificationDropdown onNavigate={onNavigate} />

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 text-[#7F1D1D] flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser?.name.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-stone-900 leading-tight">
                {currentUser?.name || 'Administrator'}
              </div>
              <div className="text-[10px] font-medium text-amber-700">
                {authService.getRoleLabel(currentUser?.role || 'COMMITTEE_ADMIN')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-stone-100">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-stone-500 truncate">{currentUser?.email}</p>
                <div className="mt-1.5">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/60">
                    {authService.getRoleLabel(currentUser?.role || 'COMMITTEE_ADMIN')}
                  </span>
                </div>
              </div>

              <div className="py-1">
                {currentUser?.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('/admin/settings');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center space-x-2 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-stone-400" />
                    <span>Committee Settings</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('/');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center space-x-2 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  <span>View Public Website</span>
                </button>
              </div>

              <div className="pt-1 border-t border-stone-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-700 hover:bg-red-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
