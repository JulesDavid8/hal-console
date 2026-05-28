import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--hal-radius-md)] font-medium transition-all active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hal-primary/70',
  {
    variants: {
      variant: {
        primary: 'bg-hal-primary text-[#06101a] hover:brightness-105 shadow-[var(--hal-glow-soft)]',
        secondary: 'border border-hal-border text-hal-text hover:border-hal-primary/45 hover:bg-hal-panel-soft',
        ghost: 'text-hal-text hover:bg-hal-panel-soft',
        danger: 'bg-hal-danger text-white hover:brightness-105',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
