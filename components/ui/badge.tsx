import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-bg-elevated text-text-secondary',
        green: 'border-accent-green/20 bg-accent-green/10 text-accent-green',
        red: 'border-accent-red/20 bg-accent-red/10 text-accent-red',
        blue: 'border-accent-blue/20 bg-accent-blue/10 text-accent-blue',
        yellow: 'border-accent-yellow/20 bg-accent-yellow/10 text-accent-yellow',
        purple: 'border-accent-purple/20 bg-accent-purple/10 text-accent-purple',
        orange: 'border-accent-orange/20 bg-accent-orange/10 text-accent-orange',
        cyan: 'border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan',
        muted: 'border-[var(--border)] bg-transparent text-text-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
