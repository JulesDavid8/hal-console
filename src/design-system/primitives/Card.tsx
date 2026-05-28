import * as React from 'react';
import { cn } from '../../lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'soft';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'hal-panel p-6',
          variant === 'soft' && 'bg-hal-panel-soft',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
