import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'default' | 'red' | 'yellow'
}

function Badge({ className, variant = 'green', children, ...props }: BadgeProps) {
  const variants = {
    green: 'bg-green-pale text-green-dark',
    default: 'bg-border text-ink-muted',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-amber-50 text-amber-700',
  }

  return (
    <span
      className={cn(
        'inline-block text-xs px-3 py-1 rounded-full font-medium tracking-tight',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
