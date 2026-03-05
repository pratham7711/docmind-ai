import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    /** Backend-signed HS256 JWT for FastAPI auth */
    backendToken?: string
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    backendToken?: string
    accessToken?: string
  }
}
