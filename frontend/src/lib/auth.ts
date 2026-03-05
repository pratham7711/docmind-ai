import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import { SignJWT } from 'jose'

/** Create a HS256 JWT that the FastAPI backend can verify with its JWT_SECRET. */
async function createBackendToken(payload: {
  email: string
  name: string
  picture?: string | null
}): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      // On first sign-in, account + user are both present
      if (account && user) {
        token.accessToken = account.access_token
      }

      // Mint/refresh backendToken whenever it's absent (covers existing sessions + new logins)
      if (!token.backendToken && token.email) {
        token.backendToken = await createBackendToken({
          email: token.email ?? '',
          name: (token.name as string) ?? (token.email?.split('@')[0] ?? ''),
          picture: token.picture as string | null,
        })
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.backendToken = token.backendToken as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
