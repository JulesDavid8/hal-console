import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils/cn';
import { Input } from './Input';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label,
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = query
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase()) ||
          opt.value.toLowerCase().includes(query.toLowerCase()) ||
          opt.description?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-xs uppercase tracking-[0.16em] text-hal-muted mb-1.5">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-2 px-3 text-sm cursor-pointer',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className={cn(!selectedOption && 'text-hal-muted')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-hal-muted">▼</span>
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-1 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-hal-border">
            <Input
              placeholder="Type to filter..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer hover:bg-hal-panel-soft',
                    value === option.value && 'bg-hal-primary/10 text-hal-primary'
                  )}
                >
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-hal-muted">{option.description}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-hal-muted">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
