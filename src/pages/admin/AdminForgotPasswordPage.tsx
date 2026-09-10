import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, KeyRound, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminForgotPasswordPage: React.FC = () => {
  const { resetPassword, isFirebaseActive } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid administrative email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email);
      if (res.success) {
        setStatusMessage(res.message || 'Password reset instructions have been sent.');
      } else {
        setErrorMessage(res.error || 'Unable to process reset request.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#140A07] text-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient lighting */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-[radial-gradient(circle,_rgba(217,119,6,0.18)_0%,_rgba(127,29,29,0.12)_45%,_transparent_75%)] blur-2xl pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(127,29,29,0.16)_0%,_transparent_70%)] blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-['Noto_Serif_Devanagari',serif] tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>॥ श्री सिद्धि विनायक विजयते ॥</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>

          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-[#7F1D1D] p-[1.5px] shadow-xl shadow-amber-500/15">
              <div className="w-full h-full rounded-[14px] bg-[#1C0F0A] flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-stone-50 tracking-wide font-['Cinzel',serif]">
            Reset Password
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 font-['Manrope',sans-serif]">
            Sri Siddhi Vinayaka Utsava Committee • Admin Security
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C1512]/95 border border-stone-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-8 relative overflow-hidden ring-1 ring-white/5"
        >
          {/* Top ornamental accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-[#991B1B] to-amber-500" />

          {statusMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-stone-100 font-['Cinzel',serif]">Instructions Sent</h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {statusMessage}
              </p>
              <div className="pt-4">
                <a
                  href="#/admin/login"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#881337] via-[#991B1B] to-[#B91C1C] hover:from-[#9F1239] hover:via-[#B91C1C] hover:to-[#DC2626] text-white font-medium shadow-md transition-colors text-xs sm:text-sm"
                >
                  Return to Admin Login
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  Enter the registered email address associated with your committee administrator account to receive password reset instructions.
                </p>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                  Administrative Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter the mail"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-stone-900/80 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#881337] via-[#991B1B] to-[#B91C1C] hover:from-[#9F1239] hover:via-[#B91C1C] hover:to-[#DC2626] transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending Recovery Link...' : 'Send Recovery Link'}
              </button>

              <div className="pt-2 text-center">
                <a
                  href="#/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-400" /> Back to Administrative Login
                </a>
              </div>
            </form>
          )}

          {!isFirebaseActive && (
            <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-900 text-stone-400 border border-stone-800">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Firebase in Preview Mode
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
