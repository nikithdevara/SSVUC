import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  Users,
  Heart,
  Navigation,
  MessageCircle,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DevotionalHeaderBadge, TraditionalDiya } from '../../components/common/CulturalMotifs';
import { useToast } from '../../components/common/Toast';

interface ContactPageProps {
  onNavigate: (route: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('Pooja Sponsorship');
  const [message, setMessage] = useState('');

  // States: 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const { showToast } = useToast();

  const validate = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = 'Please enter your full name';
    if (!phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    } else if (!/^[0-9+\s-]{8,15}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setStatus('submitting');
    setTimeout(() => {
      setStatus('success');
      showToast('Message submitted successfully!', 'success');
    }, 900);
  };

  const handleDirections = () => {
    window.open(
      'https://maps.google.com/?q=Gandhinagar+Anjayya+Colony,+Anakapalle,+Andhra+Pradesh',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      'Jai Ganesha! I would like to inquire about Ganesh Utsav 2026 pooja sankalpam and sevas at Gandhinagar Anjayya Colony, Anakapalle.'
    );
    window.open(`https://wa.me/919440123456?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
          Contact Utsava Committee
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto">
          Sri Siddhi Vinayaka Utsava Committee · Gandhinagar Anjayya Colony, Anakapalle, Andhra Pradesh
        </p>
      </div>

      {/* Quick Action Contact Bar (Call, WhatsApp, Get Directions) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <a
          href="tel:+919440123456"
          className="p-4 rounded-2xl bg-white border border-[#C9972B]/40 hover:border-[#D97706] shadow-md flex items-center justify-center gap-3 text-[#7F1D1D] font-bold text-sm transition-all hover:bg-[#FFF9ED] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-[#7F1D1D]" />
          </div>
          <div>
            <span className="block text-xs text-[#292524]/60 font-medium">Direct Hotline</span>
            <span>Call Committee</span>
          </div>
        </a>

        <button
          onClick={handleWhatsApp}
          className="p-4 rounded-2xl bg-[#166534] text-white shadow-md flex items-center justify-center gap-3 font-bold text-sm hover:bg-[#14532d] transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="block text-xs text-white/75 font-medium">Instant Seva Desk</span>
            <span>WhatsApp Committee</span>
          </div>
        </button>

        <button
          onClick={handleDirections}
          className="p-4 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-white shadow-md flex items-center justify-center gap-3 font-bold text-sm hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="block text-xs text-white/75 font-medium">Navigation</span>
            <span>Get Directions</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Mandapam Location & Helplines */}
        <div className="lg:col-span-6 space-y-6">
          {/* Address Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-4">
            <div className="flex items-center gap-3 text-[#7F1D1D]">
              <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#7F1D1D]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#292524]">Official Mandapam Location</h3>
                <span className="text-xs text-[#292524]/60">Gandhinagar Anjayya Colony, Anakapalle</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#292524]/85 leading-relaxed pl-13">
              <strong>Sri Siddhi Vinayaka Utsava Committee Mandapam</strong>
              <br />
              Gandhinagar Anjayya Colony, Main Road
              <br />
              (Near Sri Rama Mandir Arch & Community Hall Ground)
              <br />
              Anakapalle - 531001, Andhra Pradesh, India
            </p>

            <div className="p-3 rounded-xl bg-[#FFF9ED] border border-[#C9972B]/20 text-xs text-[#78350F] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>Landmark: 1.5 km from Anakapalle Railway Station · 800m from RTC Bus Complex</span>
            </div>
          </div>

          {/* Committee Helplines */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-4">
            <h3 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D] border-b border-[#C9972B]/20 pb-2">
              Festival Seva Helplines
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9ED] border border-[#C9972B]/15">
                <div>
                  <span className="font-bold text-[#292524] block">President & General Management</span>
                  <span className="text-[11px] text-[#292524]/60">Super Admin</span>
                </div>
                <a
                  href="tel:+919440123456"
                  className="font-mono font-bold text-xs text-[#166534] bg-[#166534]/10 px-3 py-1.5 rounded-lg hover:bg-[#166534]/20"
                >
                  +91 94401 23456
                </a>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9ED] border border-[#C9972B]/15">
                <div>
                  <span className="font-bold text-[#292524] block">Treasurer & Accounts Desk</span>
                  <span className="text-[11px] text-[#292524]/60">Treasurer</span>
                </div>
                <a
                  href="tel:+919848067890"
                  className="font-mono font-bold text-xs text-[#166534] bg-[#166534]/10 px-3 py-1.5 rounded-lg hover:bg-[#166534]/20"
                >
                  +91 98480 67890
                </a>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9ED] border border-[#C9972B]/15">
                <div>
                  <span className="font-bold text-[#292524] block">Maha Annadanam Seva Wing</span>
                  <span className="text-[11px] text-[#292524]/60">Committee Coordinator</span>
                </div>
                <a
                  href="tel:+919989012345"
                  className="font-mono font-bold text-xs text-[#166534] bg-[#166534]/10 px-3 py-1.5 rounded-lg hover:bg-[#166534]/20"
                >
                  +91 99890 12345
                </a>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF9ED] border border-[#C9972B]/15">
                <div>
                  <span className="font-bold text-[#292524] block">Youth Volunteer Squad</span>
                  <span className="text-[11px] text-[#292524]/60">Volunteer Lead</span>
                </div>
                <a
                  href="tel:+919849087654"
                  className="font-mono font-bold text-xs text-[#166534] bg-[#166534]/10 px-3 py-1.5 rounded-lg hover:bg-[#166534]/20"
                >
                  +91 98490 87654
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#C9972B] shadow-xl space-y-6">
            <div className="border-b border-[#C9972B]/20 pb-3">
              <h3 className="font-['Cinzel',serif] text-xl font-bold text-[#7F1D1D]">
                Devotee Inquiry & Seva Request
              </h3>
              <p className="text-xs text-[#292524]/70">
                Send a question, request special pooja sankalpam, or pledge Annadanam seva for Ganesh Utsav 2026.
              </p>
            </div>

            {status === 'success' ? (
              <div className="p-8 rounded-2xl bg-[#166534]/10 border-2 border-[#166534] text-center space-y-3 animate-in fade-in">
                <CheckCircle className="w-12 h-12 text-[#166534] mx-auto" />
                <h4 className="font-['Cinzel',serif] font-bold text-lg text-[#166534]">
                  Message Received with Sacred Blessings!
                </h4>
                <p className="text-xs sm:text-sm text-[#292524]/80 leading-relaxed">
                  Thank you, <strong>{name}</strong>. Our committee coordinators will reach back to you on{' '}
                  <strong>{phone}</strong> shortly.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setName('');
                      setPhone('');
                      setEmail('');
                      setMessage('');
                      setErrors({});
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold hover:bg-[#991B1B] cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-[#292524] mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Varma"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    className={`w-full p-3 rounded-xl border ${
                      errors.name ? 'border-red-500 bg-red-50' : 'border-[#C9972B]/40 bg-[#FFF9ED]'
                    } outline-none focus:ring-2 focus:ring-[#D97706] text-sm text-[#292524]`}
                  />
                  {errors.name && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#292524] mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98480 12345"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      className={`w-full p-3 rounded-xl border ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-[#C9972B]/40 bg-[#FFF9ED]'
                      } outline-none focus:ring-2 focus:ring-[#D97706] text-sm text-[#292524]`}
                    />
                    {errors.phone && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-[#292524] mb-1">
                      Email Address <span className="text-xs text-[#292524]/50">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="devotee@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`w-full p-3 rounded-xl border ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-[#C9972B]/40 bg-[#FFF9ED]'
                      } outline-none focus:ring-2 focus:ring-[#D97706] text-sm text-[#292524]`}
                    />
                    {errors.email && <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#292524] mb-1">Purpose of Contact</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-[#FFF9ED] outline-none focus:ring-2 focus:ring-[#D97706] text-sm text-[#292524]"
                  >
                    <option value="Pooja Sponsorship">Pooja & Homam Sponsorship</option>
                    <option value="Annadanam Seva">Maha Annadanam Material Provision</option>
                    <option value="Volunteer Enrolment">Volunteer Seva Registration</option>
                    <option value="Laddu Auction Info">Laddu Prasadam Auction Query</option>
                    <option value="Financial Transparency">Accounts & Transparency Inquiry</option>
                    <option value="Other">General Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#292524] mb-1">Your Message or Request</label>
                  <textarea
                    rows={4}
                    placeholder="Write details regarding dates, family gothram, material quantities, or seva questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#C9972B]/40 bg-[#FFF9ED] outline-none focus:ring-2 focus:ring-[#D97706] text-sm text-[#292524]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#7F1D1D] text-white font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to Utsava Committee</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 56: POLISHED MAP PLACEHOLDER */}
      <div className="bg-white border-2 border-[#C9972B] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9972B]/20 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#D97706] block">Location Map</span>
            <h3 className="font-['Cinzel',serif] text-xl font-bold text-[#7F1D1D]">
              Interactive Mandapam Location & Vicinity
            </h3>
            <p className="text-xs text-[#292524]/65">
              Gandhinagar Anjayya Colony, Anakapalle, Andhra Pradesh · Prepared for Google Maps Platform integration
            </p>
          </div>
          <button
            onClick={handleDirections}
            className="px-4 py-2 rounded-xl bg-[#FFF9ED] border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] flex items-center gap-2 cursor-pointer shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Open in Google Maps</span>
          </button>
        </div>

        {/* Polished Map Visualization Container */}
        <div className="relative rounded-2xl overflow-hidden border border-[#C9972B]/30 h-80 sm:h-96 bg-[#FAF7F0] flex flex-col justify-between p-6">
          {/* Stylized Grid pattern resembling city grid */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#C9972B 1px, transparent 1px), linear-gradient(90deg, #C9972B 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Roads & River stylized overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {/* Sarada River representation */}
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-sky-300 to-transparent border-l border-sky-400/40" />
            <span className="absolute top-6 right-4 text-[10px] uppercase font-bold tracking-widest text-sky-700 rotate-90 origin-right">
              Sarada River Ghat (Visarjan)
            </span>

            {/* Main Road line */}
            <div className="absolute top-1/2 left-0 right-0 h-4 bg-amber-200/80 -translate-y-1/2 border-y border-amber-400" />
            <span className="absolute top-[46%] left-6 text-[9px] uppercase font-bold tracking-wider text-[#78350F]">
              Main Road (RTC Complex ↔ Railway Station)
            </span>
          </div>

          {/* Top Bar on Map */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-xl bg-white/95 border border-[#C9972B]/40 shadow-xs text-xs font-semibold text-[#7F1D1D] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#166534] animate-ping" />
              <span>Mandapam Ground Active</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-[#C9972B]/30 shadow-xs text-[11px] font-mono text-[#292524]">
              17.6896° N, 83.0034° E
            </div>
          </div>

          {/* Centered Landmark Pin Card */}
          <div className="relative z-10 self-center max-w-sm w-full p-4 rounded-2xl bg-white/95 border-2 border-[#D97706] shadow-xl text-center space-y-2 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-full bg-[#7F1D1D] text-white flex items-center justify-center mx-auto shadow-md">
              <MapPin className="w-5 h-5 text-[#FEF08A]" />
            </div>
            <h4 className="font-['Cinzel',serif] text-sm font-bold text-[#7F1D1D]">
              Sri Siddhi Vinayaka Utsav Mandapam
            </h4>
            <p className="text-[11px] text-[#292524]/80 leading-tight">
              Gandhinagar Anjayya Colony Ground, Near Sri Rama Mandir Arch, Anakapalle
            </p>
            <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-[#166534] font-semibold">
              <span>● Pedestrian Entrance</span>
              <span>● Free Parking Ground</span>
              <span>● Annadanam Pandal</span>
            </div>
          </div>

          {/* Bottom Bar on Map */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#292524]/75 bg-white/90 p-2.5 rounded-xl border border-[#C9972B]/30">
            <span>Anakapalle Railway Station (1.5 km) · RTC Complex (800m)</span>
            <button
              onClick={handleDirections}
              className="text-[#D97706] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Get Turn-by-Turn GPS Navigation</span>
              <Navigation className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
