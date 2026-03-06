'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
} from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import { getChatMessages, getChatHistory, streamChat } from '@/lib/api'
import { useToast } from '@/components/Toast'
import type { ChatMessage, ChatSession, Source } from '@/types'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)
  if (sources.length === 0) return null
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-indigo-300/70 hover:text-indigo-300 transition-colors"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {sources.map((s, i) => (
            <div
              key={i}
              className="px-3 py-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs text-indigo-200/80"
            >
              <span className="font-medium text-indigo-300">Page {s.page}</span>
              {s.text && (
                <span className="text-indigo-200/60 ml-2 line-clamp-1 max-w-[200px] inline-block align-bottom">
                  {s.text}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-sm text-white leading-relaxed">
        {msg.content}
      </div>
    </div>
  )
}

function AssistantMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] text-sm text-white/85 leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        {msg.sources && <SourcesPanel sources={msg.sources} />}
      </div>
    </div>
  )
}

function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] text-sm text-white/85 leading-relaxed prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
        <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const sessionId = params.session_id as string
  const isNew = sessionId === 'new'
  const docIdFromQuery = searchParams.get('doc_id') ?? ''

  const { toast } = useToast()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    isNew ? null : sessionId
  )
  const [docId, setDocId] = useState<string>(docIdFromQuery)
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [currentSources, setCurrentSources] = useState<Source[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(!isNew)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  // Load sidebar sessions
  useEffect(() => {
    if (status !== 'authenticated') return
    getChatHistory()
      .then(setChatSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false))
  }, [status])

  // Load messages for existing session
  useEffect(() => {
    if (isNew || status !== 'authenticated') {
      setLoadingMessages(false)
      return
    }
    setLoadingMessages(true)
    getChatMessages(sessionId)
      .then((msgs) => {
        setMessages(msgs)
        // Try to infer docId from session list
      })
      .catch(() => toast('Could not load chat history.', 'error'))
      .finally(() => setLoadingMessages(false))
  }, [sessionId, isNew, status, toast])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleSend = useCallback(async () => {
    const text = inputValue.trim()
    if (!text || isStreaming) return
    if (!docId) {
      toast('No document linked to this chat. Please upload a PDF first.', 'error')
      return
    }

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setIsStreaming(true)
    setStreamingContent('')
    setCurrentSources([])

    // abort previous stream if any
    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    let accumulated = ''
    let finalSources: Source[] = []

    try {
      await streamChat(
        currentSessionId ?? '',
        text,
        docId,
        (token) => {
          accumulated += token
          setStreamingContent((prev) => prev + token)
        },
        (sources) => {
          finalSources = sources
          setCurrentSources(sources)
        },
        (newSessionId) => {
          setCurrentSessionId(newSessionId)
          // Update URL without full navigation
          window.history.replaceState(null, '', `/chat/${newSessionId}`)
          // Refresh session list
          getChatHistory().then(setChatSessions).catch(() => {})
        },
        (msg, _code) => {
          toast(msg, 'error')
          setIsStreaming(false)
        },
        abort.signal
      )

      // Finalise assistant message
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulated,
        sources: finalSources,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast('Streaming error. Please try again.', 'error')
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [inputValue, isStreaming, docId, currentSessionId, toast])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value)
    autoResize()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0a1a] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 shrink-0 border-r border-white/5 bg-white/[0.02] flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] font-bold text-xs">
              D
            </div>
            <span className="font-semibold text-sm tracking-tight">DocMind AI</span>
          </div>
        </div>

        {/* New chat */}
        <div className="px-3 py-3">
          <a
            href="/upload"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg
              bg-indigo-600 hover:bg-indigo-500 transition-colors text-xs font-medium"
          >
            + New Chat
          </a>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {loadingSessions ? (
            <div className="py-4 flex justify-center">
              <div className="w-4 h-4 rounded-full border border-indigo-500/30 border-t-indigo-400 animate-spin" />
            </div>
          ) : chatSessions.length === 0 ? (
            <p className="text-white/25 text-xs text-center py-6 px-3">No chats yet</p>
          ) : (
            chatSessions.map((s) => {
              const isActive = s.id === (currentSessionId ?? sessionId)
              return (
                <a
                  key={s.id}
                  href={`/chat/${s.id}`}
                  className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg transition-colors text-left
                    ${isActive
                      ? 'bg-indigo-500/15 border border-indigo-500/20'
                      : 'hover:bg-white/5'
                    }`}
                >
                  <span
                    className={`text-xs truncate font-medium ${isActive ? 'text-indigo-200' : 'text-white/70'}`}
                  >
                    {s.title || 'Untitled Chat'}
                  </span>
                  <span className="text-[10px] text-white/25">{formatDate(s.created_at)}</span>
                </a>
              )
            })
          )}
        </div>

        {/* User */}
        <div className="border-t border-white/5 px-4 py-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] text-xs font-semibold shrink-0">
            {session?.user?.name?.charAt(0) ?? session?.user?.email?.charAt(0) ?? 'U'}
          </div>
          <span className="text-xs text-white/40 truncate flex-1">
            {session?.user?.email ?? ''}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-white/25 hover:text-white/50 transition-colors text-xs"
            title="Sign out"
          >
            ⎋
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-white/60">
              {isNew && docIdFromQuery
                ? `New chat · doc_id: ${docIdFromQuery.slice(0, 8)}…`
                : currentSessionId
                  ? 'Active session'
                  : 'New chat'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">{session?.user?.email}</span>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-lg mx-auto">
              <div className="text-5xl">💬</div>
              <div>
                <h2 className="font-semibold text-lg mb-2">
                  {docId ? 'Ask anything about your document' : 'No document linked'}
                </h2>
                <p className="text-white/40 text-sm leading-relaxed">
                  {docId
                    ? "Type your question below or pick a suggestion to get started."
                    : 'Go back and upload a PDF to start chatting.'}
                </p>
              </div>

              {docId && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    { icon: '📋', label: 'Summarize this document' },
                    { icon: '🔑', label: 'What are the key points?' },
                    { icon: '❓', label: 'What questions does this answer?' },
                    { icon: '📌', label: 'List the main conclusions' },
                    { icon: '🧩', label: 'Explain the core concepts' },
                    { icon: '⚠️', label: 'Any risks or limitations mentioned?' },
                  ].map(({ icon, label }) => (
                    <button
                      key={label}
                      onClick={() => {
                        setInputValue(label)
                        textareaRef.current?.focus()
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04]
                        hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all text-left text-sm text-white/70 hover:text-white"
                    >
                      <span className="text-base shrink-0">{icon}</span>
                      <span className="leading-snug">{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {!docId && (
                <a
                  href="/upload"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium"
                >
                  Upload PDF →
                </a>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <UserMessage key={msg.id} msg={msg} />
                ) : (
                  <AssistantMessage key={msg.id} msg={msg} />
                )
              )}
              {isStreaming && streamingContent && (
                <StreamingMessage content={streamingContent} />
              )}
              {isStreaming && !streamingContent && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 px-6 py-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div
              className={`flex items-end gap-3 rounded-2xl border px-4 py-3 transition-colors
                ${isStreaming
                  ? 'border-indigo-500/20 bg-indigo-500/5'
                  : 'border-white/10 bg-white/5 focus-within:border-indigo-500/40'
                }`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={
                  isStreaming
                    ? 'Generating answer…'
                    : docId
                      ? 'Ask anything about your document…'
                      : 'Upload a PDF first…'
                }
                className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder:text-white/25 leading-relaxed max-h-[120px] disabled:cursor-not-allowed"
                style={{ height: 'auto' }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming || !docId}
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
                  ${inputValue.trim() && !isStreaming && docId
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                title="Send (Enter)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-white/20 mt-2">
              Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40 font-mono text-[10px]">Enter</kbd> to send
              &nbsp;·&nbsp;
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40 font-mono text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
