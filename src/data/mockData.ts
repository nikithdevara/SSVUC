import {
  Donation,
  MaterialDonation,
  Expense,
  Receipt,
  EventItem,
  Announcement,
  GalleryItem,
  AuditLog,
  AdminUser,
  CommitteeSettings,
} from '../types';

export const initialSettings: CommitteeSettings = {
  committeeName: 'Sri Siddhi Vinayaka Utsava Committee',
  subtitle: 'Gandhinagar Anjayya Colony · Anakapalle',
  location: 'Gandhinagar Anjayya Colony, Anakapalle',
  addressLine1: 'Main Mandapam Ground, Near Vinayaka Temple Road',
  city: 'Anakapalle',
  district: 'Anakapalle District',
  state: 'Andhra Pradesh',
  pincode: '531001',
  contactPhone1: '+91 63051 92846',
  contactPhone2: '+91 63051 92846',
  contactEmail: 'saisanthosha09@gmail.com',
  contactPhone: '+91 63051 92846',
  whatsappNumber: '+916305192846',
  upiId: '8919982789@axl',
  upiQrHolder: 'MANGARAPU DHANUSH SAI',
  festivalYear: '2026',
  festivalName: 'Sri Siddhi Vinayaka Ganesh Utsav 2026',
  year: '2026',
  targetBudget: 450000,
  annadanamCapacity: 2500,
  enablePublicTransparency: true,
  festivalStartDate: '2026-09-14',
  festivalEndDate: '2026-09-22',
  motto: 'Faith. Community. Transparency.',
};

// Empty initial arrays for real-time live data
export const initialDonations: Donation[] = [];
export const initialMaterialDonations: MaterialDonation[] = [];
export const initialExpenses: Expense[] = [];
export const initialEvents: EventItem[] = [];
export const initialAnnouncements: Announcement[] = [];
export const initialGallery: GalleryItem[] = [];
export const initialAuditLogs: AuditLog[] = [];

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'USR-01',
    name: 'Super Admin',
    email: 'admin@siddhivinayak.demo',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: 'Never',
    phone: '+91 63051 92846',
  },
  {
    id: 'USR-02',
    name: 'Treasurer',
    email: 'treasurer@siddhivinayak.demo',
    role: 'TREASURER',
    status: 'ACTIVE',
    lastLogin: 'Never',
    phone: '+91 63051 92846',
  },
  {
    id: 'USR-03',
    name: 'Committee Admin',
    email: 'committee@siddhivinayak.demo',
    role: 'COMMITTEE_ADMIN',
    status: 'ACTIVE',
    lastLogin: 'Never',
    phone: '+91 63051 92846',
  },
];

