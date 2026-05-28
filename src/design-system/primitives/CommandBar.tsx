import { useState } from 'react';
import { cn } from '../../lib/utils/cn';

interface CommandBarProps {
  placeholder?: string;
  onCommand?: (command: string) => void;
  className?: string;
}

export function CommandBar({ placeholder = "Type a command (e.g. 'signal MSFT')", onCommand, className }: CommandBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onCommand?.(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="flex items-center rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-2 px-4 py-2 focus-within:border-hal-primary/60">
        <span className="text-hal-muted mr-3 select-none">&gt;</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-hal-text placeholder:text-hal-muted focus:outline-none"
        />
        <kbd className="hidden sm:block text-[10px] text-hal-muted bg-hal-panel-soft px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>
    </form>
  );
}
