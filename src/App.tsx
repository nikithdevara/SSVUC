import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { CommandPalette } from './components/common/CommandPalette';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { UtsavPage } from './pages/public/UtsavPage';
import { DonatePage } from './pages/public/DonatePage';
import { DonationsPage } from './pages/public/DonationsPage';
import { MaterialsPage } from './pages/public/MaterialsPage';
import { ExpensesPage } from './pages/public/ExpensesPage';
import { TransparencyPage } from './pages/public/TransparencyPage';
import { CommitteePage } from './pages/public/CommitteePage';
import { AnnouncementsPage } from './pages/public/AnnouncementsPage';
import { ContactPage } from './pages/public/ContactPage';
import { ReceiptDetailPage } from './pages/public/ReceiptDetailPage';

// Admin Architecture & Layout
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminForgotPasswordPage } from './pages/admin/AdminForgotPasswordPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDonationsPage } from './pages/admin/AdminDonationsPage';
import { AdminMaterialsPage } from './pages/admin/AdminMaterialsPage';
import { AdminExpensesPage } from './pages/admin/AdminExpensesPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminGalleryPage } from './pages/admin/AdminGalleryPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReceiptsPage } from './pages/admin/AdminReceiptsPage';

import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AccessDenied } from './components/admin/AccessDenied';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';

