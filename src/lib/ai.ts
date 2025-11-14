const DEFAULT_API_BASE = 'http://localhost:3000';

function getBackendBase(): string {
  try {
    // @ts-ignore allow Vite env override
    const override = import.meta?.env?.VITE_API_BASE_URL as string | undefined;
    if (override && override.trim()) return override.trim();
  } catch {}
  return DEFAULT_API_BASE;
}

function getChatUrl(): string {
  const base = getBackendBase().replace(/\/$/, '');
  return `${base}/chat`;
}

export async function callChatEndpoint(
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<{ reply?: string; error?: string }> {
  const endpoint = getChatUrl();
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = data?.error || 'AI request failed.';
      const err = new Error(error);
      (err as any).status = res.status;
      throw err;
    }
    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') throw error;
    try { if ((import.meta as any)?.env?.DEV) console.warn('[AI] backend error', error); } catch {}
    throw new Error(error?.message || 'AI request failed: Network error.');
  }
}

// Allow passing an AbortSignal to support cancellation of in-flight AI requests
export async function aiComplete(
  prompt: string,
  signal?: AbortSignal,
  options?: { mode?: 'chat' | 'intent'; assistantName?: string; userName?: string }
): Promise<string> {
  try {
    const data = await callChatEndpoint(
      {
        message: prompt,
        mode: options?.mode,
        assistantName: options?.assistantName,
        userName: options?.userName,
      },
      signal
    );
    const reply = (data?.reply || '').trim();
    return reply || 'I do not have a response.';
  } catch (error: any) {
    if (error?.name === 'AbortError') return 'AI request cancelled';
    return error?.message || 'AI request failed.';
  }
}
