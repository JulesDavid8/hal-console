import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-hal-primary/10 text-hal-primary',
        success: 'bg-hal-success/20 text-hal-success',
        warning: 'bg-hal-warning/10 text-hal-warning',
        danger: 'bg-hal-danger/10 text-hal-danger',
        neutral: 'bg-hal-panel-soft text-hal-muted',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
