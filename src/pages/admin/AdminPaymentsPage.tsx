import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  ArrowUpRight,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { PaymentRecord, PaymentStatus } from '../../types';
import { useToast } from '../../components/common/Toast';
import { authService } from '../../services/authService';
import { svucStore } from '../../services/store';

interface AdminPaymentsPageProps {
  onNavigate?: (route: string) => void;
}

export const AdminPaymentsPage: React.FC<AdminPaymentsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const currentUser = authService.getCurrentUser();
  const [payments, setPayments] = useState<PaymentRecord[]>(() => paymentService.getPaymentRecords());
  const [reconciliation, setReconciliation] = useState(() => paymentService.getReconciliationSummary());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const refreshData = () => {
    setPayments(paymentService.getPaymentRecords());
    setReconciliation(paymentService.getReconciliationSummary());
  };

  const pendingDonationsCount = svucStore.getDonations().filter((d) => d.status === 'Pending').length;

  const handleRefundSubmit = () => {
    if (!refundTarget) return;
    if (!refundReason.trim()) {
      showToast('Please provide a mandatory justification for refunding.', 'error');
      return;
    }
    setRefundLoading(true);
    setTimeout(() => {
      const res = paymentService.processRefund(refundTarget.paymentId || refundTarget.id, refundReason.trim());
      setRefundLoading(false);
      if (res.success) {
        showToast(res.message, 'success');
        setRefundTarget(null);
        setRefundReason('');
        refreshData();
      } else {
        showToast(res.message, 'error');
      }
    }, 600);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.paymentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.donorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.receiptId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3" /> Paid & Verified
          </span>
        );
      case 'failed':
      case 'verification_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3" /> {status === 'verification_failed' ? 'Tampered / Failed' : 'Failed'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            Cancelled
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <RotateCcw className="w-3 h-3" /> Refunded
          </span>
        );
      case 'initiated':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <RefreshCw className="w-3 h-3 animate-spin" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#7F1D1D] font-['Cinzel',serif] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#D97706]" />
            Payment Gateway & Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Verify payment provider webhooks, reconcile ledger discrepancies, and manage refunds.
          </p>
        </div>

        <button
          onClick={refreshData}
          className="px-3.5 py-2 bg-white border border-[#C9972B] text-[#78350F] rounded-xl text-xs font-bold hover:bg-[#FEF3C7] flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Strict Audit: Pending Offerings Awaiting Approval in Payments */}
      {pendingDonationsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{pendingDonationsCount} Devotee Payment{pendingDonationsCount > 1 ? 's' : ''} Awaiting Committee Audit</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                  Treasurer Action
                </span>
              </h3>
              <p className="text-xs text-amber-800">
                Online payments are recorded, but devotee offerings are held in Pending Verification until Super Admin or Treasurer clicks "Verify & Approve" in the Offerings Ledger.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/admin/donations')}
              className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              Go to Offerings Audit Queue &rarr;
            </button>
          )}
        </div>
      )}

      {/* Section 123: Critical Discrepancy Warning */}
      {reconciliation.hasDiscrepancy && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-950">
              Financial reconciliation requires attention.
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Total verified online payments (₹{reconciliation.totalVerifiedOnlineAmount.toLocaleString('en-IN')}) do not
              match approved online offering records (₹{reconciliation.totalApprovedOnlineDonations.toLocaleString('en-IN')}).
              A discrepancy of <strong>₹{reconciliation.difference.toLocaleString('en-IN')}</strong> was detected.
            </p>
            {reconciliation.unmatchedCount > 0 && (
              <p className="text-xs text-amber-900 font-semibold pt-1">
                Notice: {reconciliation.unmatchedCount} payment(s) were received but have no approved offering linked.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reconciliation Metrics Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Verified Online Total</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700">
            ₹{reconciliation.totalVerifiedOnlineAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-stone-500 block">{reconciliation.verifiedCount} Successful txns</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Approved Offerings Total</span>
          <span className="text-xl sm:text-2xl font-black text-[#7F1D1D]">
            ₹{reconciliation.totalApprovedOnlineDonations.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-stone-500 block">{reconciliation.approvedCount} Approved records</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Discrepancy Difference</span>
          <span className={`text-xl sm:text-2xl font-black ${reconciliation.hasDiscrepancy ? 'text-amber-600' : 'text-emerald-600'}`}>
            ₹{reconciliation.difference.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-stone-500 block">
            {reconciliation.hasDiscrepancy ? 'Requires manual audit' : 'Ledger in balance'}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500 block">Unmatched / Failed</span>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-red-600">
              {reconciliation.failedCount}
            </span>
            <span className="text-xs text-stone-500">failed / {reconciliation.unmatchedCount} unmatched</span>
          </div>
          <span className="text-[11px] text-stone-500 block">Security review</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID, Donor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#C9972B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'paid', 'failed', 'cancelled', 'refunded'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#7F1D1D] text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {st === 'ALL' ? 'All Transactions' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFFDF7] border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Payment / Order ID</th>
                <th className="py-3 px-4">Devotee / Contributor</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Gateway</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No transactions matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">
                      <div className="flex flex-col">
                        <span className="text-[#7F1D1D] font-bold">{p.paymentId || 'N/A (Pending)'}</span>
                        <span className="text-[10px] text-stone-400">{p.orderId}</span>
                        {p.isDemo && (
                          <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">DEMO TXN</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {p.donorName}
                      {p.donorPhone && <span className="block text-[10px] text-stone-500 font-normal">{p.donorPhone}</span>}
                    </td>
                    <td className="py-3 px-4 font-black text-stone-900 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-800">{p.paymentMethod}</span>
                      <span className="block text-[10px] text-stone-500">{p.paymentProvider}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-800">
                      {p.receiptId || (
                        <span className="text-stone-400 italic font-normal text-[11px]">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                      {p.createdAt ? p.createdAt.slice(0, 10) : 'Today'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'paid' && (
                        <button
                          onClick={() => {
                            setRefundTarget(p);
                            setRefundReason('');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 text-[11px] font-bold cursor-pointer transition-all"
                        >
                          Process Refund
                        </button>
                      )}
                      {p.errorMessage && (
                        <span className="block text-[10px] text-red-600 truncate max-w-[140px]" title={p.errorMessage}>
                          {p.errorMessage}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full my-auto border-2 border-[#C9972B] shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-base border-b border-stone-200 pb-3">
                <RotateCcw className="w-5 h-5" />
                <span>Process Official Seva Refund</span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                You are recording a refund for transaction <strong className="font-mono">{refundTarget.paymentId || refundTarget.id}</strong> of <strong>₹{refundTarget.amount.toLocaleString('en-IN')}</strong> from <strong>{refundTarget.donorName}</strong>.
              </p>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-stone-800 block">
                  Mandatory Administrative Reason: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Duplicate payment charged during bank timeout / donor request approved by Treasurer"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#C9972B]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-[11px] text-amber-900 space-y-1">
                <strong>Audit Notice:</strong> This action will mark the payment record as refunded, archive the linked donation, deduct ₹{refundTarget.amount.toLocaleString('en-IN')} from festival totals, and record an immutable entry in the audit trail.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={refundLoading}
                  onClick={handleRefundSubmit}
                  className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {refundLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Refund</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
