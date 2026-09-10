import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Package,
  FileText,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Download,
  Users,
  Eye,
  FileSpreadsheet,
  Trash2,
  Mail,
  Bell,
} from 'lucide-react';
import { financialService } from '../../services/financialService';
import { authService } from '../../services/authService';
import { svucStore } from '../../services/store';
import { donationsService, expensesService, materialsService } from '../../services/adminService';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { Donation, Expense, MaterialDonation } from '../../types';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminStats, StatCardItem } from '../../components/admin/AdminStats';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState(financialService.getSummary());
  const [donationsList, setDonationsList] = useState<Donation[]>(svucStore.getDonations());
  const [expensesList, setExpensesList] = useState<Expense[]>(svucStore.getExpenses());
  const [materialsList, setMaterialsList] = useState<MaterialDonation[]>(svucStore.getMaterials());
  const currentUser = authService.getCurrentUser();
  const settings = svucStore.getSettings();

  // Selected item for action modal (Accept, Decline, Remove)
  const [actionModal, setActionModal] = useState<{
    action: 'approve' | 'reject' | 'delete';
    type: 'donation' | 'expense' | 'material';
    id: string;
    title: string;
    message: string;
    amount?: number;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  const refreshData = () => {
    setSummary(financialService.getSummary());
    setDonationsList(svucStore.getDonations());
    setExpensesList(svucStore.getExpenses());
    setMaterialsList(svucStore.getMaterials());
  };

  useEffect(() => {
    if (isFirebaseConfigured() && db) {
      const unsubD = onSnapshot(collection(db, 'donations'), (snap) => {
        const live = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Donation));
        setDonationsList(live);
      });
      const unsubE = onSnapshot(collection(db, 'expenses'), (snap) => {
        const live = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
        setExpensesList(live);
      });
      const unsubM = onSnapshot(collection(db, 'materials'), (snap) => {
        const live = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialDonation));
        setMaterialsList(live);
      });
      return () => {
        unsubD();
        unsubE();
        unsubM();
      };
    } else {
      const handleUpdate = () => refreshData();
      window.addEventListener('svuc_store_updated', handleUpdate);
      return () => window.removeEventListener('svuc_store_updated', handleUpdate);
    }
  }, []);

  // Compute live summary based on real-time collections
  const totalApprovedDonations = useMemo(() => {
    return donationsList
      .filter((d) => d.status === 'Approved' || d.status === 'Verified')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [donationsList]);

  const approvedDonationCount = useMemo(() => {
    return donationsList.filter((d) => d.status === 'Approved' || d.status === 'Verified').length;
  }, [donationsList]);

  const totalApprovedExpenses = useMemo(() => {
    return expensesList
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expensesList]);

  const approvedExpenseCount = useMemo(() => {
    return expensesList.filter((e) => e.status === 'Approved' || e.status === 'Paid').length;
  }, [expensesList]);

  const availableBalance = totalApprovedDonations - totalApprovedExpenses;

  const approvedMaterialCount = useMemo(() => {
    return materialsList.filter((m) => m.status === 'Approved' || m.status === 'Verified').length;
  }, [materialsList]);

  const totalMaterialItemsCount = useMemo(() => {
    return materialsList
      .filter((m) => m.status === 'Approved' || m.status === 'Verified')
      .reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);
  }, [materialsList]);

  const pendingDonations = donationsList.filter((d) => d.status === 'Pending');
  const pendingExpenses = expensesList.filter((e) => e.status === 'Pending');
  const pendingMaterials = materialsList.filter((m) => m.status === 'Pending');
  const totalPending = pendingDonations.length + pendingExpenses.length + pendingMaterials.length;

  const recentAudits = (svucStore.getAuditLogs ? svucStore.getAuditLogs() : [])?.slice(0, 5) || [];


  const canViewFinance = authService.hasPermission('donations.view') || authService.hasPermission('expenses.view');
  const canViewAudit = authService.hasPermission('audit.view');
  const canApprove = authService.hasPermission('donations.approve') || authService.hasPermission('expenses.approve') || authService.hasPermission('materials.approve');

  const eventsList = (svucStore.getEvents ? svucStore.getEvents() : []) || [];
  const announcementsList = (svucStore.getAnnouncements ? svucStore.getAnnouncements() : []) || [];
  const contactMessages = (svucStore.getContactMessages ? svucStore.getContactMessages() : []) || [];
  const unreadMessagesCount = contactMessages.filter((m) => !m?.read).length;

  const financialStats: StatCardItem[] = [
    {
      id: 'donations',
      label: 'Approved Offerings',
      value: `₹${(totalApprovedDonations || 0).toLocaleString('en-IN')}`,
      subtext: `${approvedDonationCount || 0} verified contributions`,
      icon: <DollarSign className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-50 text-emerald-700',
      positive: true,
      highlight: true,
    },
    {
      id: 'expenses',
      label: 'Approved Expenses',
      value: `₹${(totalApprovedExpenses || 0).toLocaleString('en-IN')}`,
      subtext: `${approvedExpenseCount || 0} disbursed vouchers`,
      icon: <FileText className="w-5 h-5 text-red-700" />,
      iconBg: 'bg-red-50 text-red-700',
    },
    {
      id: 'balance',
      label: 'Treasury Balance',
      value: `₹${(availableBalance || 0).toLocaleString('en-IN')}`,
      subtext: 'Net Available Liquid Funds',
      icon: <TrendingUp className="w-5 h-5 text-amber-700" />,
      iconBg: 'bg-amber-50 text-amber-700',
      highlight: true,
    },
    {
      id: 'materials',
      label: 'Material Seva Items',
      value: (totalMaterialItemsCount || 0).toLocaleString('en-IN'),
      subtext: `${approvedMaterialCount || 0} in-kind pledges`,
      icon: <Package className="w-5 h-5 text-amber-800" />,
      iconBg: 'bg-amber-50 text-amber-800',
    },
  ];

  const operationalStats: StatCardItem[] = [
    {
      id: 'total-offered',
      label: 'Total Amount Offered',
      value: `₹${(totalApprovedDonations || 0).toLocaleString('en-IN')}`,
      subtext: `${approvedDonationCount || 0} verified contributions`,
      icon: <DollarSign className="w-5 h-5 text-emerald-700" />,
      iconBg: 'bg-emerald-50 text-emerald-700',
      positive: true,
      highlight: true,
    },
    {
      id: 'total-spent',
      label: 'Total Amount Spent',
      value: `₹${(totalApprovedExpenses || 0).toLocaleString('en-IN')}`,
      subtext: `${approvedExpenseCount || 0} disbursed vouchers`,
      icon: <FileText className="w-5 h-5 text-red-700" />,
      iconBg: 'bg-red-50 text-red-700',
    },
    {
      id: 'events',
      label: 'Festival Schedule',
      value: `${eventsList.length} Events`,
      subtext: 'Scheduled rituals & celebrations',
      icon: <Calendar className="w-5 h-5 text-indigo-700" />,
      iconBg: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'messages',
      label: 'Devotee Inquiries',
      value: `${contactMessages.length} Messages`,
      subtext: `${unreadMessagesCount} unread message(s)`,
      icon: <Mail className="w-5 h-5 text-blue-700" />,
      iconBg: 'bg-blue-50 text-blue-700',
      highlight: unreadMessagesCount > 0,
    },
  ];

  const stats = canViewFinance ? financialStats : operationalStats;

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    const { action, type, id } = actionModal;
    try {
      if (action === 'approve') {
        if (type === 'donation') await donationsService.approve(id);
        else if (type === 'expense') await expensesService.approve(id);
        else if (type === 'material') await materialsService.approve(id);
      } else if (action === 'reject') {
        if (type === 'donation') await donationsService.reject(id, actionReason || 'Declined from dashboard queue');
        else if (type === 'expense') await expensesService.reject(id, actionReason || 'Declined from dashboard queue');
        else if (type === 'material') await materialsService.reject(id, actionReason || 'Declined from dashboard queue');
      } else if (action === 'delete') {
        if (type === 'donation') await donationsService.delete(id);
        else if (type === 'expense') await expensesService.delete(id);
        else if (type === 'material') await materialsService.delete(id);
      }
    } catch (err: any) {
      console.error('Error executing dashboard action:', err);
    } finally {
      setActionModal(null);
      setActionReason('');
      refreshData();
    }
  };

  const handleReplyWhatsApp = (msg: { phone?: string; name: string; message: string }) => {
    if (!msg.phone) return;
    const cleanPhone = msg.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Namaste ${msg.name || 'Devotee'} garu,\nGreetings from Sri Siddhi Vinayaka Utsava Committee, Gandhinagar Anjayya Colony, Anakapalle.\n\nIn response to your inquiry:\n"${msg.message}"\n\n`
    );
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`, '_blank');
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <AdminBreadcrumbs items={[{ label: 'Dashboard' }]} onNavigate={onNavigate} />

      {/* Header */}
      <AdminPageHeader
        title="Committee Administrative Dashboard"
        subtitle={`Sri Siddhi Vinayaka Utsav 2026 • Logged in as ${currentUser?.name || 'Committee Admin'} (${authService.getRoleLabel(
          currentUser?.role || 'COMMITTEE_ADMIN'
        )})`}
        actions={
          <div className="flex items-center gap-2">
            {authService.hasPermission('reports.view') && (
              <button
                onClick={() => onNavigate('/admin/reports')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
                <span>Financial Statements</span>
              </button>
            )}
            {authService.hasPermission('donations.create') && (
              <button
                onClick={() => onNavigate('/admin/donations/new')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Offering</span>
              </button>
            )}
            {authService.hasPermission('events.create') && (
              <button
                onClick={() => onNavigate('/admin/events')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Manage Events</span>
              </button>
            )}
          </div>
        }
      />

      {/* Pending Approvals Alert Bar (Only shown for users with approval rights) */}
      {canApprove && totalPending > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                Action Required: {totalPending} Record(s) Pending Audit Verification
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                {pendingDonations.length} offering(s), {pendingExpenses.length} expense voucher(s), and {pendingMaterials.length} material pledge(s) are awaiting committee approval before impacting public figures.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {pendingDonations.length > 0 && (
              <button
                onClick={() => onNavigate('/admin/donations')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors"
              >
                Review Offerings
              </button>
            )}
            {pendingExpenses.length > 0 && (
              <button
                onClick={() => onNavigate('/admin/expenses')}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors"
              >
                Review Expenses
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Metric Cards */}
      <AdminStats stats={stats} />

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {authService.hasPermission('donations.view') && (
          <button
            onClick={() => onNavigate('/admin/donations')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Offerings</div>
            <div className="text-[10px] text-stone-500">{summary?.totalDonationCount || 0} records</div>
          </button>
        )}

        {authService.hasPermission('materials.view') && (
          <button
            onClick={() => onNavigate('/admin/materials')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Material Seva</div>
            <div className="text-[10px] text-stone-500">{summary?.totalMaterialCount || 0} in-kind</div>
          </button>
        )}

        {authService.hasPermission('expenses.view') && (
          <button
            onClick={() => onNavigate('/admin/expenses')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Expenses</div>
            <div className="text-[10px] text-stone-500">{summary?.totalExpenseCount || 0} vouchers</div>
          </button>
        )}

        {authService.hasPermission('events.view') && (
          <button
            onClick={() => onNavigate('/admin/events')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Events</div>
            <div className="text-[10px] text-stone-500">{eventsList.length} scheduled</div>
          </button>
        )}

        {authService.hasPermission('announcements.view') && (
          <button
            onClick={() => onNavigate('/admin/announcements')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Announcements</div>
            <div className="text-[10px] text-stone-500">{announcementsList.length} bulletins</div>
          </button>
        )}

        {authService.hasPermission('messages.view') && (
          <button
            onClick={() => onNavigate('/admin/messages')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Messages</div>
            <div className="text-[10px] text-stone-500">{unreadMessagesCount} unread</div>
          </button>
        )}

        {authService.hasPermission('reports.view') && (
          <button
            onClick={() => onNavigate('/admin/reports')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Reports</div>
            <div className="text-[10px] text-stone-500">Ledgers & export</div>
          </button>
        )}

        {authService.hasPermission('audit.view') && (
          <button
            onClick={() => onNavigate('/admin/audit-logs')}
            className="p-3 bg-white border border-stone-200 hover:border-amber-400 rounded-xl text-left transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-900">Audit Trail</div>
            <div className="text-[10px] text-stone-500">Tamper logs</div>
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conditional: Pending Approvals Table for Finance Users */}
          {canViewFinance ? (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-serif text-stone-900">
                    Pending Approvals Queue
                  </h3>
                  <p className="text-xs text-stone-500">
                    Awaiting counter verification or treasurer sign-off
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {totalPending} waiting
                </span>
              </div>

              {totalPending === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                  All monetary offerings, material seva, and expense vouchers are currently approved!
                </div>
              ) : (
                <div className="divide-y divide-stone-100 text-xs">
                  {/* Pending Offerings */}
                  {pendingDonations.slice(0, 3).map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          ₹
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{d.donorName}</div>
                          <div className="text-[11px] text-stone-500">
                            {d.id} • {d.paymentMethod} • {d.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-emerald-800 text-sm mr-1">
                          ₹{(d.amount || 0).toLocaleString('en-IN')}
                        </span>
                        {authService.hasPermission('donations.approve') && (
                          <>
                            <button
                              onClick={() =>
                                setActionModal({
                                  action: 'approve',
                                  type: 'donation',
                                  id: d.id,
                                  title: 'Accept & Approve Offering',
                                  message: `Are you sure you want to accept and verify offering ₹${(d.amount || 0).toLocaleString('en-IN')} from ${d.donorName}? This will verify the record in festival accounts.`,
                                  amount: d.amount,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Accept Offering"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                setActionModal({
                                  action: 'reject',
                                  type: 'donation',
                                  id: d.id,
                                  title: 'Decline Monetary Offering',
                                  message: `Are you sure you want to decline offering ₹${(d.amount || 0).toLocaleString('en-IN')} from ${d.donorName}? The status will be set to Declined.`,
                                  amount: d.amount,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Decline Offering"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {authService.hasPermission('donations.delete') && (
                          <button
                            onClick={() =>
                              setActionModal({
                                action: 'delete',
                                type: 'donation',
                                id: d.id,
                                title: 'Remove Offering Record',
                                message: `Are you sure you want to permanently delete offering ₹${(d.amount || 0).toLocaleString('en-IN')} from ${d.donorName}? This will permanently remove the record.`,
                                amount: d.amount,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
                            title="Remove Record"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pending Expenses */}
                  {pendingExpenses.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-md bg-red-50 text-red-700 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{e.expenseName}</div>
                          <div className="text-[11px] text-stone-500">
                            {e.id} • {e.category} • Paid to: {e.paidTo}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-red-800 text-sm mr-1">
                          ₹{(e.amount || 0).toLocaleString('en-IN')}
                        </span>
                        {authService.hasPermission('expenses.approve') && (
                          <button
                            onClick={() =>
                              setActionModal({
                                action: 'approve',
                                type: 'expense',
                                id: e.id,
                                title: `Approve Expense Voucher`,
                                message: `Are you sure you want to approve voucher ₹${e.amount} for ${e.expenseName}?`,
                                amount: e.amount,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pending Materials */}
                  {pendingMaterials.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{m.materialName}</div>
                          <div className="text-[11px] text-stone-500">
                            Donor: {m.donorName} • Category: {m.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-amber-900 text-xs mr-1">
                          {m.quantity} {m.unit}
                        </span>
                        {authService.hasPermission('materials.approve') && (
                          <>
                            <button
                              onClick={() =>
                                setActionModal({
                                  action: 'approve',
                                  type: 'material',
                                  id: m.id,
                                  title: `Accept & Verify Material Seva`,
                                  message: `Are you sure you want to accept and verify ${m.quantity} ${m.unit} of ${m.materialName} from ${m.donorName}?`,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Accept Item"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                setActionModal({
                                  action: 'reject',
                                  type: 'material',
                                  id: m.id,
                                  title: `Decline Material Offering`,
                                  message: `Are you sure you want to decline material contribution "${m.materialName}" (${m.quantity} ${m.unit}) from ${m.donorName}? The status will be set to Declined.`,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Decline Offering"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {authService.hasPermission('materials.delete') && (
                          <button
                            onClick={() =>
                              setActionModal({
                                action: 'delete',
                                type: 'material',
                                id: m.id,
                                title: `Remove Material from Ledger`,
                                message: `Are you sure you want to permanently delete material contribution "${m.materialName}" (${m.quantity} ${m.unit}) from ${m.donorName}? This will completely remove the record from the ledger.`,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
                            title="Remove Record"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Operational Schedule & Events for Committee Admin */
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-serif text-stone-900">
                      Festival Schedule & Rituals
                    </h3>
                    <p className="text-xs text-stone-500">
                      Upcoming events, poojas, and cultural programs
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/admin/events')}
                    className="text-xs text-[#7F1D1D] hover:underline font-semibold flex items-center"
                  >
                    Manage Events <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>

                {eventsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    <Calendar className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
                    No festival events scheduled yet. Click Manage Events to create schedule.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {eventsList.slice(0, 4).map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900">{evt.title || 'Festival Event'}</div>
                            <div className="text-[11px] text-stone-500">
                              {evt.date || 'Festival 2026'} {evt.time ? `• ${evt.time}` : ''} • {evt.location || 'Main Mandapam'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {evt.category || 'Pooja'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Devotee Inquiries */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-serif text-stone-900">
                      Recent Devotee Inquiries
                    </h3>
                    <p className="text-xs text-stone-500">
                      Direct inquiries received via the temple contact portal
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/admin/messages')}
                    className="text-xs text-[#7F1D1D] hover:underline font-semibold flex items-center"
                  >
                    View all ({contactMessages.length}) <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>

                {contactMessages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                    No pending inquiries from devotees.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 text-xs">
                    {contactMessages.slice(0, 3).map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-stone-50/70 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              {msg.name || 'Devotee'}
                              {!msg.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 line-clamp-1 max-w-xs sm:max-w-md">
                              "{msg.message || ''}"
                            </div>
                          </div>
                        </div>
                        {msg.phone && (
                          <button
                            onClick={() => handleReplyWhatsApp(msg)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            WhatsApp
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Audit Trail Snippet - Only for Super Admin */}
          {canViewAudit && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <div>
                  <h3 className="text-sm font-bold font-serif text-stone-900">
                    Recent Audit Trail
                  </h3>
                  <p className="text-xs text-stone-500">
                    Security logs of administrative operations & updates
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/admin/audit-logs')}
                  className="text-xs text-[#7F1D1D] hover:underline font-semibold flex items-center"
                >
                  View all logs <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>

              <div className="space-y-3">
                {recentAudits.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-stone-800 leading-relaxed font-medium">
                        {log.details || ''}
                      </p>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        by <span className="font-medium text-stone-600">{log.userName || 'Admin'}</span> ({log.userRole || 'Admin'}) • {log.timestamp || ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Treasury Breakdown or Operational Circulars & Festival Status */}
        <div className="space-y-6">
          {canViewFinance ? (
            /* Treasury Utilization Bar */
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold font-serif text-stone-900 mb-1">
                Treasury Utilization
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Approved funds disbursement ratio
              </p>

              {/* Visual Balance Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-600">Disbursed Expenses</span>
                  <span className="text-stone-900">
                    {summary?.totalApprovedDonations && summary.totalApprovedDonations > 0
                      ? Math.round(((summary.totalApprovedExpenses || 0) / summary.totalApprovedDonations) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-red-700 transition-all duration-500"
                    style={{
                      width: `${
                        summary?.totalApprovedDonations && summary.totalApprovedDonations > 0
                          ? Math.min(100, Math.round(((summary.totalApprovedExpenses || 0) / summary.totalApprovedDonations) * 100))
                          : 0
                      }%`,
                    }}
                    title="Expenses"
                  />
                  <div
                    className="bg-emerald-600 flex-1 transition-all duration-500"
                    title="Remaining Balance"
                  />
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Available</span>
                    <div className="text-sm font-bold text-emerald-900 font-serif">
                      ₹{(summary?.availableBalance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-100">
                    <span className="text-[10px] uppercase font-bold text-red-700">Spent</span>
                    <div className="text-sm font-bold text-red-900 font-serif">
                      ₹{(summary?.totalApprovedExpenses || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Expenses Breakdown */}
              <div className="mt-5 pt-4 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  Expenditure by Category
                </h4>
                <div className="space-y-2">
                  {(summary?.categoryExpenses || []).slice(0, 4).map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-stone-700">{cat.category}</span>
                        <span className="font-semibold text-stone-900">
                          ₹{(cat.amount || 0).toLocaleString('en-IN')} ({cat.percentage || 0}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${cat.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Announcements for Committee Admin */
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold font-serif text-stone-900">
                  Active Circulars
                </h3>
                <button
                  onClick={() => onNavigate('/admin/announcements')}
                  className="text-xs text-[#7F1D1D] hover:underline font-semibold"
                >
                  View all
                </button>
              </div>
              <p className="text-xs text-stone-500 mb-3">
                Official public notices & daily schedules
              </p>

              {announcementsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  <Bell className="w-6 h-6 text-amber-400 mx-auto mb-2 opacity-80" />
                  No active circulars.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcementsList.slice(0, 4).map((ann) => (
                    <div key={ann.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                      <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold mb-1">
                        <span>{ann.category || 'NOTICE'}</span>
                        <span className="text-stone-400 font-normal">{ann.date || ''}</span>
                      </div>
                      <div className="text-xs font-bold text-stone-900 line-clamp-1">{ann.title || ''}</div>
                      <div className="text-[11px] text-stone-600 mt-1 line-clamp-2">{ann.content || ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Festival Setup Card */}
          <div className="bg-stone-900 text-stone-200 rounded-xl p-5 shadow-xs border border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Utsav 2026 Mandapam
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-medium">
                Active Setup
              </span>
            </div>
            <h4 className="text-base font-bold font-serif text-white">
              {settings?.festivalName || 'Sri Siddhi Vinayaka Ganesh Utsav 2026'}
            </h4>
            <p className="text-xs text-stone-400 mt-1">
              {settings?.location || 'Gandhinagar Anjayya Colony, Anakapalle'}
            </p>
            <div className="mt-4 pt-3 border-t border-stone-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Total Offered</span>
                <span className="font-bold text-emerald-400">₹{(totalApprovedDonations || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Total Spent</span>
                <span className="font-bold text-red-400">₹{(totalApprovedExpenses || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Target Budget</span>
                <span className="font-bold text-amber-300">₹{(settings?.targetBudget || 450000).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                <span className="text-stone-400">Annadanam Capacity</span>
                <span className="font-bold text-stone-200">{settings?.annadanamCapacity || 2500} Devotees / day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {actionModal && (
        <ConfirmationModal
          isOpen={true}
          title={actionModal.title}
          message={actionModal.message}
          confirmLabel={
            actionModal.action === 'approve'
              ? 'Yes, Accept & Verify'
              : actionModal.action === 'reject'
              ? 'Yes, Decline Offering'
              : 'Yes, Permanently Remove'
          }
          variant={
            actionModal.action === 'approve'
              ? 'success'
              : 'danger'
          }
          requireReason={actionModal.action === 'reject'}
          reasonPlaceholder="Specify reason for declining..."
          reasonValue={actionReason}
          onReasonChange={setActionReason}
          onConfirm={handleExecuteAction}
          onCancel={() => {
            setActionModal(null);
            setActionReason('');
          }}
        />
      )}
    </div>
  );
};
