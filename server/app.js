import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from the repo root by default.
// This makes `node server/index.js` work even if your shell CWD is `server/`.
const rootEnvPath = path.resolve(__dirname, "../.env");
const serverEnvPath = path.resolve(__dirname, "./.env");

dotenv.config({ path: rootEnvPath });
// If a variable exists but is empty (common in some environments), allow `.env` to override it.
if (!process.env.GROQ_API_KEY && !process.env.VITE_GROQ_API_KEY) {
  dotenv.config({ path: rootEnvPath, override: true });
}

// Also allow a local `server/.env` if someone prefers it.
dotenv.config({ path: serverEnvPath });

const PRIMARY_MODEL = "llama3-8b-8192";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const SYSTEM_PROMPT = "You are a helpful AI assistant.";

function readEnvFileKey(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const match = raw.match(/^\s*GROQ_API_KEY\s*=\s*(.+?)\s*$/m);
    if (!match) return undefined;
    const value = String(match[1] || "")
      .trim()
      .replace(/^['"]/, "")
      .replace(/['"]$/, "");
    return value || undefined;
  } catch {
    return undefined;
  }
}

const apiKey =
  String(process.env.GROQ_API_KEY || "").trim() ||
  String(process.env.VITE_GROQ_API_KEY || "").trim() ||
  readEnvFileKey(rootEnvPath) ||
  readEnvFileKey(serverEnvPath);

if (!apiKey) {
  console.warn("[Groq] Missing GROQ_API_KEY in environment");
}

const groq = apiKey ? new Groq({ apiKey }) : null;

function isModelDecommissioned(error = {}) {
  const code = error?.error?.error?.code || error?.code;
  return code === "model_decommissioned";
}

async function runCompletion(text) {
  if (!groq) {
    throw new Error("Groq API key is not configured");
  }

  const trimmed = text.trim();
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: trimmed },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      });
      return completion.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      lastError = error;
      if (!isModelDecommissioned(error) || model === models[models.length - 1]) {
        throw error;
      }
      console.warn(`[Groq] model ${model} decommissioned, trying fallback`);
    }
  }

  throw lastError || new Error("Groq completion failed");
}

export function createApp() {
  const app = express();
  const corsOrigins = process.env.CLIENT_ORIGIN || "*";
  const originList = corsOrigins.split(",").map((o) => o.trim()).filter(Boolean);
  const corsOptions = corsOrigins === "*" ? { origin: true } : { origin: originList.length ? originList : true };

  app.use(cors(corsOptions));
  app.use(express.json());

  app.post("/chat", async (req, res) => {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message must be a non-empty string" });
    }

    if (!groq) {
      return res.status(500).json({ error: "Groq API key is not configured" });
    }

    try {
      const reply = await runCompletion(message);
      return res.json({ reply });
    } catch (error) {
      console.error("[Groq] chat error", error);
      if (error?.status === 401 || error?.status === 403) {
        return res.status(401).json({ error: "Groq authentication failed" });
      }
      if (isModelDecommissioned(error)) {
        return res.status(502).json({ error: "Requested Groq model has been decommissioned" });
      }
      return res.status(500).json({ error: "Failed to fetch Groq response" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

export default createApp;
