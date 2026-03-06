/**
 * GET /api/auth/backend-token
 *
 * Server-side route that mints a fresh HS256 JWT for the FastAPI backend,
 * signed with NEXTAUTH_SECRET (== JWT_SECRET on the backend).
 *
 * This avoids any session-cookie timing issues — the token is always
 * generated fresh from the current NextAuth session.
 */
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { authOptions } from '@/lib/auth'

export async function GET() {
  // ── TEST MODE: when backend has DISABLE_AUTH=true, mint a dummy token ──────
  if (process.env.DISABLE_AUTH === 'true') {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const token = await new SignJWT({
      email: 'test@docmind.local',
      name: 'Test User',
      picture: null,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)
    return NextResponse.json({ token })
  }

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

  const token = await new SignJWT({
    email: session.user.email,
    name: session.user.name ?? session.user.email.split('@')[0],
    picture: session.user.image ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)

  return NextResponse.json({ token })
}
