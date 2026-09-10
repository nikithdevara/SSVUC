import React from 'react';

// Sacred "श्री गणेशाय नमः" devotional ribbon
export const DevotionalHeaderBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#7F1D1D]/10 border border-[#7F1D1D]/20 text-[#7F1D1D] shadow-xs ${className}`}>
    <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
    <span className="text-sm font-semibold tracking-wide font-['Noto_Serif_Devanagari',serif]">श्री गणेशाय नमः</span>
    <span className="text-xs uppercase tracking-widest font-medium opacity-80 border-l border-[#7F1D1D]/30 pl-2">Ganesh Utsav 2026</span>
  </div>
);

// Traditional Brass Diya with animated golden flame
export const TraditionalDiya: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    {/* Flame glow */}
    <circle cx="24" cy="14" r="10" fill="#F59E0B" fillOpacity="0.25" className="animate-pulse" />
    {/* Flame */}
    <path
      d="M24 6C24 6 28 12 28 16C28 18.2091 26.2091 20 24 20C21.7909 20 20 18.2091 20 16C20 12 24 6 24 6Z"
      fill="url(#diyaFlame)"
    />
    <path
      d="M24 10C24 10 26 13 26 15.5C26 16.88 25.1 18 24 18C22.9 18 22 16.88 22 15.5C22 13 24 10 24 10Z"
      fill="#FFFBEB"
    />
    {/* Diya Clay Base */}
    <path
      d="M8 24C8 32.8366 15.1634 38 24 38C32.8366 38 40 32.8366 40 24C40 24 34 26 24 26C14 26 8 24 8 24Z"
      fill="#C9972B"
      stroke="#B45309"
      strokeWidth="1.5"
    />
    {/* Diya Rim */}
    <ellipse cx="24" cy="24" rx="16" ry="3.5" fill="#D97706" />
    <ellipse cx="24" cy="24" rx="13" ry="2" fill="#78350F" />
    {/* Stand base */}
    <path d="M18 38H30L32 42H16L18 38Z" fill="#92400E" />
    <defs>
      <linearGradient id="diyaFlame" x1="24" y1="6" x2="24" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="0.6" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

// Sacred Ganesha / Om Emblem Icon
export const SacredGaneshaEmblem: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* Outer decorative ring */}
    <circle cx="32" cy="32" r="30" stroke="#C9972B" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
    <circle cx="32" cy="32" r="26" fill="#7F1D1D" />
    {/* Sacred Ganesha stylized silhouette */}
    {/* Ears & Face */}
    <path
      d="M20 20C16 22 14 27 16 32C17.5 35 21 35 23 34"
      stroke="#FDE68A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M44 20C48 22 50 27 48 32C46.5 35 43 35 41 34"
      stroke="#FDE68A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Crown (Mukuta) */}
    <path
      d="M26 21L32 12L38 21H26Z"
      fill="#F59E0B"
      stroke="#FDE68A"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="15" r="1.5" fill="#FFFBEB" />
    {/* Forehead Tilak */}
    <path d="M30 22H34" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 20V26" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    {/* Trunk curving gracefully */}
    <path
      d="M32 26V37C32 42 27 45 24 42C21.5 39.5 24 37 26 38"
      stroke="#FDE68A"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Modaka in trunk */}
    <circle cx="28.5" cy="40.5" r="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
  </svg>
);

// Temple Arch top ornamental border
export const TempleArchBorder: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full overflow-hidden leading-none ${className}`} aria-hidden="true">
    <svg
      className="w-full h-4 text-[#D97706]/30"
      preserveAspectRatio="none"
      viewBox="0 0 1200 24"
      fill="currentColor"
    >
      <path d="M0,0 Q150,24 300,0 Q450,24 600,0 Q750,24 900,0 Q1050,24 1200,0 L1200,24 L0,24 Z" />
    </svg>
  </div>
);

// Marigold garland divider accent
export const MarigoldGarlandDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-2 py-4 ${className}`} aria-hidden="true">
    <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9972B]/60 to-transparent flex-1 max-w-xs"></div>
    <div className="flex items-center gap-1 text-[#D97706]">
      <span className="text-sm">🌼</span>
      <TraditionalDiya size={20} />
      <span className="text-sm">🌼</span>
    </div>
    <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9972B]/60 to-transparent flex-1 max-w-xs"></div>
  </div>
);

// Indian Rangoli subtle corner ornament
export const RangoliCornerAccent: React.FC<{ position?: 'tl' | 'tr' | 'bl' | 'br'; className?: string }> = ({
  position = 'tr',
  className = '',
}) => {
  const rotation =
    position === 'tr' ? 'rotate-90' : position === 'br' ? 'rotate-180' : position === 'bl' ? '-rotate-90' : '';

  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-[#C9972B]/40 pointer-events-none ${rotation} ${className}`}
      aria-hidden="true"
    >
      <path
        d="M0 0C24 0 48 24 48 48H0V0Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M0 32C16 32 32 16 32 0" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="3" fill="#D97706" />
    </svg>
  );
};
