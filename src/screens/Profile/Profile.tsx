import { Navbar } from "../../components/Navbar";
import { User, Mail, Calendar, MapPin, Award, TrendingUp, MessageSquare, Mic } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

export const Profile = (): JSX.Element => {
  const stats = [
    { label: "Total Chats", value: "247", icon: <MessageSquare className="w-5 h-5" />, color: "text-purple-400" },
    { label: "Voice Sessions", value: "89", icon: <Mic className="w-5 h-5" />, color: "text-orange-400" },
    { label: "Active Agents", value: "4", icon: <Award className="w-5 h-5" />, color: "text-blue-400" },
    { label: "Hours Saved", value: "156", icon: <TrendingUp className="w-5 h-5" />, color: "text-green-400" },
  ];

  const recentActivity = [
    { action: "Started chat session", time: "2 hours ago", type: "chat" },
    { action: "Activated Research Agent", time: "5 hours ago", type: "agent" },
    { action: "Voice interaction completed", time: "1 day ago", type: "voice" },
    { action: "Updated settings", time: "2 days ago", type: "settings" },
  ];

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[20px] md:rounded-[24px] overflow-hidden mb-6">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">John Doe</h1>
                  <p className="text-gray-400 mb-4">Premium User</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-300 justify-center md:justify-start">
                      <Mail className="w-4 h-4 text-purple-400" />
                      john.doe@example.com
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 justify-center md:justify-start">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      Joined March 2024
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 justify-center md:justify-start">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      San Francisco, CA
                    </div>
                  </div>
                </div>

                <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                  Edit Profile
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[16px] md:rounded-[20px] overflow-hidden"
              >
                <CardContent className="p-4 md:p-6 text-center">
                  <div className={`${stat.color} flex items-center justify-center mb-2`}>
                    {stat.icon}
                  </div>
                  <div className="text-white text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-xs md:text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[20px] md:rounded-[24px] overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#2a2d4a]/50 hover:bg-[#2a2d4a] transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-xs">{activity.time}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
