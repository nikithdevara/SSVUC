import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Heart,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Calendar,
  Layers,
  DollarSign,
  Bell,
  Phone,
  BarChart3,
} from 'lucide-react';
import { SacredGaneshaEmblem } from './CulturalMotifs';
import { svucStore } from '../../services/store';
import { authService } from '../../services/authService';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenSearch?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser() || svucStore.getCurrentUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser() || svucStore.getCurrentUser());
    };
    window.addEventListener('svuc_auth_changed', handleAuthChange);
    window.addEventListener('svuc_store_updated', handleAuthChange);
    return () => {
      window.removeEventListener('svuc_auth_changed', handleAuthChange);
      window.removeEventListener('svuc_store_updated', handleAuthChange);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Core navigation items for desktop top bar
  const primaryNavLinks = [
    { label: 'Home', route: '/' },
    { label: 'Offerings', route: '/donations' },
    {
      label: 'Material Contributions & Seva',
      shortLabel: 'Material Seva',
      route: '/materials',
    },
    { label: 'Transparency', route: '/transparency', highlight: true },
    { label: 'Announcements', route: '/announcements' },
  ];

  // Secondary items placed cleanly in the "More ▾" dropdown on desktop
  const secondaryNavLinks = [
    { label: 'Daily Poojas & Schedule', route: '/utsav', icon: Calendar, desc: 'Pooja schedule & cultural events' },
    { label: 'Audited Expenses', route: '/expenses', icon: DollarSign, desc: 'Itemized vendor vouchers & bills' },
    { label: 'Official Circulars', route: '/announcements', icon: Bell, desc: 'Bulletins & festival updates' },
    { label: 'Mandapam & Contact', route: '/contact', icon: Phone, desc: 'Location, priests & directions' },
  ];

  // Complete list for mobile menu
  const allMobileLinks = [
    { label: 'Home', route: '/', icon: SacredGaneshaEmblem },
    { label: 'Offerings Registry', route: '/donations', icon: Heart },
    { label: 'Material Contributions & Seva', route: '/materials', icon: Layers },
    { label: '100% Public Transparency', route: '/transparency', icon: BarChart3, highlight: true },
    { label: 'Audited Expense Bills', route: '/expenses', icon: DollarSign },
    { label: 'Daily Poojas & Utsav', route: '/utsav', icon: Calendar },
    { label: 'Official Announcements', route: '/announcements', icon: Bell },
    { label: 'Mandapam & Contact', route: '/contact', icon: Phone },
  ];

  const isSecondaryActive = secondaryNavLinks.some((item) => item.route === currentRoute);

  return (
    <header className="sticky top-0 z-50 w-full shadow-md bg-[#FFFDF7]/98 backdrop-blur-md border-b border-[#C9972B]/35">
      {/* 1. Auspicious Micro-Bar (Maroon & Gold) */}
      <div className="bg-[#7F1D1D] text-[#FEF08A] text-xs py-1.5 px-3 sm:px-6 border-b border-[#C9972B]/30 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Sacred Mantra & Location */}
          <div className="flex items-center gap-2 truncate">
            <span className="font-['Noto_Serif_Devanagari',serif] font-bold text-xs sm:text-sm text-[#FDE68A] shrink-0">
              श्री गणेशाय नमः
            </span>
            <span className="text-[#C9972B] hidden xs:inline">•</span>
            <span className="text-[11px] sm:text-xs text-[#FFFBEB]/90 font-medium truncate">
              Ganesh Utsav 2026 · Gandhinagar Anjayya Colony, Anakapalle
            </span>
          </div>

          {/* Quick Utility Links */}
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] shrink-0">
            <button
              onClick={() => handleNav('/donations')}
              className="hover:text-[#FDE68A] flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
              title="Inspect official digital receipts"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span className="hidden md:inline">Verify Receipt</span>
            </button>

            <span className="text-[#C9972B]/70 hidden sm:inline">|</span>

            {currentUser ? (
              <button
                onClick={() => handleNav('/admin/dashboard')}
                className="hover:text-[#FDE68A] flex items-center gap-1.5 transition-colors font-bold text-[#FFFBEB] cursor-pointer"
                title="Access Executive Admin Portal"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span className="hidden sm:inline">Admin Portal</span>
              </button>
            ) : (
              <button
                onClick={() => handleNav('/admin/login')}
                className="hover:text-[#FDE68A] opacity-90 hover:opacity-100 transition-opacity flex items-center gap-1.5 font-medium cursor-pointer"
                title="Access Committee Portal"
              >
                <span className="hidden xs:inline sm:inline">Committee Portal</span>
                <span className="xs:hidden">Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">
          
          {/* Brand Identity / Logo (Left) */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 sm:gap-3.5 text-left group focus:outline-none shrink-0 py-1"
            aria-label="Sri Siddhi Vinayaka Utsava Committee Home"
          >
            <div className="shrink-0 transition-transform group-hover:scale-105 duration-200">
              <SacredGaneshaEmblem size={44} className="w-9 h-9 sm:w-11 sm:h-11 shadow-xs" />
            </div>

            <div className="flex flex-col justify-center shrink-0">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#D97706] font-bold font-sans leading-tight whitespace-nowrap">
                Ganesh Utsav 2026
              </span>
              <span className="font-['Cinzel',serif] text-base sm:text-lg xl:text-xl font-black text-[#7F1D1D] leading-tight whitespace-nowrap group-hover:text-[#991B1B] transition-colors">
                Sri Siddhi Vinayaka
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#292524]/75 leading-tight whitespace-nowrap">
                Utsava Committee · Anakapalle
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links (Center) */}
          <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1 px-2" aria-label="Main Navigation">
            {primaryNavLinks.map((link) => {
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => handleNav(link.route)}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#7F1D1D] text-white shadow-xs'
                      : link.highlight
                      ? 'text-[#7F1D1D] bg-[#D97706]/15 hover:bg-[#D97706]/25 border border-[#D97706]/30'
                      : 'text-[#292524] hover:text-[#7F1D1D] hover:bg-[#D97706]/10'
                  }`}
                  title={link.label}
                >
                  <span className="hidden xl:inline">{link.label}</span>
                  <span className="xl:hidden">{link.shortLabel || link.label}</span>
                  {link.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse"></span>
                  )}
                </button>
              );
            })}

            {/* Desktop "More ▾" Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  isSecondaryActive || moreDropdownOpen
                    ? 'bg-[#7F1D1D] text-white shadow-xs'
                    : 'text-[#292524] hover:text-[#7F1D1D] hover:bg-[#D97706]/10'
                }`}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Box */}
              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border-2 border-[#C9972B]/40 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider px-3 py-1.5 border-b border-[#C9972B]/20">
                    Festival Seva & Modules
                  </div>
                  <div className="py-1 space-y-0.5">
                    {secondaryNavLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentRoute === item.route;
                      return (
                        <button
                          key={item.route}
                          onClick={() => handleNav(item.route)}
                          className={`w-full px-3 py-2 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#FEF3C7] text-[#7F1D1D] font-bold'
                              : 'hover:bg-[#FFF9ED] text-[#292524]'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-[#7F1D1D] text-white' : 'bg-[#D97706]/10 text-[#D97706]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold leading-tight">{item.label}</span>
                            <span className="block text-[11px] text-[#292524]/60 leading-tight mt-0.5">{item.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions: Support Utsav CTA + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Prominent Golden Saffron Support CTA */}
            <button
              onClick={() => handleNav('/donate')}
              className="relative overflow-hidden px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#7F1D1D] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap cursor-pointer"
              aria-label="Offer Seva to Ganesh Utsav 2026"
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white animate-pulse shrink-0" />
              <span>Support Utsav</span>
            </button>

            {/* Mobile Menu Hamburger Toggle (Visible on < lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl lg:hidden text-[#7F1D1D] bg-white border border-[#C9972B]/40 hover:bg-[#FEF3C7] transition-colors cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-[#C9972B]/30 bg-[#FFFDF7] px-4 pt-3 pb-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pb-3 mb-2 border-b border-[#C9972B]/20">
            <button
              onClick={() => handleNav('/donate')}
              className="p-2.5 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#991B1B] cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Offer Online</span>
            </button>
            <button
              onClick={() => handleNav('/transparency')}
              className="p-2.5 rounded-xl bg-[#FEF3C7] border border-[#C9972B] text-[#78350F] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#FDE68A] cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-[#D97706]" />
              <span>100% Ledger</span>
            </button>
          </div>

          {/* Nav Links Grid */}
          <div className="space-y-1">
            {allMobileLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => handleNav(link.route)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#7F1D1D] text-white shadow-xs'
                      : 'text-[#292524] hover:bg-[#FEF3C7] active:bg-[#FEF3C7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {typeof Icon === 'function' && <Icon className="w-4 h-4 text-[#D97706]" />}
                    <span>{link.label}</span>
                  </div>
                  {link.highlight && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#166534] text-white">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Options inside Mobile Menu */}
          <div className="pt-4 mt-3 border-t border-[#C9972B]/20 flex flex-col gap-2 text-xs">
            <button
              onClick={() => handleNav('/donations')}
              className="w-full text-left px-3.5 py-2 text-[#166534] font-bold flex items-center gap-2 hover:bg-[#166534]/10 rounded-xl cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Verify Official Digital Receipt</span>
            </button>
            <button
              onClick={() => handleNav('/admin/login')}
              className="w-full text-left px-3.5 py-2 text-[#7F1D1D] font-bold flex items-center gap-2 hover:bg-[#7F1D1D]/10 rounded-xl cursor-pointer"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{currentUser ? `Admin Portal (${currentUser.name})` : 'Committee Portal'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
