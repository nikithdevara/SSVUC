import React, { useState } from 'react';
import {
  Mail,
  Search,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { ContactMessage } from '../../types';
import { useToast } from '../../components/common/Toast';

export const AdminMessagesPage: React.FC = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>(() => svucStore.getContactMessages());
  const [searchQuery, setSearchQuery] = useState('');

  const refreshList = () => {
    setMessages(svucStore.getContactMessages());
  };

  const handleToggleRead = (id: string) => {
    const list = svucStore.getContactMessages();
    const item = list.find((m) => m.id === id);
    if (item) {
      item.read = !item.read;
      item.status = item.read ? 'read' : 'unread';
      svucStore.saveContactMessages(list);
      refreshList();
      showToast(`Marked message as ${item.read ? 'read' : 'unread'}`, 'info');
    }
  };

  const handleReplyWhatsApp = (msg: ContactMessage) => {
    if (!msg.phone) {
      showToast('No phone number attached to this inquiry', 'error');
      return;
    }
    const cleanPhone = msg.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Namaste ${msg.name} garu,\nGreetings from Sri Siddhi Vinayaka Utsava Committee, Gandhinagar Anjayya Colony, Anakapalle.\n\nIn response to your inquiry regarding:\n"${msg.message}"\n\n`
    );
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`, '_blank');
  };

  const filtered = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#7F1D1D] font-['Cinzel',serif] flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#D97706]" />
            Devotee Inquiries & Contact Messages
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            View public inquiries submitted via the festival website, coordinate volunteer requests, and reply via WhatsApp.
          </p>
        </div>

        <button
          onClick={refreshList}
          className="px-3.5 py-2 bg-white border border-[#C9972B] text-[#78350F] rounded-xl text-xs font-bold hover:bg-[#FEF3C7] flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries by devotee name, phone, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-[#C9972B]"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 space-y-2">
            <Mail className="w-10 h-10 mx-auto text-stone-300" />
            <p className="font-semibold text-stone-600">No devotee messages</p>
            <p className="text-xs text-stone-400">Public inquiries submitted on the contact page will appear here.</p>
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs space-y-3 ${
                !msg.read ? 'border-amber-300 bg-amber-50/15' : 'border-stone-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#7F1D1D]/10 text-[#7F1D1D] font-bold text-xs flex items-center justify-center">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-stone-900 block">{msg.name}</span>
                    <span className="text-[11px] text-stone-500">{msg.email || 'No email provided'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {msg.phone && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
                      <Phone className="w-3 h-3 text-[#166534]" /> {msg.phone}
                    </span>
                  )}
                  <span className="text-[11px] text-stone-400">
                    {new Date(msg.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed font-sans bg-stone-50 p-3 rounded-xl border border-stone-200">
                "{msg.message}"
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                {msg.phone && (
                  <button
                    onClick={() => handleReplyWhatsApp(msg)}
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20bd5a] flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply via WhatsApp</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleRead(msg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                    msg.read
                      ? 'border-stone-300 text-stone-600 hover:bg-stone-100'
                      : 'border-emerald-400 bg-emerald-50 text-emerald-800 font-bold'
                  }`}
                >
                  {msg.read ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
