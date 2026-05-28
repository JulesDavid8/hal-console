import { cn } from '../lib/utils/cn';
import { Badge } from '../design-system/primitives/Badge';

interface NavItem {
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}

interface SidebarProps {
  className?: string;
  navItems?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', active: true },
  { label: 'Signals', badge: '12' },
  { label: 'Watchlists' },
  { label: 'Scenarios' },
  { label: 'Optimization' },
  { label: 'ML Datasets' },
];

export function Sidebar({ className, navItems = defaultNavItems }: SidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-hal-muted mb-2 px-3">Navigation</div>
        <nav className="space-y-1">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                'w-full flex items-center justify-between text-left px-3 py-2 rounded-[var(--hal-radius-sm)] text-sm transition-colors border border-transparent',
                item.active 
                  ? 'bg-hal-primary/12 text-hal-primary font-medium border-hal-primary/30 shadow-hal-glow-soft'
                  : 'text-hal-text-soft hover:bg-hal-panel-soft hover:border-hal-border hover:text-hal-text'
              )}
            >
              <span className="flex items-center gap-2">
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
