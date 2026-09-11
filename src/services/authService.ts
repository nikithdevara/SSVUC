import { AdminUser, AdminRole, Permission } from '../types';
import { svucStore } from './store';

export interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  roleLabel: string;
  description: string;
  phone: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Super Admin',
    email: 'superadmin@utsav.org',
    password: 'Admin@123',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    description: 'Full administrative access across all modules, settings, approvals & users.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Super Admin',
    email: 'admin@utsav.org',
    password: 'Admin@123',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    description: 'Full administrative access across all modules, settings, approvals & users.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Super Admin',
    email: 'admin@siddhivinayak.demo',
    password: 'Admin@2026',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    description: 'Full administrative access across all modules, settings, approvals & users.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Super Admin',
    email: 'president@siddhivinayaka-utsav.org',
    password: 'Admin@2026',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    description: 'Full administrative access across all modules, settings, approvals & users.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Treasurer',
    email: 'treasurer@utsav.org',
    password: 'Treasurer@123',
    role: 'TREASURER',
    roleLabel: 'Treasurer',
    description: 'Manages donations, material seva, expenses, receipts, vouchers and financial audits.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Treasurer',
    email: 'treasurer@siddhivinayak.demo',
    password: 'Treasury@2026',
    role: 'TREASURER',
    roleLabel: 'Treasurer',
    description: 'Manages donations, material seva, expenses, receipts, vouchers and financial audits.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Treasurer',
    email: 'treasurer@siddhivinayaka-utsav.org',
    password: 'Treasury@2026',
    role: 'TREASURER',
    roleLabel: 'Treasurer',
    description: 'Manages donations, material seva, expenses, receipts, vouchers and financial audits.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Committee Admin',
    email: 'committee@utsav.org',
    password: 'Member@123',
    role: 'COMMITTEE_ADMIN',
    roleLabel: 'Committee Admin',
    description: 'Manages festival events, offerings, public announcements, media gallery & devotional programs.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Committee Admin',
    email: 'committee@siddhivinayak.demo',
    password: 'Committee@2026',
    role: 'COMMITTEE_ADMIN',
    roleLabel: 'Committee Admin',
    description: 'Manages festival events, public announcements, media gallery & devotional programs.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Committee Admin',
    email: 'admin@siddhivinayaka-utsav.org',
    password: 'Committee@2026',
    role: 'COMMITTEE_ADMIN',
    roleLabel: 'Committee Admin',
    description: 'Manages festival events, public announcements, media gallery & devotional programs.',
    phone: '+91 63051 92846',
  },
  {
    name: 'Lead Developer',
    email: 'developer@dev.org',
    password: 'Devara@dev',
    role: 'DEVELOPER',
    roleLabel: 'Lead Developer',
    description: 'System Developer & DevOps Console: Direct database maintenance, audit purges, sync probes & backups.',
    phone: '+91 63051 92846',
  },
];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  DEVELOPER: [
    'donations.view',
    'donations.create',
    'donations.edit',
    'donations.delete',
    'donations.approve',
    'materials.view',
    'materials.create',
    'materials.edit',
    'materials.delete',
    'materials.approve',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'expenses.delete',
    'expenses.approve',
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'announcements.view',
    'announcements.create',
    'announcements.edit',
    'announcements.delete',
    'gallery.view',
    'gallery.create',
    'gallery.edit',
    'gallery.delete',
    'reports.view',
    'reports.export',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'audit.view',
    'payments.view',
    'payments.reconcile',
    'receipts.view',
    'receipts.void',
    'messages.view',
    'messages.manage',
    'notifications.view',
    'developer.manage',
  ],
  SUPER_ADMIN: [
    'donations.view',
    'donations.create',
    'donations.edit',
    'donations.delete',
    'donations.approve',
    'materials.view',
    'materials.create',
    'materials.edit',
    'materials.delete',
    'materials.approve',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'expenses.delete',
    'expenses.approve',
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'announcements.view',
    'announcements.create',
    'announcements.edit',
    'announcements.delete',
    'gallery.view',
    'gallery.create',
    'gallery.edit',
    'gallery.delete',
    'reports.view',
    'reports.export',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'settings.view',
    'settings.edit',
    'audit.view',
    'payments.view',
    'payments.reconcile',
    'receipts.view',
    'receipts.void',
    'messages.view',
    'messages.manage',
    'notifications.view',
  ],
  TREASURER: [
    'donations.view',
    'donations.create',
    'donations.edit',
    'donations.delete',
    'donations.approve',
    'materials.view',
    'materials.create',
    'materials.edit',
    'materials.delete',
    'materials.approve',
    'expenses.view',
    'expenses.create',
    'expenses.edit',
    'expenses.delete',
    'expenses.approve',
    'reports.view',
    'reports.export',
    'payments.view',
    'payments.reconcile',
    'receipts.view',
    'receipts.void',
    'notifications.view',
  ],
  COMMITTEE_ADMIN: [
    'events.view',
    'events.create',
    'events.edit',
    'events.delete',
    'announcements.view',
    'announcements.create',
    'announcements.edit',
    'announcements.delete',
    'gallery.view',
    'gallery.create',
    'gallery.edit',
    'gallery.delete',
    'messages.view',
    'messages.manage',
    'notifications.view',
  ],
};

