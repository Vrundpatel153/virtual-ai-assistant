import { settingsManager } from './historyManager';

export async function aiComplete(prompt: string): Promise<string> {
  const s = settingsManager.get();
  const key = s.apiKey?.trim();
  if (!key) {
    // No key, return a clear message but keep it minimal
    return 'No API key configured. Please add one in Settings.';
  }
  // Example: use a generic compatible endpoint (user can set their own proxy); keep local-first otherwise
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || 'I do not have a response.';
  } catch (e: any) {
    return `AI request failed: ${e?.message || 'unknown error'}`;
  }
}
