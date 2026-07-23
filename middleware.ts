import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isAuthRoute =
    path.startsWith('/api/auth') ||
    path === '/api/cron/recurring-incomes' ||
    path === '/login' ||
    path === '/auth/error'

  if (!isLoggedIn && !isAuthRoute) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  const email = req.auth?.user?.email?.toLowerCase()
  if (email && !allowedEmails.includes(email) && !isAuthRoute) {
    return Response.redirect(new URL('/auth/error?error=AccessDenied', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$).*)'],
}