const AUTH_STORAGE_KEY = 'svuc_admin_session_v2';
const REMEMBER_ME_KEY = 'svuc_remember_me_email';

export const authService = {
  getDemoAccounts(): DemoAccount[] {
    return DEMO_ACCOUNTS;
  },

  getRememberedEmail(): string {
    return localStorage.getItem(REMEMBER_ME_KEY) || '';
  },

  setRememberedEmail(email: string, remember: boolean) {
    if (remember && email) {
      localStorage.setItem(REMEMBER_ME_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  },

  login(email: string, password?: string, rememberMe: boolean = false): { success: boolean; user?: AdminUser; error?: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // 1. Check demo accounts
    const demo = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === cleanEmail);
    if (demo) {
      const validPasswords = [
        demo.password.toLowerCase(),
        'admin@2026',
        'admin@123',
        'admin@1234',
        'admin',
        'treasury@2026',
        'treasurer@2026',
        'treasurer@123',
        'treasurer',
        'committee@2026',
        'committee@123',
        'member@123',
        'committee',
        '1234',
        '123456',
        'password',
      ];

      // If a password was provided, verify it or allow standard admin passwords
      if (cleanPassword && !validPasswords.includes(cleanPassword) && cleanPassword !== demo.password.toLowerCase()) {
        return { success: false, error: 'Incorrect password for this administrator account. Default: Admin@123' };
      }

      const user: AdminUser = {
        id: `USR-${demo.role === 'DEVELOPER' ? 'DEV' : demo.role === 'SUPER_ADMIN' ? '01' : demo.role === 'TREASURER' ? '02' : '03'}`,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        status: 'ACTIVE',
        lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        phone: demo.phone,
      };

      this.saveSession(user);
      this.setRememberedEmail(cleanEmail, rememberMe);
      svucStore.addAuditLog('User', user.id, 'LOGIN', `${user.name} logged into Admin Portal as ${demo.roleLabel}.`);
      return { success: true, user };
    }

    // 2. Check store admin users list
    const users = svucStore.getAdminUsers();
    const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (matched) {
      if (matched.status !== 'ACTIVE') {
        return { success: false, error: 'This administrative account is inactive or suspended.' };
      }
      matched.lastLogin = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      this.saveSession(matched);
      this.setRememberedEmail(cleanEmail, rememberMe);
      svucStore.addAuditLog('User', matched.id, 'LOGIN', `${matched.name} logged into Admin Portal.`);
      return { success: true, user: matched };
    }

    // 3. Fallback for any valid email format in administrative login
    if (cleanEmail.includes('@')) {
      const assignedRole: AdminRole =
        cleanEmail.includes('super') || cleanEmail.includes('president') || cleanEmail.includes('admin')
          ? 'SUPER_ADMIN'
          : cleanEmail.includes('treasur') || cleanEmail.includes('finance')
            ? 'TREASURER'
            : 'COMMITTEE_ADMIN';

      const fallbackUser: AdminUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        role: assignedRole,
        status: 'ACTIVE',
        lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        phone: '+91 63051 92846',
      };
      this.saveSession(fallbackUser);
      this.setRememberedEmail(cleanEmail, rememberMe);
      svucStore.addAuditLog('User', fallbackUser.id, 'LOGIN', `${fallbackUser.name} logged into Admin Portal as ${assignedRole}.`);
      return { success: true, user: fallbackUser };
    }

    return { success: false, error: 'Invalid email address or unrecognized credentials.' };
  },

  logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      svucStore.addAuditLog('User', user.id, 'LOGIN', `${user.name} logged out from Admin Portal.`);
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('svuc_current_user_v1');
    window.dispatchEvent(new Event('svuc_auth_changed'));
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

  getCurrentUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem('svuc_current_user_v1');
      if (!raw) return null;
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  },

  getSession(): { user: AdminUser | null; token: string; expiresAt: string } | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    return {
      user,
      token: `demo-bearer-token-${user.id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.status === 'ACTIVE';
  },

  hasRole(role: AdminRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.role === role;
  },

  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(permission);
  },

  getPermissions(): Permission[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  },

  saveSession(user: AdminUser) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('svuc_current_user_v1', JSON.stringify(user));
    window.dispatchEvent(new Event('svuc_auth_changed'));
    window.dispatchEvent(new Event('svuc_store_updated'));
  },

  updateProfile(updates: Partial<AdminUser>): void {
    const user = this.getCurrentUser();
    if (user) {
      const updated = { ...user, ...updates };
      this.saveSession(updated);
    }
  },

  getRoleLabel(role: AdminRole): string {
    switch (role) {
      case 'DEVELOPER':
        return 'Lead Developer';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'TREASURER':
        return 'Treasurer';
      case 'COMMITTEE_ADMIN':
        return 'Committee Admin';
      default:
        return role;
    }
  },
  isDeveloper(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'DEVELOPER' || user?.email.toLowerCase() === 'developer@dev.org';
  },
};
