import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  RefreshCw,
  Eye,
  Filter,
  Sparkles,
  Clock,
} from 'lucide-react';
import { svucStore, deduplicateReceipts } from '../../services/store';
import { Receipt } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { useToast } from '../../components/common/Toast';
import { pdfReceiptService } from '../../services/pdfReceiptService';
import { authService } from '../../services/authService';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { onSnapshot, collection } from 'firebase/firestore';

export const AdminReceiptsPage: React.FC = () => {
  const { showToast } = useToast();
  const currentUser = authService.getCurrentUser();
  const [receipts, setReceipts] = useState<Receipt[]>(() => svucStore.getReceipts());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MONETARY' | 'MATERIAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'VOID'>('ALL');

  // Modal states
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [voidTarget, setVoidTarget] = useState<Receipt | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const refreshList = () => {
    setReceipts(svucStore.getReceipts());
  };

  useEffect(() => {
    // 1. Initial load
    setReceipts(svucStore.getReceipts());

    // 2. Real-time Firestore live listener
    let unsub: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      try {
        unsub = onSnapshot(collection(db, 'receipts'), (snapshot) => {
          const live = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Receipt));
          const deduped = deduplicateReceipts(live);
          setReceipts(deduped);
        });
      } catch (err) {
        console.warn('[Receipts snapshot listener error]', err);
      }
    }

    // 3. Instant local store event for 0ms immediate UI update
    const handleUpdate = () => refreshList();
    window.addEventListener('svuc_store_updated', handleUpdate);

    return () => {
      if (unsub) unsub();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  const handleDownloadPdf = async (r: Receipt) => {
    try {
      const fileName = await pdfReceiptService.generateReceiptPdf(r, svucStore.getSettings());
      showToast(`Downloaded official PDF receipt: ${fileName}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF', 'error');
    }
  };

  const handleRegenerate = (r: Receipt) => {
    const updated = svucStore.regenerateReceipt(r.receiptNumber);
    if (updated) {
      showToast(`Receipt ${r.receiptNumber} regenerated. Logged in audit trail.`, 'success');
      refreshList();
    }
  };

  const handleVoidSubmit = () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      showToast('Please provide a mandatory reason for voiding this receipt.', 'error');
      return;
    }

    setVoidLoading(true);
    setTimeout(() => {
      const success = svucStore.voidReceipt(voidTarget.receiptNumber, voidReason.trim());
      setVoidLoading(false);
      if (success) {
        showToast(`Receipt ${voidTarget.receiptNumber} marked as VOID. Historical record preserved.`, 'success');
        setVoidTarget(null);
        setVoidReason('');
        refreshList();
      } else {
        showToast('Failed to void receipt', 'error');
      }
    }, 500);
  };

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.verificationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.materialName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VOID'
        ? r.status === 'VOID' || r.status === 'REVOKED'
        : statusFilter === 'PENDING'
        ? r.status === 'PENDING'
        : r.status === 'VERIFIED');

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#7F1D1D] font-['Cinzel',serif] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#D97706]" />
            Official Receipts Ledger & Audit
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Immutable registry of all monetary and material receipts with cryptographic verification tracking.
          </p>
        </div>

        <button
          onClick={refreshList}
          className="px-3.5 py-2 bg-white border border-[#C9972B] text-[#78350F] rounded-xl text-xs font-bold hover:bg-[#FEF3C7] flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Receipts
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Receipt No, Donor, Material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#C9972B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['ALL', 'MONETARY', 'MATERIAL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === t ? 'bg-white text-[#7F1D1D] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t === 'MONETARY' ? 'Monetary' : 'Material'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['ALL', 'VERIFIED', 'PENDING', 'VOID'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === s ? 'bg-white text-[#7F1D1D] shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s === 'VERIFIED' ? 'Verified' : s === 'PENDING' ? 'Pending' : 'Void / Cancelled'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFFDF7] border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Devotee Name</th>
                <th className="py-3 px-4">Contribution Details</th>
                <th className="py-3 px-4">Issued Date & By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No receipts match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const isVoid = r.status === 'VOID' || r.status === 'REVOKED';
                  return (
                    <tr key={r.id} className={`hover:bg-stone-50 transition-colors ${isVoid ? 'bg-red-50/40' : ''}`}>
                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold text-xs ${isVoid ? 'text-red-700 line-through' : 'text-[#7F1D1D]'}`}>
                          {r.receiptNumber}
                        </span>
                        <span className="block text-[10px] text-stone-400 font-normal truncate max-w-[140px]">
                          {r.verificationCode}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.type === 'MONETARY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {r.type === 'MONETARY' ? 'Monetary Seva' : 'Material Seva'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {r.anonymous ? 'Devotee (Anonymous)' : r.donorName}
                      </td>

                      <td className="py-3 px-4">
                        {r.type === 'MONETARY' ? (
                          <div>
                            <span className="font-black text-emerald-700 text-sm">
                              ₹{(r.amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="block text-[10px] text-stone-500">{r.paymentMethod || 'UPI'}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-[#D97706]">
                              {r.quantity} {r.unit}
                            </span>
                            <span className="block text-[10px] text-stone-600">{r.materialName}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-stone-600">
                        <span className="font-medium text-stone-800 block">{r.date}</span>
                        <span className="text-[10px] text-stone-500">
                          {(!r.issuedBy || /satyam|treasurer|portal/i.test(r.issuedBy)) ? 'Utsav Committee' : r.issuedBy}
                        </span>
                        {r.regeneratedAt && (
                          <span className="text-[9px] text-amber-700 font-semibold block">
                            Regenerated: {r.regeneratedAt.slice(0, 10)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isVoid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-800 border border-red-300">
                            <XCircle className="w-3 h-3" /> VOID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewReceipt(r)}
                            title="View Official Receipt"
                            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200 hover:text-stone-900 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(r)}
                            title="Download Official PDF"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {!isVoid && (
                            <>
                              <button
                                onClick={() => handleRegenerate(r)}
                                title="Regenerate Receipt (Section 32)"
                                className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setVoidTarget(r);
                                  setVoidReason('');
                                }}
                                title="Void Receipt (Section 33)"
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {viewReceipt && (
        <ReceiptModal receipt={viewReceipt} showPrint={true} onClose={() => setViewReceipt(null)} />
      )}

      {/* Void Modal (Section 33) */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full my-auto border-2 border-red-400 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-700 font-bold text-base border-b border-stone-200 pb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Void Official Receipt: {voidTarget.receiptNumber}</span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                In accordance with committee policy, voiding marks this receipt as invalid and displays a prominent <strong>VOID RECEIPT</strong> watermark if viewed or scanned online. The historical audit entry will be preserved permanently.
              </p>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-stone-800 block">
                  Mandatory Voiding Reason: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter reason for voiding receipt (e.g. Cancelled due to duplicate entry or transaction reversal)..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={voidLoading}
                  onClick={handleVoidSubmit}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {voidLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Void</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
