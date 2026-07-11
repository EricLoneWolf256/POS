import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import api from '../services/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const [notifs, count] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifs.data);
      setUnread(count.data.count);
    } catch {}
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(n => n.map(x => x.id === id ? { ...x, status: 'sent' } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, status: 'sent' })));
    setUnread(0);
  };

  const getIcon = (type) => {
    if (type === 'email') return <CheckCircle2 size={14} className="text-blue-500" />;
    if (type === 'sms') return <AlertTriangle size={14} className="text-amber-500" />;
    return <Info size={14} className="text-slate-400" />;
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200/80 z-[110] animate-modal-enter overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X size={14} /></button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No notifications yet</div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div key={n.id} onClick={() => n.status === 'pending' && markRead(n.id)} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${n.status === 'pending' ? 'bg-teal-50/30 hover:bg-teal-50/50' : 'hover:bg-slate-50'}`}>
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{n.subject || 'Notification'}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {n.status === 'pending' && <div className="w-2 h-2 bg-teal-500 rounded-full shrink-0 mt-2" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
