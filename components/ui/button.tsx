import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-bg-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-text-primary text-bg-base hover:bg-text-primary/90 active:scale-[0.98]',
        primary:
          'bg-accent-green text-bg-base hover:bg-accent-green/90 active:scale-[0.98]',
        secondary:
          'bg-bg-elevated text-text-primary hover:bg-bg-elevated/80 active:scale-[0.98] border border-[var(--border)]',
        ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
        outline:
          'border border-[var(--border)] bg-transparent text-text-primary hover:bg-bg-elevated hover:border-[var(--border-hover)]',
        destructive:
          'bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border border-accent-red/20',
        link: 'text-accent-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
