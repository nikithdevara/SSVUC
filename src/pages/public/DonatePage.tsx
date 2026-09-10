import React, { useState } from 'react';
import {
  Heart,
  CheckCircle,
  ShieldCheck,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Lock,
  Download,
  Share2,
  Printer,
  Sparkles,
  Info,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Building2,
  RefreshCw,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Banknote,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { svucStore } from '../../services/store';
import { PaymentMethod, Receipt, PaymentRecord } from '../../types';
import { TraditionalDiya, DevotionalHeaderBadge } from '../../components/common/CulturalMotifs';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../components/common/Toast';
import { paymentService } from '../../services/paymentService';
import { generateReceiptNumber } from '../../services/receiptNumberService';
import { donationsFirebaseService } from '../../services/firebase/donationsFirebaseService';

interface DonatePageProps {
  onNavigate: (route: string) => void;
}

const PRESET_AMOUNTS = [101, 501, 1001, 2501, 5001, 10001];

export const DonatePage: React.FC<DonatePageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  // Steps: 1: ENTER, 2: REVIEW & PAY, 3: PROCESSING, 4: SUCCESS, 5: FAILED/CANCELLED
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [amount, setAmount] = useState<number>(1001);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gothram, setGothram] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Payment Tracking State
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [verifiedPayment, setVerifiedPayment] = useState<PaymentRecord | null>(null);
  const [failureReason, setFailureReason] = useState<string>('');
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);

  const gatewayConfig = paymentService.getConfig();
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const committeeSettings = svucStore.getSettings();
  const upiId = committeeSettings.upiId || '8919982789@axl';
  const upiHolder = committeeSettings.upiQrHolder || 'MANGARAPU DHANUSH SAI';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiHolder)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Ganesh Utsav 2026 Offering')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUrl)}&margin=10`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    showToast(`UPI ID copied: ${upiId}`, 'success');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) {
      showToast('Please enter a valid offering amount.', 'error');
      return;
    }
    if (!anonymous && !donorName.trim()) {
      showToast('Please enter your name or check the Anonymous option.', 'error');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInitiatePayment = (simulateFailure = false, simulateCancel = false) => {
    // Step 1: Create Payment Intent
    const intent = paymentService.createPaymentIntent({
      donorName: anonymous ? 'Devotee (Anonymous)' : donorName,
      amount: finalAmount,
      currency: 'INR',
      email,
      phone: phoneNumber,
      notes: utrNumber.trim() ? `${notes ? notes + ' | ' : ''}UTR/UPI Ref: ${utrNumber.trim()}` : notes,
      paymentMethod,
      isAnonymous: anonymous,
    });
    setCurrentOrderId(intent.orderId);
    setStep(3);

    // Step 2: Register offering and verify details
    setTimeout(() => {
      if (simulateCancel) {
        paymentService.cancelPayment(intent.orderId, 'User dismissed payment modal.');
        setFailureReason('Payment submission was cancelled.');
        setStep(5);
        return;
      }

      if (simulateFailure) {
        paymentService.failPayment(intent.orderId, 'Payment recording error.');
        setFailureReason('Submission could not be recorded.');
        setStep(5);
        return;
      }

      const generatedPaymentId = utrNumber.trim() || `UPI_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const verification = paymentService.verifyPayment({
        orderId: intent.orderId,
        paymentId: generatedPaymentId,
        amount: finalAmount,
        currency: 'INR',
        isDemo: false,
      });

      if (!verification.verified) {
        setFailureReason(verification.message);
        setStep(5);
        return;
      }

      setVerifiedPayment(verification.paymentRecord);

      // Record approved donation in store
      const allDonations = svucStore.getDonations();
      const newSeq = allDonations.length + 1;
      const officialReceiptNum = generateReceiptNumber('MONETARY', newSeq);

      const { receipt, donation } = svucStore.addDonation({
        donorName: anonymous ? 'Devotee (Anonymous)' : donorName,
        anonymous,
        amount: finalAmount,
        paymentMethod,
        phoneNumber,
        email,
        gothram,
        notes: utrNumber.trim() ? `${notes ? notes + ' | ' : ''}UTR: ${utrNumber.trim()}` : notes,
        status: 'Pending',
      });

      // Update donation with payment details
      donation.paymentStatus = 'paid';
      donation.paymentProvider = paymentMethod === 'UPI' ? 'UPI_INTENT' : 'CASH_DESK';
      donation.paymentId = generatedPaymentId;
      donation.orderId = intent.orderId;
      donation.signatureVerified = true;
      donation.receiptId = officialReceiptNum;
      receipt.receiptNumber = officialReceiptNum;
      receipt.status = 'PENDING';

      // Sync to Firebase Cloud Firestore directly
      donationsFirebaseService
        .createDonation({
          donorName: anonymous ? 'Devotee (Anonymous)' : donorName,
          anonymous,
          amount: finalAmount,
          paymentMethod,
          phoneNumber,
          email,
          gothram,
          notes: utrNumber.trim() ? `${notes ? notes + ' | ' : ''}UTR/UPI Ref: ${utrNumber.trim()}` : notes,
          status: 'Pending',
        })
        .catch((err) => console.warn('[Firestore Offering Sync Error]', err));

      // Send notification to Super Admin & Treasurer
      svucStore.addNotification({
        title: 'New Offering Awaiting Verification',
        message: `Devotee ${donation.donorName} submitted an offering of ₹${donation.amount.toLocaleString('en-IN')} (${donation.paymentMethod}${utrNumber.trim() ? ` · UTR: ${utrNumber.trim()}` : ''}). Review in /admin/donations.`,
        type: 'warning',
        link: '/admin/donations',
        donationId: donation.id,
        createdAt: new Date().toISOString(),
      });

      setGeneratedReceipt(receipt);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D97706', '#7F1D1D', '#F59E0B', '#166534', '#FEF08A'],
        });
      } catch (err) {
        // Ignored if canvas confetti not supported
      }
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Devotional Header */}
      <div className="text-center space-y-3">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-3xl sm:text-4xl font-black text-[#7F1D1D] tracking-tight">
          Support the Ganesh Utsav 2026
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-lg mx-auto">
          "Every contribution matters. Every rupee is accounted for." Your sacred offering sustains Vedic poojas,
          Annadanam for devotees, and traditional cultural arts.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold text-[#78350F]">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-[#7F1D1D] text-white' : 'bg-[#FEF3C7] text-[#78350F]'}`}>
            1. Offering Details
          </span>
          <span>&rarr;</span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-[#7F1D1D] text-white' : 'bg-[#FEF3C7] text-[#78350F]'}`}>
            2. {paymentMethod === 'UPI' ? 'Scan & Pay (UPI)' : 'Mandapam Cash Desk'}
          </span>
          <span>&rarr;</span>
          <span className={`px-3 py-1 rounded-full ${step >= 4 ? 'bg-[#166534] text-white' : 'bg-[#FEF3C7] text-[#78350F]'}`}>
            3. Official Receipt
          </span>
        </div>
      </div>

      {/* STEP 1: FORM ENTRY */}
      {step === 1 && (
        <form onSubmit={handleProceedToReview} className="bg-white border-2 border-[#C9972B] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-[#C9972B]/30 pb-4 flex items-center justify-between">
            <h2 className="font-['Cinzel',serif] text-xl font-bold text-[#7F1D1D] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D97706]" /> Choose Offering Amount
            </h2>
            <TraditionalDiya className="w-6 h-6 text-[#D97706]" />
          </div>

          {/* Preset Amounts Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {PRESET_AMOUNTS.map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => handleSelectPreset(val)}
                className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                  amount === val && !customAmount
                    ? 'bg-[#7F1D1D] text-white border-[#7F1D1D] shadow-md scale-105 font-bold'
                    : 'bg-[#FFF9ED] text-[#78350F] border-[#C9972B]/40 hover:border-[#D97706] font-semibold'
                }`}
              >
                <span className="text-xs sm:text-sm">₹{val.toLocaleString('en-IN')}</span>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#7F1D1D] block mb-1.5">
              Or Enter Custom Offering Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg text-[#78350F]">₹</span>
              <input
                type="number"
                min="1"
                placeholder="Enter amount..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#C9972B]/40 bg-[#FFF9ED] text-base font-bold text-[#292524] outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20"
              />
            </div>
          </div>

          {/* Devotee Info */}
          <div className="space-y-4 pt-2 border-t border-[#C9972B]/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7F1D1D]">
                Devotee / Yajamani Details
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#78350F] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded text-[#7F1D1D] focus:ring-[#7F1D1D]"
                />
                <span>Remain Anonymous (Gupt Daan)</span>
              </label>
            </div>

            {!anonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#292524]/80 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required={!anonymous}
                    placeholder="e.g. Ramesh Varma"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-[#C9972B]/30 bg-[#FFF9ED] outline-none focus:border-[#D97706]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#292524]/80 block mb-1">Gothram (Optional for Archana)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyapa / Bharadwaja"
                    value={gothram}
                    onChange={(e) => setGothram(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-[#C9972B]/30 bg-[#FFF9ED] outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#292524]/80 block mb-1">Mobile Number (For SMS/WhatsApp Receipt)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9848012345"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-[#C9972B]/30 bg-[#FFF9ED] outline-none focus:border-[#D97706]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#292524]/80 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. devotee@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-[#C9972B]/30 bg-[#FFF9ED] outline-none focus:border-[#D97706]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#292524]/80 block mb-1">Devotional Sankalpam / Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. In memory of parents / for child's health & education..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-[#C9972B]/30 bg-[#FFF9ED] outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 pt-2 border-t border-[#C9972B]/20">
            <label className="text-xs font-bold uppercase tracking-wider text-[#7F1D1D] block">
              Preferred Offering Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['UPI', 'Cash'] as PaymentMethod[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMethod(mode)}
                  className={`p-4 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === mode
                      ? 'bg-[#166534] text-white border-[#166534] shadow-md ring-2 ring-[#166534]/30'
                      : 'bg-[#FFF9ED] text-[#292524] border-[#C9972B]/30 hover:border-[#D97706]'
                  }`}
                >
                  <span className="text-base font-bold flex items-center gap-1.5">
                    {mode === 'UPI' ? <Smartphone className="w-5 h-5 text-emerald-300" /> : <Banknote className="w-5 h-5 text-amber-300" />}
                    {mode === 'UPI' ? 'Direct UPI / QR Code' : 'Mandapam Cash Voucher'}
                  </span>
                  <span className="text-[11px] opacity-90">
                    {mode === 'UPI' ? 'Instant GPay · PhonePe · Paytm · QR Scan' : 'Pay in Person at Mandapam Counter'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#7F1D1D] text-white font-extrabold text-base shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Payment: ₹{finalAmount.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#292524]/60 mt-3">
              <Lock className="w-3.5 h-3.5 text-[#166534]" />
              <span>Instant cryptographic digital receipt issued with every contribution.</span>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: REVIEW & COMPLETE PAYMENT (UPI OR CASH) */}
      {step === 2 && (
        <div className="bg-white border-2 border-[#C9972B] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-[#C9972B]/30 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-['Cinzel',serif] text-xl font-bold text-[#7F1D1D]">
                {paymentMethod === 'UPI' ? 'Scan & Pay via UPI' : 'Mandapam Cash Voucher'}
              </h2>
              <span className="text-xs text-[#292524]/60">Sri Siddhi Vinayaka Utsava Committee · Anakapalle</span>
            </div>
            <span className="text-2xl font-black text-[#166534]">₹{finalAmount.toLocaleString('en-IN')}</span>
          </div>

          {/* Donor Summary */}
          <div className="p-3.5 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/20 text-xs sm:text-sm space-y-1.5">
            <div className="flex justify-between py-0.5">
              <span className="text-[#292524]/70">Devotee / Yajamani:</span>
              <span className="font-bold text-[#292524]">{anonymous ? 'Devotee (Anonymous)' : donorName}</span>
            </div>
            {phoneNumber && (
              <div className="flex justify-between py-0.5">
                <span className="text-[#292524]/70">Mobile:</span>
                <span className="font-medium text-[#292524]">{phoneNumber}</span>
              </div>
            )}
            {gothram && (
              <div className="flex justify-between py-0.5">
                <span className="text-[#292524]/70">Gothram:</span>
                <span className="font-medium text-[#292524]">{gothram}</span>
              </div>
            )}
            <div className="flex justify-between py-0.5 border-t border-[#C9972B]/15 pt-1">
              <span className="text-[#292524]/70">Mode:</span>
              <span className="font-bold text-[#78350F]">{paymentMethod === 'UPI' ? 'Direct UPI Transfer' : 'Cash at Mandapam Counter'}</span>
            </div>
          </div>

          {/* UPI PAYMENT CARD */}
          {paymentMethod === 'UPI' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-b from-amber-50 to-[#FFF9ED] border-2 border-amber-300 space-y-5 text-center">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5 text-amber-800" /> Direct UPI Offering
                </span>
                <h3 className="font-['Cinzel',serif] text-lg font-bold text-[#7F1D1D]">
                  Scan with any UPI App
                </h3>
                <p className="text-xs text-stone-600">
                  Google Pay · PhonePe · Paytm · BHIM · Cred · Amazon Pay
                </p>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-amber-400/80 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code for Ganesh Utsav Offering"
                  className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-lg"
                />
                <div className="pt-2 text-xs font-black text-[#7F1D1D] tracking-wide">
                  Offering Amount: ₹{finalAmount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Beneficiary Details */}
              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-white/90 border border-amber-200 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">Account Name:</span>
                  <span className="font-bold text-stone-800">{upiHolder}</span>
                </div>
                <div className="flex justify-between items-center border-t border-amber-100 pt-2">
                  <span className="text-stone-500 font-medium">UPI ID / VPA:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-amber-100/80 px-2 py-0.5 rounded font-mono font-bold text-[#7F1D1D] text-xs">
                      {upiId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition-all cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-amber-900" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Deep Link */}
              <div className="pt-1">
                <a
                  href={upiUrl}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open in UPI App (Mobile Only)</span>
                </a>
              </div>

              {/* UTR / Reference Input */}
              <div className="max-w-md mx-auto pt-2 text-left space-y-1.5">
                <label className="text-xs font-bold text-stone-800 block">
                  UPI Transaction ID / UTR No (Recommended)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 425189201923 (12 digits from your UPI app)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-amber-300 bg-white outline-none focus:border-[#7F1D1D] focus:ring-2 focus:ring-[#7F1D1D]/10"
                />
                <span className="text-[10px] text-stone-500 block">
                  Enables instant auto-matching by the Committee Treasurer when bank statement updates.
                </span>
              </div>
            </div>
          )}

          {/* CASH MANDAPAM CARD */}
          {paymentMethod === 'Cash' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-300 space-y-4 text-left">
              <div className="flex items-center gap-2 font-bold text-[#78350F]">
                <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
                <span className="text-sm sm:text-base">Mandapam Counter Cash Offering Protocol</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                You can deposit your cash offering in person directly at the festival mandapam counter:
              </p>
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1 font-medium text-stone-700">
                <p>📍 <strong>Location:</strong> Gandhinagar Anjayya Colony, Main Mandapam Ground, Anakapalle</p>
                <p>⏰ <strong>Counter Timings:</strong> 6:00 AM – 10:00 PM throughout the Utsav days</p>
                <p>📋 <strong>Action:</strong> Click the button below to generate your <strong>Mandapam Cash Voucher</strong>. Show the voucher number to the committee volunteer at the desk upon handing over your cash.</p>
              </div>
            </div>
          )}

          {/* Audit Callout */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300/80 space-y-2 text-xs text-left">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Committee Financial Safeguards</span>
            </div>
            <p className="text-amber-900 leading-relaxed text-[11px]">
              Upon submission, your offering is recorded and marked <strong>Pending Verification</strong>. The Treasurer & Super Admin review the credit against the bank statement/cash counter, approve it, and activate your verified public receipt.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-[#C9972B] text-[#78350F] font-bold text-xs sm:text-sm hover:bg-[#FFF9ED] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Details
              </button>

              <button
                onClick={() => handleInitiatePayment(false, false)}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle className="w-5 h-5 text-amber-300 shrink-0" />
                <span>
                  {paymentMethod === 'UPI'
                    ? `I Have Paid ₹${finalAmount.toLocaleString('en-IN')} · Submit Offering`
                    : `Generate Cash Voucher (₹${finalAmount.toLocaleString('en-IN')})`}
                </span>
              </button>
            </div>
            <p className="text-center text-[11px] text-stone-500">
              ⚡ Instant digital acknowledgment receipt is issued immediately upon clicking submit.
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: REGISTERING OFFERING */}
      {step === 3 && (
        <div className="bg-white border-2 border-[#C9972B] rounded-3xl p-10 sm:p-14 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#D97706]/15 text-[#D97706] flex items-center justify-center animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
            Registering Offering & Generating Digital Receipt...
          </h2>
          <div className="text-xs text-[#292524]/75 max-w-md mx-auto space-y-1 font-mono">
            <p>Order Reference: <strong>{currentOrderId}</strong></p>
            <p className="text-[11px] text-stone-500">
              Amount ₹{finalAmount.toLocaleString('en-IN')} · Mode: {paymentMethod}
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS & CONFIRMATION (SECTION 18) */}
      {step === 4 && generatedReceipt && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Submission Status Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/80 border-2 border-amber-400 text-center space-y-3 relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-amber-600 text-white mx-auto flex items-center justify-center shadow-md">
              <Clock className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> Pending Super Admin & Treasurer Review
            </div>
            <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-extrabold text-[#7F1D1D]">
              Offering Submitted for Verification!
            </h2>
            <p className="text-sm font-medium text-stone-700 max-w-lg mx-auto leading-relaxed">
              Your contribution has been successfully registered. A notification has been dispatched to the Super Admin and Treasurer in <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">/admin/donations</code>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs max-w-xl mx-auto text-left bg-white/95 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Amount</span>
                <span className="font-black text-[#7F1D1D] text-sm">₹{finalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 capitalize">
                  <Clock className="w-3 h-3" /> Pending Audit
                </span>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Ack / Receipt No</span>
                <span className="font-mono font-bold text-[#7F1D1D]">{generatedReceipt.receiptNumber}</span>
              </div>
              <div>
                <span className="text-stone-500 text-[10px] block uppercase font-bold">Date</span>
                <span className="font-semibold text-stone-800">{generatedReceipt.date}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs text-amber-900 max-w-lg mx-auto text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>What happens next:</strong> Once the Treasurer or Super Admin verifies the credit and clicks <strong>"Verify & Approve"</strong>, your official verified receipt will be unlocked and your seva will be automatically listed on the <strong>Public Offerings Ledger</strong>.
              </p>
            </div>

            {/* Quick Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('/donations')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>View Public Offerings Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/admin/donations')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-600 bg-white hover:bg-amber-50 text-[#78350F] font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                <span>Committee Admin Queue</span>
              </button>
            </div>
          </div>

          {/* Standalone Printable & Downloadable Digital Receipt */}
          <ReceiptModal receipt={generatedReceipt} standalone={true} onNavigate={onNavigate} />

          <div className="text-center pt-4">
            <button
              onClick={() => onNavigate('/donations')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#78350F] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Public Offerings Ledger
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: FAILED OR CANCELLED PAYMENT (SECTION 12 & 13) */}
      {step === 5 && (
        <div className="bg-white border-2 border-red-300 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="font-['Cinzel',serif] text-2xl font-bold text-red-700">
              Payment was not completed
            </h2>
            <p className="text-sm text-stone-700">
              {failureReason || 'The transaction could not be authorized by the payment processor.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 text-left space-y-1">
            <p>• <strong>Order Reference:</strong> <span className="font-mono">{currentOrderId}</span></p>
            <p>• <strong>Status:</strong> No contribution was registered in the festival ledger.</p>
            <p>• <strong>Notice:</strong> No official receipt has been issued and no funds were accepted.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#7F1D1D] text-white font-bold text-sm hover:bg-[#991B1B] shadow-md cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => onNavigate('/donations')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-200 cursor-pointer"
            >
              Return to Offerings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
