import { type LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--border)] bg-bg-card/50">
      {Icon && (
        <div className="mb-3 rounded-full bg-bg-elevated p-3">
          <Icon className="h-6 w-6 text-text-muted" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-text-secondary max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
