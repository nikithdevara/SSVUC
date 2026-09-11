import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
  Receipt,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { Donation } from '../../types';
import { svucStore, deduplicateDonations } from '../../services/store';
import { donationsService, reportService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminTable, Column } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

interface AdminDonationsPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminDonationsPage: React.FC<AdminDonationsPageProps> = ({ onNavigate, selectedId }) => {
  const [donations, setDonations] = useState<Donation[]>(svucStore.getDonations());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Donation | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Donation | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'archive' | 'delete';
    target: Donation;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editReason, setEditReason] = useState('');

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    donorName: '',
    anonymous: false,
    amount: 1116,
    paymentMethod: 'UPI' as Donation['paymentMethod'],
    phoneNumber: '',
    email: '',
    gothram: '',
    notes: '',
    status: 'Approved' as Donation['status'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshList = () => {
    setDonations(svucStore.getDonations());
  };

  useEffect(() => {
    // 1. Initial load
    setDonations(svucStore.getDonations());

    // 2. Real-time Firestore live listener across network devices
    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      try {
        unsub = onSnapshot(collection(db, 'donations'), (snapshot) => {
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Donation));
          const deduped = deduplicateDonations(live);
          setDonations(deduped);
        });
      } catch (err) {
        console.warn('[Donations snapshot listener error]', err);
      }
    }

    // 3. Instant local store event for 0ms immediate UI update
    const handleUpdate = () => refreshList();
    window.addEventListener('svuc_store_updated', handleUpdate);

    return () => {
      if (unsub) unsub();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  // Filter logic
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        d.donorName.toLowerCase().includes(q) ||
        d.receiptId.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        (d.phoneNumber && d.phoneNumber.includes(q)) ||
        String(d.amount).includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Approved' && (d.status === 'Approved' || d.status === 'Verified')) ||
        (statusFilter === 'Declined' && (d.status === 'Declined' || d.status === 'Rejected')) ||
        (statusFilter === 'Rejected' && (d.status === 'Declined' || d.status === 'Rejected')) ||
        d.status === statusFilter;

      const matchesMethod = methodFilter === 'ALL' || d.paymentMethod === methodFilter;

      return matchesQuery && matchesStatus && matchesMethod;
    });
  }, [donations, searchQuery, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDonations.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDonations.slice(start, start + pageSize);
  }, [filteredDonations, currentPage, pageSize]);

  const pendingCount = donations.filter((d) => d.status === 'Pending').length;

  // Handle open selected record if passed via URL
  useEffect(() => {
    if (selectedId) {
      const match = donations.find((d) => d.id === selectedId || d.receiptId === selectedId);
      if (match) {
        setViewReceipt(match);
      }
    }
  }, [selectedId, donations]);

  const handleOpenAdd = () => {
    setFormData({
      donorName: '',
      anonymous: false,
      amount: 1116,
      paymentMethod: 'UPI',
      phoneNumber: '',
      email: '',
      gothram: '',
      notes: '',
      status: authService.hasPermission('donations.approve') ? 'Approved' : 'Pending',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.anonymous && !formData.donorName.trim()) {
      showToast('Please enter the Devotee Name or mark as Anonymous', 'error');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast('Please enter a valid offering amount', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await donationsService.create(formData);
      
      // Immediately update local state for 0ms visual confirmation
      setDonations((prev) => [res.donation, ...prev.filter((d) => d.id !== res.donation.id)]);
      
      // Close modal immediately
      setIsAddModalOpen(false);

      // Reset form
      setFormData({
        donorName: '',
        anonymous: false,
        amount: 1116,
        paymentMethod: 'UPI',
        phoneNumber: '',
        email: '',
        gothram: '',
        notes: '',
        status: authService.hasPermission('donations.approve') ? 'Approved' : 'Pending',
      });

      showToast(`Offering ${res.donation.receiptId} recorded successfully!`, 'success');
    } catch (err: any) {
      console.error('Error creating donation:', err);
      showToast(err?.message || 'Failed to record offering. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (donation: Donation) => {
    setEditTarget(donation);
    setEditReason('');
    setFormData({
      donorName: donation.donorName,
      anonymous: donation.anonymous,
      amount: donation.amount,
      paymentMethod: donation.paymentMethod,
      phoneNumber: donation.phoneNumber || '',
      email: donation.email || '',
      gothram: donation.gothram || '',
      notes: donation.notes || '',
      status: donation.status,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await donationsService.update(
        editTarget.id,
        {
          donorName: formData.donorName,
          anonymous: formData.anonymous,
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          gothram: formData.gothram,
          notes: formData.notes,
          status: formData.status,
        },
        editReason
      );
      setEditTarget(null);
      refreshList();
      showToast(`Donation ${editTarget.receiptId} updated successfully!`, 'success');
    } catch (err: any) {
      console.error('Error updating donation:', err);
      showToast(err?.message || 'Failed to update donation', 'error');
    }
  };

  const handleExecuteConfirm = async () => {
    if (!confirmAction) return;
    const { type, target } = confirmAction;

    try {
      if (type === 'approve') {
        await donationsService.approve(target.id);
        if (target.receiptId && target.receiptId !== target.id) {
          await donationsService.approve(target.receiptId);
        }
        setDonations((prev) =>
          prev.map((d) =>
            d.id === target.id || d.receiptId === target.receiptId || (target.receiptId && d.id === target.receiptId)
              ? { ...d, status: 'Approved', approvedBy: authService.getCurrentUser()?.name || 'Administrator', approvedAt: new Date().toISOString() }
              : d
          )
        );
        showToast(`Offering ${target.receiptId} approved successfully!`, 'success');
      } else if (type === 'reject') {
        await donationsService.reject(target.id, rejectionReason || 'Counter audit rejection');
        if (target.receiptId && target.receiptId !== target.id) {
          await donationsService.reject(target.receiptId, rejectionReason || 'Counter audit rejection');
        }
        setDonations((prev) =>
          prev.map((d) =>
            d.id === target.id || d.receiptId === target.receiptId || (target.receiptId && d.id === target.receiptId)
              ? { ...d, status: 'Declined', rejectionReason }
              : d
          )
        );
        showToast(`Offering ${target.receiptId} declined.`, 'info');
      } else if (type === 'archive') {
        await donationsService.archive(target.id, 'Administrative archive');
        if (target.receiptId && target.receiptId !== target.id) {
          await donationsService.archive(target.receiptId, 'Administrative archive');
        }
        setDonations((prev) =>
          prev.map((d) =>
            d.id === target.id || d.receiptId === target.receiptId || (target.receiptId && d.id === target.receiptId)
              ? { ...d, status: 'Archived' }
              : d
          )
        );
        showToast(`Offering ${target.receiptId} archived.`, 'info');
      } else if (type === 'delete') {
        await donationsService.delete(target.id);
        if (target.receiptId && target.receiptId !== target.id) {
          await donationsService.delete(target.receiptId);
        }
        setDonations((prev) =>
          prev.filter((d) => d.id !== target.id && d.receiptId !== target.receiptId && (!target.receiptId || d.id !== target.receiptId))
        );
        showToast(`Offering ${target.receiptId} deleted.`, 'info');
      }
    } catch (err: any) {
      console.error(`Error executing ${type} on donation:`, err);
      showToast(err?.message || `Failed to ${type} donation`, 'error');
    } finally {
      setConfirmAction(null);
      setRejectionReason('');
      refreshList();
    }
  };

  const handleExportCSV = () => {
    const rows = filteredDonations.map((d) => ({
      'Receipt Number': d.receiptId,
      'Internal ID': d.id,
      'Donor Name': d.donorName,
      'Anonymous': d.anonymous ? 'Yes' : 'No',
      'Amount (INR)': d.amount,
      'Payment Method': d.paymentMethod,
      'Date': d.date,
      'Phone': d.phoneNumber || '',
      'Gothram': d.gothram || '',
      'Status': d.status,
      'Approved By': d.approvedBy || '',
    }));
    reportService.exportCSV('SSV_Donations_Ledger_2026', rows);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: Donation['status']) => {
    switch (status) {
      case 'Approved':
      case 'Verified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Pending Audit
          </span>
        );
      case 'Rejected':
      case 'Declined':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 mr-1" /> Declined
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const columns: Column<Donation>[] = [
    {
      key: 'receiptId',
      header: 'Receipt / ID',
      render: (d) => (
        <div>
          <button
            onClick={() => setViewReceipt(d)}
            className="font-mono font-bold text-[#7F1D1D] hover:underline text-left block"
          >
            {d.receiptId}
          </button>
          <span className="text-[10px] text-stone-400 font-mono">{d.id}</span>
        </div>
      ),
    },
    {
      key: 'donor',
      header: 'Donor Name',
      render: (d) => (
        <div>
          <span className="font-semibold text-stone-900 block">{d.donorName}</span>
          {d.gothram && <span className="text-[11px] text-stone-500">Gothram: {d.gothram}</span>}
          {d.phoneNumber && <span className="text-[10px] text-stone-400 block">{d.phoneNumber}</span>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (d) => (
        <div>
          <span className="font-bold text-emerald-800 text-sm">₹{d.amount.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-stone-500 block uppercase">{d.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (d) => <span className="text-stone-600 text-xs">{d.date}</span>,
    },
    {
      key: 'status',
      header: 'Audit Status',
      render: (d) => renderStatusBadge(d.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end space-x-1.5">
          {authService.hasPermission('donations.approve') && d.status === 'Pending' && (
            <>
              <button
                onClick={() => setConfirmAction({ type: 'approve', target: d })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Accept & Approve Offering"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>

              <button
                onClick={() => setConfirmAction({ type: 'reject', target: d })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Decline Offering"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </>
          )}

          {authService.hasPermission('donations.delete') && (
            <button
              onClick={() => setConfirmAction({ type: 'delete', target: d })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              title="Remove Record from Ledger"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Remove</span>
            </button>
          )}

          <button
            onClick={() => setViewReceipt(d)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            title="View Official Receipt"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>View</span>
          </button>

          {authService.hasPermission('donations.edit') && (
            <button
              onClick={() => handleOpenEdit(d)}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600 hover:text-stone-900 cursor-pointer"
              title="Edit Offering"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('donations.approve') && (d.status === 'Approved' || d.status === 'Verified') && (
            <button
              onClick={() => setConfirmAction({ type: 'reject', target: d })}
              className="p-1.5 rounded hover:bg-red-50 text-red-600 text-xs cursor-pointer"
              title="Reject Record"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('donations.delete') && (
            <button
              onClick={() => setConfirmAction({ type: 'archive', target: d })}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer"
              title="Archive Record"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Offerings Management' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Offerings Management"
        subtitle="Record, verify, and generate official receipts for financial contributions"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>

            {authService.hasPermission('donations.create') && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New Offering</span>
              </button>
            )}
          </div>
        }
      />

      {/* Strict Audit: Pending Offerings Alert Banner */}
      {pendingCount > 0 && (
        <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{pendingCount} Offering{pendingCount > 1 ? 's' : ''} Awaiting Committee Verification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-amber-800">
                Devotee submissions are held in Pending status. Click "Verify & Approve" on any record to confirm bank/counter credit and publish it to the Public Ledger.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {statusFilter !== 'Pending' && (
              <button
                onClick={() => {
                  setStatusFilter('Pending');
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                Filter Pending ({pendingCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by donor name, receipt number, phone..."
        totalResults={filteredDonations.length}
        activeFilterCount={(statusFilter !== 'ALL' ? 1 : 0) + (methodFilter !== 'ALL' ? 1 : 0)}
        onClearFilters={() => {
          setStatusFilter('ALL');
          setMethodFilter('ALL');
          setSearchQuery('');
        }}
        filters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending">Pending Audit</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash (Counter)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </>
        }
      />

      {/* Responsive Data Table */}
      <AdminTable
        data={paginatedData}
        columns={columns}
        keyExtractor={(d) => d.id}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        renderMobileCard={(d) => (
          <div className="space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => setViewReceipt(d)}
                  className="text-xs font-mono font-bold text-[#7F1D1D] hover:underline"
                >
                  {d.receiptId}
                </button>
                <div className="text-sm font-bold text-stone-900">{d.donorName}</div>
                {d.gothram && <div className="text-[11px] text-stone-500">Gothram: {d.gothram}</div>}
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-emerald-800">
                  ₹{d.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-stone-400 uppercase">{d.paymentMethod}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <span className="text-[11px] text-stone-500">{d.date}</span>
              <div>{renderStatusBadge(d.status)}</div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
              {authService.hasPermission('donations.approve') && d.status === 'Pending' && (
                <>
                  <button
                    onClick={() => setConfirmAction({ type: 'approve', target: d })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'reject', target: d })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </>
              )}
              {authService.hasPermission('donations.delete') && (
                <button
                  onClick={() => setConfirmAction({ type: 'delete', target: d })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Remove</span>
                </button>
              )}
              <button
                onClick={() => setViewReceipt(d)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>View</span>
              </button>
              {authService.hasPermission('donations.edit') && (
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Add Donation Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record New Monetary Offering"
        subtitle="Creates formal receipt and logs entry into the festival treasury"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <input
              type="checkbox"
              id="anonymous-check"
              checked={formData.anonymous}
              onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
              className="rounded text-[#7F1D1D] focus:ring-[#7F1D1D]"
            />
            <label htmlFor="anonymous-check" className="font-semibold cursor-pointer">
              Anonymous Contribution (Hides name from public transparency display)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Donor Name {!formData.anonymous && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={!formData.anonymous}
                value={formData.donorName}
                disabled={formData.anonymous}
                placeholder={formData.anonymous ? 'Anonymous Devotee' : 'e.g. Sri Ravi Kumar'}
                onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Offering Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-emerald-800 focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value as Donation['paymentMethod'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="UPI">UPI (QR / PhonePe / GPay)</option>
                <option value="Cash">Cash (Mandapam Counter)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Initial Audit Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Donation['status'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Approved">Approved (Counts toward balance instantly)</option>
                <option value="Pending">Pending (Requires secondary verification)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                placeholder="+91 94401 XXXXX"
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Gothram (Family lineage)</label>
              <input
                type="text"
                value={formData.gothram}
                placeholder="e.g. Kasyapa, Bharadwaja"
                onChange={(e) => setFormData({ ...formData, gothram: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Notes / Sankalpam Remarks</label>
            <textarea
              rows={2}
              value={formData.notes}
              placeholder="e.g., Dedicated for Day 3 Annadanam prasadam"
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? 'Recording Offering...' : 'Record Offering'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Donation Modal */}
      {editTarget && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Offering: ${editTarget.receiptId}`}
          subtitle="Modifying financial records will be logged in the permanent audit trail"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Donor Name</label>
                <input
                  type="text"
                  required
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-emerald-800 focus:border-[#7F1D1D] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as Donation['paymentMethod'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Donation['status'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Audit Justification Field per Section 74 */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Audit Reason / Justification for Change <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editReason}
                placeholder="e.g. Corrected spelling error in donor name / updated transaction ref"
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs disabled:opacity-50"
              >
                Save Changes with Audit Log
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          title={
            confirmAction.type === 'approve'
              ? 'Accept & Approve Offering'
              : confirmAction.type === 'reject'
              ? 'Decline Offering'
              : confirmAction.type === 'delete'
              ? 'Remove Offering from Ledger'
              : `Confirm ${confirmAction.type.toUpperCase()}`
          }
          message={
            confirmAction.type === 'approve'
              ? `Are you sure you want to accept and verify offering ${confirmAction.target.receiptId} of ₹${confirmAction.target.amount.toLocaleString('en-IN')} from ${confirmAction.target.donorName}? This will activate the official verification code and update the festival accounts.`
              : confirmAction.type === 'reject'
              ? `Are you sure you want to decline offering ${confirmAction.target.receiptId} of ₹${confirmAction.target.amount.toLocaleString('en-IN')} from ${confirmAction.target.donorName}? The status will be marked as Declined.`
              : confirmAction.type === 'delete'
              ? `Are you sure you want to permanently remove offering ${confirmAction.target.receiptId} of ₹${confirmAction.target.amount.toLocaleString('en-IN')} from ${confirmAction.target.donorName}? This will completely delete the record from the ledger.`
              : `Are you sure you want to archive offering ${confirmAction.target.receiptId}?`
          }
          confirmLabel={
            confirmAction.type === 'approve'
              ? 'Yes, Accept & Approve'
              : confirmAction.type === 'reject'
              ? 'Yes, Decline Offering'
              : confirmAction.type === 'delete'
              ? 'Yes, Permanently Remove'
              : `Yes, ${confirmAction.type}`
          }
          variant={
            confirmAction.type === 'approve'
              ? 'success'
              : confirmAction.type === 'delete' || confirmAction.type === 'reject'
              ? 'danger'
              : 'warning'
          }
          requireReason={confirmAction.type === 'reject'}
          reasonPlaceholder="Specify reason for declining offering..."
          reasonValue={rejectionReason}
          onReasonChange={setRejectionReason}
          onConfirm={handleExecuteConfirm}
          onCancel={() => {
            setConfirmAction(null);
            setRejectionReason('');
          }}
        />
      )}

      {/* Official Receipt Modal */}
      {viewReceipt && (
        <ReceiptModal
          isOpen={true}
          showPrint={true}
          onClose={() => setViewReceipt(null)}
          donation={viewReceipt}
          receipt={svucStore.getReceiptById(viewReceipt.receiptId) || svucStore.getReceiptById(viewReceipt.id)}
          onApprove={(id) => {
            donationsService.approve(viewReceipt.id);
            if (viewReceipt.receiptId && viewReceipt.receiptId !== viewReceipt.id) {
              donationsService.approve(viewReceipt.receiptId);
            }
            refreshList();
            const updated = svucStore.getDonations().find((d) => d.id === viewReceipt.id || d.receiptId === viewReceipt.receiptId);
            setViewReceipt(updated ? { ...updated, status: 'Approved' } : { ...viewReceipt, status: 'Approved' });
          }}
          onDecline={(id) => {
            donationsService.reject(viewReceipt.id, 'Declined by Admin/Treasurer from receipt view');
            if (viewReceipt.receiptId && viewReceipt.receiptId !== viewReceipt.id) {
              donationsService.reject(viewReceipt.receiptId, 'Declined by Admin/Treasurer from receipt view');
            }
            refreshList();
            const updated = svucStore.getDonations().find((d) => d.id === viewReceipt.id || d.receiptId === viewReceipt.receiptId);
            setViewReceipt(updated ? { ...updated, status: 'Declined' } : { ...viewReceipt, status: 'Declined' });
          }}
          onRemove={(id) => {
            donationsService.delete(viewReceipt.id);
            if (viewReceipt.receiptId && viewReceipt.receiptId !== viewReceipt.id) {
              donationsService.delete(viewReceipt.receiptId);
            }
            refreshList();
            setViewReceipt(null);
          }}
        />
      )}
    </div>
  );
};
