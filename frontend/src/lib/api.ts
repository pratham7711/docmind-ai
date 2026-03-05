import axios from 'axios'
import type { UploadResponse, ChatSession, ChatMessage, Document } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://docmind-backend-production.up.railway.app'

/** Cache the backend JWT so we don't hit /api/auth/backend-token on every request */
let _cachedToken: string | null = null
let _tokenExpiry = 0

async function getBackendToken(): Promise<string | null> {
  const now = Date.now()
  // Refresh if missing or within 60s of expiry (token is 1h, refresh at 55min mark)
  if (_cachedToken && now < _tokenExpiry - 60_000) {
    return _cachedToken
  }
  try {
    const res = await fetch('/api/auth/backend-token')
    if (!res.ok) return null
    const { token } = await res.json()
    _cachedToken = token
    _tokenExpiry = now + 55 * 60 * 1000 // 55 minutes
    return token
  } catch {
    return null
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getBackendToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use(async (config) => {
  const headers = await getAuthHeaders()
  Object.assign(config.headers, headers)
  return config
})

// Upload document
export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadResponse>('/api/v1/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
  return data
}

// Chat history list
export async function getChatHistory(): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSession[]>('/api/v1/history')
  return data
}

// Chat session detail (messages + metadata)
interface ChatSessionDetail {
  id: string
  doc_id: string
  title: string
  created_at: string
  messages: Array<{
    id: string
    session_id: string
    role: 'user' | 'assistant'
    content: string
    sources?: { page: number; text_snippet?: string }[] | null
    created_at: string
  }>
}

// Chat session messages
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatSessionDetail>(`/api/v1/history/${sessionId}`)
  // Backend returns ChatSessionDetail with a messages array; map to ChatMessage[]
  return (data.messages || []).map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    sources: msg.sources
      ? msg.sources.map((s) => ({
          page: s.page,
          text: s.text_snippet,
        }))
      : undefined,
    created_at: msg.created_at,
  }))
}

// Documents list
export async function getDocuments(): Promise<Document[]> {
  const { data } = await api.get<Document[]>('/api/v1/documents')
  return data
}

// Delete document
export async function deleteDocument(docId: string): Promise<void> {
  await api.delete(`/api/v1/documents/${docId}`)
}

// Streaming chat — returns an AbortController so caller can cancel
export async function streamChat(
  sessionId: string,
  message: string,
  docId: string,
  onToken: (token: string) => void,
  onSources: (sources: { page: number; text?: string; score?: number }[]) => void,
  onDone: (newSessionId: string) => void,
  onError: (msg: string, code?: number) => void,
  signal?: AbortSignal
): Promise<void> {
  const token = await getBackendToken()

  const response = await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      session_id: sessionId || null,
      message,
      doc_id: docId,
    }),
    signal,
  })

  if (!response.ok) {
    const errorCode = response.status
    if (errorCode === 429) {
      onError('Rate limit reached. Please wait a moment before sending another message.', 429)
    } else {
      onError(`Request failed with status ${errorCode}`, errorCode)
    }
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError('No response stream')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue
      const raw = line.slice(6)
      if (raw === '[DONE]') continue

      try {
        const event = JSON.parse(raw)
        if (event.type === 'token') {
          onToken(event.content)
        } else if (event.type === 'sources') {
          onSources(event.sources)
        } else if (event.type === 'done') {
          onDone(event.session_id)
        } else if (event.type === 'error') {
          onError(event.message, event.code)
        }
      } catch {
        // skip malformed events
      }
    }
  }
}
