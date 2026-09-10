import React from 'react';
import { Home, Calendar, ArrowRight, HelpCircle, ShieldCheck } from 'lucide-react';
import { SacredGaneshaEmblem, TraditionalDiya, DevotionalHeaderBadge } from '../../components/common/CulturalMotifs';

interface NotFoundPageProps {
  onNavigate: (route: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const handleNav = (route: string) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6 bg-white border-2 border-[#C9972B] rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        {/* Background decorative diya */}
        <div className="flex justify-center">
          <div className="relative">
            <SacredGaneshaEmblem size={72} />
            <div className="absolute -bottom-2 -right-2">
              <TraditionalDiya size={28} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <DevotionalHeaderBadge />
          <span className="text-5xl sm:text-6xl font-black font-['Cinzel',serif] text-[#7F1D1D] block mt-2">
            404
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-['Cinzel',serif] text-[#292524]">
            Looks like this path took a little detour.
          </h1>
          <p className="text-xs sm:text-sm text-[#292524]/70 max-w-sm mx-auto leading-relaxed">
            The festival page or record you are searching for might have moved or the URL may be incorrect.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => handleNav('/')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back Home</span>
          </button>
          <button
            onClick={() => handleNav('/transparency')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FFF9ED] border border-[#C9972B] text-[#78350F] font-bold text-xs sm:text-sm hover:bg-[#FEF3C7] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
            <span>View Transparency & Offerings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
