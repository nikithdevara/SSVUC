import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Archive,
  Camera,
  UploadCloud,
  Trash2,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { Expense } from '../../types';
import { svucStore } from '../../services/store';
import { expensesService, reportService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminTable, Column } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { BillModal } from '../../components/common/BillModal';
import { compressImageFile } from '../../lib/imageCompressor';
import { useToast } from '../../components/common/Toast';

interface AdminExpensesPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminExpensesPage: React.FC<AdminExpensesPageProps> = ({ onNavigate, selectedId }) => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(svucStore.getExpenses());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [viewBill, setViewBill] = useState<Expense | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'archive' | 'delete';
    target: Expense;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [editReason, setEditReason] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // File input refs for direct picker & camera access
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    expenseName: '',
    category: 'Mandapam & Tent' as Expense['category'],
    amount: 5000,
    vendorName: '',
    description: '',
    paymentMethod: 'UPI' as Expense['paymentMethod'],
    billUrl: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Approved' as Expense['status'],
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const optimized = await compressImageFile(file, 1024, 0.75);
      setFormData((prev) => ({ ...prev, billUrl: optimized }));
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const refreshList = () => {
    setExpenses(svucStore.getExpenses());
  };

  useEffect(() => {
    // 1. Initial load
    setExpenses(svucStore.getExpenses());

    // 2. Real-time Firestore live listener across network devices
    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      try {
        unsub = onSnapshot(collection(db, 'expenses'), (snapshot) => {
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
          live.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
          setExpenses(live);
        });
      } catch (err) {
        console.warn('[Expenses snapshot listener error]', err);
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

  useEffect(() => {
    if (selectedId) {
      const match = expenses.find((e) => e.id === selectedId || e.receiptVoucherNo === selectedId);
      if (match) setViewBill(match);
    }
  }, [selectedId, expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        e.expenseName.toLowerCase().includes(q) ||
        e.vendorName.toLowerCase().includes(q) ||
        e.receiptVoucherNo.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        String(e.amount).includes(q);

      const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Approved' && (e.status === 'Approved' || e.status === 'Paid')) ||
        e.status === statusFilter;
      const matchesMethod = methodFilter === 'ALL' || e.paymentMethod === methodFilter;

      return matchesQuery && matchesCategory && matchesStatus && matchesMethod;
    });
  }, [expenses, searchQuery, categoryFilter, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setShowUrlInput(false);
    setFormData({
      expenseName: '',
      category: 'Mandapam & Tent',
      amount: 5000,
      vendorName: '',
      description: '',
      paymentMethod: 'UPI',
      billUrl: '',
      date: new Date().toISOString().split('T')[0],
      status: authService.hasPermission('expenses.approve') ? 'Approved' : 'Pending',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expenseName.trim()) {
      showToast('Please enter the Expense Title', 'error');
      return;
    }
    if (!formData.vendorName.trim()) {
      showToast('Please enter the Vendor / Payee Name', 'error');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newVoucher = expensesService.create(formData);
      
      // Immediately update local state for 0ms visual confirmation
      setExpenses((prev) => [newVoucher, ...prev.filter((e) => e.id !== newVoucher.id)]);
      
      // Close modal immediately
      setIsAddModalOpen(false);

      // Reset form
      setFormData({
        expenseName: '',
        category: 'Mandapam & Tent',
        amount: 5000,
        vendorName: '',
        description: '',
        paymentMethod: 'UPI',
        billUrl: '',
        date: new Date().toISOString().split('T')[0],
        status: authService.hasPermission('expenses.approve') ? 'Approved' : 'Pending',
      });

      showToast(`Expense voucher ${newVoucher.receiptVoucherNo} created successfully!`, 'success');
    } catch (err: any) {
      console.error('Error creating expense voucher:', err);
      showToast(err?.message || 'Failed to create expense voucher. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item: Expense) => {
    setEditTarget(item);
    setEditReason('');
    setShowUrlInput(false);
    setFormData({
      expenseName: item.expenseName,
      category: item.category,
      amount: item.amount,
      vendorName: item.vendorName,
      description: item.description,
      paymentMethod: item.paymentMethod,
      billUrl: item.billUrl || '',
      date: item.date,
      status: item.status,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!formData.expenseName.trim()) {
      showToast('Please enter the Expense Title', 'error');
      return;
    }
    if (!formData.vendorName.trim()) {
      showToast('Please enter the Vendor / Payee Name', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      expensesService.update(
        editTarget.id,
        {
          expenseName: formData.expenseName,
          category: formData.category,
          amount: Number(formData.amount),
          vendorName: formData.vendorName,
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          billUrl: formData.billUrl,
          date: formData.date,
          status: formData.status,
        },
        editReason
      );

      // Immediately update local state
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editTarget.id
            ? {
                ...e,
                expenseName: formData.expenseName,
                category: formData.category,
                amount: Number(formData.amount),
                vendorName: formData.vendorName,
                description: formData.description,
                paymentMethod: formData.paymentMethod,
                billUrl: formData.billUrl,
                date: formData.date,
                status: formData.status,
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );

      setEditTarget(null);
      showToast(`Expense voucher ${editTarget.receiptVoucherNo} updated successfully!`, 'success');
    } catch (err: any) {
      console.error('Error updating expense voucher:', err);
      showToast(err?.message || 'Failed to update expense voucher', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteConfirm = () => {
    if (!confirmAction) return;
    const { type, target } = confirmAction;

    if (type === 'approve') {
      expensesService.approve(target.id);
      setExpenses((prev) => prev.map((e) => (e.id === target.id ? { ...e, status: 'Approved' } : e)));
      showToast(`Voucher ${target.receiptVoucherNo} approved successfully!`, 'success');
    } else if (type === 'reject') {
      expensesService.reject(target.id, actionReason || 'Treasury disapproval');
      setExpenses((prev) => prev.map((e) => (e.id === target.id ? { ...e, status: 'Rejected' } : e)));
      showToast(`Voucher ${target.receiptVoucherNo} marked as disapproved.`, 'info');
    } else if (type === 'archive') {
      expensesService.archive(target.id, 'Voided voucher');
      setExpenses((prev) => prev.map((e) => (e.id === target.id ? { ...e, status: 'Archived' } : e)));
      showToast(`Voucher ${target.receiptVoucherNo} archived.`, 'info');
    } else if (type === 'delete') {
      expensesService.delete(target.id);
      setExpenses((prev) => prev.filter((e) => e.id !== target.id));
      showToast(`Voucher ${target.receiptVoucherNo} deleted.`, 'info');
    }

    setConfirmAction(null);
    setActionReason('');
  };

  const handleExportCSV = () => {
    const rows = filteredExpenses.map((e) => ({
      'Voucher No': e.receiptVoucherNo,
      'Internal ID': e.id,
      'Expense Title': e.expenseName,
      'Category': e.category,
      'Amount (INR)': e.amount,
      'Vendor Name': e.vendorName,
      'Payment Method': e.paymentMethod,
      'Date': e.date,
      'Status': e.status,
      'Approved By': e.approvedBy || '',
    }));
    reportService.exportCSV('SSV_Expense_Vouchers_2026', rows);
    showToast('Exported CSV Expense Ledger successfully!', 'success');
  };

  const renderStatusBadge = (status: Expense['status']) => {
    if (status === 'Approved' || status === 'Paid') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
          Pending Treasury
        </span>
      );
    }
    if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" /> Disapproved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
        Archived
      </span>
    );
  };

  const columns: Column<Expense>[] = [
    {
      key: 'voucher',
      header: 'Voucher / ID',
      render: (e) => (
        <div>
          <button
            onClick={() => setViewBill(e)}
            className="font-mono font-bold text-[#7F1D1D] hover:underline text-left block"
          >
            {e.receiptVoucherNo}
          </button>
          <span className="text-[10px] text-stone-400 font-mono">{e.id}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Expense & Category',
      render: (e) => (
        <div>
          <span className="font-bold text-stone-900 block">{e.expenseName}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-semibold">
            {e.category}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Disbursement',
      render: (e) => (
        <div>
          <span className="font-bold text-red-800 text-sm">₹{e.amount.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-stone-500 block uppercase">{e.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Payee / Vendor',
      render: (e) => (
        <div>
          <span className="font-medium text-stone-900 block">{e.vendorName}</span>
          <span className="text-[11px] text-stone-500">{e.date}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Audit Status',
      render: (e) => renderStatusBadge(e.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (e) => (
        <div className="flex items-center justify-end space-x-1.5">
          {e.billUrl && (
            <button
              onClick={() => setViewBill(e)}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600 hover:text-stone-900"
              title="View Attached Invoice/Receipt"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('expenses.edit') && (
            <button
              onClick={() => handleOpenEdit(e)}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600 hover:text-stone-900"
              title="Edit Expense"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('expenses.approve') && e.status === 'Pending' && (
            <button
              onClick={() => setConfirmAction({ type: 'approve', target: e })}
              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 font-semibold"
              title="Approve Voucher"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('expenses.approve') && (e.status === 'Approved' || e.status === 'Paid') && (
            <button
              onClick={() => setConfirmAction({ type: 'reject', target: e })}
              className="p-1.5 rounded hover:bg-red-50 text-red-600 font-semibold"
              title="Disapprove Voucher"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('expenses.delete') && (
            <>
              <button
                onClick={() => setConfirmAction({ type: 'delete', target: e })}
                className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                title="Delete Voucher Permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setConfirmAction({ type: 'archive', target: e })}
                className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                title="Archive Record"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Expenses Management' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Expenses & Treasury Disbursements"
        subtitle="Manage festival vendor invoices, bills, and audited expense vouchers"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>

            {authService.hasPermission('expenses.create') && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense Voucher</span>
              </button>
            )}
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search expense title, vendor name, voucher number..."
        totalResults={filteredExpenses.length}
        activeFilterCount={
          (categoryFilter !== 'ALL' ? 1 : 0) +
          (statusFilter !== 'ALL' ? 1 : 0) +
          (methodFilter !== 'ALL' ? 1 : 0)
        }
        onClearFilters={() => {
          setCategoryFilter('ALL');
          setStatusFilter('ALL');
          setMethodFilter('ALL');
          setSearchQuery('');
        }}
        filters={
          <>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
            >
              <option value="ALL">All Categories</option>
              <option value="Mandapam & Tent">Mandapam & Tent</option>
              <option value="Idol (Murti)">Idol (Murti)</option>
              <option value="Sound & Lighting">Sound & Lighting</option>
              <option value="Annadanam Catering">Annadanam Catering</option>
              <option value="Pooja & Priests">Pooja & Priests</option>
              <option value="Cultural Programs">Cultural Programs</option>
              <option value="Visarjan Procession">Visarjan Procession</option>
              <option value="Permits & Sanitation">Permits & Sanitation</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>

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
              <option value="Pending">Pending Approval</option>
              <option value="Rejected">Disapproved</option>
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
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </>
        }
      />

      <AdminTable
        data={paginatedData}
        columns={columns}
        keyExtractor={(e) => e.id}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        renderMobileCard={(e) => (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => setViewBill(e)}
                  className="text-xs font-mono font-bold text-[#7F1D1D] hover:underline"
                >
                  {e.receiptVoucherNo}
                </button>
                <div className="text-sm font-bold text-stone-900">{e.expenseName}</div>
                <div className="text-xs text-stone-500">Payee: {e.vendorName}</div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-red-800 font-serif">
                  ₹{e.amount.toLocaleString('en-IN')}
                </span>
                <span className="block text-[10px] text-stone-400 uppercase">{e.paymentMethod}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <span className="text-[11px] text-stone-500">{e.date}</span>
              <div>{renderStatusBadge(e.status)}</div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
              {authService.hasPermission('expenses.approve') && e.status === 'Pending' && (
                <button
                  onClick={() => setConfirmAction({ type: 'approve', target: e })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              )}
              {authService.hasPermission('expenses.approve') && (e.status === 'Approved' || e.status === 'Paid') && (
                <button
                  onClick={() => setConfirmAction({ type: 'reject', target: e })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Disapprove</span>
                </button>
              )}
              {authService.hasPermission('expenses.delete') && (
                <button
                  onClick={() => setConfirmAction({ type: 'delete', target: e })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete</span>
                </button>
              )}
              {e.billUrl && (
                <button
                  onClick={() => setViewBill(e)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>View Bill</span>
                </button>
              )}
              {authService.hasPermission('expenses.edit') && (
                <button
                  onClick={() => handleOpenEdit(e)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Add Expense Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Expense Voucher"
        subtitle="Record festival disbursements and expenses (Bill upload is optional)"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Expense Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.expenseName}
                placeholder="e.g. Stage Sound System Rental"
                onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as Expense['category'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Mandapam & Tent">Mandapam & Tent</option>
                <option value="Idol (Murti)">Idol (Murti)</option>
                <option value="Sound & Lighting">Sound & Lighting</option>
                <option value="Annadanam Catering">Annadanam Catering</option>
                <option value="Pooja & Priests">Pooja & Priests</option>
                <option value="Cultural Programs">Cultural Programs</option>
                <option value="Visarjan Procession">Visarjan Procession</option>
                <option value="Permits & Sanitation">Permits & Sanitation</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Voucher Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-red-800 focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Vendor / Payee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.vendorName}
                placeholder="e.g. Sri Balaji Sounds & Lights"
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
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
                  setFormData({ ...formData, paymentMethod: e.target.value as Expense['paymentMethod'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Disbursement Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          {/* Hidden file & camera inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Attach Bill / Invoice (Optional)
            </label>

            {formData.billUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-50 p-2.5 flex items-center gap-3">
                <img
                  src={formData.billUrl}
                  alt="Voucher preview"
                  className="w-20 h-20 object-cover rounded-lg border border-stone-200"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Receipt Attached
                  </span>
                  <p className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                    {formData.billUrl.startsWith('data:') ? 'Captured / Uploaded from device' : formData.billUrl}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                      title="Upload from device"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#7F1D1D]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                      title="Capture with camera"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#7F1D1D]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, billUrl: '' }))}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#7F1D1D] hover:bg-stone-50 transition-colors cursor-pointer group"
                    title="Upload from Device"
                  >
                    <UploadCloud className="w-6 h-6 text-stone-500 group-hover:text-[#7F1D1D] mb-1" />
                    <span className="text-[11px] font-semibold text-stone-600 group-hover:text-[#7F1D1D]">
                      Upload File
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#7F1D1D] hover:bg-stone-50 transition-colors cursor-pointer group"
                    title="Capture with Camera"
                  >
                    <Camera className="w-6 h-6 text-stone-500 group-hover:text-[#7F1D1D] mb-1" />
                    <span className="text-[11px] font-semibold text-stone-600 group-hover:text-[#7F1D1D]">
                      Take Photo
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-stone-500 hover:text-[#7F1D1D] flex items-center gap-1 cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Hide URL link' : 'Paste web image URL'}</span>
                  </button>
                </div>

                {showUrlInput && (
                  <input
                    type="url"
                    value={formData.billUrl}
                    placeholder="https://example.com/invoice.jpg"
                    onChange={(e) => setFormData({ ...formData, billUrl: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                  />
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description / Bill Specifics</label>
            <textarea
              rows={2}
              value={formData.description}
              placeholder="e.g. 5 days sound setup with generators & operator charges"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Voucher...</span>
                </>
              ) : isCompressing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Image...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Expense Voucher</span>
                </>
              )}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Expense Modal */}
      {editTarget && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Voucher: ${editTarget.receiptVoucherNo}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Expense Name</label>
                <input
                  type="text"
                  required
                  value={formData.expenseName}
                  onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Expense['category'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="Mandapam & Tent">Mandapam & Tent</option>
                  <option value="Idol (Murti)">Idol (Murti)</option>
                  <option value="Sound & Lighting">Sound & Lighting</option>
                  <option value="Annadanam Catering">Annadanam Catering</option>
                  <option value="Pooja & Priests">Pooja & Priests</option>
                  <option value="Cultural Programs">Cultural Programs</option>
                  <option value="Visarjan Procession">Visarjan Procession</option>
                  <option value="Permits & Sanitation">Permits & Sanitation</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold text-red-800 focus:border-[#7F1D1D] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  required
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as Expense['paymentMethod'] })
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
                <label className="block font-semibold text-stone-700 mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Attach Bill / Invoice <span className="text-stone-400 font-normal">(Optional)</span>
              </label>

              {formData.billUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-50 p-2.5 flex items-center gap-3">
                  <img
                    src={formData.billUrl}
                    alt="Voucher preview"
                    className="w-20 h-20 object-cover rounded-lg border border-stone-200"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Receipt Attached
                    </span>
                    <p className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                      {formData.billUrl.startsWith('data:') ? 'Captured / Uploaded from device' : formData.billUrl}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Upload from device"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#7F1D1D]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Capture with camera"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#7F1D1D]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, billUrl: '' }))}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#7F1D1D] hover:bg-stone-50 transition-colors cursor-pointer group"
                      title="Upload from Device"
                    >
                      <UploadCloud className="w-6 h-6 text-stone-500 group-hover:text-[#7F1D1D] mb-1" />
                      <span className="text-[11px] font-semibold text-stone-600 group-hover:text-[#7F1D1D]">
                        Upload File
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-[#7F1D1D] hover:bg-stone-50 transition-colors cursor-pointer group"
                      title="Capture with Camera"
                    >
                      <Camera className="w-6 h-6 text-stone-500 group-hover:text-[#7F1D1D] mb-1" />
                      <span className="text-[11px] font-semibold text-stone-600 group-hover:text-[#7F1D1D]">
                        Take Photo
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-stone-500 hover:text-[#7F1D1D] flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showUrlInput ? 'Hide URL link' : 'Paste web image URL'}</span>
                    </button>
                  </div>

                  {showUrlInput && (
                    <input
                      type="url"
                      value={formData.billUrl}
                      placeholder="https://example.com/invoice.jpg"
                      onChange={(e) => setFormData({ ...formData, billUrl: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                    />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Description / Bill Specifics</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Audit Reason for Update <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editReason}
                placeholder="e.g. Corrected final invoice settlement amount after vendor discount"
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editReason.trim() || isSubmitting || isCompressing}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Voucher...</span>
                  </>
                ) : isCompressing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Image...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Update Voucher & Record Audit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          title={`Confirm ${confirmAction.type.toUpperCase()}`}
          message={`Are you sure you want to ${confirmAction.type} expense voucher ${confirmAction.target.receiptVoucherNo} (₹${confirmAction.target.amount})?`}
          confirmLabel={`Yes, ${confirmAction.type}`}
          variant={confirmAction.type === 'delete' || confirmAction.type === 'reject' ? 'danger' : 'warning'}
          requireReason={confirmAction.type === 'reject'}
          reasonValue={actionReason}
          onReasonChange={setActionReason}
          onConfirm={handleExecuteConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* View Attached Bill Modal */}
      {viewBill && (
        <BillModal
          isOpen={true}
          onClose={() => setViewBill(null)}
          expense={viewBill}
        />
      )}
    </div>
  );
};
