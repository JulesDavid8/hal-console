import { cn } from '../lib/utils/cn';

interface NavItem {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  className?: string;
  navItems?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', active: true },
  { label: 'Signals' },
  { label: 'Watchlists' },
  { label: 'Scenarios' },
  { label: 'Optimization' },
  { label: 'ML Datasets' },
];

export function Sidebar({ className, navItems = defaultNavItems }: SidebarProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-hal-muted mb-2">Navigation</div>
        <nav className="space-y-0.5">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                'w-full text-left px-3 py-1.5 rounded-[var(--hal-radius-sm)] text-sm transition-colors',
                item.active 
                  ? 'bg-hal-primary/10 text-hal-primary font-medium' 
                  : 'text-hal-text-soft hover:bg-hal-panel-soft hover:text-hal-text'
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-4 border-t border-hal-border">
        <div className="text-[10px] text-hal-muted">Universe: S&P 500</div>
        <div className="text-[10px] text-hal-muted">Last refresh: moments ago</div>
      </div>
    </div>
  );
}
