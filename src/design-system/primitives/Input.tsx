import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs uppercase tracking-[0.16em] text-hal-muted mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-2 px-3 py-2 text-sm text-hal-text placeholder:text-hal-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hal-primary/60 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-hal-danger focus-visible:ring-hal-danger/60',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-hal-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
