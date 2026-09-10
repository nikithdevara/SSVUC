import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { notificationsService } from '../../services/adminService';
import { AdminNotification } from '../../types';

interface AdminNotificationDropdownProps {
  onNavigate: (route: string) => void;
}

export const AdminNotificationDropdown: React.FC<AdminNotificationDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(notificationsService.getNotifications());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (notif: AdminNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    if (notif.link) {
      onNavigate(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        title="Administrative Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#7F1D1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-stone-500 hover:text-[#7F1D1D] flex items-center font-medium"
              >
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">No recent notifications.</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left p-3.5 hover:bg-stone-50 transition-colors flex items-start space-x-3 ${
                    !n.read ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      n.type === 'PENDING_APPROVAL'
                        ? 'bg-amber-100 text-amber-800'
                        : n.type === 'FINANCE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${!n.read ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-stone-400 shrink-0 ml-2">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{n.message}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-2" />
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/60 text-center">
            <span className="text-[10px] text-stone-400">Administrative notification alerts</span>
          </div>
        </div>
      )}
    </div>
  );
};
