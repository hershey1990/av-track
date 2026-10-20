import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** `light` para fondos oscuros (sidebar), `dark` para fondos claros */
  variant?: 'light' | 'dark'
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-[19px]',
  lg: 'text-3xl',
}

export function BrandLogo({
  className,
  size = 'md',
  variant = 'dark',
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-baseline gap-1 leading-none', className)}>
      <span className={cn('font-extrabold tracking-tight text-primary', sizeClasses[size])}>
        BB
      </span>
      <span
        className={cn(
          'font-light tracking-tight',
          sizeClasses[size],
          variant === 'light' ? 'text-sidebar-foreground/90' : 'text-foreground/75',
        )}
      >
        track
      </span>
    </span>
  )
}
