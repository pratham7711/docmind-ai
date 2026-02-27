import { AI_MODELS } from '../types';
import type { Message } from '../types';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MISTRAL_KEY = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined;
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

// ─── Mock fallback ──────────────────────────────────────────────────────────

async function* mockStream(modelId: string): AsyncGenerator<string> {
  const text = `No API key configured for **${modelId}**. Add the key to \`.env\` and restart.`;
  for (const ch of text.split('')) {
    yield ch;
    await new Promise((r) => setTimeout(r, 12));
  }
}

// ─── Generic OpenAI-compatible (plain fetch — no stainless headers) ──────────

async function chatOAICompat(
  apiKey: string,
  baseURL: string,
  modelId: string,
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  onChunk: (c: string) => void
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role as string, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: modelId, messages, stream: true, max_tokens: 1024 }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status}: ${errText}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const text: string = json?.choices?.[0]?.delta?.content ?? '';
        if (text) { full += text; onChunk(text); }
      } catch { /* skip malformed chunk */ }
    }
  }
  return full;
}

// ─── Gemini (REST SSE) ───────────────────────────────────────────────────────

async function chatGemini(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  onChunk: (c: string) => void
): Promise<string> {
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}` +
    `:streamGenerateContent?alt=sse`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) { full += text; onChunk(text); }
      } catch { /* skip */ }
    }
  }
  return full;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function chatWithDocument(
  documentText: string,
  _documentName: string,
  userMessage: string,
  history: Message[],
  modelId: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const model = AI_MODELS.find((m) => m.id === modelId);
  const provider = model?.provider ?? 'openai';

  const systemPrompt =
    `You are a document assistant. Answer questions based ONLY on this document:\n\n` +
    `---\n${documentText.slice(0, 80_000)}\n---\n\n` +
    `Be concise and cite specific parts when relevant. ` +
    `If the answer is not in the document, say so clearly.`;

  const isMissing = (k: string | undefined, placeholder: string) =>
    !k || k === placeholder;

  // ── Gemini ───────────────────────────────────────────────────────────────
  if (provider === 'gemini') {
    if (isMissing(GEMINI_KEY, 'your_gemini_api_key_here')) {
      let full = ''; for await (const c of mockStream(modelId)) { full += c; onChunk(c); } return full;
    }
    return chatGemini(GEMINI_KEY!, modelId, systemPrompt, history, userMessage, onChunk);
  }

  // ── Mistral ───────────────────────────────────────────────────────────────
  if (provider === 'mistral') {
    if (isMissing(MISTRAL_KEY, 'your_mistral_api_key_here')) {
      let full = ''; for await (const c of mockStream(modelId)) { full += c; onChunk(c); } return full;
    }
    return chatOAICompat(MISTRAL_KEY!, 'https://api.mistral.ai/v1', modelId, systemPrompt, history, userMessage, onChunk);
  }

  // ── Groq ──────────────────────────────────────────────────────────────────
  if (provider === 'groq') {
    if (isMissing(GROQ_KEY, 'your_groq_api_key_here')) {
      let full = ''; for await (const c of mockStream(modelId)) { full += c; onChunk(c); } return full;
    }
    return chatOAICompat(GROQ_KEY!, 'https://api.groq.com/openai/v1', modelId, systemPrompt, history, userMessage, onChunk);
  }

  throw new Error(`Unknown provider: ${provider}`);
}
