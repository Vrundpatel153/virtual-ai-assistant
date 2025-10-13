import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Template } from "./screens/Template/Template";
import { Chat } from "./screens/Chat/Chat";
import { Voice } from "./screens/Voice/Voice";
import { Agents } from "./screens/Agents/Agents";
import { Settings } from "./screens/Settings/Settings";
import { Profile } from "./screens/Profile/Profile";
// @ts-ignore
import "./index.css";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Template />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/voice" element={<Voice />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
