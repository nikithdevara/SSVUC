import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  X,
  Calendar,
  Tag,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { GalleryItem } from '../../types';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { DevotionalHeaderBadge, TraditionalDiya } from '../../components/common/CulturalMotifs';
import { ShareButton } from '../../components/common/ShareButton';

interface GalleryPageProps {
  onNavigate: (route: string) => void;
}

const CATEGORIES = ['All', 'Festival', 'Ganesh Idol', 'Pooja', 'Cultural', 'Community', 'Visarjan'];

export const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
  const [images, setImages] = useState<GalleryItem[]>(svucStore.getGallery());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      unsub = onSnapshot(
        collection(db, 'gallery'),
        (snapshot) => {
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
          setImages(live.filter((g) => g.published !== false));
        },
        (err) => console.warn('[Live Gallery Firestore Stream Error]', err)
      );
    }

    const handleUpdate = () => {
      const list = svucStore.getGallery().filter((g) => g.published !== false);
      setImages(list);
    };
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => {
      if (unsub) unsub();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  const filtered = images.filter((img) => {
    if (selectedCategory === 'All') return true;
    return img.category.toLowerCase() === selectedCategory.toLowerCase();
  });


  const activeImage = activeImageIndex !== null ? filtered[activeImageIndex] : null;

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;

      if (e.key === 'Escape') {
        setActiveImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev !== null && prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filtered.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, filtered.length]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev !== null && prev < filtered.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filtered.length - 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
          Festival Gallery & Sacred Memories
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto">
          Sacred darshans of Lord Sri Siddhi Vinayaka, Annadanam seva, children's cultural programs, and Sarada River
          Visarjan processions at Gandhinagar Anjayya Colony, Anakapalle.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveImageIndex(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7F1D1D] text-white shadow-xs'
                  : 'bg-white border border-[#C9972B]/40 text-[#78350F] hover:bg-[#FEF3C7]'
              }`}
            >
              {cat === 'All' ? 'All Memories' : cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filtered.map((img, idx) => (
          <div
            key={img.id}
            onClick={() => setActiveImageIndex(idx)}
            className="group relative rounded-3xl overflow-hidden bg-white border border-[#C9972B]/30 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
              <img
                src={img.imageUrl}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>
              <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7F1D1D] text-white shadow-xs">
                {img.category}
              </span>
            </div>

            <div className="p-4 space-y-1">
              <h3 className="font-bold text-xs sm:text-sm text-[#292524] truncate group-hover:text-[#7F1D1D] transition-colors">
                {img.title}
              </h3>
              <p className="text-[11px] text-[#292524]/65 line-clamp-1">{img.caption}</p>
              <div className="text-[10px] text-[#D97706] font-semibold pt-1">Festival {img.year}</div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#C9972B]/30 space-y-2">
          <Camera className="w-8 h-8 text-[#C9972B] mx-auto opacity-50" />
          <h3 className="font-bold text-base text-[#292524]">No photos in this category yet</h3>
          <p className="text-xs text-[#292524]/60">Select "All Memories" to view the full festival collection.</p>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && activeImageIndex !== null && (
        <div
          onClick={() => setActiveImageIndex(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6 md:p-8">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full my-auto bg-[#FFF9ED] border-2 border-[#C9972B] rounded-3xl overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col"
            >
            {/* Top Toolbar */}
            <div className="p-4 bg-[#292524] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D97706] text-white">
                  {activeImage.category}
                </span>
                <span className="text-xs text-white/70">
                  Photo {activeImageIndex + 1} of {filtered.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShareButton
                  title={activeImage.title}
                  text={`${activeImage.title} - Ganesh Utsav Gallery, Anakapalle`}
                  url={activeImage.imageUrl}
                  variant="outline"
                  size="sm"
                />
                <button
                  onClick={() => setActiveImageIndex(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image Stage with Nav arrows */}
            <div className="relative aspect-16/10 sm:aspect-16/9 bg-black flex items-center justify-center overflow-hidden flex-1">
              <img
                src={activeImage.imageUrl}
                alt={activeImage.title}
                className="max-h-full max-w-full object-contain"
              />

              {/* Prev Button */}
              {filtered.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white cursor-pointer transition-all"
                  title="Previous (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {filtered.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white cursor-pointer transition-all"
                  title="Next (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Caption & Metadata Footer */}
            <div className="p-5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-['Cinzel',serif] text-base sm:text-xl font-bold text-[#7F1D1D]">
                  {activeImage.title}
                </h2>
                <span className="text-xs font-semibold text-[#78350F]">Festival {activeImage.year}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#292524]/80 leading-relaxed">{activeImage.caption}</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
