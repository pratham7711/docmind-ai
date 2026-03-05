import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { mintBackendToken } from '@/lib/backend-token'
import type { ChatSession } from '@/types'
import { DashboardClient } from './DashboardClient'

async function fetchHistory(backendToken: string): Promise<ChatSession[]> {
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://docmind-backend-production.up.railway.app'
  try {
    const res = await fetch(`${BASE_URL}/api/v1/history`, {
      headers: { Authorization: `Bearer ${backendToken}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const backendToken = await mintBackendToken(
    session.user?.email ?? '',
    session.user?.name ?? session.user?.email?.split('@')[0] ?? '',
    session.user?.image,
  )

  const sessions = await fetchHistory(backendToken)

  return (
    <DashboardClient
      sessions={sessions}
      userEmail={session.user?.email ?? ''}
      userName={session.user?.name ?? ''}
      userImage={session.user?.image ?? null}
    />
  )
}
