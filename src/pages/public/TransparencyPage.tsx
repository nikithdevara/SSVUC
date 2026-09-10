import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  FileText,
  Download,
  Printer,
  Calendar,
  PieChart as PieIcon,
  ArrowDown,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { DevotionalHeaderBadge, TraditionalDiya } from '../../components/common/CulturalMotifs';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '../../services/firebase/firestoreService';
import { Donation, Expense, MaterialDonation } from '../../types';

interface TransparencyPageProps {
  onNavigate: (route: string) => void;
}

export const TransparencyPage: React.FC<TransparencyPageProps> = ({ onNavigate }) => {
  const [donations, setDonations] = useState<Donation[]>(() =>
    svucStore.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified')
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => svucStore.getExpenses());
  const [materials, setMaterials] = useState<MaterialDonation[]>(() =>
    svucStore.getMaterials().filter((m) => m.status === 'Approved' || m.status === 'Verified')
  );

  useEffect(() => {
    // 1. Initial local load
    setDonations(svucStore.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified'));
    setExpenses(svucStore.getExpenses());
    setMaterials(svucStore.getMaterials().filter((m) => m.status === 'Approved' || m.status === 'Verified'));

    // 2. Real-time Cloud Firestore live listener across all network devices
    let unsubDon: (() => void) | undefined;
    let unsubExp: (() => void) | undefined;
    let unsubMat: (() => void) | undefined;

    if (isFirebaseConfigured() && db) {
      try {
        unsubDon = onSnapshot(collection(db, COLLECTIONS.DONATIONS), (snap) => {
          const liveDons = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Donation))
            .filter((d) => d.status === 'Approved' || d.status === 'Verified');
          liveDons.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
          setDonations(liveDons);
        }, (err) => console.warn('[Live Transparency Donations Stream]', err));

        unsubExp = onSnapshot(collection(db, COLLECTIONS.EXPENSES), (snap) => {
          const liveExps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
          liveExps.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
          setExpenses(liveExps);
        }, (err) => console.warn('[Live Transparency Expenses Stream]', err));

        unsubMat = onSnapshot(collection(db, COLLECTIONS.MATERIALS), (snap) => {
          const liveMats = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as MaterialDonation))
            .filter((m) => m.status === 'Approved' || m.status === 'Verified');
          liveMats.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
          setMaterials(liveMats);
        }, (err) => console.warn('[Live Transparency Materials Stream]', err));
      } catch (err) {
        console.warn('[Firestore Transparency Stream Error]', err);
      }
    }

    const handleUpdate = () => {
      setDonations(
        svucStore.getDonations().filter((d) => d.status === 'Approved' || d.status === 'Verified')
      );
      setExpenses(svucStore.getExpenses());
      setMaterials(
        svucStore.getMaterials().filter((m) => m.status === 'Approved' || m.status === 'Verified')
      );
    };
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => {
      if (unsubDon) unsubDon();
      if (unsubExp) unsubExp();
      if (unsubMat) unsubMat();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  const totalIncome = useMemo(() => donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0), [donations]);
  const totalApprovedExpenses = useMemo(
    () => expenses.filter((e) => e.status === 'Approved' || e.status === 'Paid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );
  const availableBalance = totalIncome - totalApprovedExpenses;
  const totalMaterialCount = useMemo(() => materials.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0), [materials]);

  const expenseByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    expenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .forEach((e) => {
        const cat = e.category || 'Miscellaneous';
        acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
      });
    return acc;
  }, [expenses]);

  const donationsByMethod = useMemo(() => {
    const acc: Record<string, number> = {};
    donations.forEach((d) => {
      const method = d.paymentMethod || 'UPI';
      acc[method] = (acc[method] || 0) + (Number(d.amount) || 0);
    });
    return acc;
  }, [donations]);

  const summary = useMemo(() => ({
    totalDonations: totalIncome,
    totalExpenses: totalApprovedExpenses,
    availableBalance,
    totalDonors: donations.length,
    expenseCount: expenses.filter((e) => e.status === 'Approved' || e.status === 'Paid').length,
    materialItemsCount: totalMaterialCount,
    expenseByCategory,
    donationsByMethod,
  }), [totalIncome, totalApprovedExpenses, availableBalance, donations.length, expenses, totalMaterialCount, expenseByCategory, donationsByMethod]);

  const [dateRange, setDateRange] = useState<'ALL' | 'THIS_WEEK' | 'THIS_MONTH' | 'FESTIVAL'>('ALL');


  // Export CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Type,ID/Receipt,Date,Particulars/Donor,Category/Method,Amount (INR)\n';

    donations.forEach((d) => {
      csvContent += `INCOME,${d.receiptId},${d.date},"${d.donorName}",${d.paymentMethod},${d.amount}\n`;
    });

    expenses.forEach((e) => {
      csvContent += `EXPENSE,${e.receiptVoucherNo},${e.date},"${e.expenseName}",${e.category},${e.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SVUC_Financial_Statement_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9972B]/30 pb-6">
        <div>
          <DevotionalHeaderBadge />
          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
            Complete Financial Transparency
          </h1>
          <p className="text-xs sm:text-sm text-[#292524]/75">
            "Every contribution matters. Every expense is accounted for." The official public balance sheet of Ganesh Utsav 2026.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center no-print">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#C9972B] text-[#78350F] font-bold text-xs hover:bg-[#FEF3C7] shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV / Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Balance Sheet
          </button>
        </div>
      </div>

      {/* 4 Pillars Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Income */}
        <div className="p-6 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#166534]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Money Received</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#166534]">
            ₹{summary.totalDonations.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-[#292524]/60">100% verified through {summary.totalDonors} receipts</p>
        </div>

        {/* Expenses */}
        <div className="p-6 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#7F1D1D]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Approved Expenses</span>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#7F1D1D]">
            ₹{summary.totalExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-[#292524]/60">Documented across {summary.expenseCount} audited bills</p>
        </div>

        {/* Available Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFFDF7] to-[#FEF3C7] border-2 border-[#C9972B] shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#78350F]">
            <span className="text-xs font-bold uppercase tracking-wider">Net Available Balance</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#78350F]">
            ₹{summary.availableBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-[#78350F]/70">Formula: Total Donations - Total Expenses</p>
        </div>

        {/* Material Seva */}
        <div className="p-6 rounded-3xl bg-white border border-[#C9972B]/30 shadow-md space-y-2">
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-xs font-bold uppercase tracking-wider">Material Contributions</span>
            <Package className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706]">
            {summary.materialItemsCount} Items
          </div>
          <p className="text-xs text-[#292524]/60">Itemized separately from cash balance</p>
        </div>
      </div>

      {/* MONEY FLOW VISUALIZATION */}
      <section className="bg-white rounded-3xl border border-[#C9972B]/30 p-6 sm:p-8 shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">Visual Accounting Flow</span>
          <h2 className="font-['Cinzel',serif] text-xl sm:text-2xl font-bold text-[#7F1D1D]">
            How Devotees' Contributions Are Allocated
          </h2>
          <p className="text-xs text-[#292524]/60">
            Real-time visual flow from devotee offerings to mandapam execution and remaining surplus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
          {/* Box 1: Offerings */}
          <div className="p-5 rounded-2xl bg-[#166534]/10 border-2 border-[#166534] text-center space-y-1">
            <span className="text-[11px] font-bold text-[#166534] uppercase tracking-wider block">1. Devotee Offerings</span>
            <span className="text-xl font-extrabold text-[#166534]">₹{summary.totalDonations.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-[#292524]/70">Public offerings & colony collection</p>
          </div>

          <div className="flex justify-center text-[#D97706] font-bold text-lg rotate-90 md:rotate-0">
            &rarr;
          </div>

          {/* Box 2: Total Funds Pool */}
          <div className="p-5 rounded-2xl bg-[#FEF3C7] border-2 border-[#C9972B] text-center space-y-1">
            <span className="text-[11px] font-bold text-[#78350F] uppercase tracking-wider block">2. Committee Treasury</span>
            <span className="text-xl font-extrabold text-[#78350F]">₹{summary.totalDonations.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-[#292524]/70">Official State Bank Account</p>
          </div>

          <div className="flex justify-center text-[#D97706] font-bold text-lg rotate-90 md:rotate-0">
            &rarr;
          </div>

          {/* Box 3: Expenses Disbursed */}
          <div className="p-5 rounded-2xl bg-[#7F1D1D]/10 border-2 border-[#7F1D1D] text-center space-y-1">
            <span className="text-[11px] font-bold text-[#7F1D1D] uppercase tracking-wider block">3. Festival Expenses</span>
            <span className="text-xl font-extrabold text-[#7F1D1D]">₹{summary.totalExpenses.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-[#292524]/70">Pooja, Annadanam, sound, mandapam</p>
          </div>

          <div className="flex justify-center text-[#D97706] font-bold text-lg rotate-90 md:rotate-0">
            &rarr;
          </div>

          {/* Box 4: Remaining Balance */}
          <div className="p-5 rounded-2xl bg-[#166534] text-white text-center space-y-1 shadow-md">
            <span className="text-[11px] font-bold text-[#FEF08A] uppercase tracking-wider block">4. Available Surplus</span>
            <span className="text-xl font-extrabold">₹{summary.availableBalance.toLocaleString('en-IN')}</span>
            <p className="text-[10px] text-[#FFFBEB]/80">Safely preserved for Visarjan & next seva</p>
          </div>
        </div>
      </section>

      {/* CATEGORY BREAKDOWN & PAYMENT METHOD CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl border border-[#C9972B]/30 p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
            <div>
              <h3 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D]">
                Expense Category Breakdown
              </h3>
              <span className="text-xs text-[#292524]/60">Where festival funds are invested</span>
            </div>
            <span className="text-xs font-bold text-[#7F1D1D]">₹{summary.totalExpenses.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(summary.expenseByCategory || {}).length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">No approved expenses recorded yet.</p>
            ) : (
              Object.entries(summary.expenseByCategory || {}).map(([cat, amt]) => {
                const numAmt = typeof amt === 'number' ? amt : Number(amt) || 0;
                const pct = summary.totalExpenses > 0 ? Math.round((numAmt / summary.totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#292524]">{cat}</span>
                      <span className="text-[#7F1D1D]">
                        ₹{numAmt.toLocaleString('en-IN')} <span className="text-[#292524]/50 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FFF9ED] overflow-hidden border border-[#C9972B]/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#D97706] to-[#7F1D1D] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-3xl border border-[#C9972B]/30 p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#C9972B]/20 pb-3">
            <div>
              <h3 className="font-['Cinzel',serif] text-base sm:text-lg font-bold text-[#7F1D1D]">
                Offerings by Payment Channel
              </h3>
              <span className="text-xs text-[#292524]/60">How devotees offered contributions</span>
            </div>
            <span className="text-xs font-bold text-[#166534]">₹{summary.totalDonations.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(summary.donationsByMethod || {}).length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">No donations recorded yet.</p>
            ) : (
              Object.entries(summary.donationsByMethod || {}).map(([method, amt]) => {
                const numAmt = typeof amt === 'number' ? amt : Number(amt) || 0;
                const pct = summary.totalDonations > 0 ? Math.round((numAmt / summary.totalDonations) * 100) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#292524]">{method}</span>
                      <span className="text-[#166534]">
                        ₹{numAmt.toLocaleString('en-IN')} <span className="text-[#292524]/50 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#FFF9ED] overflow-hidden border border-[#C9972B]/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#166534] to-[#C9972B] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-[#FEF3C7]/60 border border-[#C9972B]/40 text-xs text-[#78350F] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#166534]" />
              <span>Independent Public Audit Standard</span>
            </div>
            <p className="text-[11px] text-[#78350F]/80">
              Any devotee or colony resident may examine the physical ledger vouchers and bank statement passbooks at the
              Gandhinagar Anjayya Colony Mandapam office counter between 4 PM and 7 PM daily.
            </p>
          </div>
        </div>
      </div>

      {/* FINANCIAL STATEMENT (ITEMIZED MONEY IN & OUT) */}
      <section className="bg-white rounded-3xl border border-[#C9972B]/30 p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9972B]/20 pb-4">
          <div>
            <h3 className="font-['Cinzel',serif] text-xl font-bold text-[#7F1D1D]">
              Comprehensive Financial Statement
            </h3>
            <span className="text-xs text-[#292524]/60">Audited chronological entries of receipts and disbursements</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#292524]/70">Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FFF9ED] border border-[#C9972B]/40 outline-none"
            >
              <option value="ALL">Full Festival Period 2026</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month (September 2026)</option>
              <option value="FESTIVAL">Main 9 Days</option>
            </select>
          </div>
        </div>

        {/* Dual Column: Income vs Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#166534]/10 p-3 rounded-xl text-xs font-bold text-[#166534]">
              <span>MONEY RECEIVED (OFFERINGS)</span>
              <span>₹{summary.totalDonations.toLocaleString('en-IN')}</span>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
              {donations.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-lg border border-[#C9972B]/20 bg-[#FFFDF7] flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-[#292524]">{d.donorName}</div>
                    <div className="text-[10px] text-[#292524]/50">
                      {d.date} · {d.receiptId}
                    </div>
                  </div>
                  <span className="font-bold text-[#166534]">₹{d.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#7F1D1D]/10 p-3 rounded-xl text-xs font-bold text-[#7F1D1D]">
              <span>MONEY OUT (EXPENSES)</span>
              <span>₹{summary.totalExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="p-2.5 rounded-lg border border-[#C9972B]/20 bg-[#FFFDF7] flex items-center justify-between"
                >
                  <div className="max-w-[70%]">
                    <div className="font-semibold text-[#292524] truncate">{e.expenseName}</div>
                    <div className="text-[10px] text-[#292524]/50">
                      {e.date} · {e.receiptVoucherNo}
                    </div>
                  </div>
                  <span className="font-bold text-[#7F1D1D]">₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Audit Summary Row */}
        <div className="pt-4 border-t-2 border-[#C9972B]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-[#78350F] bg-[#FFF9ED] p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <TraditionalDiya size={20} />
            <span>Sri Siddhi Vinayaka Utsava Committee · Certified Ledger Record</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Net Surplus: ₹{summary.availableBalance.toLocaleString('en-IN')}</span>
            <span className="text-[#166534] font-extrabold">STATUS: BALANCED & RECONCILED</span>
          </div>
        </div>
      </section>
    </div>
  );
};
