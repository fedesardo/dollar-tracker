import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarNav, BottomNav } from '@/components/shared/Navigation'
import { BlueRateBadge } from '@/components/shared/BlueRateBadge'

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen">
      <SidebarNav />
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-xl border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="lg:hidden font-display text-lg font-bold">finanzas</div>
            <div className="hidden lg:block text-sm text-text-secondary">
              Hola, <span className="text-text-primary font-medium">{session.user.name?.split(' ')[0] ?? 'che'}</span>.
            </div>
            <div className="flex items-center gap-2">
              <BlueRateBadge />
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-6 py-6 pb-24 lg:pb-10 max-w-7xl mx-auto">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
