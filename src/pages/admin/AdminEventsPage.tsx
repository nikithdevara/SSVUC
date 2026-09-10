import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, MapPin } from 'lucide-react';
import { EventItem } from '../../types';
import { svucStore } from '../../services/store';
import { eventsService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';

interface AdminEventsPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminEventsPage: React.FC<AdminEventsPageProps> = ({ onNavigate, selectedId }) => {
  const [events, setEvents] = useState<EventItem[]>(svucStore.getEvents());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: '2026-09-14',
    time: '09:00 AM - 12:00 PM',
    category: 'Pooja' as EventItem['category'],
    location: 'Main Mandapam, Gandhinagar Anjayya Colony',
    description: '',
    highlights: 'Maha Mangala Harathi, Prasadam Distribution',
  });

  const refreshList = () => {
    setEvents(svucStore.getEvents());
  };

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => window.removeEventListener('svuc_store_updated', handleUpdate);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [events, searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      date: '2026-09-14',
      time: '09:00 AM - 12:00 PM',
      category: 'Pooja',
      location: 'Main Mandapam, Gandhinagar Anjayya Colony',
      description: '',
      highlights: 'Maha Mangala Harathi, Prasadam Distribution',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    eventsService.create({
      title: formData.title,
      dayNumber: 1,
      date: formData.date,
      time: formData.time,
      category: formData.category,
      location: formData.location,
      description: formData.description,
      published: true,
      highlights: formData.highlights.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setIsAddModalOpen(false);
    refreshList();
  };

  const handleOpenEdit = (item: EventItem) => {
    setEditTarget(item);
    setFormData({
      title: item.title,
      date: item.date,
      time: item.time,
      category: item.category,
      location: item.location,
      description: item.description,
      highlights: (item.highlights || []).join(', '),
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    eventsService.update(editTarget.id, {
      title: formData.title,
      date: formData.date,
      time: formData.time,
      category: formData.category,
      location: formData.location,
      description: formData.description,
      highlights: formData.highlights.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setEditTarget(null);
    refreshList();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    eventsService.delete(deleteTarget.id);
    setDeleteTarget(null);
    refreshList();
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Festival Schedule & Events' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Festival Events & Program Schedule"
        subtitle="Manage devotional poojas, cultural programs, and utsav processions"
        actions={
          authService.hasPermission('events.create') && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Festival Event</span>
            </button>
          )
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search events by title, description, or location..."
        totalResults={filteredEvents.length}
        activeFilterCount={categoryFilter !== 'ALL' ? 1 : 0}
        onClearFilters={() => {
          setCategoryFilter('ALL');
          setSearchQuery('');
        }}
        filters={
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
          >
            <option value="ALL">All Categories</option>
            <option value="Pooja">Pooja & Homam</option>
            <option value="Cultural">Cultural & Music</option>
            <option value="Annadanam">Annadanam</option>
            <option value="Procession">Procession (Visarjan)</option>
          </select>
        }
      />

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {event.category}
                </span>
                <div className="flex items-center space-x-1">
                  {authService.hasPermission('events.edit') && (
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {authService.hasPermission('events.delete') && (
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold font-serif text-stone-900 mt-2">{event.title}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{event.description}</p>

              <div className="mt-3 space-y-1 text-xs text-stone-500">
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                  <span>{event.location}</span>
                </div>
              </div>

              {event.highlights && event.highlights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap gap-1">
                  {event.highlights.map((h, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule New Festival Event"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              placeholder="e.g. Maha Ganapathi Homam"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as EventItem['category'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Pooja">Pooja</option>
                <option value="Cultural">Cultural</option>
                <option value="Annadanam">Annadanam</option>
                <option value="Procession">Procession</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Time Schedule *</label>
              <input
                type="text"
                required
                value={formData.time}
                placeholder="09:00 AM - 12:00 PM"
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Highlights (comma separated)</label>
            <input
              type="text"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
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
              Save Event
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Modal */}
      {editTarget && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Edit Event: ${editTarget.title}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Event Title</label>
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
                <label className="block font-semibold text-stone-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as EventItem['category'] })
                  }
                  className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
                >
                  <option value="Pooja">Pooja</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Annadanam">Annadanam</option>
                  <option value="Procession">Procession</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Description</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                Update Event
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Festival Event"
          message={`Are you sure you want to remove "${deleteTarget.title}" from the festival timeline?`}
          confirmLabel="Delete Event"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
