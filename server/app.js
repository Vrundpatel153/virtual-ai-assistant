import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const PRIMARY_MODEL = "llama3-8b-8192";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const SYSTEM_PROMPT = "You are a helpful AI assistant.";

const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

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
