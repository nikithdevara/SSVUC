import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Tag } from 'lucide-react';
import { Announcement } from '../../types';
import { svucStore } from '../../services/store';
import { announcementsService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';

interface AdminAnnouncementsPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminAnnouncementsPage: React.FC<AdminAnnouncementsPageProps> = ({ onNavigate }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(svucStore.getAnnouncements());
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const currentUser = authService.getCurrentUser();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Pooja' as Announcement['category'],
    priority: 'Normal' as Announcement['priority'],
    content: '',
    author: currentUser?.name || 'Committee Secretariat',
    active: true,
  });

  const refreshList = () => {
    setAnnouncements(svucStore.getAnnouncements());
  };

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => window.removeEventListener('svuc_store_updated', handleUpdate);
  }, []);

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q);
      const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
      return matchesQuery && matchesPriority;
    });
  }, [announcements, searchQuery, priorityFilter]);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'General',
      priority: 'Normal',
      content: '',
      author: currentUser?.name || 'Committee Secretariat',
      active: true,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsService.create(formData);
      setIsAddModalOpen(false);
      refreshList();
      showToast('Announcement published successfully!', 'success');
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      showToast(err?.message || 'Failed to publish announcement', 'error');
    }
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditTarget(item);
    setFormData({
      title: item.title,
      category: item.category,
      priority: item.priority,
      content: item.content,
      author: item.author,
      active: item.active !== false,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await announcementsService.update(editTarget.id, formData);
      setEditTarget(null);
      refreshList();
      showToast('Announcement updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error updating announcement:', err);
      showToast(err?.message || 'Failed to update announcement', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await announcementsService.delete(deleteTarget.id);
      setDeleteTarget(null);
      refreshList();
      showToast('Announcement deleted successfully!', 'info');
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      showToast(err?.message || 'Failed to delete announcement', 'error');
    }
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Announcements' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Public Announcements & Emergency Notices"
        subtitle="Publish festival broadcasts, schedule changes, and devotional circulars"
        actions={
          authService.hasPermission('announcements.create') && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Announcement</span>
            </button>
          )
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search notices by title or keywords..."
        totalResults={filtered.length}
        activeFilterCount={priorityFilter !== 'ALL' ? 1 : 0}
        onClearFilters={() => {
          setPriorityFilter('ALL');
          setSearchQuery('');
        }}
        filters={
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent / Emergency</option>
            <option value="Important">Important</option>
            <option value="Normal">Normal Notice</option>
          </select>
        }
      />

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs transition-all ${
              item.priority === 'Urgent'
                ? 'border-red-300 ring-1 ring-red-100 bg-red-50/20'
                : item.priority === 'Important'
                ? 'border-amber-300'
                : 'border-stone-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    item.priority === 'Urgent'
                      ? 'bg-red-100 text-red-800'
                      : item.priority === 'Important'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {item.priority}
                </span>
                <span className="text-[10px] font-semibold text-stone-500 uppercase">
                  {item.category}
                </span>
                <span className="text-[11px] text-stone-400">• {item.date}</span>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                {authService.hasPermission('announcements.edit') && (
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {authService.hasPermission('announcements.delete') && (
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-base font-bold font-serif text-stone-900 mt-2">{item.title}</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed whitespace-pre-line">
              {item.content}
            </p>

            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span>Author: {item.author}</span>
              <span className="flex items-center text-emerald-700 font-semibold">
                <CheckCircle className="w-3 h-3 mr-1" /> Active on Public Site
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish New Announcement"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              placeholder="e.g. Mahaprasad Timings and Token Counters"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as Announcement['category'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="General">General</option>
                <option value="Pooja">Pooja Schedule</option>
                <option value="Annadanam">Annadanam</option>
                <option value="Cultural">Cultural</option>
                <option value="Visarjan">Visarjan</option>
                <option value="Important">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as Announcement['priority'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Normal">Normal Notice</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent / Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Detailed Content *</label>
            <textarea
              rows={4}
              required
              value={formData.content}
              placeholder="Enter the full text of the devotional announcement..."
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
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
              Broadcast Announcement
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Modal */}
      {editTarget && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Notice: ${editTarget.title}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as Announcement['priority'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Announcement['category'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="General">General</option>
                  <option value="Pooja">Pooja Schedule</option>
                  <option value="Annadanam">Annadanam</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Visarjan">Visarjan</option>
                  <option value="Important">Important</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Content</label>
              <textarea
                rows={4}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
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
                Update Notice
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Announcement"
          message={`Are you sure you want to delete notice "${deleteTarget.title}"? It will be removed immediately from the public noticeboard.`}
          confirmLabel="Delete Notice"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
