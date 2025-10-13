import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = "" }: ThemeToggleProps): JSX.Element => {
  const [isDark, setIsDark] = useState(true);

  const handleToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className="relative w-16 h-8 rounded-full bg-gradient-to-r from-[#1e2139] to-[#252844] border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(139,92,246,0.4)] overflow-hidden"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-7 h-7 rounded-full bg-gradient-to-br shadow-lg transform transition-all duration-500 ease-out flex items-center justify-center ${
            isDark
              ? "translate-x-0 from-purple-600 to-purple-700 shadow-purple-500/50 rotate-0"
              : "translate-x-8 from-orange-400 to-yellow-400 shadow-orange-500/50 rotate-[360deg]"
          }`}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: isDark
              ? "0 2px 12px rgba(139, 92, 246, 0.6), inset 0 1px 2px rgba(255,255,255,0.2)"
              : "0 2px 12px rgba(251, 146, 60, 0.6), inset 0 1px 2px rgba(255,255,255,0.3)",
          }}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-white" />
          ) : (
            <Sun className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-between px-2">
          <Moon
            className={`w-3 h-3 transition-opacity duration-300 ${
              isDark ? "opacity-100 text-purple-300" : "opacity-30 text-gray-600"
            }`}
          />
          <Sun
            className={`w-3 h-3 transition-opacity duration-300 ${
              !isDark ? "opacity-100 text-orange-300" : "opacity-30 text-gray-600"
            }`}
          />
        </div>
      </button>
    </div>
  );
};
