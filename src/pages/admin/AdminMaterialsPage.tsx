import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Download,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import { MaterialDonation } from '../../types';
import { svucStore } from '../../services/store';
import { materialsService, reportService } from '../../services/adminService';
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

interface AdminMaterialsPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminMaterialsPage: React.FC<AdminMaterialsPageProps> = ({ onNavigate, selectedId }) => {
  const [materials, setMaterials] = useState<MaterialDonation[]>(svucStore.getMaterials());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MaterialDonation | null>(null);
  const [viewReceipt, setViewReceipt] = useState<MaterialDonation | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'archive' | 'delete';
    target: MaterialDonation;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    donorName: '',
    anonymous: false,
    materialName: '',
    category: 'Groceries' as MaterialDonation['category'],
    quantity: 25,
    unit: 'kg',
    phoneNumber: '',
    notes: '',
    status: 'Approved' as MaterialDonation['status'],
  });

  const refreshList = () => {
    setMaterials(svucStore.getMaterials());
  };

  useEffect(() => {
    if (isFirebaseConfigured() && db) {
      const unsub = onSnapshot(collection(db, 'materials'), (snapshot) => {
        const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MaterialDonation));
        live.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
        setMaterials(live);
      });
      return () => unsub();
    } else {
      const handleUpdate = () => refreshList();
      window.addEventListener('svuc_store_updated', handleUpdate);
      return () => window.removeEventListener('svuc_store_updated', handleUpdate);
    }
  }, []);


  useEffect(() => {
    if (selectedId) {
      const match = materials.find((m) => m.id === selectedId || m.receiptId === selectedId);
      if (match) setViewReceipt(match);
    }
  }, [selectedId, materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        m.donorName.toLowerCase().includes(q) ||
        m.materialName.toLowerCase().includes(q) ||
        m.receiptId.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Approved' && (m.status === 'Approved' || m.status === 'Verified')) ||
        (statusFilter === 'Declined' && (m.status === 'Declined' || m.status === 'Rejected')) ||
        (statusFilter === 'Rejected' && (m.status === 'Declined' || m.status === 'Rejected')) ||
        m.status === statusFilter;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [materials, searchQuery, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMaterials.slice(start, start + pageSize);
  }, [filteredMaterials, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setFormData({
      donorName: '',
      anonymous: false,
      materialName: '',
      category: 'Groceries',
      quantity: 25,
      unit: 'kg',
      phoneNumber: '',
      notes: '',
      status: authService.hasPermission('materials.approve') ? 'Approved' : 'Pending',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const res = materialsService.create(formData);
    setIsAddModalOpen(false);
    refreshList();
    setViewReceipt(res.material);
  };

  const handleOpenEdit = (item: MaterialDonation) => {
    setEditTarget(item);
    setActionReason('');
    setFormData({
      donorName: item.donorName,
      anonymous: item.anonymous,
      materialName: item.materialName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      phoneNumber: item.phoneNumber || '',
      notes: item.notes || '',
      status: item.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    materialsService.update(
      editTarget.id,
      {
        donorName: formData.donorName,
        anonymous: formData.anonymous,
        materialName: formData.materialName,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        phoneNumber: formData.phoneNumber,
        notes: formData.notes,
        status: formData.status,
      },
      actionReason
    );
    setEditTarget(null);
    refreshList();
  };

  const handleExecuteConfirm = () => {
    if (!confirmAction) return;
    const { type, target } = confirmAction;

    if (type === 'approve') {
      materialsService.approve(target.id);
    } else if (type === 'reject') {
      materialsService.reject(target.id, actionReason || 'Declined pledge');
    } else if (type === 'archive') {
      materialsService.archive(target.id, 'Archived material pledge');
    } else if (type === 'delete') {
      materialsService.delete(target.id);
    }

    setConfirmAction(null);
    setActionReason('');
    refreshList();
  };

  const handleExportCSV = () => {
    const rows = filteredMaterials.map((m) => ({
      'Receipt No': m.receiptId,
      'Internal ID': m.id,
      'Donor Name': m.donorName,
      'Material Item': m.materialName,
      'Category': m.category,
      'Quantity': m.quantity,
      'Unit': m.unit,
      'Date': m.date,
      'Status': m.status,
      'Phone': m.phoneNumber || '',
    }));
    reportService.exportCSV('SSV_Material_Contributions_2026', rows);
  };

  const renderStatusBadge = (status: MaterialDonation['status']) => {
    if (status === 'Approved' || status === 'Verified') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Verified / Received
        </span>
      );
    }
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
          Pledge Pending
        </span>
      );
    }
    if (status === 'Rejected' || status === 'Declined') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
          <XCircle className="w-3 h-3 mr-1" /> Declined
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
        Archived
      </span>
    );
  };

  const columns: Column<MaterialDonation>[] = [
    {
      key: 'receiptId',
      header: 'Receipt / ID',
      render: (m) => (
        <div>
          <button
            onClick={() => setViewReceipt(m)}
            className="font-mono font-bold text-[#7F1D1D] hover:underline text-left block"
          >
            {m.receiptId}
          </button>
          <span className="text-[10px] text-stone-400 font-mono">{m.id}</span>
        </div>
      ),
    },
    {
      key: 'item',
      header: 'Material Item',
      render: (m) => (
        <div>
          <span className="font-bold text-stone-900 block">{m.materialName}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-medium">
            {m.category}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (m) => (
        <span className="font-bold text-amber-950 text-sm">
          {m.quantity} {m.unit}
        </span>
      ),
    },
    {
      key: 'donor',
      header: 'Contributor',
      render: (m) => (
        <div>
          <span className="font-medium text-stone-900 block">{m.donorName}</span>
          {m.phoneNumber && <span className="text-[10px] text-stone-400">{m.phoneNumber}</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => renderStatusBadge(m.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end space-x-1.5">
          {authService.hasPermission('materials.approve') && m.status === 'Pending' && (
            <>
              <button
                onClick={() => setConfirmAction({ type: 'approve', target: m })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Accept & Verify Item"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>

              <button
                onClick={() => setConfirmAction({ type: 'reject', target: m })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Decline Material Contribution"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </>
          )}

          {authService.hasPermission('materials.delete') && (
            <button
              onClick={() => setConfirmAction({ type: 'delete', target: m })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              title="Remove Record from Ledger"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Remove</span>
            </button>
          )}

          <button
            onClick={() => setViewReceipt(m)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            title="View Official Receipt"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>View</span>
          </button>

          {authService.hasPermission('materials.edit') && (
            <button
              onClick={() => handleOpenEdit(m)}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600 hover:text-stone-900 cursor-pointer"
              title="Edit Material"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {authService.hasPermission('materials.delete') && (
            <button
              onClick={() => setConfirmAction({ type: 'archive', target: m })}
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
      <AdminBreadcrumbs items={[{ label: 'Material Seva' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Material Seva & In-Kind Contributions"
        subtitle="Manage groceries, pooja samagri, electrical and festival provisions"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>

            {authService.hasPermission('materials.create') && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Material Seva</span>
              </button>
            )}
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search material items, donor name, receipt number..."
        totalResults={filteredMaterials.length}
        activeFilterCount={(categoryFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)}
        onClearFilters={() => {
          setCategoryFilter('ALL');
          setStatusFilter('ALL');
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
              <option value="Groceries">Groceries (Annadanam)</option>
              <option value="Pooja">Pooja Samagri</option>
              <option value="Prasad">Prasadam / Sweets</option>
              <option value="Mandapam">Mandapam Hardware</option>
              <option value="Electrical">Lighting & Sound</option>
              <option value="Decoration">Flowers & Decor</option>
              <option value="Other">Other Provisions</option>
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
              <option value="Approved">Verified / Received</option>
              <option value="Pending">Pledges Pending</option>
              <option value="Declined">Declined</option>
              <option value="Archived">Archived</option>
            </select>
          </>
        }
      />

      <AdminTable
        data={paginatedData}
        columns={columns}
        keyExtractor={(m) => m.id}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        renderMobileCard={(m) => (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => setViewReceipt(m)}
                  className="text-xs font-mono font-bold text-[#7F1D1D] hover:underline"
                >
                  {m.receiptId}
                </button>
                <div className="text-sm font-bold text-stone-900">{m.materialName}</div>
                <div className="text-xs text-stone-500">By {m.donorName}</div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-amber-950 font-serif">
                  {m.quantity} {m.unit}
                </span>
                <span className="block text-[10px] text-amber-800 font-semibold">{m.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
              <span className="text-[11px] text-stone-500">{m.date}</span>
              <div>{renderStatusBadge(m.status)}</div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-stone-100">
              {authService.hasPermission('materials.approve') && m.status === 'Pending' && (
                <>
                  <button
                    onClick={() => setConfirmAction({ type: 'approve', target: m })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'reject', target: m })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </>
              )}
              {authService.hasPermission('materials.delete') && (
                <button
                  onClick={() => setConfirmAction({ type: 'delete', target: m })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Remove</span>
                </button>
              )}
              <button
                onClick={() => setViewReceipt(m)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>View</span>
              </button>
              {authService.hasPermission('materials.edit') && (
                <button
                  onClick={() => handleOpenEdit(m)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Add Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Material Contribution"
        subtitle="Registers in-kind inventory for Annadanam & Mandapam preparations"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Material Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.materialName}
                placeholder="e.g. Sona Masoori Rice, Pure Ghee"
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
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
                  setFormData({ ...formData, category: e.target.value as MaterialDonation['category'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Groceries">Groceries (Annadanam)</option>
                <option value="Pooja">Pooja Samagri</option>
                <option value="Prasad">Prasadam / Sweets</option>
                <option value="Mandapam">Mandapam Hardware</option>
                <option value="Electrical">Lighting & Sound</option>
                <option value="Decoration">Flowers & Decor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-bold focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Unit of Measurement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                placeholder="kg, bags, litres, tins, packs"
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Contributor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.donorName}
                placeholder="e.g. Smt. Lakshmi Devi"
                onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                placeholder="+91 98480 XXXXX"
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs font-semibold focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Approved">Verified / Received (Mandapam Handover Done)</option>
                <option value="Pending">Pending (Pledged by Devotee)</option>
              </select>
            </div>

            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                  className="w-4 h-4 rounded text-[#7F1D1D] focus:ring-[#7F1D1D]"
                />
                <span>Anonymous Devotee (Keep name confidential)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Storage Location / Remarks</label>
            <textarea
              rows={2}
              value={formData.notes}
              placeholder="e.g., Stored in Mandapam Store Room Rack 2"
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs"
            >
              Register Material & Issue Receipt
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Modal */}
      {editTarget && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Material Record: ${editTarget.receiptId}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Material Name</label>
                <input
                  type="text"
                  required
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as MaterialDonation['category'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Pooja">Pooja</option>
                  <option value="Prasad">Prasad</option>
                  <option value="Mandapam">Mandapam</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Decoration">Decoration</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Unit</label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs font-semibold focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="Approved">Verified / Received</option>
                  <option value="Pending">Pending Handover</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={formData.anonymous}
                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                    className="w-4 h-4 rounded text-[#7F1D1D] focus:ring-[#7F1D1D]"
                  />
                  <span>Anonymous Devotee</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Audit Reason for Update <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={actionReason}
                placeholder="e.g. Adjusted count after physical store verification"
                onChange={(e) => setActionReason(e.target.value)}
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
                disabled={!actionReason.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs disabled:opacity-50"
              >
                Update Material
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
              ? 'Accept & Verify Material Seva'
              : confirmAction.type === 'reject'
              ? 'Decline Material Offering'
              : confirmAction.type === 'delete'
              ? 'Remove Material Record from Ledger'
              : `Confirm ${confirmAction.type.toUpperCase()}`
          }
          message={
            confirmAction.type === 'approve'
              ? `Are you sure you want to accept and verify receipt of material item "${confirmAction.target.materialName}" (${confirmAction.target.quantity} ${confirmAction.target.unit}) from ${confirmAction.target.donorName}? This will verify the inventory for Mandapam use.`
              : confirmAction.type === 'reject'
              ? `Are you sure you want to decline material contribution "${confirmAction.target.materialName}" (${confirmAction.target.quantity} ${confirmAction.target.unit}) from ${confirmAction.target.donorName}? The status will be marked as Declined.`
              : confirmAction.type === 'delete'
              ? `Are you sure you want to permanently remove material contribution "${confirmAction.target.materialName}" (${confirmAction.target.quantity} ${confirmAction.target.unit}) from ${confirmAction.target.donorName}? This will completely delete the record from the ledger.`
              : `Are you sure you want to archive material item "${confirmAction.target.materialName}"?`
          }
          confirmLabel={
            confirmAction.type === 'approve'
              ? 'Yes, Accept & Verify'
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
          reasonPlaceholder="Specify reason for declining material contribution..."
          reasonValue={actionReason}
          onReasonChange={setActionReason}
          onConfirm={handleExecuteConfirm}
          onCancel={() => {
            setConfirmAction(null);
            setActionReason('');
          }}
        />
      )}

      {/* Receipt Modal */}
      {viewReceipt && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setViewReceipt(null)}
          material={viewReceipt}
          receipt={svucStore.getReceiptById(viewReceipt.receiptId) || svucStore.getReceiptById(viewReceipt.id)}
          onApprove={(id) => {
            materialsService.approve(viewReceipt.id);
            refreshList();
            const updated = svucStore.getMaterials().find((m) => m.id === viewReceipt.id);
            setViewReceipt(updated || null);
          }}
          onDecline={(id) => {
            materialsService.reject(viewReceipt.id, 'Declined by Admin/Treasurer from receipt view');
            refreshList();
            const updated = svucStore.getMaterials().find((m) => m.id === viewReceipt.id);
            setViewReceipt(updated || null);
          }}
          onRemove={(id) => {
            materialsService.delete(viewReceipt.id);
            refreshList();
            setViewReceipt(null);
          }}
        />
      )}
    </div>
  );
};
