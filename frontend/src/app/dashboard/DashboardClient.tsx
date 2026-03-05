'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import type { ChatSession } from '@/types'

interface Props {
  sessions: ChatSession[]
  userEmail: string
  userName: string
  userImage: string | null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function DashboardClient({ sessions, userEmail, userName, userImage }: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-white/5 bg-white/[0.02] flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] font-bold text-sm">
              D
            </div>
            <span className="font-semibold tracking-tight">DocMind AI</span>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-4 py-4">
          <Link
            href="/upload"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl
              bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium"
          >
            <span className="text-base leading-none">+</span>
            New Chat
          </Link>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-white/25 text-xs text-center py-8 px-4">
              No chats yet. Upload a PDF to begin.
            </p>
          ) : (
            <>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 pb-2">
                Recent Chats
              </p>
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/chat/${s.id}`}
                  className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-sm text-white/80 truncate group-hover:text-white transition-colors">
                    {s.title || 'Untitled Chat'}
                  </span>
                  <span className="text-[11px] text-white/30">
                    {formatDate(s.created_at)} · {s.message_count} msg
                    {s.message_count !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* User info */}
        <div className="border-t border-white/5 px-4 py-4">
          <div className="flex items-center gap-3">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName}
                className="w-8 h-8 rounded-full border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] text-sm font-semibold">
                {userName.charAt(0) || userEmail.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{userName || userEmail}</p>
              <p className="text-[11px] text-white/30 truncate">{userEmail}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-white/40 hover:text-red-400 transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">Dashboard</h1>
            <p className="text-white/40 text-sm">Welcome back, {userName || 'there'} 👋</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-white/40 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-white/5 hover:border-red-500/20"
          >
            Sign out
          </button>
        </header>

        <div className="flex-1 p-8">
          {sessions.length === 0 ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center gap-6 text-center max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl">
                📄
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">No chats yet</h2>
                <p className="text-white/40 text-sm leading-relaxed">
                  Upload a PDF to get started. Ask questions and get cited answers powered by AI.
                </p>
              </div>
              <Link
                href="/upload"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium"
              >
                Upload a PDF →
              </Link>
            </div>
          ) : (
            /* Sessions grid */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Recent Chats</h2>
                <Link
                  href="/upload"
                  className="text-sm px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 transition-colors font-medium"
                >
                  + New Chat
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.slice(0, 12).map((s) => (
                  <Link
                    key={s.id}
                    href={`/chat/${s.id}`}
                    className="flex flex-col gap-2 p-5 rounded-2xl border border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">💬</span>
                      <span className="text-[11px] text-white/30">{formatDate(s.created_at)}</span>
                    </div>
                    <h3 className="font-medium text-white/90 text-sm leading-snug group-hover:text-[#818cf8] transition-colors line-clamp-2">
                      {s.title || 'Untitled Chat'}
                    </h3>
                    <p className="text-[11px] text-white/30 mt-auto">
                      {s.message_count} message{s.message_count !== 1 ? 's' : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
