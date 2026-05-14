import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Edge-safe Auth.js config: NO database adapter here.
 * Used by middleware (which runs in the Edge runtime).
 * The full config in lib/auth.ts re-uses this.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase()
      if (!email) return false
      return allowedEmails.includes(email)
    },
  },
  trustHost: true,
} satisfies NextAuthConfig
