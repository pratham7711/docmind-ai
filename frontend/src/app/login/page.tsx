'use client'

import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <p className="text-white/40 text-sm">Checking session…</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null // redirect in progress
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card with gradient border */}
        <div className="rounded-2xl p-px bg-gradient-to-b from-indigo-500/30 via-white/5 to-white/5">
          <div className="rounded-2xl bg-[#0f0f1f] p-8 flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-[#818cf8] font-bold text-2xl shadow-lg shadow-indigo-500/10">
                D
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight">DocMind AI</h1>
                <p className="text-white/40 text-sm mt-1">
                  Sign in to start chatting with your PDFs
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* Google Sign In */}
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl
                bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 
                transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
            >
              {/* Google logo SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="text-white/20 text-xs text-center leading-relaxed">
              By signing in, you agree to let DocMind AI
              <br />
              access your Google account to authenticate you.
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <a href="/" className="text-white/30 text-sm hover:text-white/60 transition-colors">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
