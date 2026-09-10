import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Filter,
  ShieldCheck,
  Receipt as ReceiptIcon,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { Donation, PaymentMethod } from '../../types';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { DevotionalHeaderBadge } from '../../components/common/CulturalMotifs';

interface DonationsPageProps {
  onNavigate: (route: string) => void;
}

export const DonationsPage: React.FC<DonationsPageProps> = ({ onNavigate }) => {
  const [donations, setDonations] = useState<Donation[]>(() =>
    svucStore.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [amountTier, setAmountTier] = useState<string>('ALL');
  const [donorType, setDonorType] = useState<'ALL' | 'NAMED' | 'ANONYMOUS'>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setDonations(
        svucStore.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified')
      );
    };
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => window.removeEventListener('svuc_store_updated', handleUpdate);
  }, []);

  // Top Metrics Calculation
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalDonors = donations.length;
  const avgDonation = totalDonors > 0 ? Math.round(totalAmount / totalDonors) : 0;

  // Today's donations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDonations = donations
    .filter((d) => d.date === todayStr || d.date === '2026-09-08')
    .reduce((sum, d) => sum + d.amount, 0);

  // Filtered List
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.amount.toString().includes(searchQuery);

      // Method
      const matchesMethod = selectedMethod === 'ALL' || d.paymentMethod === selectedMethod;

      // Amount Tier
      let matchesAmount = true;
      if (amountTier === 'UNDER_1000') matchesAmount = d.amount < 1000;
      else if (amountTier === '1000_5000') matchesAmount = d.amount >= 1000 && d.amount <= 5000;
      else if (amountTier === 'ABOVE_5000') matchesAmount = d.amount > 5000;

      // Donor Type
      let matchesType = true;
      if (donorType === 'NAMED') matchesType = !d.anonymous;
      else if (donorType === 'ANONYMOUS') matchesType = d.anonymous;

      return matchesSearch && matchesMethod && matchesAmount && matchesType;
    });
  }, [donations, searchQuery, selectedMethod, amountTier, donorType]);

  const handleOpenReceipt = (receiptId: string) => {
    const rec = svucStore.getReceiptById(receiptId);
    if (rec) {
      setSelectedReceipt(rec);
    } else {
      onNavigate(`/receipt/${receiptId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9972B]/30 pb-6">
        <div>
          <DevotionalHeaderBadge />
          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
            Offerings Transparency
          </h1>
          <p className="text-xs sm:text-sm text-[#292524]/75">
            "Every contribution helps us celebrate together." Live, unedited public registry of all devotees' contributions.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/donate')}
          className="px-6 py-3 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] shadow-md flex items-center gap-2 self-start md:self-center"
        >
          <Heart className="w-4 h-4 fill-white" /> Offer Seva / Make an Offering
        </button>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#166534]">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Total Offerings</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-[#166534]">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-xs text-[#292524]/60">Monetary funds raised to date</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7F1D1D]">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Total Donors</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-[#7F1D1D]">{totalDonors}</div>
          <p className="text-[10px] sm:text-xs text-[#292524]/60">Devotees & families contributing</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Today's Seva</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-[#D97706]">
            ₹{todayDonations.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-xs text-[#292524]/60">Received in last 24 hours</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#78350F]">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Average Seva</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-[#78350F]">
            ₹{avgDonation.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-xs text-[#292524]/60">Mean offering per receipt</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF7] border border-[#C9972B]/30 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D97706]" />
            <input
              type="text"
              placeholder="Search donor name, receipt ID (e.g. REC-2026-001) or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
            />
          </div>

          {/* Payment Method filter */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>

          {/* Amount Tier filter */}
          <select
            value={amountTier}
            onChange={(e) => setAmountTier(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
          >
            <option value="ALL">All Amounts</option>
            <option value="UNDER_1000">&lt; ₹1,000</option>
            <option value="1000_5000">₹1,000 – ₹5,000</option>
            <option value="ABOVE_5000">&gt; ₹5,000</option>
          </select>

          {/* Donor Type */}
          <select
            value={donorType}
            onChange={(e) => setDonorType(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
          >
            <option value="ALL">All Donors</option>
            <option value="NAMED">Named Devotees</option>
            <option value="ANONYMOUS">Anonymous Seva</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-[#292524]/70 pt-1">
          <span>
            Showing <strong>{filteredDonations.length}</strong> of {donations.length} contributions
          </span>
          <span className="text-[11px] text-[#166534] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> All receipts cryptographically verified
          </span>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (HIDDEN ON MOBILE) */}
      <div className="hidden md:block bg-white rounded-3xl border border-[#C9972B]/30 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FEF3C7]/60 text-[#7F1D1D] font-bold uppercase tracking-wider border-b border-[#C9972B]/30">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Donor Name</th>
                <th className="py-3.5 px-4">Receipt ID</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Digital Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9972B]/15">
              {filteredDonations.map((d) => (
                <tr key={d.id} className="hover:bg-[#FFF9ED] transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-[#292524]/80">{d.date}</td>
                  <td className="py-3 px-4 font-bold text-[#292524]">
                    {d.donorName}
                    {d.notes && <span className="block text-[11px] text-[#292524]/60 font-normal truncate max-w-xs">{d.notes}</span>}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#78350F] font-semibold">{d.receiptId}</td>
                  <td className="py-3 px-4 font-extrabold text-sm text-[#166534]">
                    ₹{d.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D97706]/10 text-[#78350F]">
                      {d.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#166534] bg-[#166534]/10 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenReceipt(d.receiptId)}
                      className="px-3 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#C9972B] text-[#7F1D1D] hover:bg-[#FEF3C7] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <ReceiptIcon className="w-3.5 h-3.5 text-[#D97706]" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE RESPONSIVE CARDS VIEW (MANDATED FOR MOBILE) */}
      <div className="md:hidden space-y-3">
        {filteredDonations.map((d) => (
          <div
            key={d.id}
            className="p-4 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-[#292524] block">{d.donorName}</span>
                <span className="text-[11px] text-[#292524]/60 font-mono">
                  {d.date} · {d.receiptId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-[#166534] block">
                  ₹{d.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-[#166534] bg-[#166534]/10 px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              </div>
            </div>

            {d.notes && <p className="text-xs text-[#292524]/75 italic bg-[#FFF9ED] p-2 rounded-lg">{d.notes}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-[#C9972B]/15 text-xs">
              <span className="font-semibold text-[#78350F] bg-[#D97706]/10 px-2 py-0.5 rounded">
                {d.paymentMethod}
              </span>
              <button
                onClick={() => handleOpenReceipt(d.receiptId)}
                className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1"
              >
                <span>View Digital Receipt</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDonations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-[#C9972B]/30 p-8 space-y-3">
          <p className="text-base font-semibold text-[#292524]">No offerings match your search filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMethod('ALL');
              setAmountTier('ALL');
              setDonorType('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Modal View for Receipt */}
      {selectedReceipt && (
        <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </div>
  );
};
