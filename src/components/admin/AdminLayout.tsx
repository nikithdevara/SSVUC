import React, { useState, useEffect, ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDrawer } from './AdminDrawer';
import { AdminSearch } from './AdminSearch';
import { authService } from '../../services/authService';

interface AdminLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: ReactNode;
  pageTitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
  pageTitle,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    authService.logout();
    onNavigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-row font-sans text-stone-800 antialiased selection:bg-amber-200 selection:text-amber-950">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          currentRoute={currentRoute}
          onNavigate={onNavigate}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer */}
      <AdminDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onLogout={handleLogout}
      />

      {/* Global Command Palette */}
      <AdminSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header */}
        <AdminHeader
          onOpenSidebar={() => setDrawerOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onNavigate={onNavigate}
          onLogout={handleLogout}
          pageTitle={pageTitle}
        />

        {/* Subtle Demo Banner per Section 77 */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-center text-[11px] text-amber-900 font-medium flex items-center justify-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block mr-1" />
          <span>Committee Management System </span>
        </div>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
