import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  DollarSign,
  ShieldCheck,
  Calendar,
  Building,
  Eye,
  TrendingDown,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { svucStore, deduplicateExpenses } from '../../services/store';
import { Expense, ExpenseCategory } from '../../types';
import { BillModal } from '../../components/common/BillModal';
import { DevotionalHeaderBadge } from '../../components/common/CulturalMotifs';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '../../services/firebase/firestoreService';

interface ExpensesPageProps {
  onNavigate: (route: string) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Mandapam Setup',
  'Pooja Materials',
  'Decoration',
  'Sound & Lighting',
  'Electricity',
  'Annadanam / Food',
  'Cultural Events',
  'Cleaning & Sanitation',
  'Transport & Logistics',
  'Visarjan Arrangements',
  'Printing & Media',
  'Other',
];

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onNavigate }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => svucStore.getExpenses());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedExpenseForBill, setSelectedExpenseForBill] = useState<Expense | null>(null);

  React.useEffect(() => {
    // 1. Initial local load
    setExpenses(svucStore.getExpenses());

    // 2. Real-time Cloud Firestore live listener across all network devices
    let unsubscribe: (() => void) | undefined;
    if (isFirebaseConfigured() && db) {
      try {
        unsubscribe = onSnapshot(
          collection(db, COLLECTIONS.EXPENSES),
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
            const deduped = deduplicateExpenses(list);
            const approved = deduped.filter((e) => e.status === 'Approved' || e.status === 'Paid');
            setExpenses(approved);
          },
          (err) => console.warn('[Live Expenses Firestore Stream]', err)
        );
      } catch (err) {
        console.warn('[Expenses Firestore Listen Error]', err);
      }
    }

    const handleUpdate = () => {
      const list = svucStore.getExpenses().filter((e) => e.status === 'Approved' || e.status === 'Paid');
      setExpenses(list);
    };
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('svuc_store_updated', handleUpdate);
    };
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCount = expenses.length;

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.expenseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.receiptVoucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.amount.toString().includes(searchQuery);

      const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9972B]/30 pb-6">
        <div>
          <DevotionalHeaderBadge />
          <h1 className="font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl font-black text-[#7F1D1D] mt-2">
            Festival Expenses
          </h1>
          <p className="text-xs sm:text-sm text-[#292524]/75">
            "Transparency in every rupee spent." Every contractor bill, pooja material receipt, and municipal fee is logged
            and publicly auditable.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/transparency')}
          className="px-6 py-3 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm hover:bg-[#991B1B] shadow-md flex items-center gap-2 self-start md:self-center"
        >
          <ShieldCheck className="w-4 h-4 text-[#4ADE80]" /> Complete Balance Sheet
        </button>
      </div>

      {/* Top 3 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7F1D1D]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Expenses</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#7F1D1D]">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-[#292524]/60">Disbursed for Ganesh Utsav 2026</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#D97706]">
            <span className="text-xs font-bold uppercase tracking-wider">Audited Vouchers</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D97706]">{totalCount} Vouchers</div>
          <p className="text-xs text-[#292524]/60">Verified bills and payment slips</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#166534]">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Status</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#166534]">100% Verified</div>
          <p className="text-xs text-[#292524]/60">Approved by Committee Treasurer</p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF7] border border-[#C9972B]/30 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D97706]" />
            <input
              type="text"
              placeholder="Search by expense, vendor, voucher number (e.g. VCH-2026-101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-xl bg-white border border-[#C9972B]/30 outline-none focus:border-[#D97706]"
          >
            <option value="ALL">All Expense Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-[#292524]/70 pt-1">
          <span>
            Showing <strong>{filteredExpenses.length}</strong> of {expenses.length} audited expense vouchers
          </span>
          <span className="text-[11px] text-[#7F1D1D] font-semibold">
            All invoices watermarked with official seal
          </span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-[#C9972B]/30 shadow-md overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#FEF3C7]/60 text-[#7F1D1D] font-bold uppercase tracking-wider border-b border-[#C9972B]/30">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Voucher No.</th>
              <th className="py-3.5 px-4">Expense Particulars</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Vendor Name</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4 text-right">Invoice / Bill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C9972B]/15">
            {filteredExpenses.map((e) => (
              <tr key={e.id} className="hover:bg-[#FFF9ED] transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-[#292524]/80">{e.date}</td>
                <td className="py-3 px-4 font-mono text-xs font-bold text-[#78350F]">{e.receiptVoucherNo}</td>
                <td className="py-3 px-4 font-bold text-[#292524]">
                  {e.expenseName}
                  <span className="block text-[11px] text-[#292524]/60 font-normal truncate max-w-xs">
                    {e.description}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D97706]/10 text-[#78350F]">
                    {e.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#292524]/80 font-medium">{e.vendorName}</td>
                <td className="py-3 px-4 font-extrabold text-sm text-[#7F1D1D]">
                  ₹{e.amount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right">
                  {e.billUrl ? (
                    <button
                      onClick={() => setSelectedExpenseForBill(e)}
                      className="px-3 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#C9972B] text-[#7F1D1D] hover:bg-[#FEF3C7] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D97706]" /> View Bill
                    </button>
                  ) : (
                    <span className="text-xs text-[#292524]/40 italic">Manual Entry</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards */}
      <div className="md:hidden space-y-3">
        {filteredExpenses.map((e) => (
          <div key={e.id} className="p-4 rounded-2xl bg-white border border-[#C9972B]/30 shadow-xs space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-bold text-[#292524] block">{e.expenseName}</span>
                <span className="text-[11px] text-[#292524]/60 font-mono">
                  {e.date} · {e.receiptVoucherNo}
                </span>
              </div>
              <span className="text-base font-black text-[#7F1D1D]">
                ₹{e.amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="text-xs text-[#292524]/80 bg-[#FFF9ED] p-2 rounded-lg">
              <span className="font-semibold text-[#78350F]">Vendor:</span> {e.vendorName}
              <br />
              <span className="text-[11px] text-[#292524]/65">{e.description}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#C9972B]/15">
              <span className="px-2 py-0.5 rounded bg-[#D97706]/10 text-[#78350F] font-medium text-[11px]">
                {e.category}
              </span>
              {e.billUrl ? (
                <button
                  onClick={() => setSelectedExpenseForBill(e)}
                  className="text-xs font-bold text-[#7F1D1D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Voucher</span>
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Bill Preview Modal */}
      {selectedExpenseForBill && (
        <BillModal
          expense={selectedExpenseForBill}
          onClose={() => setSelectedExpenseForBill(null)}
        />
      )}
    </div>
  );
};
