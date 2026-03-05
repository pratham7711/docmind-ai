// API Response Types

export interface UploadResponse {
  doc_id: string
  filename: string
  page_count: number
  chunk_count: number
}

export interface ChatSession {
  id: string
  title: string
  doc_id: string
  doc_filename?: string
  last_message_preview?: string | null
  message_count: number
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  created_at: string
}

export interface Source {
  page: number
  text?: string
  score?: number
}

export interface Document {
  id: string
  filename: string
  size: number
  page_count: number
  created_at: string
}

// SSE Event Types
export interface SSETokenEvent {
  type: 'token'
  content: string
}

export interface SSESourcesEvent {
  type: 'sources'
  sources: Source[]
}

export interface SSEDoneEvent {
  type: 'done'
  session_id: string
}

export interface SSEErrorEvent {
  type: 'error'
  message: string
  code?: number
}

export type SSEEvent = SSETokenEvent | SSESourcesEvent | SSEDoneEvent | SSEErrorEvent

// NextAuth extension
declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
  }
}
