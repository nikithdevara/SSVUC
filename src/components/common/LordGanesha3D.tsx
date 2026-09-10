import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { TraditionalDiya } from './CulturalMotifs';

export const LordGanesha3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const prefersReduced = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReduced) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16;
      const y = (e.clientY / innerHeight - 0.5) * 16;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [prefersReduced]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ perspective: 1000 }}
    >
      {/* Background Sacred Glow & Prabhavali Halo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#D97706]/30 via-[#C9972B]/20 to-[#7F1D1D]/25 blur-3xl animate-pulse" />
      </div>

      {/* Floating Cultural Particles (Gold Coins & Marigold Petals) */}
      {!prefersReduced && (
        <>
          {/* Top-Left Floating Gold Coin */}
          <motion.div
            className="absolute -top-4 -left-2 sm:left-4 z-20 pointer-events-none"
            animate={{
              y: [-6, 6, -6],
              rotate: [0, 15, -10, 0],
            }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#FEF08A] via-[#C9972B] to-[#92400E] border border-[#FEF08A] shadow-lg flex items-center justify-center text-xs font-bold text-[#78350F]">
              ₹
            </div>
          </motion.div>

          {/* Bottom-Right Floating Gold Coin */}
          <motion.div
            className="absolute bottom-10 right-2 sm:right-6 z-20 pointer-events-none"
            animate={{
              y: [8, -8, 8],
              rotate: [10, -12, 10],
            }}
            transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut', delay: 0.8 }}
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#FEF08A] via-[#C9972B] to-[#92400E] border border-[#FEF08A] shadow-md flex items-center justify-center text-[10px] font-bold text-[#78350F]">
              卐
            </div>
          </motion.div>

          {/* Floating Marigold Petal 1 */}
          <motion.div
            className="absolute top-12 right-4 sm:right-10 z-20 pointer-events-none text-xl sm:text-2xl"
            animate={{
              y: [-10, 10, -10],
              x: [-4, 4, -4],
              rotate: [0, 45, 0],
            }}
            transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
          >
            🌼
          </motion.div>

          {/* Floating Marigold Petal 2 */}
          <motion.div
            className="absolute bottom-16 -left-4 sm:left-2 z-20 pointer-events-none text-lg sm:text-xl"
            animate={{
              y: [10, -10, 10],
              x: [3, -3, 3],
              rotate: [30, -20, 30],
            }}
            transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 0.4 }}
          >
            🌸
          </motion.div>

          {/* Floating Diya at Base */}
          <motion.div
            className="absolute -bottom-6 left-12 z-20 pointer-events-none hidden sm:block"
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          >
            <TraditionalDiya size={34} />
          </motion.div>
        </>
      )}

      {/* Main 3D Stylized Lord Ganesha Card */}
      <motion.div
        className="relative z-10 w-64 h-80 sm:w-80 sm:h-96 md:w-96 md:h-[430px] rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-[#7F1D1D]/90 via-[#450A0A] to-[#292524] border-2 border-[#C9972B]/60 shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden"
        style={{
          transform: prefersReduced
            ? 'none'
            : `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Sacred Prabhavali (Temple Arch Ring) */}
        <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none">
          <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-[#C9972B]/30 border-dashed animate-[spin_60s_linear_infinite]" />
        </div>

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between w-full px-2">
          <span className="text-[11px] sm:text-xs tracking-widest text-[#FDE68A] uppercase font-semibold">
            Gandhinagar · Anakapalle
          </span>
          <div className="flex items-center gap-1.5 bg-[#C9972B]/20 border border-[#C9972B]/50 px-2.5 py-0.5 rounded-full text-[10px] text-[#FEF08A] font-semibold">
            <span>🪔</span> 2026 Utsav
          </div>
        </div>

        {/* Lord Ganesha Royal Deity Artwork */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          {/* Glowing Divine Aura */}
          <div className="relative">
            <svg
              className="w-44 h-48 sm:w-56 sm:h-60 md:w-64 md:h-68 drop-shadow-[0_12px_24px_rgba(217,119,6,0.35)]"
              viewBox="0 0 200 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Aura rays */}
              <circle cx="100" cy="100" r="82" fill="url(#auraGrad)" opacity="0.6" />
              <circle cx="100" cy="100" r="72" stroke="#C9972B" strokeWidth="1" strokeDasharray="4 4" />

              {/* Ears */}
              <path
                d="M50 78C30 82 22 102 32 120C40 134 56 130 65 125"
                fill="#C9972B"
                stroke="#FDE68A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M150 78C170 82 178 102 168 120C160 134 144 130 135 125"
                fill="#C9972B"
                stroke="#FDE68A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Shoulders & Traditional Angavastram */}
              <path
                d="M48 165C60 148 82 142 100 142C118 142 140 148 152 165C158 174 150 195 100 195C50 195 42 174 48 165Z"
                fill="#B45309"
                stroke="#D97706"
                strokeWidth="2"
              />
              {/* Sacred Thread (Yajnopavita) */}
              <path
                d="M72 155C86 168 114 182 134 195"
                stroke="#FEF08A"
                strokeWidth="2"
                strokeDasharray="2 3"
              />

              {/* Golden Mukuta (Crown) */}
              <path
                d="M70 75L100 20L130 75H70Z"
                fill="url(#mukutaGrad)"
                stroke="#FEF08A"
                strokeWidth="2.5"
              />
              {/* Crown Jewels */}
              <circle cx="100" cy="36" r="4.5" fill="#EF4444" stroke="#FEF08A" strokeWidth="1.5" />
              <circle cx="86" cy="58" r="3" fill="#10B981" />
              <circle cx="114" cy="58" r="3" fill="#10B981" />
              <path d="M78 68H122" stroke="#FEF08A" strokeWidth="2" />

              {/* Face & Forehead */}
              <ellipse cx="100" cy="100" rx="38" ry="32" fill="#D97706" />

              {/* Traditional Red & White Tilak */}
              <path d="M92 84H108" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
              <path d="M94 80H106" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M100 75V94" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="94" r="2.5" fill="#FEF08A" />

              {/* Divine Eyes */}
              <ellipse cx="82" cy="98" rx="5" ry="3" fill="#1C1917" stroke="#FEF08A" strokeWidth="1" />
              <circle cx="81" cy="97" r="1.2" fill="#FFF" />
              <ellipse cx="118" cy="98" rx="5" ry="3" fill="#1C1917" stroke="#FEF08A" strokeWidth="1" />
              <circle cx="119" cy="97" r="1.2" fill="#FFF" />

              {/* Single Tusk (Ekadanta) */}
              <path d="M88 124L79 133L84 134L90 126" fill="#FFF" stroke="#E5E7EB" strokeWidth="0.5" />

              {/* Curved Divine Trunk with Traditional Modaka */}
              <path
                d="M100 108C100 135 118 146 118 158C118 168 108 174 96 172C84 170 82 158 90 156"
                fill="none"
                stroke="#D97706"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M100 108C100 135 118 146 118 158C118 168 108 174 96 172C84 170 82 158 90 156"
                fill="none"
                stroke="#FEF08A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
              {/* Sweet Modaka held at the trunk tip */}
              <circle
                cx="94"
                cy="154"
                r="7"
                fill="url(#modakGrad)"
                stroke="#C9972B"
                strokeWidth="1.5"
                className="animate-pulse"
              />

              {/* Abhaya Mudra Blessing Hand */}
              <g transform="translate(138, 126)">
                <ellipse cx="12" cy="14" rx="10" ry="14" fill="#C9972B" stroke="#FEF08A" strokeWidth="1.5" />
                <path d="M12 6V18" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="14" r="3" fill="#DC2626" />
              </g>

              {/* Gradients */}
              <defs>
                <radialGradient id="auraGrad" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                  <stop stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="0.7" stopColor="#D97706" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#7F1D1D" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="mukutaGrad" x1="100" y1="20" x2="100" y2="75" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FEF08A" />
                  <stop offset="0.5" stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
                <linearGradient id="modakGrad" x1="90" y1="148" x2="98" y2="160" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FEF08A" />
                  <stop offset="1" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Devotional Inscription */}
          <div className="mt-2">
            <h3 className="font-['Cinzel',serif] text-lg sm:text-xl font-bold tracking-wider text-[#FEF08A]">
              SRI SIDDHI VINAYAKA
            </h3>
            <p className="text-[11px] sm:text-xs text-[#FDE68A]/80 font-medium tracking-wide">
              Vighna Vinashaka · Sarva Karyartha Siddhi
            </p>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="relative z-10 w-full pt-2 border-t border-[#C9972B]/30 flex items-center justify-around text-[10px] sm:text-[11px] text-[#FEF08A]/90">
          <div className="flex items-center gap-1">
            <span className="text-[#10B981]">●</span> 14ft Clay Idol
          </div>
          <div className="text-[#C9972B]">|</div>
          <div className="flex items-center gap-1">
            <span className="text-[#F59E0B]">★</span> 9-Day Festival
          </div>
          <div className="text-[#C9972B]">|</div>
          <div className="flex items-center gap-1">
            <span className="text-[#10B981]">●</span> 100% Transparent
          </div>
        </div>
      </motion.div>
    </div>
  );
};
