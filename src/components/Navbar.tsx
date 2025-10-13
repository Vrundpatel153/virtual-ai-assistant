import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, Mic, Zap, Menu, X, Settings, User, Chrome as Home } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const Navbar = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { icon: <Home className="w-4 h-4" />, label: "Home", path: "/" },
    { icon: <MessageSquare className="w-4 h-4" />, label: "Chat", path: "/chat" },
    { icon: <Mic className="w-4 h-4" />, label: "Voice", path: "/voice" },
    { icon: <Zap className="w-4 h-4" />, label: "Agents", path: "/agents" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0a0b1e]/80 backdrop-blur-xl border-b border-[#2d3256]/50 shadow-lg shadow-purple-500/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 md:gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-500/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base md:text-xl">AI Assistant</h1>
              <p className="text-gray-400 text-[10px] md:text-xs">Chat + Voice + Agents</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                icon={link.icon}
                label={link.label}
                active={location.pathname === link.path}
                onClick={() => navigate(link.path)}
              />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/settings")}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#1e2139]/80 hover:bg-[#252844] border border-[#2d3256]/50 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:border-[#3d4266]/70"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] hover:from-[#6d28d9] hover:to-[#7c3aed] flex items-center justify-center text-white transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-[#1e2139]/80 border border-[#2d3256]/50 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2 animate-in fade-in slide-in-from-top duration-200">
            {navLinks.map((link) => (
              <MobileNavLink
                key={link.path}
                icon={link.icon}
                label={link.label}
                active={location.pathname === link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  navigate("/settings");
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 h-11 rounded-xl bg-[#1e2139]/80 hover:bg-[#252844] border border-[#2d3256]/50 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </button>
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center gap-2 text-white transition-all duration-200 shadow-lg shadow-purple-500/30"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Profile</span>
              </button>
            </div>
            <div className="flex justify-center pt-2">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl font-medium text-xs md:text-sm transition-all duration-200 ${
        active
          ? "bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/30"
          : "text-gray-400 hover:text-white hover:bg-[#1e2139]/60"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const MobileNavLink = ({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
        active
          ? "bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/30"
          : "bg-[#1e2139]/60 text-gray-400 hover:text-white hover:bg-[#252844] border border-[#2d3256]/50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
