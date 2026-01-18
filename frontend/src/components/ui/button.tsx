import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'secondary' | 'outline' | 'default';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantMap: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-surface-900 hover:bg-accent/90',
  ghost: 'bg-transparent border border-white/10 text-white hover:border-accent/60',
  subtle: 'bg-white/5 text-white hover:bg-white/10',
  danger: 'bg-red-500/80 text-white hover:bg-red-500',
  secondary: 'bg-muted text-foreground hover:bg-muted/80',
  outline: 'border border-border text-foreground hover:bg-muted',
  default: 'bg-accent text-surface-900 hover:bg-accent/90'
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', disabled, fullWidth, size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60',
        sizeMap[size],
        variantMap[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
);

Button.displayName = 'Button';
