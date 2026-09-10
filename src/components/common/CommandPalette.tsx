import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Calendar,
  DollarSign,
  Package,
  Bell,
  FileText,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { svucStore } from '../../services/store';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : {};
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const donations = svucStore
    .getDonations()
    .filter((d) => d.status === 'Approved' || d.status === 'Verified');
  const expenses = svucStore.getExpenses();
  const events = svucStore.getEvents();
  const announcements = svucStore.getAnnouncements();
  const materials = svucStore
    .getMaterials()
    .filter((m) => m.status === 'Approved' || m.status === 'Verified');

  const q = query.trim().toLowerCase();

  const matchedDonations = q
    ? donations
        .filter(
          (d) =>
            d.donorName.toLowerCase().includes(q) ||
            d.receiptId.toLowerCase().includes(q) ||
            d.amount.toString().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchedExpenses = q
    ? expenses
        .filter(
          (e) =>
            e.expenseName.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            e.vendorName.toLowerCase().includes(q) ||
            e.receiptVoucherNo.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  const matchedEvents = q
    ? events
        .filter(
          (ev) =>
            ev.title.toLowerCase().includes(q) ||
            ev.category.toLowerCase().includes(q) ||
            ev.date.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const matchedAnnouncements = q
    ? announcements
        .filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const matchedMaterials = q
    ? materials
        .filter(
          (m) =>
            m.materialName.toLowerCase().includes(q) ||
            m.donorName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q) ||
            m.receiptId.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  const isReceiptQuery = q.startsWith('rec') || q.startsWith('don-') || q.startsWith('mat-');

  const handleSelect = (route: string) => {
    onNavigate(route);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:pt-20 sm:px-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full sm:max-w-2xl h-full sm:h-auto bg-[#FFF9ED] border-0 sm:border-2 border-[#C9972B] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#C9972B]/30 flex items-center gap-3 bg-[#FFFDF7]">
          <Search className="w-5 h-5 text-[#D97706] shrink-0" />
          <input
            type="text"
            placeholder="Search offerings, expenses, receipts, announcements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-base text-[#292524] placeholder:text-[#292524]/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-[#D97706]/10 rounded-full text-[#78350F] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#78350F] bg-[#D97706]/15 rounded-md hover:bg-[#D97706]/25 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* Quick Direct Receipt Verification prompt */}
          {isReceiptQuery && (
            <div className="p-3 rounded-xl bg-[#166534]/10 border border-[#166534] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#166534] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Receipt ID: "{query.toUpperCase()}"</span>
              </div>
              <button
                onClick={() => handleSelect(`/verify/${encodeURIComponent(query.toUpperCase())}`)}
                className="px-3 py-1 rounded-lg bg-[#166534] text-white text-xs font-bold hover:bg-[#15803d] flex items-center gap-1 cursor-pointer"
              >
                <span>Verify Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-[#292524]/70 space-y-3">
              <p className="text-sm font-medium">
                Type a donor name, amount (e.g. 5001), receipt ID, or festival topic.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleSelect('/transparency')}
                  className="px-3 py-1.5 rounded-lg bg-[#D97706]/10 text-[#7F1D1D] text-xs font-semibold hover:bg-[#D97706]/20 transition-colors cursor-pointer"
                >
                  📊 Financial Transparency
                </button>
                <button
                  onClick={() => handleSelect('/verify')}
                  className="px-3 py-1.5 rounded-lg bg-[#D97706]/10 text-[#7F1D1D] text-xs font-semibold hover:bg-[#D97706]/20 transition-colors cursor-pointer"
                >
                  🔍 Verify Receipt
                </button>
                <button
                  onClick={() => handleSelect('/announcements')}
                  className="px-3 py-1.5 rounded-lg bg-[#D97706]/10 text-[#7F1D1D] text-xs font-semibold hover:bg-[#D97706]/20 transition-colors cursor-pointer"
                >
                  📢 Announcements
                </button>
                <button
                  onClick={() => handleSelect('/donate')}
                  className="px-3 py-1.5 rounded-lg bg-[#7F1D1D] text-white text-xs font-semibold hover:bg-[#991B1B] transition-colors cursor-pointer"
                >
                  🙏 Offer Seva
                </button>
                <button
                  onClick={() => handleSelect('/materials')}
                  className="px-3 py-1.5 rounded-lg bg-[#166534] text-white text-xs font-semibold hover:bg-[#15803d] transition-colors cursor-pointer"
                >
                  📦 Material Seva
                </button>
              </div>
            </div>
          )}

          {/* Offerings matches */}
          {matchedDonations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#D97706]" /> Offerings
              </h4>
              <div className="space-y-1.5">
                {matchedDonations.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(`/receipt/${d.receiptId}`)}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#C9972B]/20 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#292524]">{d.donorName}</div>
                      <div className="text-xs text-[#292524]/60">
                        {d.receiptId} · {d.date} · {d.paymentMethod}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#166534]">₹{d.amount.toLocaleString('en-IN')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expenses matches */}
          {matchedExpenses.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#D97706]" /> Expenses
              </h4>
              <div className="space-y-1.5">
                {matchedExpenses.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => handleSelect('/expenses')}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#C9972B]/20 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#292524]">{e.expenseName}</div>
                      <div className="text-xs text-[#292524]/60">
                        {e.category} · {e.vendorName} · {e.receiptVoucherNo}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#7F1D1D]">₹{e.amount.toLocaleString('en-IN')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Materials matches */}
          {matchedMaterials.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#D97706]" /> Material Contributions
              </h4>
              <div className="space-y-1.5">
                {matchedMaterials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(`/receipt/${m.receiptId}`)}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#C9972B]/20 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#292524]">{m.materialName}</div>
                      <div className="text-xs text-[#292524]/60">
                        By {m.donorName} · {m.category} · {m.receiptId}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#D97706]">
                      {m.quantity} {m.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Announcements matches */}
          {matchedAnnouncements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#7F1D1D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#D97706]" /> Announcements
              </h4>
              <div className="space-y-1.5">
                {matchedAnnouncements.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelect(`/announcements/${a.id}`)}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#FEF3C7] border border-[#C9972B]/20 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#292524]">{a.title}</div>
                      <div className="text-xs text-[#292524]/60">
                        {a.date} · {a.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query &&
            matchedDonations.length === 0 &&
            matchedExpenses.length === 0 &&
            matchedMaterials.length === 0 &&
            matchedEvents.length === 0 &&
            matchedAnnouncements.length === 0 && (
              <div className="text-center py-8 text-[#292524]/60 space-y-2">
                <p className="text-base font-semibold">No records found matching "{query}"</p>
                <p className="text-xs">Try searching for a different name, date, or category.</p>
              </div>
            )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FEF3C7]/60 border-t border-[#C9972B]/30 flex items-center justify-between text-xs text-[#78350F]">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#166534]" />
            <span>Official Sri Siddhi Vinayaka Records Database</span>
          </div>
          <span className="text-[11px] opacity-75 hidden sm:inline">Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
