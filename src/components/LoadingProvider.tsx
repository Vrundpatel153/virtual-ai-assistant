import React, { createContext, useContext, useState, useMemo } from 'react';

type LoadingContextType = {
  loading: boolean;
  setLoading: (v: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useGlobalLoading must be used within LoadingProvider');
  return ctx;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const value = useMemo(() => ({ loading, setLoading }), [loading]);
  return (
    <LoadingContext.Provider value={value}>
      <div className="relative">
        {children}
        {loading && (
          <div className="fixed inset-0 z-[1000] backdrop-blur-md bg-black/30 flex items-center justify-center">
            <div className="rounded-2xl bg-gradient-to-br from-[#1e2139]/90 to-[#252844]/80 border border-white/10 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="text-white text-lg font-semibold flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-white/80 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="inline-block w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="inline-block w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]"></span>
                <span className="ml-3 opacity-90">Loading</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadingContext.Provider>
  );
};
