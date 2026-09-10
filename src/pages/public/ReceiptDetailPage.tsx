import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldAlert, Sparkles, Calendar, ShieldCheck, Building2, QrCode } from 'lucide-react';
import { receiptsFirebaseService, PublicReceiptVerificationResult } from '../../services/firebase/receiptsFirebaseService';
import { svucStore } from '../../services/store';
import { ReceiptModal } from '../../components/common/ReceiptModal';

interface ReceiptDetailPageProps {
  receiptId: string;
  onNavigate: (route: string) => void;
}

export const ReceiptDetailPage: React.FC<ReceiptDetailPageProps> = ({ receiptId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<PublicReceiptVerificationResult | null>(null);
  const localReceipt = svucStore.getReceiptById(receiptId);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      setLoading(true);
      const res = await receiptsFirebaseService.verifyReceiptPublicly(receiptId);
      if (isMounted) {
        setVerification(res);
        setLoading(false);
      }
    }
    verify();
    return () => {
      isMounted = false;
    };
  }, [receiptId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/donations')}
          className="px-4 py-2 rounded-xl bg-white border border-[#C9972B] text-[#78350F] text-xs font-bold hover:bg-[#FEF3C7] flex items-center gap-1.5 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Public Donations Registry
        </button>
        <span className="text-xs text-[#292524]/60 font-mono">Sri Siddhi Vinayaka Public Verification</span>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-[#7F1D1D] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Verifying receipt cryptographic signature against official ledger...</p>
        </div>
      ) : verification?.verified ? (
        <div className="space-y-6">
          {/* Official Verification Certificate Card */}
          <div className="bg-white rounded-3xl border-2 border-emerald-500/50 p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between flex-wrap gap-4 border-b border-stone-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold font-serif text-stone-900">
                      Authentic Registered Receipt
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      ✓ Valid
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Sri Siddhi Vinayaka Utsava Committee • Verified Public Record
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-stone-400 block text-[10px] uppercase">Receipt No.</span>
                <span className="font-bold text-stone-800 text-sm">{verification.receiptNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Devotee / Contributor</span>
                <span className="font-semibold text-stone-900 text-sm">{verification.donorName}</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Offering Type & Value</span>
                {verification.type === 'MONETARY' ? (
                  <span className="font-bold text-emerald-700 text-base">₹{verification.amount?.toLocaleString('en-IN')}</span>
                ) : (
                  <span className="font-bold text-amber-800 text-sm">
                    {verification.quantity} {verification.unit} of {verification.materialName}
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Registration Date</span>
                <span className="font-semibold text-stone-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  {verification.date}
                </span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70">
                <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-1">Mandapam Location</span>
                <span className="font-medium text-stone-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                  {verification.location}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-stone-500">
              <span className="font-mono">Security Hash: {verification.verificationCode}</span>
              <span className="text-emerald-700 font-semibold">Protected under Mandapam Transparency Charter</span>
            </div>
          </div>

          {/* Full Digital Receipt View if local object is also present */}
          {localReceipt && (
            <div className="pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Official Digital Voucher</h3>
              <ReceiptModal receipt={localReceipt} standalone={true} />
            </div>
          )}
        </div>
      ) : verification?.status === 'VOID' ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-red-50/50 border-2 border-red-500 text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="inline-block px-4 py-1 rounded-full bg-red-600 text-white font-black text-sm tracking-widest uppercase">
            VOID RECEIPT
          </div>
          <ShieldAlert className="w-14 h-14 text-red-600 mx-auto" />
          <h2 className="font-['Cinzel',serif] text-2xl font-black text-red-700">
            Official Receipt Marked as VOID
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 max-w-lg mx-auto leading-relaxed">
            {verification.message}
          </p>
          <div className="p-4 bg-white rounded-2xl border border-red-200 max-w-md mx-auto text-xs text-left space-y-1.5 font-mono">
            <p>• <strong>Receipt Number:</strong> {verification.receiptNumber}</p>
            <p>• <strong>Original Devotee:</strong> {verification.donorName}</p>
            <p>• <strong>Date Issued:</strong> {verification.date}</p>
            <p>• <strong>Status:</strong> INVALID / CANCELLED</p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/donations')}
              className="px-6 py-2.5 rounded-xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-900 cursor-pointer"
            >
              Browse Valid Offerings
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-red-300 text-center space-y-4 shadow-lg">
          <ShieldAlert className="w-14 h-14 text-red-600 mx-auto" />
          <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
            Receipt could not be verified
          </h2>
          <p className="text-xs sm:text-sm text-[#292524]/75 max-w-md mx-auto">
            {verification?.message || 'No official approved record matches the provided receipt code.'}
          </p>
          <button
            onClick={() => onNavigate('/donations')}
            className="px-6 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B]"
          >
            Browse Public Registry
          </button>
        </div>
      )}
    </div>
  );
};
