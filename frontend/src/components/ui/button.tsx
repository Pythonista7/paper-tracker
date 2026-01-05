import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger';

const variantMap: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-surface-900 hover:bg-accent/90',
  ghost: 'bg-transparent border border-white/10 text-white hover:border-accent/60',
  subtle: 'bg-white/5 text-white hover:bg-white/10',
  danger: 'bg-red-500/80 text-white hover:bg-red-500'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', disabled, fullWidth, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60',
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
