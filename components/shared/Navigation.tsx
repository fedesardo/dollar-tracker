'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  HandCoins,
  Wallet,
  BarChart3,
  Target,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { signOutAction } from '@/actions/auth'

const items = [
  { href: '/', label: 'Inicio', Icon: LayoutDashboard },
  { href: '/transactions', label: 'Movimientos', Icon: ArrowLeftRight },
  { href: '/analysis', label: 'Análisis', Icon: PieChart },
  { href: '/loans', label: 'Préstamos', Icon: HandCoins },
  { href: '/portfolio', label: 'Portfolio', Icon: Wallet },
  { href: '/stats', label: 'Stats', Icon: BarChart3 },
  { href: '/goals', label: 'Metas', Icon: Target },
  { href: '/settings', label: 'Config', Icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col border-r border-[var(--border)] bg-bg-surface/50 backdrop-blur-xl z-40">
      <div className="px-6 py-7">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          finanzas
        </Link>
        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
          Fede & Flor
        </p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <form action={signOutAction} className="p-3 border-t border-[var(--border)]">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-muted hover:text-accent-red hover:bg-bg-elevated transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </form>
    </aside>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const main = items.slice(0, 5)
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-bg-surface/95 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {main.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors',
                active ? 'text-text-primary' : 'text-text-muted',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-accent-green')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
