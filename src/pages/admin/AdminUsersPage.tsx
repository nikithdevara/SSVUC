import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  Edit2,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  Phone,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types';
import { authService } from '../../services/authService';
import { adminUserService } from '../../services/adminService';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTable, Column } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';

interface AdminUsersPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<AdminUser[]>(adminUserService.getAll());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<AdminUser | null>(null);

  const isSuperAdmin = authService.hasRole('SUPER_ADMIN');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'COMMITTEE_ADMIN' as AdminRole,
    phone: '',
    status: 'ACTIVE' as AdminUser['status'],
  });

  const refreshList = () => {
    setUsers(adminUserService.getAll());
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'COMMITTEE_ADMIN',
      phone: '',
      status: 'ACTIVE',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    adminUserService.create({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone,
      status: formData.status,
    });
    setIsAddModalOpen(false);
    refreshList();
  };

  const handleOpenEdit = (u: AdminUser) => {
    setEditTarget(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      status: u.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    adminUserService.update(editTarget.id, {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone,
      status: formData.status,
    });
    const current = authService.getCurrentUser();
    if (current && (current.id === editTarget.id || current.email === editTarget.email)) {
      authService.updateProfile({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        status: formData.status,
      });
    }
    setEditTarget(null);
    refreshList();
  };

  const handleToggleStatus = () => {
    if (!statusToggleTarget) return;
    const newStatus = statusToggleTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    adminUserService.toggleStatus(statusToggleTarget.id, newStatus);
    setStatusToggleTarget(null);
    refreshList();
  };

  const renderRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#7F1D1D] text-white">
            Super Admin
          </span>
        );
      case 'TREASURER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
            Treasurer
          </span>
        );
      case 'COMMITTEE_ADMIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">
            Committee Admin
          </span>
        );
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Committee Member',
      render: (u) => (
        <div>
          <span className="font-bold text-stone-900 text-xs block">{u.name}</span>
          <span className="text-[11px] text-stone-500 flex items-center mt-0.5">
            <Mail className="w-3 h-3 mr-1 text-stone-400" />
            {u.email}
          </span>
          {u.phone && (
            <span className="text-[10px] text-stone-400 flex items-center">
              <Phone className="w-2.5 h-2.5 mr-1 text-stone-400" />
              {u.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (u) => renderRoleBadge(u.role),
    },
    {
      key: 'status',
      header: 'Access Status',
      render: (u) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            u.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-stone-200 text-stone-600'
          }`}
        >
          {u.status === 'ACTIVE' ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" /> Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" /> Deactivated
            </>
          )}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Authentication',
      render: (u) => (
        <span className="text-xs text-stone-500 font-mono">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => {
        if (!isSuperAdmin) return null;
        return (
          <div className="flex items-center justify-end space-x-1.5">
            <button
              onClick={() => handleOpenEdit(u)}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600"
              title="Edit User"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setStatusToggleTarget(u)}
              className={`p-1.5 rounded text-xs font-semibold ${
                u.status === 'ACTIVE'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
              title={u.status === 'ACTIVE' ? 'Deactivate Access' : 'Activate Access'}
            >
              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Committee Users' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Admin Users & Role-Based Access Control"
        subtitle="Manage authorized committee members, treasury signers, and administrative permissions"
        actions={
          isSuperAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Admin User</span>
            </button>
          )
        }
      />

      {!isSuperAdmin && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center">
          <Lock className="w-4 h-4 mr-2 shrink-0 text-amber-700" />
          <span>
            You are viewing this user directory in read-only mode. Modifying permissions or creating new accounts requires the <strong>Super Admin</strong> role.
          </span>
        </div>
      )}

      <AdminTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        currentPage={1}
        totalPages={1}
        pageSize={users.length}
        onPageChange={() => {}}
      />

      {/* Add User Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Authorized Administrator"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              placeholder="e.g. Sri K. Suresh"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                placeholder="suresh@gmail.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                placeholder="+91 94401 XXXXX"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Administrative Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="COMMITTEE_ADMIN">Committee Admin (Content & Public)</option>
                <option value="TREASURER">Treasurer (Donations, Expenses & Reports)</option>
                <option value="SUPER_ADMIN">Super Admin (Unrestricted Oversight)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as AdminUser['status'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="ACTIVE">Active Account</option>
                <option value="INACTIVE">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
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
              Provision Account
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit User Modal */}
      {editTarget && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Administrator: ${editTarget.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="COMMITTEE_ADMIN">Committee Admin</option>
                  <option value="TREASURER">Treasurer</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as AdminUser['status'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-xs"
              >
                Save Permissions
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Confirmation Modal */}
      {statusToggleTarget && (
        <ConfirmationModal
          isOpen={true}
          title={statusToggleTarget.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
          message={`Are you sure you want to ${
            statusToggleTarget.status === 'ACTIVE' ? 'suspend' : 'activate'
          } ${statusToggleTarget.name}'s administrative access?`}
          confirmLabel={statusToggleTarget.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          variant={statusToggleTarget.status === 'ACTIVE' ? 'danger' : 'warning'}
          onConfirm={handleToggleStatus}
          onCancel={() => setStatusToggleTarget(null)}
        />
      )}
    </div>
  );
};
