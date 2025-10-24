import { useEffect, useMemo, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Bell, CheckCheck, Trash2, Clock, Mail, CalendarClock, Megaphone } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { notificationsManager, remindersManager, emailService } from "../../lib/historyManager";
import { t, useI18n } from "../../lib/i18n";

export const Notifications = (): JSX.Element => {
  // subscribe to i18n changes
  useI18n();
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
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 px-3 sm:px-4 md:px-6 flex gap-3 md:gap-4 max-w-7xl mx-auto w-full">
        <div className="flex-1 min-w-0">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-foreground text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <Bell className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-400 flex-shrink-0" />
                <span className="truncate">{t('notificationsPageTitle')}</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{t('notificationsPageSubtitle')}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => { notificationsManager.markAllRead(); setItems(notificationsManager.getAll()); }} className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 sm:px-4 py-2 rounded-xl border border-border hover:border-border/60 transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('markAllRead')}</span>
                <span className="sm:hidden">Read</span>
              </button>
              <button onClick={() => { notificationsManager.clear(); remindersManager.clear(); emailService.clear(); setItems([]); setReminders([]); setOutbox([]); }} className="flex-1 sm:flex-none bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 sm:px-4 py-2 rounded-xl border border-destructive/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t('clear')}</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notifications list */}
            <Card className="lg:col-span-2 backdrop-blur-xl bg-card border border-border rounded-[20px] overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-card-foreground font-semibold">{t('allNotifications')}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{t('unreadCount').replace('{count}', String(unread))}</span>
                    <button
                      onClick={() => { notificationsManager.clear(); setItems([]); }}
                      className="text-xs px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 inline-flex items-center gap-1"
                      title="Clear notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('clear')}
                    </button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">{t('noNotificationsYet')}</p>
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
                              {t('markAsRead')}
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
              <Card className="backdrop-blur-xl bg-card border border-border rounded-[20px] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-5 h-5 text-yellow-400" />
                      <h2 className="text-card-foreground font-semibold">{t('reminders')}</h2>
                    </div>
                    <button
                      onClick={() => { remindersManager.clear(); setReminders([]); }}
                      className="text-xs px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 inline-flex items-center gap-1"
                      title="Clear reminders"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('clear')}
                    </button>
                  </div>
                  <div className="max-h-[34vh] overflow-y-auto p-3 space-y-3">
                    {reminders.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-6">{t('noRemindersYet')}</p>
                    ) : (
                      reminders.map(r => (
                        <div key={r.id} className="p-3 rounded-xl bg-muted border border-border">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground text-sm font-medium">{r.description}</p>
                            {r.completed ? (
                              <span className="text-xs text-green-300">{t('completed')}</span>
                            ) : (
                              <span className="text-xs text-yellow-300">{t('dueAt').replace('{when}', r.dueAt.toLocaleString())}</span>
                            )}
                          </div>
                          {r.email && (
                            <div className="text-xs text-muted-foreground mt-1">{t('emailLabel').replace('{email}', r.email).replace('{sent}', r.emailSent ? t('emailSent') : '')}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-card border border-border rounded-[20px] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <h2 className="text-card-foreground font-semibold">{t('outbox')}</h2>
                    </div>
                    <button
                      onClick={() => { emailService.clear(); setOutbox([]); }}
                      className="text-xs px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 inline-flex items-center gap-1"
                      title="Clear emails"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t('clear')}
                    </button>
                  </div>
                  <div className="max-h-[34vh] overflow-y-auto p-3 space-y-3">
                    {outbox.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-6">{t('noEmailsSent')}</p>
                    ) : (
                      outbox.map(e => (
                        <div key={e.id} className="p-3 rounded-xl bg-muted border border-border">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground text-sm font-medium truncate">{e.subject}</p>
                            <span className="text-xs text-muted-foreground">{e.timestamp.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{t('toLabel').replace('{to}', e.to)}</div>
                          <p className="text-muted-foreground text-xs mt-1 whitespace-pre-line line-clamp-3">{e.body}</p>
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
