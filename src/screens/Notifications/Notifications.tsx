import { useEffect, useMemo, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Bell, CheckCheck, Trash2, Clock, Mail, CalendarClock, Megaphone } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { notificationsManager, remindersManager, emailService } from "../../lib/historyManager";

export const Notifications = (): JSX.Element => {
  const [items, setItems] = useState(notificationsManager.getAll());
  const [reminders, setReminders] = useState(remindersManager.getAll());
  const [outbox, setOutbox] = useState(emailService.getOutbox());

  useEffect(() => {
    const refresh = () => {
      setItems(notificationsManager.getAll());
      setReminders(remindersManager.getAll());
      setOutbox(emailService.getOutbox());
    };
    // Small polling in case other tabs update
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, []);

  const unread = useMemo(() => items.filter(i => !i.read).length, [items]);

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6 flex gap-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Bell className="w-8 h-8 text-yellow-400" />
                Notifications
              </h1>
              <p className="text-gray-400 text-sm md:text-base">Stay on top of reminders and system updates</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { notificationsManager.markAllRead(); setItems(notificationsManager.getAll()); }} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-2">
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
              <button onClick={() => { notificationsManager.clear(); setItems([]); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-2 rounded-xl border border-red-500/30 transition-all duration-300 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notifications list */}
            <Card className="lg:col-span-2 backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-white font-semibold">All Notifications</h2>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white">{unread} unread</span>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
                  {items.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No notifications yet</p>
                  ) : (
                    items.map(n => (
                      <div key={n.id} className={`p-4 rounded-xl border ${n.read ? 'bg-[#2a2d4a]/40 border-white/5' : 'bg-[#2a2d4a] border-white/10'} flex items-start gap-3`}>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {n.type === 'reminder' && <CalendarClock className="w-4 h-4 text-yellow-300" />}
                          {n.type === 'pdf' && <FileIcon />}
                          {n.type === 'voice' && <Megaphone className="w-4 h-4 text-orange-300" />}
                          {n.type === 'chat' && <Megaphone className="w-4 h-4 text-purple-300" />}
                          {n.type === 'system' && <Megaphone className="w-4 h-4 text-blue-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-white text-sm font-semibold truncate">{n.title}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {n.timestamp.toLocaleString()}
                            </div>
                          </div>
                          <p className="text-gray-300 text-xs mt-1">{n.message}</p>
                          {!n.read && (
                            <button onClick={() => { notificationsManager.markRead(n.id); setItems(notificationsManager.getAll()); }} className="mt-2 text-xs text-white/80 hover:text-white underline">
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reminders and Outbox */}
            <div className="space-y-6">
              <Card className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-white/10 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-white font-semibold">Reminders</h2>
                  </div>
                  <div className="max-h-[34vh] overflow-y-auto p-3 space-y-3">
                    {reminders.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">No reminders yet</p>
                    ) : (
                      reminders.map(r => (
                        <div key={r.id} className="p-3 rounded-xl bg-[#2a2d4a]/50 border border-white/10">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-sm font-medium">{r.description}</p>
                            {r.completed ? (
                              <span className="text-xs text-green-300">Completed</span>
                            ) : (
                              <span className="text-xs text-yellow-300">Due {r.dueAt.toLocaleString()}</span>
                            )}
                          </div>
                          {r.email && (
                            <div className="text-xs text-gray-400 mt-1">Email: {r.email} {r.emailSent ? '(sent)' : ''}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 rounded-[20px] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-white/10 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <h2 className="text-white font-semibold">Email Outbox (mock)</h2>
                  </div>
                  <div className="max-h-[34vh] overflow-y-auto p-3 space-y-3">
                    {outbox.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">No emails sent</p>
                    ) : (
                      outbox.map(e => (
                        <div key={e.id} className="p-3 rounded-xl bg-[#2a2d4a]/50 border border-white/10">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-sm font-medium truncate">{e.subject}</p>
                            <span className="text-xs text-gray-400">{e.timestamp.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">To: {e.to}</div>
                          <p className="text-gray-300 text-xs mt-1 whitespace-pre-line line-clamp-3">{e.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default Notifications;
