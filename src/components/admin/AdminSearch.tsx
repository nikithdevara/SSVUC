import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  DollarSign,
  Package,
  Receipt,
  Calendar,
  Bell,
  Users,
  FileText,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { svucStore } from '../../services/store';

interface AdminSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const AdminSearch: React.FC<AdminSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const clean = query.trim().toLowerCase();

  // Search through records
  const donations = svucStore.getDonations().filter(
    (d) =>
      clean &&
      (d.donorName.toLowerCase().includes(clean) ||
        d.receiptId.toLowerCase().includes(clean) ||
        d.id.toLowerCase().includes(clean) ||
        String(d.amount).includes(clean))
  );

  const materials = svucStore.getMaterials().filter(
    (m) =>
      clean &&
      (m.donorName.toLowerCase().includes(clean) ||
        m.materialName.toLowerCase().includes(clean) ||
        m.receiptId.toLowerCase().includes(clean) ||
        m.id.toLowerCase().includes(clean))
  );

  const expenses = svucStore.getExpenses().filter(
    (e) =>
      clean &&
      (e.expenseName.toLowerCase().includes(clean) ||
        e.vendorName.toLowerCase().includes(clean) ||
        e.receiptVoucherNo.toLowerCase().includes(clean) ||
        e.id.toLowerCase().includes(clean))
  );

  const events = svucStore.getEvents().filter(
    (e) =>
      clean &&
      (e.title.toLowerCase().includes(clean) ||
        e.category.toLowerCase().includes(clean) ||
        e.description.toLowerCase().includes(clean))
  );

  const announcements = svucStore.getAnnouncements().filter(
    (a) =>
      clean &&
      (a.title.toLowerCase().includes(clean) ||
        a.category.toLowerCase().includes(clean) ||
        a.content.toLowerCase().includes(clean))
  );

  const users = svucStore.getAdminUsers().filter(
    (u) =>
      clean &&
      (u.name.toLowerCase().includes(clean) ||
        u.email.toLowerCase().includes(clean) ||
        u.role.toLowerCase().includes(clean))
  );

  const hasResults =
    donations.length > 0 ||
    materials.length > 0 ||
    expenses.length > 0 ||
    events.length > 0 ||
    announcements.length > 0 ||
    users.length > 0;

  const handleSelect = (route: string) => {
    onClose();
    onNavigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-stone-200">
          <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search offerings, vouchers, materials, events, users..."
            className="flex-1 text-sm bg-transparent outline-hidden text-stone-900 placeholder:text-stone-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold text-stone-500 bg-stone-100 border border-stone-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {!clean ? (
            <div className="py-8 text-center text-xs text-stone-400 space-y-2">
              <p>Type keywords, names, receipt numbers, or amounts to search the portal.</p>
              <div className="flex justify-center gap-2 pt-2 flex-wrap">
                <span className="px-2 py-1 bg-stone-100 rounded text-stone-600">DON-2026-001</span>
                <span className="px-2 py-1 bg-stone-100 rounded text-stone-600">Annadanam</span>
                <span className="px-2 py-1 bg-stone-100 rounded text-stone-600">Satyam</span>
                <span className="px-2 py-1 bg-stone-100 rounded text-stone-600">VCH-2026-101</span>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-xs text-stone-500">
              No matching administrative records found for "{query}".
            </div>
          ) : (
            <div className="space-y-3">
              {/* Offerings Results */}
              {donations.length > 0 && (
                <div>
                  <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 mb-1">
                    <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    Offerings ({donations.length})
                  </div>
                  <div className="space-y-1">
                    {donations.slice(0, 4).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleSelect(`/admin/donations/${d.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <span className="font-semibold text-stone-900">{d.donorName}</span>
                          <span className="text-stone-400 ml-2">({d.receiptId})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-emerald-800">₹{d.amount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            {d.status}
                          </span>
                          <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-stone-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses Results */}
              {expenses.length > 0 && (
                <div>
                  <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 mb-1">
                    <FileText className="w-3.5 h-3.5 mr-1 text-red-700" />
                    Expenses ({expenses.length})
                  </div>
                  <div className="space-y-1">
                    {expenses.slice(0, 4).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => handleSelect(`/admin/expenses/${e.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <span className="font-semibold text-stone-900">{e.expenseName}</span>
                          <span className="text-stone-400 ml-2">({e.receiptVoucherNo})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-red-800">₹{e.amount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            {e.category}
                          </span>
                          <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-stone-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Material Seva */}
              {materials.length > 0 && (
                <div>
                  <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 mb-1">
                    <Package className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    Material Contributions ({materials.length})
                  </div>
                  <div className="space-y-1">
                    {materials.slice(0, 3).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelect(`/admin/materials/${m.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <span className="font-semibold text-stone-900">{m.materialName}</span>
                          <span className="text-stone-400 ml-2">by {m.donorName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-amber-900">{m.quantity} {m.unit}</span>
                          <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-stone-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Events & Announcements */}
              {events.length > 0 && (
                <div>
                  <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-700" />
                    Events ({events.length})
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => handleSelect(`/admin/events/${ev.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-between text-xs transition-colors group"
                      >
                        <span className="font-semibold text-stone-900">{ev.title}</span>
                        <span className="text-stone-500">{ev.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {users.length > 0 && (
                <div>
                  <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-stone-500 px-2 mb-1">
                    <Users className="w-3.5 h-3.5 mr-1 text-stone-700" />
                    Admin Users ({users.length})
                  </div>
                  <div className="space-y-1">
                    {users.slice(0, 2).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSelect('/admin/users')}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <span className="font-semibold text-stone-900">{u.name}</span>
                          <span className="text-stone-400 ml-2">({u.email})</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Nav Footer */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center">
            <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono mr-1.5">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono mr-2">K</kbd>
            Universal Command Search
          </span>
          <span>Sri Siddhi Vinayaka Committee</span>
        </div>
      </div>
    </div>
  );
};
