import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Package,
  FileText,
  DollarSign,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { LordGanesha3D } from '../../components/common/LordGanesha3D';
import {
  DevotionalHeaderBadge,
  TraditionalDiya,
  MarigoldGarlandDivider,
  RangoliCornerAccent,
} from '../../components/common/CulturalMotifs';
import { svucStore } from '../../services/store';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '../../services/firebase/firestoreService';
import { Donation, Expense, EventItem, Announcement } from '../../types';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState(svucStore.getFinancialSummary());
  const [donations, setDonations] = useState<Donation[]>(() =>
    svucStore
      .getDonations()
      .filter((d) => d.status === 'Approved' || d.status === 'Verified')
      .slice(0, 4)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => svucStore.getExpenses().slice(0, 4));
  const [events, setEvents] = useState<EventItem[]>(() => svucStore.getEvents().slice(0, 3));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => svucStore.getAnnouncements().slice(0, 3));

  // Configurable Festival Countdown & Lifecycle State (Section 44)
  const currentSettings = svucStore.getSettings();
  const [festivalState, setFestivalState] = useState<'UPCOMING' | 'UNDERWAY' | 'CONCLUDED'>('UPCOMING');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const settings = svucStore.getSettings();
    const startDateStr = settings.festivalStartDate || '2026-09-14';
    const endDateStr = settings.festivalEndDate || '2026-09-22';
    const targetDate = new Date(`${startDateStr}T08:30:00+05:30`).getTime();
    const endDate = new Date(`${endDateStr}T23:59:59+05:30`).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      if (now > endDate) {
        setFestivalState('CONCLUDED');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else if (now >= targetDate) {
        setFestivalState('UNDERWAY');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setFestivalState('UPCOMING');
        const distance = targetDate - now;
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    // Live Real-Time Cloud Firestore Sync for Home Page
    let unsubDonations: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubEvents: (() => void) | undefined;
    let unsubAnnouncements: (() => void) | undefined;

    if (isFirebaseConfigured() && db) {
      try {
        const donQ = query(collection(db, COLLECTIONS.DONATIONS), orderBy('date', 'desc'));
        unsubDonations = onSnapshot(donQ, (snap) => {
          const allDons = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Donation))
            .filter((d) => d.status === 'Approved' || d.status === 'Verified');
          setDonations(allDons.slice(0, 4));

          // Real-time summary update
          const totalDon = allDons.reduce((sum, d) => sum + (d.amount || 0), 0);
          setSummary((prev) => ({
            ...prev,
            totalDonations: totalDon,
            donationsCount: allDons.length,
            netBalance: totalDon - prev.totalExpenses,
          }));
        }, (err) => console.warn('[Live Home Donations Stream]', err));

        const expQ = query(collection(db, COLLECTIONS.EXPENSES), orderBy('date', 'desc'));
        unsubExpenses = onSnapshot(expQ, (snap) => {
          const allExps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
          setExpenses(allExps.slice(0, 4));

          const totalExp = allExps.reduce((sum, e) => sum + (e.amount || 0), 0);
          setSummary((prev) => ({
            ...prev,
            totalExpenses: totalExp,
            expensesCount: allExps.length,
            netBalance: prev.totalDonations - totalExp,
          }));
        }, (err) => console.warn('[Live Home Expenses Stream]', err));

        const evtQ = query(collection(db, COLLECTIONS.EVENTS), orderBy('dayNumber', 'asc'));
        unsubEvents = onSnapshot(evtQ, (snap) => {
          const allEvts = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as EventItem))
            .filter((e) => e.published !== false);
          setEvents(allEvts.slice(0, 3));
        });

        const annQ = query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('date', 'desc'));
        unsubAnnouncements = onSnapshot(annQ, (snap) => {
          const allAnns = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Announcement))
            .filter((a) => a.published !== false);
          setAnnouncements(allAnns.slice(0, 3));
        });
      } catch (err) {
        console.warn('[Firestore Home Stream Error]', err);
      }
    }

    const updateStore = () => {
      setSummary(svucStore.getFinancialSummary());
      setDonations(
        svucStore
          .getDonations()
          .filter((d) => d.status === 'Approved' || d.status === 'Verified')
          .slice(0, 4)
      );
      setExpenses(svucStore.getExpenses().slice(0, 4));
      setEvents(svucStore.getEvents().slice(0, 3));
      setAnnouncements(svucStore.getAnnouncements().slice(0, 3));
    };

    window.addEventListener('svuc_store_updated', updateStore);
    return () => {
      clearInterval(timer);
      if (unsubDonations) unsubDonations();
      if (unsubExpenses) unsubExpenses();
      if (unsubEvents) unsubEvents();
      if (unsubAnnouncements) unsubAnnouncements();
      window.removeEventListener('svuc_store_updated', updateStore);
    };
  }, []);


  const handleNav = (route: string) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 pb-8 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <RangoliCornerAccent position="tl" className="absolute top-0 left-0" />
        <RangoliCornerAccent position="tr" className="absolute top-0 right-0" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <DevotionalHeaderBadge />

            <div className="space-y-2">
              <h1 className="font-['Cinzel',serif] text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-[#7F1D1D] tracking-tight leading-[1.15]">
                Welcome to Sri Siddhi Vinayaka Utsava Committee
              </h1>
              <p className="text-sm sm:text-base font-bold text-[#D97706] tracking-wide">
                Gandhinagar Anjayya Colony · Anakapalle, Andhra Pradesh
              </p>
            </div>

            <p className="text-base sm:text-lg text-[#292524] font-medium leading-relaxed max-w-2xl">
              "Celebrating faith. Celebrating community. Celebrating together."
            </p>

            <p className="text-xs sm:text-sm text-[#292524]/80 leading-relaxed max-w-xl">
              Join us for the auspicious Ganesh Utsav 2026. Experience daily Vedic rituals, sacred Homams, grand Annadanam,
              cultural performances, and complete financial transparency in every rupee and material seva received.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleNav('/donate')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#7F1D1D] text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>Support the Utsav</span>
              </button>
              <button
                onClick={() => handleNav('/transparency')}
                className="px-6 py-3.5 rounded-xl bg-white border-2 border-[#C9972B] text-[#7F1D1D] font-bold text-sm sm:text-base hover:bg-[#FEF3C7] shadow-xs hover:shadow-md transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-[#166534]" />
                <span>View Transparency</span>
              </button>
              <button
                onClick={() => handleNav('/donations')}
                className="px-4 py-3.5 rounded-xl text-[#78350F] hover:bg-[#D97706]/10 font-semibold text-xs sm:text-sm flex items-center gap-1.5"
              >
                <span>Browse Offerings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#78350F]">
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#C9972B]/30">
                <CheckCircle className="w-4 h-4 text-[#166534]" />
                <span>Verified Digital Receipts</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#C9972B]/30">
                <ShieldCheck className="w-4 h-4 text-[#166534]" />
                <span>100% Audited Expenses</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] px-3 py-1.5 rounded-lg border border-[#C9972B]/30">
                <TraditionalDiya size={18} />
                <span>Eco-Friendly Clay Idol</span>
              </div>
            </div>
          </div>

          {/* Right Hero 3D Lord Ganesha Visual */}
          <div className="lg:col-span-5 flex justify-center pt-4 lg:pt-0">
            <LordGanesha3D />
          </div>
        </div>
      </section>

      {/* 2. FESTIVAL COUNTDOWN & STATUS CARD (Section 44) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white border-2 border-[#C9972B] shadow-2xl relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#D97706]/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#C9972B]/20 blur-2xl" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF08A]/15 border border-[#FEF08A]/30 text-[#FEF08A] text-xs font-bold uppercase tracking-wider">
              <span>🪔</span> Ganesh Utsav {currentSettings.festivalYear || '2026'}
            </div>

            {festivalState === 'CONCLUDED' ? (
              <div className="space-y-3 py-2">
                <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl md:text-3xl font-bold text-[#FFFBEB]">
                  Thank You for Being Part of This Year's Celebration
                </h2>
                <p className="text-xs sm:text-sm text-[#FDE68A]/90 max-w-xl mx-auto leading-relaxed">
                  May Sri Siddhi Vinayaka Swami bestow peace, prosperity, and auspicious blessings upon all devotees, donors, and the Gandhinagar Anjayya Colony community.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => handleNav('/transparency')}
                    className="px-4 py-2 rounded-xl bg-[#FEF08A] text-[#7F1D1D] font-bold text-xs hover:bg-white transition-colors cursor-pointer shadow-sm"
                  >
                    View Final Transparency Accounts
                  </button>
                  <button
                    onClick={() => handleNav('/verify')}
                    className="px-4 py-2 rounded-xl bg-[#450A0A] border border-[#C9972B] text-[#FEF08A] font-bold text-xs hover:bg-[#5C0D0D] transition-colors cursor-pointer"
                  >
                    Verify Receipt
                  </button>
                  <button
                    onClick={() => handleNav('/announcements')}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Official Announcements
                  </button>
                </div>
              </div>
            ) : festivalState === 'UNDERWAY' ? (
              <div className="space-y-3 py-2">
                <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl md:text-3xl font-bold text-[#FFFBEB]">
                  The Sacred Festival is Underway!
                </h2>
                <p className="text-xs sm:text-sm text-[#FDE68A]/90 max-w-xl mx-auto leading-relaxed">
                  Daily Sahasranama poojas, evening aartis, and community Annadanam are actively taking place at {currentSettings.location || 'Gandhinagar Anjayya Colony Mandapam, Anakapalle'}. All devotees are warmly welcome.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => handleNav('/announcements')}
                    className="px-4 py-2 rounded-xl bg-[#FEF08A] text-[#7F1D1D] font-bold text-xs hover:bg-white transition-colors cursor-pointer shadow-sm"
                  >
                    View Official Announcements
                  </button>
                  <button
                    onClick={() => handleNav('/donate')}
                    className="px-4 py-2 rounded-xl bg-[#450A0A] border border-[#C9972B] text-[#FEF08A] font-bold text-xs hover:bg-[#5C0D0D] transition-colors cursor-pointer"
                  >
                    Offer Seva / Annadanam
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl md:text-3xl font-bold text-[#FFFBEB]">
                  Days Until Sri Vighneswara Prathishta
                </h2>
                <p className="text-xs sm:text-sm text-[#FDE68A]/90 max-w-xl mx-auto">
                  {currentSettings.festivalStartDate || '14 September 2026'} · {currentSettings.location || 'Gandhinagar Anjayya Colony Mandapam, Anakapalle'}
                </p>

                {/* Countdown timer grid */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto pt-2">
                  {[
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Minutes', value: timeLeft.minutes },
                    { label: 'Seconds', value: timeLeft.seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 sm:p-4 rounded-2xl bg-[#450A0A]/70 border border-[#C9972B]/40 backdrop-blur-xs flex flex-col items-center"
                    >
                      <span className="font-mono text-2xl sm:text-4xl font-extrabold text-[#FEF08A]">
                        {String(item.value).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#FDE68A]/80 mt-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. QUICK INFORMATION CARDS (4 CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Festival Date */}
          <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D97706]/15 text-[#D97706] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#7F1D1D] block">
              Festival Dates
            </span>
            <h3 className="font-bold text-base text-[#292524]">14 Sep – 22 Sep 2026</h3>
            <p className="text-xs text-[#292524]/70">9 Auspicious Days of Celebrations & Daily Homams</p>
          </div>

          {/* Card 2: Pooja Timing */}
          <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/15 text-[#7F1D1D] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#7F1D1D] block">
              Daily Pooja Timing
            </span>
            <h3 className="font-bold text-base text-[#292524]">6:30 AM & 6:30 PM</h3>
            <p className="text-xs text-[#292524]/70">Nitya Abhishekam, Archana, and Maha Mangala Harathi</p>
          </div>

          {/* Card 3: Today's Program */}
          <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#166534]/15 text-[#166534] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#166534] block">
              Highlight Seva
            </span>
            <h3 className="font-bold text-base text-[#292524]">Maha Annadanam</h3>
            <p className="text-xs text-[#292524]/70">Special satvik feast for 3,000+ devotees on Day 3</p>
          </div>

          {/* Card 4: Location */}
          <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs hover:shadow-md transition-all space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#C9972B]/20 text-[#78350F] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#7F1D1D] block">
              Mandapam Ground
            </span>
            <h3 className="font-bold text-base text-[#292524]">Gandhinagar Colony</h3>
            <p className="text-xs text-[#292524]/70">Anjayya Colony Main Road, Anakapalle</p>
          </div>
        </div>
      </section>

      {/* 4. FINANCIAL SNAPSHOT (CORE HOMEPAGE SECTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#FFFDF7] to-[#FFF9ED] border-2 border-[#C9972B] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9972B]/30 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#166534] uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Live Public Transparency Audit</span>
              </div>
              <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-extrabold text-[#7F1D1D]">
                Financial Snapshot
              </h2>
              <p className="text-xs sm:text-sm text-[#292524]/70">
                "Every contribution matters. Every expense is accounted for."
              </p>
            </div>
            <button
              onClick={() => handleNav('/transparency')}
              className="px-5 py-2.5 rounded-xl bg-[#7F1D1D] text-white text-xs sm:text-sm font-bold hover:bg-[#991B1B] shadow-xs flex items-center gap-2 self-start sm:self-center"
            >
              <span>View Complete Transparency</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Offerings */}
            <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#166534]">
                <span className="text-xs font-bold uppercase tracking-wider">Total Offerings</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#166534]">
                ₹{summary.totalDonations.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#292524]/60">From {summary.totalDonors} verified donors</p>
            </div>

            {/* Material Contributions */}
            <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#D97706]">
                <span className="text-xs font-bold uppercase tracking-wider">Material Seva</span>
                <Package className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#D97706]">
                {summary.materialItemsCount} Items
              </div>
              <p className="text-[11px] text-[#292524]/60">
                Rice, flowers, ghee & pooja samagri ({summary.materialContributorsCount} contributors)
              </p>
            </div>

            {/* Total Expenses */}
            <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#7F1D1D]">
                <span className="text-xs font-bold uppercase tracking-wider">Total Expenses</span>
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#7F1D1D]">
                ₹{summary.totalExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#292524]/60">{summary.expenseCount} audited bills & vouchers</p>
            </div>

            {/* Available Balance */}
            <div className="p-5 rounded-2xl bg-[#FEF3C7] border border-[#C9972B] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#78350F]">
                <span className="text-xs font-bold uppercase tracking-wider">Available Balance</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#78350F]">
                ₹{summary.availableBalance.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-[#78350F]/70">Net monetary funds in committee account</p>
            </div>
          </div>

          <div className="text-[11px] text-[#292524]/60 text-center sm:text-left bg-[#FFF9ED] p-3 rounded-xl border border-[#C9972B]/20">
            * <em>Note:</em> Available balance is strictly computed as <strong>Total Monetary Offerings minus Total Approved Expenses</strong>. Material offerings are itemized separately without arbitrary monetary inflation.
          </div>
        </div>
      </section>

      {/* 5. OFFERINGS & EXPENSE PREVIEWS (2-COLUMN GRID) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Offerings Preview */}
          <div className="p-6 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
              <div>
                <h3 className="font-['Cinzel',serif] text-lg font-bold text-[#7F1D1D]">Recent Offerings</h3>
                <span className="text-xs text-[#292524]/60">Verified contributions received</span>
              </div>
              <button
                onClick={() => handleNav('/donations')}
                className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {donations.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleNav(`/receipt/${d.receiptId}`)}
                  className="p-3 rounded-xl bg-[#FFF9ED] hover:bg-[#FEF3C7] border border-[#C9972B]/20 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-[#292524]">{d.donorName}</div>
                    <div className="text-[11px] text-[#292524]/60">
                      {d.date} · {d.paymentMethod} · {d.receiptId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#166534]">₹{d.amount.toLocaleString('en-IN')}</div>
                    <span className="inline-block text-[10px] font-semibold text-[#166534] bg-[#166534]/10 px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleNav('/donate')}
              className="w-full py-2.5 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold hover:bg-[#991B1B] shadow-xs flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" /> Offer a Contribution
            </button>
          </div>

          {/* Recent Expenses Preview */}
          <div className="p-6 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
              <div>
                <h3 className="font-['Cinzel',serif] text-lg font-bold text-[#7F1D1D]">Recent Expenses</h3>
                <span className="text-xs text-[#292524]/60">Audited festival spending with bills</span>
              </div>
              <button
                onClick={() => handleNav('/expenses')}
                className="text-xs font-bold text-[#D97706] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  onClick={() => handleNav('/expenses')}
                  className="p-3 rounded-xl bg-[#FFF9ED] hover:bg-[#FEF3C7] border border-[#C9972B]/20 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="text-sm font-bold text-[#292524] truncate">{e.expenseName}</div>
                    <div className="text-[11px] text-[#292524]/60">
                      {e.category} · {e.receiptVoucherNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#7F1D1D]">₹{e.amount.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-[#D97706] font-semibold underline">View Voucher</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleNav('/transparency')}
              className="w-full py-2.5 rounded-xl bg-[#FFF9ED] border border-[#C9972B] text-[#78350F] text-xs font-bold hover:bg-[#FEF3C7] shadow-xs flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#166534]" /> Download Audited Financial Report
            </button>
          </div>
        </div>
      </section>

      {/* 6. ANNOUNCEMENTS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#D97706] block">
              Official Bulletins
            </span>
            <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-bold text-[#7F1D1D]">
              Latest Announcements
            </h2>
          </div>
          <button
            onClick={() => handleNav('/announcements')}
            className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1"
          >
            <span>All Updates</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {announcements.map((a) => (
            <div
              key={a.id}
              onClick={() => handleNav(`/announcements/${a.id}`)}
              className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#C9972B]/30 hover:border-[#D97706] shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#D97706]">{a.category}</span>
                  <span className="text-[#292524]/60">{a.date}</span>
                </div>
                <h3 className="font-bold text-sm text-[#292524] line-clamp-2">{a.title}</h3>
                <p className="text-xs text-[#292524]/70 line-clamp-3">{a.content}</p>
              </div>
              <span className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1">
                Read Full Circular &rarr;
              </span>
            </div>
          ))}
        </div>
      </section>

      <MarigoldGarlandDivider />

      {/* 9. FINAL HOME EMOTIONAL CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-[#7F1D1D] to-[#450A0A] text-white border-2 border-[#C9972B] shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex justify-center">
            <TraditionalDiya size={40} />
          </div>

          <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#FFFBEB] leading-tight">
            Be a part of this year's sacred celebration.
          </h2>

          <p className="text-sm sm:text-base text-[#FDE68A]/90 max-w-2xl mx-auto leading-relaxed">
            Your contribution—whether monetary or in materials like rice, flowers, and pooja samagri—helps bring the
            festival traditions, sacred Homams, and community Annadanam feast to life.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleNav('/donate')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706] text-[#78350F] font-black text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Heart className="w-5 h-5 fill-[#78350F]" />
              <span>Donate Now</span>
            </button>
            <button
              onClick={() => handleNav('/materials')}
              className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-[#FEF08A]/40 text-[#FFFBEB] font-bold text-sm sm:text-base transition-all"
            >
              Contribute Materials Seva
            </button>
            <button
              onClick={() => handleNav('/transparency')}
              className="px-6 py-4 rounded-xl bg-transparent hover:bg-black/30 border border-white/20 text-white font-semibold text-sm sm:text-base transition-all"
            >
              View Public Transparency
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
