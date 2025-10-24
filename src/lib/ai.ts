import { settingsManager } from './historyManager';

// Preferred model and env var for Gemini
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

function getEnvGeminiKey(): string | undefined {
  try {
    // Vite-style env variable
    // @ts-ignore
    const k = import.meta?.env?.VITE_GEMINI_API_KEY as string | undefined;
    return k?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function hasAIKey(): boolean {
  const s = settingsManager.get();
  return Boolean(s.apiKey?.trim() || getEnvGeminiKey());
}

// Allow passing an AbortSignal to support cancellation of in-flight AI requests
export async function aiComplete(prompt: string, signal?: AbortSignal): Promise<string> {
  const s = settingsManager.get();
  const key = s.apiKey?.trim() || getEnvGeminiKey();
  if (!key) {
    // No key, return a clear message but keep it minimal
    return 'No API key configured. Please add one in Settings or set VITE_GEMINI_API_KEY.';
  }

  try {
    // Google Generative Language API with Search grounding enabled
    const url = `https://generativelanguage.googleapis.com/v1/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      tools: [
        // Attempt to use Google Search grounding when available
        { google_search: {} },
      ],
      generationConfig: {
        temperature: 0.4,
      },
      safetySettings: [
        // keep defaults; rely on server-side policy
      ],
    } as any;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Extract text from candidates
    const candidates = data?.candidates || [];
    let text = '';
    if (candidates.length > 0) {
      const parts = candidates[0]?.content?.parts || [];
      text = parts.map((p: any) => p?.text || '').join('\n').trim();
    }
    return text || 'I do not have a response.';
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return 'AI request cancelled';
    }
    return `AI request failed: ${e?.message || 'unknown error'}`;
  }
}
