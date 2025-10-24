import { Navbar } from "../../components/Navbar";
import { User as UserIcon, Mail, Calendar, Award, TrendingUp, MessageSquare, Mic, Save, Lock, KeyRound, Edit3 } from "lucide-react";
import { authService, User } from "../../lib/auth";
import { Card, CardContent } from "../../components/ui/card";
import { t, useI18n } from "../../lib/i18n";
import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { useToast } from "../../components/ToastProvider";

export const Profile = (): JSX.Element => {
  useI18n();
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [editOpen]);
  const stats = [
    { label: t('statsTotalChats'), value: "247", icon: <MessageSquare className="w-5 h-5" />, color: "text-purple-400" },
    { label: t('statsVoiceSessions'), value: "89", icon: <Mic className="w-5 h-5" />, color: "text-orange-400" },
    { label: t('statsActiveAgents'), value: "4", icon: <Award className="w-5 h-5" />, color: "text-blue-400" },
    { label: t('statsHoursSaved'), value: "156", icon: <TrendingUp className="w-5 h-5" />, color: "text-green-400" },
  ];

  const recentActivity = [
    { action: "Started chat session", time: "2 hours ago", type: "chat" },
    { action: "Activated Research Agent", time: "5 hours ago", type: "agent" },
    { action: "Voice interaction completed", time: "1 day ago", type: "voice" },
    { action: "Updated settings", time: "2 days ago", type: "settings" },
  ];

  return (
    <>
    <div className="bg-background w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 sm:pt-20 md:pt-24 pb-4 sm:pb-6 px-3 sm:px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="backdrop-blur-xl bg-card border border-border shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[16px] sm:rounded-[20px] md:rounded-[24px] overflow-hidden mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/50 flex-shrink-0">
                  <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                </div>

                <div className="flex-1 text-center md:text-left min-w-0">
                  <h1 className="text-foreground text-xl sm:text-2xl md:text-3xl font-bold mb-2 truncate">{user?.name || 'User'}</h1>
                  <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">{user?.loginMethod === 'google' ? t('loginMethodGoogle') : t('loginMethodEmail')}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{user?.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{t('joinedMarch2024')}</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setEditOpen(true); setNameInput(user?.name || ""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex-shrink-0 inline-flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> {t('editProfile')}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="backdrop-blur-xl bg-card border border-border shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[12px] sm:rounded-[16px] md:rounded-[20px] overflow-hidden"
              >
                <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                  <div className={`${stat.color} flex items-center justify-center mb-1.5 sm:mb-2`}>
                    {stat.icon}
                  </div>
                  <div className="text-foreground text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-tight">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="backdrop-blur-xl bg-card border border-border shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[16px] sm:rounded-[20px] md:rounded-[24px] overflow-hidden">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <h2 className="text-foreground text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                {t('recentActivityTitle')}
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-foreground text-xs sm:text-sm font-medium truncate">{activity.action}</p>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">{activity.time}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  </div>

  {/* Edit Profile Modal */}
    <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
      <div className="space-y-6">
        {/* Name section */}
        <div>
          <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><UserIcon className="w-4 h-4 text-purple-400"/> Display name</h3>
          <div className="flex gap-2">
            <input value={nameInput} onChange={(e)=>setNameInput(e.target.value)} placeholder="Your name" className="flex-1 bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
            <button
              onClick={() => {
                const res = authService.updateName(nameInput);
                if (!res.success) {
                  showToast({ variant: 'error', title: 'Profile', description: res.error || 'Failed to update name' });
                  return;
                }
                setUser(authService.getCurrentUser());
                showToast({ variant: 'success', title: 'Profile', description: 'Name updated' });
              }}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4"/> Save
            </button>
          </div>
        </div>

        {/* Password section */}
        <div>
          <h3 className="text-foreground font-semibold mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-purple-400"/> Change password</h3>
          {user?.loginMethod === 'email' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="password" value={currentPw} onChange={(e)=>setCurrentPw(e.target.value)} placeholder="Current password" className="bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
                <input type="password" value={newPw} onChange={(e)=>setNewPw(e.target.value)} placeholder="New password" className="bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
                <input type="password" value={confirmPw} onChange={(e)=>setConfirmPw(e.target.value)} placeholder="Confirm new password" className="bg-input text-foreground rounded-xl px-4 py-3 outline-none border border-border focus:border-primary transition-colors text-sm" />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (newPw !== confirmPw) {
                      showToast({ variant: 'error', title: 'Profile', description: 'Passwords do not match' });
                      return;
                    }
                    const res = authService.changePassword(currentPw, newPw);
                    if (!res.success) {
                      showToast({ variant: 'error', title: 'Profile', description: res.error || 'Failed to change password' });
                      return;
                    }
                    setCurrentPw(''); setNewPw(''); setConfirmPw('');
                    showToast({ variant: 'success', title: 'Profile', description: 'Password updated' });
                  }}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4"/> Update password
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters.</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">This account is signed in with Google. Password changes are not available.</div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={()=>setEditOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm">Close</button>
        </div>
      </div>
    </Modal>
    </>
  );
};
