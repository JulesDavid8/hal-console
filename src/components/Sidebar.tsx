import { type ReactNode } from 'react';
import { cn } from '../lib/utils/cn';
import { Badge } from '../design-system/primitives/Badge';

interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}

interface SidebarProps {
  className?: string;
  navItems?: NavItem[]; 
}

export function Sidebar({ className, navItems = [] }: SidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-hal-muted mb-2 px-3">
          Navigation Hub
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              disabled={item.disabled}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'w-full flex items-center justify-between text-left px-3 py-2 rounded-[var(--hal-radius-sm)] text-sm transition-colors border border-transparent disabled:opacity-55 disabled:cursor-not-allowed',
                item.active 
                  ? 'bg-hal-primary/12 text-hal-primary font-medium border-hal-primary/30 shadow-hal-glow-soft'
                  : 'text-hal-text-soft hover:bg-hal-panel-soft hover:border-hal-border hover:text-hal-text',
                item.disabled && 'hover:bg-transparent hover:border-transparent hover:text-hal-text-soft'
              )}
            >
              <span className="flex items-center gap-2">
                {item.icon && <span className="text-hal-muted">{item.icon}</span>}
                {item.active && <span className="h-1.5 w-1.5 rounded-full bg-hal-primary" />}
                {item.label}
              </span>
              {item.badge && <Badge size="sm">{item.badge}</Badge>}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-4 border-t border-hal-border px-3">
        <div className="text-[10px] text-hal-muted">Universe: S&amp;P 500</div>
        <div className="text-[10px] text-hal-muted">Last refresh: moments ago</div>
      </div>
    </div>
  );
}
