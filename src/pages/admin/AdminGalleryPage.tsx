import React, { useState, useEffect } from 'react';
import { Image, Plus, Trash2, Edit2, Upload, Eye } from 'lucide-react';
import { GalleryItem } from '../../types';
import { svucStore } from '../../services/store';
import { galleryService } from '../../services/adminService';
import { authService } from '../../services/authService';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { useToast } from '../../components/common/Toast';

interface AdminGalleryPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminGalleryPage: React.FC<AdminGalleryPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>(svucStore.getGallery());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Mandapam' as GalleryItem['category'],
    imageUrl: '',
    description: '',
    year: '2026',
  });

  const refreshList = () => {
    setItems(svucStore.getGallery());
  };

  useEffect(() => {
    setItems(svucStore.getGallery());

    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      try {
        unsub = onSnapshot(collection(db, 'gallery'), (snapshot) => {
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
          live.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setItems(live);
        });
      } catch (err) {
        console.warn('[Gallery snapshot listener error]', err);
      }
    }

    const handleUpdate = () => refreshList();
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => {
      if (unsub) unsub();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  const filtered = items.filter(
    (item) => categoryFilter === 'ALL' || item.category === categoryFilter
  );

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      category: 'Mandapam',
      imageUrl: 'https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?w=800&auto=format&fit=crop&q=80',
      description: '',
      year: '2026',
    });
    setIsAddModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const dataUrl = await galleryService.uploadImage(e.target.files[0]);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    }
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a photo title', 'error');
      return;
    }
    if (!formData.imageUrl.trim()) {
      showToast('Please enter an image URL or upload an image', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await galleryService.create(formData);
      if (res?.item) {
        setItems((prev) => [res.item, ...prev.filter((i) => i.id !== res.item.id)]);
      }
      setIsAddModalOpen(false);
      showToast('Media item added to gallery!', 'success');
    } catch (err: any) {
      console.error('Error adding gallery item:', err);
      showToast(err?.message || 'Failed to add media item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditTarget(item);
    setFormData({
      title: item.title,
      category: item.category,
      imageUrl: item.imageUrl,
      description: item.description,
      year: item.year,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await galleryService.update(editTarget.id, formData);
      setEditTarget(null);
      refreshList();
      showToast('Gallery item updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error updating gallery item:', err);
      showToast(err?.message || 'Failed to update gallery item', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await galleryService.delete(deleteTarget.id);
      setDeleteTarget(null);
      refreshList();
      showToast('Gallery item removed!', 'info');
    } catch (err: any) {
      console.error('Error deleting gallery item:', err);
      showToast(err?.message || 'Failed to delete gallery item', 'error');
    }
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Media Gallery' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Festival Media Gallery"
        subtitle="Manage photo archives of Mandapam, pooja rituals, Annadanam, and processions"
        actions={
          authService.hasPermission('gallery.create') && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] text-white transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
          )
        }
      />

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {['ALL', 'Mandapam', 'Pooja', 'Cultural', 'Annadanam', 'Visarjan'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === cat
                ? 'bg-[#7F1D1D] text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat === 'ALL' ? 'All Photographs' : cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-shadow flex flex-col"
          >
            <div className="relative aspect-video bg-stone-100 overflow-hidden group">
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                {item.category} • {item.year}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold font-serif text-stone-900 leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[10px]">ID: {item.id}</span>
                <div className="flex items-center space-x-1">
                  {authService.hasPermission('gallery.edit') && (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {authService.hasPermission('gallery.delete') && (
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1 rounded text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Gallery Photo"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Photo Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              placeholder="Enter photo title"
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
                  setFormData({ ...formData, category: e.target.value as GalleryItem['category'] })
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden bg-white"
              >
                <option value="Mandapam">Mandapam</option>
                <option value="Pooja">Pooja</option>
                <option value="Cultural">Cultural</option>
                <option value="Annadanam">Annadanam</option>
                <option value="Visarjan">Visarjan</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Year</label>
              <input
                type="text"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Image URL *</label>
            <input
              type="url"
              required
              value={formData.imageUrl}
              placeholder="Enter image URL (https://...)"
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-[#7F1D1D] outline-hidden mb-2"
            />

            <label className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-stone-300 hover:border-stone-400 cursor-pointer text-stone-500 bg-stone-50">
              <Upload className="w-4 h-4 mr-2" />
              <span>Or click to upload local photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {formData.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-stone-200 aspect-video max-h-48 bg-stone-100">
              <img
                src={formData.imageUrl}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              placeholder="Enter photo description or notes..."
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7F1D1D] hover:bg-[#991B1B] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs"
            >
              {isSubmitting ? 'Adding Photo...' : 'Add to Gallery'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Gallery Photo"
          message={`Are you sure you want to remove "${deleteTarget.title}" from the public gallery?`}
          confirmLabel="Delete Photo"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
