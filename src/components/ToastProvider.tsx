import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "default" | "success" | "error" | "info";
type Toast = { id: string; title?: string; description?: string; variant?: ToastVariant; duration?: number };

type ToastContextType = {
  showToast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast = { id, duration: 2500, variant: "default", ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), toast.duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="pointer-events-none fixed right-4 top-16 z-[1100] flex w-[90vw] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto overflow-hidden rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
              t.variant === "success"
                ? "bg-emerald-900/40 border-emerald-500/30 text-emerald-100"
                : t.variant === "error"
                ? "bg-red-900/40 border-red-500/30 text-red-100"
                : t.variant === "info"
                ? "bg-blue-900/40 border-blue-500/30 text-blue-100"
                : "bg-[#1e2139]/70 border-white/10 text-white",
            ].join(" ")}
          >
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
