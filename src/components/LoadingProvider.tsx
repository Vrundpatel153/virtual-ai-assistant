import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';

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
  // Visibility between 2s (min) and 3s (max)
  const MIN_VISIBLE_MS = 2000;
  const MAX_VISIBLE_MS = 3000;

  const [visible, setVisible] = useState(false);
  const startedAtRef = useRef<number>(0);
  const minHideTRef = useRef<number | null>(null);
  const maxHideTRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (minHideTRef.current) {
      window.clearTimeout(minHideTRef.current);
      minHideTRef.current = null;
    }
    if (maxHideTRef.current) {
      window.clearTimeout(maxHideTRef.current);
      maxHideTRef.current = null;
    }
  };

  const hideNow = () => {
    setVisible(false);
    clearTimers();
  };

  const setLoading = (next: boolean) => {
    if (next) {
      // Turn ON immediately (only if currently hidden) and cap duration to MAX_VISIBLE_MS
      if (!visible) {
        clearTimers();
        startedAtRef.current = performance.now();
        setVisible(true);
        maxHideTRef.current = window.setTimeout(() => {
          // Force hide after MAX to avoid endless overlays
          hideNow();
        }, MAX_VISIBLE_MS);
      }
      return;
    }

    // Request to hide: respect the minimum visible time
    if (!visible) return; // nothing to hide
    const elapsed = performance.now() - startedAtRef.current;
    const remainingToMin = MIN_VISIBLE_MS - elapsed;
    if (remainingToMin > 0) {
      // Schedule hide at the min threshold; keep max cap intact
      if (minHideTRef.current) window.clearTimeout(minHideTRef.current);
      minHideTRef.current = window.setTimeout(() => hideNow(), remainingToMin);
    } else {
      hideNow();
    }
  };

  // Cleanup pending timers on unmount
  useEffect(() => () => clearTimers(), []);

  const value = useMemo(() => ({ loading: visible, setLoading }), [visible]);
  return (
    <LoadingContext.Provider value={value}>
      <div className="relative">
        {children}
        {visible && (
          <div className="fixed inset-0 z-[1000] backdrop-blur-[6px] bg-gradient-to-b from-black/50 via-black/40 to-black/60 flex items-center justify-center" aria-busy>
            <div className="rounded-2xl bg-[#0d0f23]/90 border border-white/10 px-8 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.7)] flex items-center gap-5">
              {/* Detailed gradient loader */}
              <div className="relative h-16 w-16">
                {/* Outer gradient ring */}
                <div
                  className="absolute inset-0 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-fuchsia-500 via-purple-500 to-fuchsia-500 animate-spin"
                  style={{
                    // Create a donut by masking the center
                    WebkitMask: 'radial-gradient(farthest-side, transparent 60%, #000 62%)',
                    mask: 'radial-gradient(farthest-side, transparent 60%, #000 62%)',
                    animationDuration: '1.2s',
                  }}
                />

                {/* Counter-rotating subtle dashed arc */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(rgba(255,255,255,0.18) 0deg, transparent 36deg, rgba(255,255,255,0.12) 72deg, transparent 108deg, rgba(255,255,255,0.1) 144deg, transparent 180deg, rgba(255,255,255,0.12) 216deg, transparent 252deg, rgba(255,255,255,0.14) 288deg, transparent 324deg)',
                    WebkitMask: 'radial-gradient(farthest-side, transparent 68%, #000 70%)',
                    mask: 'radial-gradient(farthest-side, transparent 68%, #000 70%)',
                    animation: 'spin 3s linear infinite',
                    animationDirection: 'reverse',
                  }}
                />

                {/* Orbiting dot */}
                <div className="absolute inset-0" style={{ animation: 'spin 1.8s linear infinite' }}>
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.75)]" />
                </div>

                {/* Glossy center soft light */}
                <div className="absolute inset-3 rounded-full bg-gradient-to-b from-white/10 to-transparent blur-[2px] opacity-70" />
              </div>

              {/* Label */}
              <div>
                <div className="text-white font-semibold tracking-wide">
                  Loading
                  <span className="inline-flex w-8 justify-start overflow-hidden align-middle ml-1">
                    <span className="w-1 h-1 bg-white/80 rounded-full mx-0.5 animate-bounce" style={{ animationDuration: '1s', animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-white/80 rounded-full mx-0.5 animate-bounce" style={{ animationDuration: '1s', animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-white/80 rounded-full mx-0.5 animate-bounce" style={{ animationDuration: '1s', animationDelay: '300ms' }} />
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">Preparing your experience…</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadingContext.Provider>
  );
};
