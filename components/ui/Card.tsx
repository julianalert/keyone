import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'bg'
}

function Card({ className, variant = 'white', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        variant === 'white' ? 'bg-cream' : 'bg-bg',
        className
      )}
      style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 border-b', className)} style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }} {...props}>
      {children}
    </div>
  )
}

function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4 border-t', className)} style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }} {...props}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent, CardFooter }
