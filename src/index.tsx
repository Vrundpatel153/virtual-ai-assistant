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
// @ts-ignore
import "./index.css";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <LoadingProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<ProtectedRoute><Template /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/voice" element={<ProtectedRoute><Voice /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
  <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    </LoadingProvider>
  </StrictMode>,
);
