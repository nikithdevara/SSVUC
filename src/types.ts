export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'Card' | 'Net Banking' | 'Wallet' | 'Demo';

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'verification_failed';

export type DonationStatus = 'Approved' | 'Pending' | 'Rejected' | 'Declined' | 'Archived' | 'Verified';

export type ExpenseStatus = 'Approved' | 'Pending' | 'Paid' | 'Rejected' | 'Archived';

export type ExpenseCategory = 
  | 'Mandapam Setup'
  | 'Pooja Materials'
  | 'Decoration'
  | 'Sound & Lighting'
  | 'Electricity'
  | 'Annadanam / Food'
  | 'Cultural Events'
  | 'Cleaning & Sanitation'
  | 'Transport & Logistics'
  | 'Visarjan Arrangements'
  | 'Printing & Media'
  | 'Other';

export type MaterialCategory =
  | 'Food Supplies'
  | 'Flowers & Garlands'
  | 'Pooja Materials'
  | 'Decoration Material'
  | 'Electrical Items'
  | 'Cleaning Materials'
  | 'Utensils & Furniture'
  | 'Other';

export interface Donation {
  id: string;
  receiptId: string;
  donorName: string;
  anonymous: boolean;
  isAnonymous?: boolean;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentProvider?: string;
  paymentId?: string;
  orderId?: string;
  signatureVerified?: boolean;
  date: string;
  donationDate?: string;
  notes?: string;
  status: DonationStatus;
  publicVisibility?: boolean;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  gothram?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentProvider: 'RAZORPAY' | 'UPI_INTENT' | 'CASH_DESK' | 'DEMO_GATEWAY' | string;
  status: PaymentStatus;
  signatureVerified: boolean;
  donationId?: string;
  receiptId?: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
  isDemo?: boolean;
}

export interface MaterialDonation {
  id: string;
  receiptId: string;
  donorName: string;
  anonymous: boolean;
  materialName: string;
  category: MaterialCategory;
  quantity: number;
  unit: string; // e.g. "kg", "bags", "litres", "sets", "pieces"
  date: string;
  notes?: string;
  status: DonationStatus;
  phoneNumber?: string;
  email?: string;
  gothram?: string;
  deliveryMethod?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Expense {
  id: string;
  expenseName: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  vendorName: string;
  description: string;
  billUrl?: string;
  receiptVoucherNo: string;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  type: 'MONETARY' | 'MATERIAL';
  donationId?: string;
  materialDonationId?: string;
  donorName: string;
  anonymous: boolean;
  amount?: number;
  materialName?: string;
  quantity?: number;
  unit?: string;
  paymentMethod?: PaymentMethod;
  date: string;
  verificationCode: string;
  qrCodeData: string;
  committeeName: string;
  location: string;
  issuedBy: string;
  createdAt: string;
  status: 'VERIFIED' | 'REVOKED' | 'VOID' | 'PENDING';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  regeneratedAt?: string;
  regeneratedBy?: string;
  verificationCount?: number;
}

export interface EventItem {
  id: string;
  title: string;
  dayNumber: number;
  date: string;
  time: string;
  category: 'Pooja' | 'Cultural' | 'Annadanam' | 'Community' | 'Visarjan' | 'Procession';
  description: string;
  location: string;
  highlight?: boolean;
  highlights?: string[];
  published: boolean;
  imageUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Festival' | 'Pooja' | 'Annadanam' | 'Important' | 'Community' | 'General' | 'Cultural' | 'Visarjan';
  content: string;
  date: string;
  pinned: boolean;
  published: boolean;
  author: string;
  priority?: 'Normal' | 'Important' | 'Urgent';
  active?: boolean;
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Ganesh Idol' | 'Pooja' | 'Festival' | 'Cultural' | 'Community' | 'Visarjan';
  imageUrl: string;
  caption: string;
  description?: string;
  year: string;
  featured?: boolean;
  published?: boolean;
}

export type GalleryImage = GalleryItem;

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  servingSince: string;
  phoneNumber: string;
  photoUrl: string;
  bio: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'VERIFY' | 'APPROVE' | 'REJECT' | 'ARCHIVE';

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entity: 'Donation' | 'Material' | 'Expense' | 'Event' | 'Announcement' | 'Gallery' | 'Receipt' | 'User' | 'Settings' | 'System';
  recordId: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  performedBy?: string;
  auditReason?: string;
  diff?: any;
}

export type AdminRole = 'SUPER_ADMIN' | 'TREASURER' | 'COMMITTEE_ADMIN';

export type Permission =
  | 'donations.view'
  | 'donations.create'
  | 'donations.edit'
  | 'donations.delete'
  | 'donations.approve'
  | 'materials.view'
  | 'materials.create'
  | 'materials.edit'
  | 'materials.delete'
  | 'materials.approve'
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  | 'expenses.approve'
  | 'events.view'
  | 'events.create'
  | 'events.edit'
  | 'events.delete'
  | 'announcements.view'
  | 'announcements.create'
  | 'announcements.edit'
  | 'announcements.delete'
  | 'gallery.view'
  | 'gallery.create'
  | 'gallery.edit'
  | 'gallery.delete'
  | 'reports.view'
  | 'reports.export'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'settings.view'
  | 'settings.edit'
  | 'audit.view'
  | 'payments.view'
  | 'payments.reconcile'
  | 'receipts.view'
  | 'receipts.void'
  | 'messages.view'
  | 'messages.manage'
  | 'notifications.view';

export interface AdminUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  lastLoginAt?: string;
  phone: string;
  photoURL?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'super_admin' | 'treasurer' | 'committee_admin' | 'SUPER_ADMIN' | 'TREASURER' | 'COMMITTEE_ADMIN';
  status: 'active' | 'inactive' | 'suspended' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  photoURL?: string;
  phone?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
  read?: boolean;
  status?: 'unread' | 'read' | 'replied';
}

export interface CommitteeSettings {
  committeeName: string;
  subtitle: string;
  location: string;
  addressLine1: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  contactPhone1: string;
  contactPhone2: string;
  contactEmail: string;
  contactPhone?: string;
  whatsappNumber: string;
  upiId: string;
  upiQrHolder: string;
  festivalYear: string;
  festivalName?: string;
  year?: string;
  targetBudget: number;
  annadanamCapacity: number;
  enablePublicTransparency?: boolean;
  festivalStartDate: string;
  festivalEndDate: string;
  defaultPoojaTime?: string;
  visarjanDate?: string;
  receiptPrefix?: string;
  donationPrefix?: string;
  materialPrefix?: string;
  receiptFooterText?: string;
  verificationUrl?: string;
  motto: string;
  publicWebsiteEnabled?: boolean;
  paymentGatewayConfigured?: boolean;
  paymentProviderName?: string;
  razorpayKeyId?: string;
  paymentEnvironment?: 'development' | 'staging' | 'production';
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export type NotificationPriority = 'Info' | 'Warning' | 'Important' | 'Critical';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'PENDING_APPROVAL' | 'FINANCE' | 'EVENT' | 'SYSTEM' | 'PAYMENT';
  priority?: NotificationPriority;
  read: boolean;
  link?: string;
  relatedRecordId?: string;
  relatedEntity?: string;
}
