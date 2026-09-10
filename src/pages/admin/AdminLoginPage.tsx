import React, { useState, useEffect } from 'react';
import {
  Flame,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  KeyRound,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (route: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect directly to dashboard
    if (authService.isAuthenticated()) {
      onNavigate('/admin/dashboard');
    }
    const remembered = authService.getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
    }
  }, [onNavigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        onNavigate('/admin/dashboard');
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#140A07] text-stone-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Refined Sacred Atmospheric Layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial ambient warmth from top header */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-[radial-gradient(circle,_rgba(217,119,6,0.18)_0%,_rgba(127,29,29,0.12)_45%,_transparent_75%)] blur-2xl" />
        
        {/* Subtle base vignette glow */}
        <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(127,29,29,0.16)_0%,_transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] bg-[radial-gradient(circle,_rgba(201,151,43,0.08)_0%,_transparent_70%)] blur-3xl" />

        {/* Subtle ornamental grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(245, 158, 11, 0.8) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-10 pt-6 px-4 sm:px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-stone-400 hover:text-amber-300 transition-colors py-2 px-3 rounded-lg bg-stone-900/60 hover:bg-stone-900 border border-stone-800/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Return to Devotional Website</span>
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-stone-400 bg-stone-900/40 border border-stone-800/60 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Authorized Access Only</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Sacred Invocation & Crest */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-['Noto_Serif_Devanagari',serif] tracking-wider mb-4 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>॥ श्री सिद्धि विनायक विजयते ॥</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>

            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-[#7F1D1D] p-[1.5px] shadow-xl shadow-amber-500/15">
                  <div className="w-full h-full rounded-[14px] bg-[#1C0F0A] flex items-center justify-center">
                    <Flame className="w-8 h-8 text-amber-400 fill-amber-500/30" />
                  </div>
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#7F1D1D] border-2 border-[#140A07] flex items-center justify-center text-amber-300 shadow-md">
                  <KeyRound className="w-3 h-3" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-['Cinzel',serif] font-bold text-stone-50 tracking-wide">
              Sri Siddhi Vinayaka Utsav
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 font-['Manrope',sans-serif]">
              Gandhinagar Anjayya Colony • Anakapalle
            </p>
          </div>

          {/* Secure Administrative Login Card */}
          <div className="bg-[#1C1512]/95 backdrop-blur-md border border-stone-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden ring-1 ring-white/5">
            {/* Top Ornamental Gold/Crimson Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-[#991B1B] to-amber-500" />

            <div className="mb-6">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Executive Management Portal</span>
              </div>
              <h2 className="text-lg sm:text-xl font-['Cinzel',serif] font-bold text-stone-100">
                Committee Sign In
              </h2>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Sign in with your registered committee credentials to access the financial ledger, seva registries, and administration tools.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="Enter the mail"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-stone-900/80 text-stone-100 rounded-xl border border-stone-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all placeholder:text-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-stone-900/80 text-stone-100 rounded-xl border border-stone-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all placeholder:text-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 rounded-md transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-stone-400 cursor-pointer hover:text-stone-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-900 text-[#7F1D1D] focus:ring-amber-500 focus:ring-offset-stone-900"
                  />
                  <span>Remember email</span>
                </label>

                <button
                  type="button"
                  onClick={() => onNavigate('/admin/forgot-password')}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#881337] via-[#991B1B] to-[#B91C1C] hover:from-[#9F1239] hover:via-[#B91C1C] hover:to-[#DC2626] text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-950/40 hover:shadow-red-900/50 transition-all flex items-center justify-center space-x-2 border border-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Authenticate & Access Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-5 border-t border-stone-800/80 flex items-start space-x-3 text-[11px] text-stone-400">
              <ShieldCheck className="w-4 h-4 text-amber-400/90 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-stone-300">Confidential System:</span> Access is strictly restricted to committee trustees and designated treasury officials. All sign-in attempts and financial updates are permanently recorded in the audit trail.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-stone-500 border-t border-stone-900">
        <p>Sri Siddhi Vinayaka Utsava Committee • Gandhinagar Anjayya Colony, Anakapalle</p>
      </footer>
    </div>
  );
};

