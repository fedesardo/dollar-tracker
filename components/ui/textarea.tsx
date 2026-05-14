import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[64px] w-full rounded-xl border border-[var(--border)] bg-bg-elevated px-4 py-2 text-sm text-text-primary',
        'placeholder:text-text-muted',
        'focus-visible:outline-none focus-visible:border-accent-blue focus-visible:ring-2 focus-visible:ring-accent-blue/20',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
