import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  showMark?: boolean
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { mark: 'h-7 w-7 text-xs', wordmark: 'text-xl' },
  md: { mark: 'h-8 w-8 text-sm', wordmark: 'text-2xl' },
  lg: { mark: 'h-10 w-10 text-base', wordmark: 'text-3xl' },
}

export function BrandLogo({
  className,
  showMark = true,
  showWordmark = true,
  size = 'md',
}: BrandLogoProps) {
  const classes = sizeClasses[size]

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showMark && (
        <span
          className={cn(
            'flex items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold leading-none tracking-tight',
            classes.mark,
          )}
        >
          BB
        </span>
      )}
      {showWordmark && (
        <span
          className={cn(
            'font-heading font-semibold tracking-tight text-foreground uppercase',
            classes.wordmark,
          )}
        >
          BB
        </span>
      )}
    </div>
  )
}
