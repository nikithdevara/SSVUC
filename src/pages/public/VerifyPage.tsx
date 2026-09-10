import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  QrCode,
  ArrowRight,
  CheckCircle,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Camera,
  RotateCcw,
  Sparkles,
  Clock,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { Receipt } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { COLLECTIONS } from '../../services/firebase/firestoreService';
import { DevotionalHeaderBadge, TraditionalDiya } from '../../components/common/CulturalMotifs';
import { ShareButton } from '../../components/common/ShareButton';

interface VerifyPageProps {
  initialId?: string;
  onNavigate: (route: string) => void;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({ initialId, onNavigate }) => {
  const [searchId, setSearchId] = useState(initialId || '');
  const [hasSearched, setHasSearched] = useState(!!initialId);
  const [result, setResult] = useState<{ verified: boolean; receipt?: Receipt; message: string } | null>(
    initialId ? svucStore.verifyReceipt(initialId) : null
  );

  useEffect(() => {

    if (initialId) {
      setSearchId(initialId);
      handleVerify(initialId);
    }
  }, [initialId]);

  const handleVerify = async (idToVerify?: string) => {
    const target = (idToVerify !== undefined ? idToVerify : searchId).trim();
    if (!target) return;

    setHasSearched(true);
    let res = svucStore.verifyReceipt(target);
    if ((!res || !res.verified) && isFirebaseConfigured() && db) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.RECEIPTS, target));
        if (snap.exists()) {
          const r = { id: snap.id, ...snap.data() } as Receipt;
          res = {
            verified: r.status === 'VERIFIED',
            receipt: r,
            message: r.status === 'VERIFIED' ? 'Official verified receipt found in festival registry.' : `Receipt status: ${r.status}`,
          };
        }
      } catch (err) {
        console.warn('Firestore receipt lookup error', err);
      }
    }
    setResult(res);
  };

  const handleReset = () => {
    setSearchId('');
    setHasSearched(false);
    setResult(null);
  };


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <DevotionalHeaderBadge />
        <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
          Verify Official Digital Receipt
        </h1>
        <p className="text-xs sm:text-sm text-[#292524]/75 max-w-xl mx-auto">
          Authenticate monetary seva or material contribution receipts issued by Sri Siddhi Vinayaka Utsava Committee,
          Gandhinagar Anjayya Colony, Anakapalle.
        </p>
      </div>

      {/* Verification Form Card */}
      <div className="bg-white border-2 border-[#C9972B] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C9972B]" />
            <input
              type="text"
              placeholder="Enter Official Receipt Number (e.g. SSV-2026-D-00001 or SSV-2026-M-00001)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/50 text-[#292524] text-sm font-mono font-semibold placeholder:font-sans placeholder:text-[#292524]/45 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            />
          </div>
          <button
            onClick={() => handleVerify()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#7F1D1D] text-white font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Receipt</span>
          </button>
        </div>
        <p className="text-[11px] text-[#292524]/60">
          Tip: You can locate your 12-digit receipt code on your printed voucher or the digital receipt link provided after contribution.
        </p>
      </div>


      {/* RESULT STATE */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          {result && (result.status === 'VOID' || (result.receipt && (result.receipt.status === 'VOID' || result.receipt.status === 'REVOKED'))) ? (
            /* VOID / DECLINED STATE */
            <div className="bg-[#FFFDF7] border-3 border-red-600 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-widest mb-1 shadow-xs">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>DECLINED / VOID OFFERING</span>
                    </div>
                    <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-red-700">
                      Official Offering Declined / Voided
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate(`/receipt/${result.receipt?.receiptNumber || searchId}`)}
                    className="px-4 py-2 rounded-xl bg-red-700 text-white font-bold text-xs sm:text-sm hover:bg-red-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Void Notice</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-1">
                <strong className="block text-sm font-bold">Important Audit Notice:</strong>
                <p className="leading-relaxed">
                  {result.message || 'This offering was formally DECLINED or marked as VOID by the committee administration. It cannot be used as proof of contribution and has been excluded from active records.'}
                </p>
                {result.receipt?.voidReason && (
                  <p className="pt-1 text-red-800">
                    <strong>Recorded Reason:</strong> {result.receipt.voidReason}
                  </p>
                )}
              </div>

              {result.receipt && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-red-200 space-y-1">
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Receipt Number</span>
                    <span className="font-mono font-bold text-sm text-red-700 line-through">
                      {result.receipt.receiptNumber}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-red-200 space-y-1">
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Originally Issued Date</span>
                    <span className="font-semibold text-sm text-[#292524]">{result.receipt.date}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-red-200 space-y-1">
                    <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Status</span>
                    <span className="font-bold text-sm text-red-600 uppercase">
                      DECLINED / VOID
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Verify Another Receipt</span>
                </button>
                <button
                  onClick={() => onNavigate('/donations')}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] cursor-pointer"
                >
                  Browse Valid Offerings
                </button>
              </div>
            </div>
          ) : result && (result.status === 'PENDING' || (result.receipt && result.receipt.status === 'PENDING')) && result.status !== 'VOID' && result.receipt && result.receipt.status !== 'VOID' && result.receipt.status !== 'REVOKED' ? (
            /* PENDING STATE */
            <div className="bg-[#FFFDF7] border-3 border-amber-500 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-1 border border-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending Verification / Handover</span>
                    </div>
                    <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-[#7F1D1D]">
                      Registered Seva Pledge
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShareButton
                    title={`Pending Seva ${result.receipt.receiptNumber}`}
                    text={`Registered offering ${result.receipt.receiptNumber} with Sri Siddhi Vinayaka Utsava Committee.`}
                    url={window.location.origin + `/receipt/${result.receipt.receiptNumber}`}
                  />
                  <button
                    onClick={() => onNavigate(`/receipt/${result.receipt!.receiptNumber}`)}
                    className="px-4 py-2 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Provisional Receipt</span>
                  </button>
                </div>
              </div>

              {/* Status banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <strong className="block text-sm font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Seva Audit Status: Pending Committee Handover / Approval
                </strong>
                <p className="leading-relaxed">
                  {result.message || 'This seva contribution has been successfully registered in the festival database. Upon physical handover at the Mandapam counter or verification by committee audit officers, this receipt will automatically upgrade to Cryptographically Verified.'}
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Receipt Number</span>
                  <span className="font-mono font-bold text-sm text-[#7F1D1D]">
                    {result.receipt.receiptNumber}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Date Pledged</span>
                  <span className="font-semibold text-sm text-[#292524]">{result.receipt.date}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Contribution Type</span>
                  <span className="font-bold text-sm text-[#D97706]">
                    {result.receipt.type === 'MONETARY' ? 'Monetary Seva (Pledged)' : 'Material Seva (Pledged)'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Contributor</span>
                  <span className="font-bold text-sm text-[#292524]">
                    {result.receipt.anonymous ? 'Anonymous Devotee' : result.receipt.donorName}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1 sm:col-span-2">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Contribution Value</span>
                  {result.receipt.type === 'MONETARY' ? (
                    <span className="font-extrabold text-lg text-[#D97706]">
                      ₹{result.receipt.amount?.toLocaleString('en-IN')} via {result.receipt.paymentMethod || 'UPI'}
                    </span>
                  ) : (
                    <span className="font-extrabold text-base text-[#D97706]">
                      {result.receipt.quantity} {result.receipt.unit} of {result.receipt.materialName}
                    </span>
                  )}
                </div>
              </div>

              {/* Committee metadata */}
              <div className="p-4 rounded-2xl bg-[#FEF3C7]/60 border border-[#C9972B]/30 text-xs space-y-2">
                <div className="flex items-center justify-between text-[#78350F] font-semibold">
                  <span>Authority: Sri Siddhi Vinayaka Utsava Committee</span>
                  <span className="font-mono text-[11px]">{result.receipt.verificationCode}</span>
                </div>
                <p className="text-[#292524]/75 text-[11px] leading-relaxed">
                  Location: Gandhinagar Anjayya Colony, Anakapalle. If you have handed over items at the Mandapam counter, please request the volunteer or committee admin to verify your receipt number.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 text-white font-bold text-xs hover:bg-stone-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Verify Another Receipt</span>
                </button>
                <button
                  onClick={() => onNavigate('/materials')}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] cursor-pointer"
                >
                  View Material Contributions
                </button>
              </div>
            </div>
          ) : result && result.verified && result.receipt ? (
            /* SUCCESS STATE */
            <div className="bg-[#FFFDF7] border-3 border-[#166534] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#166534]/20 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#166534]/15 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-[#166534]" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#166534]/15 text-[#166534] text-xs font-bold uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>✓ Verified Official Receipt</span>
                    </div>
                    <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-[#7F1D1D]">
                      Authentic Festival Record
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShareButton
                    title={`Verified Receipt ${result.receipt.receiptNumber}`}
                    text={`Official receipt ${result.receipt.receiptNumber} verified on Sri Siddhi Vinayaka Utsav platform.`}
                    url={window.location.origin + `/receipt/${result.receipt.receiptNumber}`}
                  />
                  <button
                    onClick={() => onNavigate(`/receipt/${result.receipt!.receiptNumber}`)}
                    className="px-4 py-2 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Official Receipt</span>
                  </button>
                </div>
              </div>

              {/* Receipt Details Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Receipt Number</span>
                  <span className="font-mono font-bold text-sm text-[#7F1D1D]">
                    {result.receipt.receiptNumber}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Date Issued</span>
                  <span className="font-semibold text-sm text-[#292524]">{result.receipt.date}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Contribution Type</span>
                  <span className="font-bold text-sm text-[#166534]">
                    {result.receipt.type === 'MONETARY' ? 'Monetary Seva' : 'Material Contribution'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Contributor</span>
                  <span className="font-bold text-sm text-[#292524]">
                    {result.receipt.anonymous ? 'Anonymous Devotee' : result.receipt.donorName}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#C9972B]/30 space-y-1 sm:col-span-2">
                  <span className="text-[#292524]/60 uppercase font-bold text-[10px] block">Contribution Value</span>
                  {result.receipt.type === 'MONETARY' ? (
                    <span className="font-extrabold text-lg text-[#166534]">
                      ₹{result.receipt.amount?.toLocaleString('en-IN')} via {result.receipt.paymentMethod || 'UPI'}
                    </span>
                  ) : (
                    <span className="font-extrabold text-base text-[#166534]">
                      {result.receipt.quantity} {result.receipt.unit} of {result.receipt.materialName}
                    </span>
                  )}
                </div>
              </div>

              {/* Committee & Verification metadata */}
              <div className="p-4 rounded-2xl bg-[#FEF3C7]/60 border border-[#C9972B]/30 text-xs space-y-2">
                <div className="flex items-center justify-between text-[#78350F] font-semibold">
                  <span>Authorized Authority: Sri Siddhi Vinayaka Utsava Committee</span>
                  <span className="font-mono text-[11px]">{result.receipt.verificationCode}</span>
                </div>
                <p className="text-[#292524]/75 text-[11px] leading-relaxed">
                  Location: Gandhinagar Anjayya Colony, Anakapalle, Andhra Pradesh. This digital record is verified
                  against the official festival accounts ledger for Ganesh Utsav 2026.
                </p>
              </div>
            </div>
          ) : (
            /* INVALID STATE */
            <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-red-300 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
                Receipt Could Not Be Verified
              </h2>
              <p className="text-xs sm:text-sm text-[#292524]/75 max-w-md mx-auto leading-relaxed">
                Please check the receipt number and try again. Ensure there are no typographical errors in the ID{' '}
                <code className="font-mono font-bold text-[#7F1D1D]">{searchId}</code>.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => onNavigate('/donations')}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] cursor-pointer"
                >
                  Browse Offerings Registry
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
