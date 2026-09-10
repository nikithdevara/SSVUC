import React from 'react';
import {
  Users,
  ShieldCheck,
  Phone,
  Mail,
  Award,
  Heart,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { DevotionalHeaderBadge, TraditionalDiya, MarigoldGarlandDivider } from '../../components/common/CulturalMotifs';

interface CommitteePageProps {
  onNavigate: (route: string) => void;
}

export const CommitteePage: React.FC<CommitteePageProps> = ({ onNavigate }) => {
  const members = svucStore.getCommittee();

  const handleNav = (route: string) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. HERO BANNER */}
      <section className="bg-gradient-to-b from-[#7F1D1D] to-[#450A0A] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#C9972B]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <DevotionalHeaderBadge className="bg-white/10 text-[#FEF08A] border-[#FEF08A]/30" />
          <h1 className="font-['Cinzel',serif] text-3xl sm:text-4xl md:text-5xl font-black text-[#FFFBEB]">
            Utsava Committee Leadership
          </h1>
          <p className="text-sm sm:text-base text-[#FDE68A] font-medium max-w-xl mx-auto">
            Serving Lord Sri Siddhi Vinayaka and the Gandhinagar Anjayya Colony community with devotion, integrity, and
            transparency since 2012.
          </p>
        </div>
      </section>

      {/* 2. COMMITTEE TRANSPARENCY PLEDGE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl p-6 sm:p-8 bg-[#FFF9ED] border-2 border-[#C9972B] shadow-md space-y-4 text-center">
          <div className="flex justify-center">
            <TraditionalDiya size={32} />
          </div>
          <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
            Our Solemn Pledge of Integrity
          </h2>
          <p className="text-xs sm:text-sm text-[#292524]/80 max-w-2xl mx-auto leading-relaxed">
            "Every rupee contributed by a devotee is sacred trust (Deva Dravyam). Our committee commits to zero personal
            gain, daily ledger updates, public display of contractor vouchers, and complete open audits available to every
            resident of Anakapalle."
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#78350F] pt-2">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#C9972B]/30">
              <ShieldCheck className="w-4 h-4 text-[#166534]" /> 100% Volunteer Driven
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#C9972B]/30">
              <Award className="w-4 h-4 text-[#D97706]" /> Registered Community Trust
            </span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#C9972B]/30">
              <Sparkles className="w-4 h-4 text-[#7F1D1D]" /> 14 Years of Unbroken Seva
            </span>
          </div>
        </div>
      </section>

      {/* 3. MEMBERS DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">Executive Body</span>
          <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-bold text-[#7F1D1D]">
            Committee Office Bearers 2026
          </h2>
          <p className="text-xs sm:text-sm text-[#292524]/65">
            Devotees may reach out directly for pooja sponsorships, Annadanam contributions, and volunteer coordination.
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
                  <div className="relative">
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
                    <h3 className="font-bold text-base text-[#292524] leading-tight">{m.name}</h3>
                    <span className="text-xs font-extrabold text-[#7F1D1D] block mt-0.5">{m.role}</span>
                    <span className="text-[11px] text-[#D97706] font-semibold">{m.servingSince}</span>
                  </div>
                </div>

                <p className="text-xs text-[#292524]/80 leading-relaxed bg-[#FFF9ED] p-3 rounded-xl border border-[#C9972B]/20">
                  {m.bio}
                </p>
              </div>

              <div className="pt-3 border-t border-[#C9972B]/20 space-y-1 text-xs">
                <a
                  href={`tel:${m.phoneNumber}`}
                  className="flex items-center gap-2 text-[#78350F] hover:text-[#D97706] font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{m.phoneNumber}</span>
                </a>
                <div className="flex items-center gap-2 text-[#292524]/60">
                  <MapPin className="w-3.5 h-3.5 text-[#7F1D1D]" />
                  <span>Gandhinagar, Anakapalle</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarigoldGarlandDivider />

      {/* 4. VOLUNTEER SEVA WING */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <h3 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
          Join the Utsav Volunteer Seva Force
        </h3>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-lg mx-auto">
          Over 60+ youth and residents assist during Annadanam distribution, crowd management, Laddu auction, and Shobha
          Yatra. Become a seva volunteer today.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => handleNav('/contact')}
            className="px-6 py-3 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] shadow-md flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Register as Volunteer
          </button>
          <button
            onClick={() => handleNav('/donate')}
            className="px-6 py-3 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs sm:text-sm hover:bg-[#FEF3C7]"
          >
            Support the Committee
          </button>
        </div>
      </section>
    </div>
  );
};
