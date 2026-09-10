import React from 'react';
import {
  Users,
  ShieldCheck,
  Award,
  Heart,
  Sparkles,
  MapPin,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import {
  DevotionalHeaderBadge,
  TraditionalDiya,
  MarigoldGarlandDivider,
  SacredGaneshaEmblem,
} from '../../components/common/CulturalMotifs';

interface AboutPageProps {
  onNavigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const members = svucStore.getCommittee();
  const settings = svucStore.getSettings();

  const handleNav = (route: string) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const values = [
    {
      title: 'Faith (Bhakti)',
      desc: 'Deep Vedic devotion to Lord Sri Siddhi Vinayaka, upholding sacred rituals, Homams, and traditional archana.',
      icon: Flame,
      color: 'text-[#D97706]',
      bgColor: 'bg-[#D97706]/10',
    },
    {
      title: 'Unity (Aikyam)',
      desc: 'Bringing together all families of Gandhinagar Anjayya Colony and Anakapalle across ages, backgrounds, and professions.',
      icon: Users,
      color: 'text-[#7F1D1D]',
      bgColor: 'bg-[#7F1D1D]/10',
    },
    {
      title: 'Service (Seva)',
      desc: 'Selfless community service through Maha Annadanam, clean drinking water, eco-friendly idol immersion, and youth volunteerism.',
      icon: Heart,
      color: 'text-[#166534]',
      bgColor: 'bg-[#166534]/10',
    },
    {
      title: 'Tradition (Sampradayam)',
      desc: 'Preserving authentic cultural arts, classical Carnatic concerts, Harikatha narratives, and traditional street rangolis.',
      icon: Sparkles,
      color: 'text-[#C9972B]',
      bgColor: 'bg-[#C9972B]/10',
    },
    {
      title: 'Transparency (Nirmalatha)',
      desc: '100% public accounting: every rupee donated and every vendor bill paid is verifiable in real-time by every devotee.',
      icon: ShieldCheck,
      color: 'text-[#0284C7]',
      bgColor: 'bg-[#0284C7]/10',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-20 pb-20">
      {/* 1. HERO BANNER */}
      <section className="bg-gradient-to-b from-[#7F1D1D] via-[#5B1010] to-[#450A0A] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b-4 border-[#C9972B] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <DevotionalHeaderBadge className="bg-white/10 text-[#FEF08A] border-[#FEF08A]/30" />
          <h1 className="font-['Cinzel',serif] text-3xl sm:text-4xl md:text-5xl font-black text-[#FFFBEB] tracking-tight">
            About Sri Siddhi Vinayaka Utsava Committee
          </h1>
          <p className="text-base sm:text-lg text-[#FDE68A] font-semibold">
            Gandhinagar Anjayya Colony · Anakapalle, Andhra Pradesh
          </p>
          <p className="text-xs sm:text-sm text-[#FFF9ED]/80 max-w-2xl mx-auto leading-relaxed">
            Founded with pure devotional fervor in 2012, our committee unites the neighborhood in sacred worship,
            cultural celebration, community feeding, and unwavering ethical stewardship.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => handleNav('/donate')}
              className="px-6 py-2.5 rounded-xl bg-[#D97706] text-white font-bold text-xs sm:text-sm hover:bg-[#B45309] shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Support the Utsav</span>
            </button>
            <button
              onClick={() => handleNav('/transparency')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-[#FEF08A]/40 text-[#FEF08A] font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Our Transparency Model
            </button>
          </div>
        </div>
      </section>

      {/* 2. OUR STORY & OUR PURPOSE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">Our Origins</span>
              <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-[#7F1D1D]">
                Fourteen Years of Devotional Heritage
              </h2>
            </div>

            <div className="prose text-xs sm:text-sm text-[#292524]/80 space-y-4 leading-relaxed">
              <p>
                In 2012, the elders and residents of Gandhinagar Anjayya Colony in Anakapalle resolved to establish a
                community-led Ganesh Utsav where devotion, cultural authenticity, and financial honesty would walk hand
                in hand.
              </p>
              <p>
                What began as a humble mandapam in the colony square has blossomed over 14 uninterrupted years into one of
                Anakapalle's most cherished devotional landmarks. Every autumn, thousands of devotees congregate for
                sacred morning poojas, Vedic homams, evening cultural recitals, and the massive Annadanam that nourishes
                thousands of pilgrims.
              </p>
              <p>
                As an eco-conscious committee, we were among the earliest in the district to adopt 100% natural clay
                Ganesha idols sculpted by traditional Andhra artisans, shunning toxic chemical paints in reverence to the
                sacred waters of the Sarada River.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 text-center">
                <span className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-[#7F1D1D] block">2012</span>
                <span className="text-[11px] text-[#292524]/65 font-medium">Year Established</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 text-center">
                <span className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-[#D97706] block">10,000+</span>
                <span className="text-[11px] text-[#292524]/65 font-medium">Annual Devotees</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 text-center">
                <span className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-[#166534] block">100%</span>
                <span className="text-[11px] text-[#292524]/65 font-medium">Open Transparency</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#C9972B] shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-[#C9972B]/20 pb-4">
                <SacredGaneshaEmblem size={36} />
                <div>
                  <h3 className="font-['Cinzel',serif] text-lg font-bold text-[#7F1D1D]">Our Sacred Purpose</h3>
                  <span className="text-xs text-[#D97706] font-semibold">Service · Tradition · Community Harmony</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#292524]/80">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#292524] block font-semibold">Vedic Worship & Spiritual Purity</strong>
                    Conducted strictly under the guidance of certified Vedic Ritwiks, ensuring every mantra, homam, and
                    archana follows canonical Agamic traditions.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#292524] block font-semibold">Maha Annadanam (Free Sacred Meals)</strong>
                    Nourishing over 3,000 pilgrims without discrimination of caste, creed, or status with delicious,
                    hygienic satvik prasadam.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#292524] block font-semibold">Eco-Friendly Environmental Stewardship</strong>
                    100% clay murtis, biodegradable areca leaf dining plates, clean drinking water stations, and zero
                    plastic waste guidelines.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#292524] block font-semibold">Youth Empowerment & Community Bonds</strong>
                    Engaging over 60 neighborhood youth in volunteer logistics, stage sound, queue safety, and festival
                    management.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR FIVE CORE VALUES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">Guiding Principles</span>
          <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-[#7F1D1D]">
            Our Foundational Values
          </h2>
          <p className="text-xs sm:text-sm text-[#292524]/70">
            These five sacred pillars govern every decision made by the committee, from priest appointments to ledger
            reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl ${v.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${v.color}`} />
                  </div>
                  <h3 className="font-bold text-sm text-[#292524]">{v.title}</h3>
                  <p className="text-xs text-[#292524]/75 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. TRANSPARENCY PROMISE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-6 sm:p-10 bg-[#FFF9ED] border-3 border-[#C9972B] shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="flex justify-center">
            <TraditionalDiya size={36} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">Deva Dravyam Pledge</span>
            <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-black text-[#7F1D1D]">
              Our Transparency Promise
            </h2>
          </div>

          <p className="text-xs sm:text-base text-[#292524]/85 max-w-2xl mx-auto leading-relaxed font-medium">
            "The funds and provisions contributed by devotees are sacred (Deva Dravyam). Sri Siddhi Vinayaka Utsava
            Committee operates with zero personal remuneration. Every rupee of monetary donation and every item of
            material seva is recorded in a live, public registry. Approved vendor bills are photographed, audited, and
            open to every resident of Anakapalle."
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleNav('/transparency')}
              className="px-6 py-3 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] shadow-md flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
              <span>Explore Complete Balance Sheet</span>
            </button>
            <button
              onClick={() => handleNav('/donations')}
              className="px-6 py-3 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs sm:text-sm hover:bg-[#FEF3C7] shadow-2xs cursor-pointer"
            >
              View Public Donations Registry
            </button>
          </div>
        </div>
      </section>

      {/* 5. COMMITTEE LEADERSHIP DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">Our Leadership</span>
          <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-bold text-[#7F1D1D]">
            Committee Office Bearers 2026
          </h2>
          <p className="text-xs sm:text-sm text-[#292524]/65 max-w-xl mx-auto">
            Experienced elders and community volunteers stewarding the festival arrangements with commitment and
            humility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-6 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={m.photoUrl}
                      alt={m.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C9972B]"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#166534] border-2 border-white flex items-center justify-center">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#292524]">{m.name}</h3>
                    <p className="text-xs font-bold text-[#7F1D1D]">{m.role}</p>
                    <span className="text-[11px] text-[#292524]/60 block">{m.servingSince}</span>
                  </div>
                </div>

                <p className="text-xs text-[#292524]/75 leading-relaxed">{m.bio}</p>
              </div>

              <div className="pt-3 border-t border-[#C9972B]/20 flex items-center justify-between text-xs">
                <span className="text-[#292524]/60 text-[11px]">Direct Contact:</span>
                <a
                  href={`tel:${m.phoneNumber.replace(/ /g, '')}`}
                  className="font-mono font-bold text-[#166534] hover:underline"
                >
                  {m.phoneNumber}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FINAL COMMUNITY CALLOUT */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#D97706]/15 via-[#FEF3C7] to-[#7F1D1D]/15 border border-[#C9972B]/40 space-y-4">
          <h3 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
            Join Our Volunteer Family
          </h3>
          <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto leading-relaxed">
            Whether through assisting in floral alankarams, distributing water to queue lines, or contributing raw food
            materials for Annadanam, every helping hand is blessed by Lord Vighneswara.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleNav('/contact')}
              className="px-6 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Reach the Committee</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