// Services
import { authService } from './services/authService';
import { svucStore } from './services/store';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Client-side routing with hash support fallback
  const getInitialRoute = () => {
    if (window.location.hash) {
      return window.location.hash.replace('#', '') || '/';
    }
    return window.location.pathname || '/';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute());
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentRoute(hash || '/');
    };

    const handleAuthChange = () => {
      setAuthVersion((v) => v + 1);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('svuc_auth_changed', handleAuthChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('svuc_auth_changed', handleAuthChange);
    };
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matchers
  const isReceiptRoute = currentRoute.startsWith('/receipt/') || (currentRoute.startsWith('/verify/') && currentRoute.length > 8);
  const receiptId = isReceiptRoute
    ? currentRoute.replace('/receipt/', '').replace('/verify/', '')
    : null;

  const isAnnouncementRoute = currentRoute.startsWith('/announcements/');
  const announcementId = isAnnouncementRoute ? currentRoute.replace('/announcements/', '') : null;

  const isAdminRoute = currentRoute.startsWith('/admin');

  // MAINTENANCE MODE GUARD (Section 43)
  const currentSettings = svucStore.getSettings();
  if (!isAdminRoute && currentSettings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-6 text-center text-[#292524]">
        <div className="max-w-md w-full bg-white border-2 border-[#C9972B] rounded-3xl p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#FEF3C7] border border-[#C9972B]/40 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🪔
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider">
            <span>Maintenance Update</span>
          </div>
          <h1 className="font-['Cinzel',serif] text-2xl font-black text-[#7F1D1D]">
            {currentSettings.committeeName || 'Sri Siddhi Vinayaka Utsava Committee'}
          </h1>
          <p className="text-xs text-[#292524]/70">
            {currentSettings.location || 'Gandhinagar Anjayya Colony, Anakapalle'}
          </p>
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs leading-relaxed">
            {currentSettings.maintenanceMessage ||
              "We're performing a short maintenance update. Please check back soon."}
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
            >
              Committee Administration Login
            </button>
            <p className="text-[10px] text-stone-400">
              Helpline: {currentSettings.contactPhone || '+91 94401 23456'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN ROUTING WITH RBAC GUARDS
  if (isAdminRoute) {
    if (currentRoute === '/admin/forgot-password') {
      return <AdminForgotPasswordPage />;
    }

    if (currentRoute === '/admin/login') {
      return <AdminLoginPage onNavigate={navigate} />;
    }

    if (!authService.isAuthenticated() && !isAuthenticated) {
      return <AdminLoginPage onNavigate={navigate} />;
    }

    // Authenticated admin view inside AdminLayout
    const renderAdminModule = () => {
      // Base route or dashboard
      if (currentRoute === '/admin' || currentRoute === '/admin/dashboard') {
        return <AdminDashboard onNavigate={navigate} />;
      }

      if (currentRoute.startsWith('/admin/donations')) {
        return authService.hasPermission('donations.view') ? (
          <AdminDonationsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="donations.view" />
        );
      }

      if (currentRoute.startsWith('/admin/receipts')) {

        return authService.hasPermission('receipts.view') ? (
          <AdminReceiptsPage />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="receipts.view" />
        );
      }

      if (currentRoute.startsWith('/admin/notifications')) {
        return <AdminNotificationsPage onNavigate={navigate} />;
      }

      if (currentRoute.startsWith('/admin/messages')) {
        return authService.hasPermission('messages.view') ? (
          <AdminMessagesPage />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="messages.view" />
        );
      }

      if (currentRoute.startsWith('/admin/materials')) {
        return authService.hasPermission('materials.view') ? (
          <AdminMaterialsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="materials.view" />
        );
      }

      if (currentRoute.startsWith('/admin/expenses')) {
        return authService.hasPermission('expenses.view') ? (
          <AdminExpensesPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="expenses.view" />
        );
      }

      if (currentRoute.startsWith('/admin/events')) {
        return authService.hasPermission('events.view') ? (
          <AdminEventsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="events.view" />
        );
      }

      if (currentRoute.startsWith('/admin/announcements')) {
        return authService.hasPermission('announcements.view') ? (
          <AdminAnnouncementsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="announcements.view" />
        );
      }

      if (currentRoute.startsWith('/admin/gallery')) {
        return authService.hasPermission('gallery.view') ? (
          <AdminGalleryPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="gallery.view" />
        );
      }

      if (currentRoute.startsWith('/admin/reports')) {
        return authService.hasPermission('reports.view') ? (
          <AdminReportsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="reports.view" />
        );
      }

      if (currentRoute.startsWith('/admin/audit-logs') || currentRoute.startsWith('/admin/audit')) {
        return authService.hasPermission('audit.view') ? (
          <AdminAuditLogsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="audit.view" />
        );
      }

      if (currentRoute.startsWith('/admin/users')) {
        return authService.hasPermission('users.view') ? (
          <AdminUsersPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="users.view" />
        );
      }

      if (currentRoute.startsWith('/admin/settings')) {
        return authService.hasPermission('settings.view') ? (
          <AdminSettingsPage onNavigate={navigate} />
        ) : (
          <AccessDenied onNavigate={navigate} requiredPermission="settings.view" />
        );
      }

      // Default fallback
      return <AdminDashboard onNavigate={navigate} />;
    };

    return (
      <AdminLayout currentRoute={currentRoute} onNavigate={navigate}>
        {renderAdminModule()}
      </AdminLayout>
    );
  }

  // PUBLIC PAGES
  const renderPublicPage = () => {
    if (receiptId) {
      return <ReceiptDetailPage receiptId={receiptId} onNavigate={navigate} />;
    }

    if (announcementId) {
      return <AnnouncementsPage initialId={announcementId} onNavigate={navigate} />;
    }

    switch (currentRoute) {
      case '/':
      case '/utsav':
      case '/committee':
      case '/about':
        return <HomePage onNavigate={navigate} />;
      case '/donate':
        return <DonatePage onNavigate={navigate} />;
      case '/donations':
      case '/verify':
        return <DonationsPage onNavigate={navigate} />;
      case '/materials':
        return <MaterialsPage onNavigate={navigate} />;
      case '/expenses':
        return <ExpensesPage onNavigate={navigate} />;
      case '/transparency':
        return <TransparencyPage onNavigate={navigate} />;
      case '/announcements':
        return <AnnouncementsPage onNavigate={navigate} />;
      case '/contact':
        return <ContactPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF7] text-[#292524] selection:bg-[#FEF08A] selection:text-[#7F1D1D]">
      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigate}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1 w-full">{renderPublicPage()}</main>

      {/* Footer */}
      <Footer onNavigate={navigate} />

      {/* Global Quick Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
