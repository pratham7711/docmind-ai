/**
 * Server-side helper: mint a fresh HS256 JWT for the FastAPI backend.
 * Import this only in Server Components or API routes (uses Node.js crypto via jose).
 */
import { SignJWT } from 'jose'

export async function mintBackendToken(email: string, name: string, picture?: string | null): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
  return new SignJWT({ email, name, picture: picture ?? null })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
}
