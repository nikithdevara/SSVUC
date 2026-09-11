import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  Music,
  Utensils,
  Flame,
  CheckCircle,
  Share2,
} from 'lucide-react';
import { DevotionalHeaderBadge, TraditionalDiya, MarigoldGarlandDivider } from '../../components/common/CulturalMotifs';
import { svucStore } from '../../services/store';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { EventItem } from '../../types';

interface UtsavPageProps {
  onNavigate: (route: string) => void;
}

export const UtsavPage: React.FC<UtsavPageProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<EventItem[]>(svucStore.getEvents());

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      unsub = onSnapshot(
        collection(db, 'events'),
        (snapshot) => {
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
          live.sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
          setEvents(live.filter((e) => e.published !== false));
        },
        (err) => console.warn('[Live Events Firestore Stream Error]', err)
      );
    }

    const handleUpdate = () => {
      const list = svucStore.getEvents().filter((e) => e.published !== false);
      list.sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0));
      setEvents(list);
    };
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => {
      if (unsub) unsub();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  const handleNav = (route: string) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. HERO BANNER */}
      <section className="bg-gradient-to-b from-[#7F1D1D] to-[#450A0A] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#C9972B]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <DevotionalHeaderBadge className="bg-white/10 text-[#FEF08A] border-[#FEF08A]/30" />
          <h1 className="font-['Cinzel',serif] text-3xl sm:text-4xl md:text-5xl font-black text-[#FFFBEB] tracking-tight">
            Ganesh Utsav 2026 Celebrations
          </h1>
          <p className="text-base sm:text-lg text-[#FDE68A] font-semibold">
            14 September to 22 September 2026 · 9 Auspicious Days
          </p>
          <p className="text-xs sm:text-sm text-[#FFF9ED]/80 max-w-2xl mx-auto leading-relaxed">
            Experience the divine presence of Lord Sri Siddhi Vinayaka at Gandhinagar Anjayya Colony, Anakapalle.
            Immerse in daily Vedic chanting, sacred Homams, community Annadanam, and cultural devotion.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => handleNav('/donate')}
              className="px-6 py-2.5 rounded-xl bg-[#D97706] text-white font-bold text-xs sm:text-sm hover:bg-[#B45309] shadow-md flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 fill-white" /> Offer Seva
            </button>
            <button
              onClick={() => handleNav('/transparency')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-[#FEF08A]/40 text-[#FEF08A] font-semibold text-xs sm:text-sm"
            >
              Financial Transparency
            </button>
          </div>
        </div>
      </section>

      {/* 2. DAILY POOJA TIMINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-6 sm:p-8 bg-white border border-[#C9972B]/30 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C9972B]/20 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">Nitya Sevas</span>
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
                Daily Sacred Pooja Timings
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#166534] font-semibold bg-[#166534]/10 px-3 py-1.5 rounded-full self-start sm:self-center">
              <CheckCircle className="w-3.5 h-3.5" /> All Devotees Cordially Invited
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/20 space-y-2">
              <div className="flex items-center justify-between text-[#7F1D1D]">
                <span className="font-bold text-sm">Morning Seva</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-extrabold text-[#D97706]">06:30 AM – 08:00 AM</div>
              <p className="text-xs text-[#292524]/75 leading-relaxed">
                Suprabhatam, Panchamrutha Abhishekam, Alankaram, and Veda Parayanam.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/20 space-y-2">
              <div className="flex items-center justify-between text-[#7F1D1D]">
                <span className="font-bold text-sm">Noon Maha Harathi</span>
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-xl font-extrabold text-[#D97706]">11:30 AM – 12:30 PM</div>
              <p className="text-xs text-[#292524]/75 leading-relaxed">
                Ganapathi Sahasranama Archana, Nivedana, Maha Mangala Harathi & Teertha Prasada Vitharana.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/20 space-y-2">
              <div className="flex items-center justify-between text-[#7F1D1D]">
                <span className="font-bold text-sm">Evening Deepotsavam</span>
                <TraditionalDiya size={20} />
              </div>
              <div className="text-xl font-extrabold text-[#D97706]">06:30 PM – 09:30 PM</div>
              <p className="text-xs text-[#292524]/75 leading-relaxed">
                Sandhya Harathi, Laksha Deeparadhana, Bhajans, and Classical Cultural Programs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPLETE 9-DAY FESTIVAL TIMELINE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">
            Sacred Day-by-Day Journey
          </span>
          <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#7F1D1D]">
            Festival Timeline & Program Schedule
          </h2>
          <p className="text-xs sm:text-sm text-[#292524]/70 max-w-xl mx-auto">
            Each day brings a special homam, spiritual discourse, cultural expression, and prasadam for our colony and
            Anakapalle town.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative border-l-2 border-[#C9972B]/50 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-8">
          {events.map((ev) => (
            <div key={ev.id} className="relative group">
              {/* Day Marker Dot on line */}
              <div className="absolute -left-[35px] sm:-left-[51px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7F1D1D] border-2 border-[#FEF08A] text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-md group-hover:scale-110 transition-transform">
                {ev.dayNumber}
              </div>

              {/* Event Card */}
              <div
                className={`p-6 rounded-3xl bg-white border transition-all ${
                  ev.highlight
                    ? 'border-[#D97706] shadow-lg bg-gradient-to-r from-white to-[#FEF3C7]/30'
                    : 'border-[#C9972B]/30 shadow-md hover:shadow-lg'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#7F1D1D] text-white">
                      DAY {ev.dayNumber}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#D97706]/15 text-[#78350F]">
                      {ev.category}
                    </span>
                    {ev.highlight && (
                      <span className="text-xs font-bold text-[#166534] bg-[#166534]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Grand Highlight
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#7F1D1D] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#D97706]" /> {ev.date}
                  </span>
                </div>

                <h3 className="font-['Cinzel',serif] text-lg sm:text-xl font-bold text-[#292524] mb-2">
                  {ev.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#292524]/80 leading-relaxed mb-4">{ev.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#C9972B]/20 text-xs text-[#292524]/70">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D97706]" />
                    <span className="font-semibold">{ev.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#7F1D1D]" />
                    <span>{ev.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PILLARS OF CELEBRATION (ANNADANAM, CULTURAL, VISARJAN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-bold text-[#7F1D1D] text-center">
          Pillars of the Celebration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Annadanam */}
          <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#C9972B]/30 shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#166534]/15 text-[#166534] flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#292524]">Maha Annadanam Seva</h3>
            <p className="text-xs text-[#292524]/75 leading-relaxed">
              Feeding devotees is considered the highest form of worship. On Day 3 and throughout the festival, wholesome
              satvik meals, Bellam Payasam, and hot prasadam are distributed to all.
            </p>
            <button
              onClick={() => handleNav('/materials')}
              className="text-xs font-bold text-[#166534] hover:underline flex items-center gap-1 pt-1"
            >
              Contribute Rice & Groceries &rarr;
            </button>
          </div>

          {/* Cultural & Sangeeth */}
          <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#C9972B]/30 shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7F1D1D]/15 text-[#7F1D1D] flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#292524]">Cultural & Devotional Stage</h3>
            <p className="text-xs text-[#292524]/75 leading-relaxed">
              Featuring children's fancy dress, Sanskrit sloka recitations, Harikatha, Carnatic sangeeth, Kolatam, and
              traditional folk performances by local Anakapalle artists.
            </p>
            <button
              onClick={() => handleNav('/announcements')}
              className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1 pt-1"
            >
              View Cultural Bulletins &rarr;
            </button>
          </div>

          {/* Shobha Yatra & Visarjan */}
          <div className="p-6 rounded-3xl bg-[#FFFDF7] border border-[#C9972B]/30 shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706]/15 text-[#D97706] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#292524]">Sarada River Visarjan</h3>
            <p className="text-xs text-[#292524]/75 leading-relaxed">
              On the final 9th day, the grand Shobha Yatra moves through Anakapalle main roads to Sarada River Ghat.
              Our 14ft idol is 100% natural clay, safeguarding our sacred waters.
            </p>
            <button
              onClick={() => handleNav('/contact')}
              className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1 pt-1"
            >
              View Procession Route &rarr;
            </button>
          </div>
        </div>
      </section>

      <MarigoldGarlandDivider />

      {/* 5. CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <h3 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
          Support the Sacred Rituals
        </h3>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-lg mx-auto">
          You can sponsor a day's pooja, Annadanam, or homam. All contributions receive an official verified receipt and
          are visible in our transparency statement.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => handleNav('/donate')}
            className="px-6 py-3 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] shadow-md flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 fill-white" /> Sponsor Pooja / Donate
          </button>
          <button
            onClick={() => handleNav('/materials')}
            className="px-6 py-3 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs sm:text-sm hover:bg-[#FEF3C7]"
          >
            Contribute Materials
          </button>
        </div>
      </section>
    </div>
  );
};
