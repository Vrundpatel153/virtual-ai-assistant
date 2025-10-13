import React from "react";
import { Navbar } from "../../components/Navbar";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Settings as SettingsIcon, Bell, Lock, Globe, Palette, Zap } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

export const Settings = (): JSX.Element => {
  const settingsSections = [
    {
      icon: <Palette className="w-5 h-5 text-white" />,
      title: "Appearance",
      description: "Customize the look and feel",
      color: "from-purple-600 to-purple-700",
      component: (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold mb-1">Theme</p>
            <p className="text-gray-400 text-sm">Toggle between light and dark mode</p>
          </div>
          <ThemeToggle />
        </div>
      ),
    },
    {
      icon: <Bell className="w-5 h-5 text-white" />,
      title: "Notifications",
      description: "Manage your notification preferences",
      color: "from-blue-600 to-blue-700",
      component: (
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Email notifications</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Push notifications</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Agent activity alerts</span>
            <input type="checkbox" className="w-5 h-5 rounded accent-purple-600" />
          </label>
        </div>
      ),
    },
    {
      icon: <Lock className="w-5 h-5 text-white" />,
      title: "Privacy & Security",
      description: "Control your data and security settings",
      color: "from-green-600 to-green-700",
      component: (
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Two-factor authentication</span>
            <input type="checkbox" className="w-5 h-5 rounded accent-purple-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Data encryption</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-600" />
          </label>
          <button className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors">
            Change Password →
          </button>
        </div>
      ),
    },
    {
      icon: <Globe className="w-5 h-5 text-white" />,
      title: "Language & Region",
      description: "Set your preferred language and location",
      color: "from-orange-600 to-orange-700",
      component: (
        <div className="space-y-3">
          <div>
            <label className="text-gray-300 text-sm mb-2 block">Language</label>
            <select className="w-full bg-[#2a2d4a] text-white rounded-lg px-4 py-2 outline-none border border-white/10 focus:border-purple-500 transition-colors">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-2 block">Time Zone</label>
            <select className="w-full bg-[#2a2d4a] text-white rounded-lg px-4 py-2 outline-none border border-white/10 focus:border-purple-500 transition-colors">
              <option>UTC-8 (Pacific Time)</option>
              <option>UTC-5 (Eastern Time)</option>
              <option>UTC+0 (London)</option>
              <option>UTC+1 (Berlin)</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      title: "Performance",
      description: "Optimize app performance and features",
      color: "from-yellow-600 to-yellow-700",
      component: (
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Hardware acceleration</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Auto-save conversations</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-purple-600" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Reduced animations</span>
            <input type="checkbox" className="w-5 h-5 rounded accent-purple-600" />
          </label>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[#0a0b1e] w-full min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 md:pt-24 pb-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-purple-400" />
              Settings
            </h1>
            <p className="text-gray-400 text-sm md:text-base">Customize your AI assistant experience</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {settingsSections.map((section, index) => (
              <Card
                key={index}
                className="backdrop-blur-xl bg-gradient-to-br from-[#1e2139]/95 to-[#252844]/90 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[20px] md:rounded-[24px] overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white text-lg font-bold mb-1">{section.title}</h3>
                      <p className="text-gray-400 text-sm">{section.description}</p>
                    </div>
                  </div>
                  <div className="pl-14">{section.component}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button className="px-6 py-3 rounded-full font-semibold text-sm text-gray-300 hover:text-white transition-colors">
              Reset to Defaults
            </button>
            <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
