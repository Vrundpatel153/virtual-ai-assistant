import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./screens/Landing/Landing";
import { Template } from "./screens/Template/Template";
import { Chat } from "./screens/Chat/Chat";
import { Voice } from "./screens/Voice/Voice";
import { AITools } from "./screens/AITools/AITools";
import { Settings } from "./screens/Settings/Settings";
import { Profile } from "./screens/Profile/Profile";
import { Notifications } from "./screens/Notifications/Notifications";
import { Pricing } from "./screens/Pricing/Pricing";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingProvider } from "./components/LoadingProvider";
import { ToastProvider } from "./components/ToastProvider";
import { Cursor } from "./components/Cursor";
import { useEffect, useState } from "react";
import { settingsManager } from "./lib/historyManager";
// @ts-ignore
import "./index.css";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <LoadingProvider>
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
    <Route path="/home" element={<Template />} />
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/voice" element={<ProtectedRoute><Voice /></ProtectedRoute>} />
  <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
  <Route path="/settings" element={<Settings />} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/pricing" element={<Pricing />} />
      </Routes>
      <CursorGate />
    </BrowserRouter>
    </ToastProvider>
    </LoadingProvider>
  </StrictMode>,
);

function CursorGate() {
  const [enabled, setEnabled] = useState<boolean>(true);
  useEffect(() => {
    const apply = () => {
      const s = settingsManager.get();
      const on = (s.customCursor !== false) && !s.reduceLoad; // disable when reduceLoad is on
      setEnabled(on);
      document.documentElement.classList.toggle('ai-cursor-hide-system', on);
    };
    apply();
    const handler = () => apply();
    window.addEventListener('ai_settings_updated', handler as any);
    return () => window.removeEventListener('ai_settings_updated', handler as any);
  }, []);
  return enabled ? <Cursor /> : null;
}
