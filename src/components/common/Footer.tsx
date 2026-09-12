import React from 'react';
import { Heart, MapPin, Phone, Mail, ShieldCheck, ExternalLink } from 'lucide-react';
import { SacredGaneshaEmblem, TraditionalDiya } from './CulturalMotifs';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (route: string) => {
    onNavigate(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#292524] text-[#FFF9ED] border-t-4 border-[#C9972B] relative overflow-hidden">
      {/* Decorative top pattern */}
      <div className="h-1 bg-gradient-to-r from-[#D97706] via-[#FEF08A] to-[#D97706]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SacredGaneshaEmblem size={44} />
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#F59E0B] font-bold block">
                  Ganesh Utsav 2026
                </span>
                <h3 className="font-['Cinzel',serif] text-base font-bold text-[#FEF08A] leading-tight">
                  Sri Siddhi Vinayaka
                </h3>
                <span className="text-xs text-[#FFF9ED]/75 block">Utsava Committee</span>
              </div>
            </div>

            <p className="text-xs text-[#FFF9ED]/80 leading-relaxed">
              "A sacred tradition, managed with modern transparency." Connecting devotees across Anakapalle to celebrate
              faith, community, and service with complete financial accountability.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#FEF08A] bg-[#7F1D1D]/40 p-2.5 rounded-xl border border-[#C9972B]/30">
              <TraditionalDiya size={22} />
              <span className="font-medium">Faith · Community · Transparency</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FEF08A] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Utsav Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { name: 'Offerings Transparency', route: '/donations' },
                { name: 'Material Contributions', route: '/materials' },
                { name: 'Festival Expenses', route: '/expenses' },
                { name: 'Full Financial Dashboard', route: '/transparency' },
                { name: 'Latest Announcements', route: '/announcements' },
                { name: 'Mandapam & Contact', route: '/contact' },
              ].map((item) => (
                <li key={item.route}>
                  <button
                    onClick={() => handleNav(item.route)}
                    className="text-[#FFF9ED]/80 hover:text-[#F59E0B] transition-colors flex items-center gap-1.5"
                  >
                    <span>›</span> {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Transparency */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FEF08A] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" /> Verification & Trust
            </h4>
            <div className="space-y-3 text-xs text-[#FFF9ED]/80">
              <p>
                Every monetary and material offering is logged and assigned a cryptographically unique receipt code for
                public verification.
              </p>
              <button
                onClick={() => handleNav('/donations')}
                className="w-full text-left p-2.5 rounded-xl bg-[#166534]/25 border border-[#166534] text-[#86EFAC] font-semibold flex items-center justify-between hover:bg-[#166534]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
                  <span>Verify Any Receipt</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNav('/donate')}
                className="w-full p-2.5 rounded-xl bg-[#D97706] text-white font-bold text-center hover:bg-[#B45309] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Support Ganesh Utsav 2026</span>
              </button>
            </div>
          </div>

          {/* Location & Committee Info */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#FEF08A] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Mandapam Location
            </h4>
            <div className="space-y-2.5 text-xs text-[#FFF9ED]/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Gandhinagar Anjayya Colony</strong>
                  <span>Main Mandapam Ground, Anakapalle, Andhra Pradesh — 531001</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>+91 63051 92846 / +91 63051 92846</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>saisanthosha09@gmail.com</span>
              </div>
              <div className="pt-2 border-t border-[#FFF9ED]/10 flex items-center gap-3 text-[11px]">
                <button onClick={() => handleNav('/contact')} className="hover:text-[#F59E0B] cursor-pointer">
                  Mandapam Location & Directions
                </button>
                <span>·</span>
                <button onClick={() => handleNav('/admin')} className="hover:text-[#F59E0B] text-[#FEF08A] cursor-pointer">
                  Admin Portal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal & Corner Attribution */}
        <div className="pt-6 border-t border-[#FFF9ED]/15 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#FFF9ED]/60">
          <div className="text-center md:text-left">
            © 2026 Sri Siddhi Vinayaka Utsava Committee, Gandhinagar Anjayya Colony, Anakapalle. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => handleNav('/privacy')} className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => handleNav('/terms')} className="hover:text-white transition-colors cursor-pointer">
              Terms of Service
            </button>
            <span>•</span>
            <button onClick={() => handleNav('/transparency')} className="hover:text-white transition-colors cursor-pointer">
              Public Transparency Disclosures
            </button>
          </div>
          <div className="text-center md:text-right text-[#FFF9ED]/75 font-medium tracking-wide">
            Designed and developed by <span className="text-[#FEF08A] font-bold hover:text-amber-300 transition-colors">Devara</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
