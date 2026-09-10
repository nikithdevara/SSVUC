import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Trash2,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { AdminNotification, NotificationPriority } from '../../types';
import { useToast } from '../../components/common/Toast';

interface AdminNotificationsPageProps {
  onNavigate?: (route: string) => void;
}

export const AdminNotificationsPage: React.FC<AdminNotificationsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => svucStore.getNotifications());
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const refreshList = () => {
    setNotifications(svucStore.getNotifications());
  };

  const handleMarkAsRead = (id: string) => {
    svucStore.markNotificationRead(id);
    refreshList();
    showToast('Notification marked as read', 'info');
  };

  const handleMarkAllRead = () => {
    svucStore.markAllNotificationsRead();
    refreshList();
    showToast('All notifications marked as read', 'success');
  };

  const getPriorityBadge = (priority?: NotificationPriority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300 uppercase">
            CRITICAL
          </span>
        );
      case 'Important':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
            IMPORTANT
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300 uppercase">
            WARNING
          </span>
        );
      case 'Info':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-300 uppercase">
            INFO
          </span>
        );
    }
  };

  const filtered = notifications.filter((n) => {
    if (priorityFilter === 'ALL') return true;
    return (n.priority || 'Info') === priorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#7F1D1D] font-['Cinzel',serif] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#D97706]" />
            Administrative Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Real-time alerts for pending seva approvals, payment discrepancies, and system operations.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 bg-white border border-[#C9972B] text-[#78350F] rounded-xl text-xs font-bold hover:bg-[#FEF3C7] flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'Critical', 'Important', 'Warning', 'Info'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              priorityFilter === p
                ? 'bg-[#7F1D1D] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {p === 'ALL' ? 'All Alerts' : p}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-stone-300" />
            <p className="font-semibold text-stone-600">No notifications to display</p>
            <p className="text-xs text-stone-400">All administrative items are up to date.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.read ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.priority === 'Critical'
                      ? 'bg-red-100 text-red-700'
                      : n.priority === 'Warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {n.priority === 'Critical' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : n.priority === 'Warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm font-bold ${!n.read ? 'text-[#7F1D1D]' : 'text-stone-800'}`}>
                      {n.title}
                    </h4>
                    {getPriorityBadge(n.priority)}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {new Date(n.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {n.link && onNavigate && (
                  <button
                    onClick={() => {
                      if (!n.read) svucStore.markNotificationRead(n.id);
                      onNavigate(n.link!);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#7F1D1D] text-white font-bold text-xs hover:bg-[#991B1B] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="px-2.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100 cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
