import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Tag,
  Search,
  CheckCircle,
  FileText,
  ArrowLeft,
  Printer,
  ChevronRight,
  Pin,
  Sparkles,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { Announcement } from '../../types';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { DevotionalHeaderBadge, TraditionalDiya } from '../../components/common/CulturalMotifs';
import { ShareButton } from '../../components/common/ShareButton';

interface AnnouncementsPageProps {
  initialId?: string;
  onNavigate: (route: string) => void;
}

const CATEGORIES = ['All', 'Festival', 'Pooja', 'Event', 'Important', 'Community'];

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ initialId, onNavigate }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(svucStore.getAnnouncements());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(
    initialId ? svucStore.getAnnouncementById(initialId) || null : null
  );

  useEffect(() => {
    if (isFirebaseConfigured() && db) {
      const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
        setAnnouncements(live.filter((a) => a.published !== false));
      });
      return () => unsub();
    } else {
      const handleUpdate = () => setAnnouncements(svucStore.getAnnouncements());
      window.addEventListener('svuc_store_updated', handleUpdate);
      return () => window.removeEventListener('svuc_store_updated', handleUpdate);
    }
  }, []);

  useEffect(() => {
    if (initialId) {
      const found = announcements.find((a) => a.id === initialId) || svucStore.getAnnouncementById(initialId);
      if (found) setActiveAnnouncement(found);
    }
  }, [initialId, announcements]);


  const filtered = announcements.filter((a) => {
    const matchesCategory =
      selectedCategory === 'All' || a.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pinnedAnnouncements = filtered.filter((a) => a.pinned);
  const otherAnnouncements = filtered.filter((a) => !a.pinned);

  // Related announcements in detail view
  const relatedAnnouncements = activeAnnouncement
    ? announcements.filter((a) => a.id !== activeAnnouncement.id && a.category === activeAnnouncement.category).slice(0, 2)
    : [];

  const handleSelectAnnouncement = (a: Announcement) => {
    setActiveAnnouncement(a);
    onNavigate(`/announcements/${a.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveAnnouncement(null);
    onNavigate('/announcements');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
          Announcements
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto">
          Important updates and notices regarding Ganesh Utsav 2026 from Sri Siddhi Vinayaka Utsava Committee,
          Gandhinagar Anjayya Colony, Anakapalle.
        </p>
      </div>

      {/* DETAIL VIEW */}
      {activeAnnouncement ? (
        <div className="bg-white border-2 border-[#C9972B] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9972B]/20 pb-4">
            <button
              onClick={handleBackToList}
              className="px-4 py-2 rounded-xl bg-[#FFF9ED] border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] flex items-center gap-1.5 cursor-pointer self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Announcements</span>
            </button>

            <div className="flex items-center gap-2">
              <ShareButton
                title={activeAnnouncement.title}
                text={`${activeAnnouncement.title} - Sri Siddhi Vinayaka Utsava Committee`}
                url={window.location.origin + `/announcements/${activeAnnouncement.id}`}
              />
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold hover:bg-[#991B1B] flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Notice</span>
              </button>
            </div>
          </div>

          {/* Hero image for announcement */}
          <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-[#7F1D1D] to-[#D97706] relative flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 text-center text-white space-y-2 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[#FEF08A] text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                {activeAnnouncement.category} Circular
              </span>
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-white leading-tight">
                {activeAnnouncement.title}
              </h2>
              <span className="text-xs text-white/80 block">{activeAnnouncement.date}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#292524]/60 border-b border-[#C9972B]/15 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D97706]" />
                <span>Published on {activeAnnouncement.date}</span>
              </div>
              {activeAnnouncement.author && (
                <span className="font-medium text-[#78350F]">Issued by: {activeAnnouncement.author}</span>
              )}
            </div>

            <div className="prose text-xs sm:text-sm text-[#292524]/90 leading-relaxed whitespace-pre-line py-2">
              {activeAnnouncement.content}
            </div>

            {/* Official Certification Stamp */}
            <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#166534] font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Official Committee Authenticated Circular</span>
              </div>
              <div className="text-left sm:text-right text-[#78350F]">
                <strong className="block">Sri Siddhi Vinayaka Utsava Committee</strong>
                <span className="text-[11px] text-[#292524]/65">Gandhinagar Anjayya Colony, Anakapalle</span>
              </div>
            </div>
          </div>

          {/* Related Announcements */}
          {relatedAnnouncements.length > 0 && (
            <div className="pt-6 border-t border-[#C9972B]/20 space-y-3">
              <h3 className="font-['Cinzel',serif] text-sm font-bold text-[#7F1D1D]">
                Related {activeAnnouncement.category} Notices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedAnnouncements.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => handleSelectAnnouncement(rel)}
                    className="p-3.5 rounded-2xl bg-[#FFFDF7] border border-[#C9972B]/30 hover:border-[#D97706] cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-[10px] text-[#292524]/60 block">{rel.date}</span>
                    <h4 className="font-bold text-xs text-[#292524] line-clamp-1">{rel.title}</h4>
                    <p className="text-[11px] text-[#292524]/70 line-clamp-2">{rel.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-6">
          {/* Category Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#7F1D1D] text-white shadow-xs'
                      : 'bg-[#FFF9ED] border border-[#C9972B]/30 text-[#78350F] hover:bg-[#FEF3C7]'
                  }`}
                >
                  {cat === 'All' ? 'All Notices' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D97706]" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#C9972B]/40 outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>
          </div>

          {/* PINNED ANNOUNCEMENTS SECTION */}
          {pinnedAnnouncements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7F1D1D] uppercase tracking-wider">
                <Pin className="w-3.5 h-3.5 text-[#D97706] rotate-45" />
                <span>Pinned Bulletins</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleSelectAnnouncement(a)}
                    className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#FFF9ED] via-white to-[#FEF3C7]/40 border-2 border-[#D97706] hover:shadow-lg transition-all cursor-pointer space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D97706] text-white flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#7F1D1D]/10 text-[#7F1D1D]">
                          {a.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#292524]/60">{a.date}</span>
                    </div>

                    <h3 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#292524] hover:text-[#7F1D1D] transition-colors leading-snug">
                      {a.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#292524]/75 line-clamp-2 leading-relaxed">
                      {a.content}
                    </p>

                    <div className="pt-2 border-t border-[#C9972B]/20 flex items-center justify-between text-xs">
                      <span className="text-[#166534] font-medium text-[11px]">Official Bulletin</span>
                      <span className="font-bold text-[#7F1D1D] flex items-center gap-1">
                        Read Full Circular <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL / REMAINING ANNOUNCEMENTS */}
          <div className="space-y-3">
            {pinnedAnnouncements.length > 0 && otherAnnouncements.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#292524]/60 uppercase tracking-wider pt-2">
                <Bell className="w-3.5 h-3.5 text-[#D97706]" />
                <span>General Notices</span>
              </div>
            )}

            <div className="space-y-3">
              {otherAnnouncements.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleSelectAnnouncement(a)}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-[#C9972B]/30 hover:border-[#D97706] shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D97706]/15 text-[#78350F]">
                        {a.category}
                      </span>
                      <span className="text-[#292524]/60">{a.date}</span>
                    </div>
                    <span className="text-xs font-bold text-[#7F1D1D] flex items-center gap-1 hover:underline">
                      Read Circular <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <h3 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#292524] hover:text-[#7F1D1D] transition-colors">
                    {a.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#292524]/75 line-clamp-2 leading-relaxed">
                    {a.content}
                  </p>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-12 rounded-3xl bg-white border border-[#C9972B]/30 text-center space-y-2">
                  <Bell className="w-8 h-8 text-[#C9972B] mx-auto opacity-50" />
                  <h4 className="font-bold text-base text-[#292524]">No announcements match your search</h4>
                  <p className="text-xs text-[#292524]/60">
                    Try selecting "All Notices" or clearing the search bar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
