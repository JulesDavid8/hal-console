import { Badge } from '../design-system/primitives/Badge';
import { cn } from '../lib/utils/cn';
import type { DataProvenance } from '../features/market/types';

interface DataProvenanceBarProps {
  provenance?: DataProvenance | null;
  className?: string;
  compact?: boolean;
}

const levelVariant: Record<DataProvenance['level'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  live: 'success',
  delayed: 'warning',
  eod: 'warning',
  stale: 'danger',
  unavailable: 'danger',
};

const levelLabel: Record<DataProvenance['level'], string> = {
  live: 'LIVE',
  delayed: 'DELAYED',
  eod: 'EOD',
  stale: 'STALE',
  unavailable: 'UNAVAILABLE',
};

const sessionLabel: Record<DataProvenance['session'], string> = {
  pre: 'PRE',
  regular: 'OPEN',
  post: 'POST',
  closed: 'CLOSED',
  unknown: 'UNKNOWN',
  mixed: 'MIXED',
};

function formatEt(iso: string | null): string {
  if (!iso) {
    return 'unknown';
  }
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return 'unknown';
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(parsed));
}

function formatLocal(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return 'unknown';
  }
  return new Date(parsed).toLocaleTimeString();
}

function lagLabel(lagSeconds: number | null): string {
  if (lagSeconds === null || !Number.isFinite(lagSeconds)) {
    return 'lag unknown';
  }
  if (lagSeconds < 60) {
    return `+${lagSeconds}s`;
  }
  const minutes = Math.floor(lagSeconds / 60);
  const seconds = lagSeconds % 60;
  return `+${minutes}m ${seconds}s`;
}

function caveatLabel(provenance: DataProvenance): string {
  if (provenance.level === 'eod') {
    return 'End-of-day fallback';
  }
  if (provenance.level === 'stale') {
    return 'Source stale';
  }
  if (provenance.level === 'delayed') {
    return 'Upstream delay';
  }
  if (provenance.fallback) {
    return 'Fallback source';
  }
  return 'Near real-time';
}

export function DataProvenanceBar({
  provenance,
  className,
  compact = false,
}: DataProvenanceBarProps) {
  if (provenance === undefined) {
    return (
      <div
        className={cn(
          'rounded-[var(--hal-radius-sm)] border border-hal-border bg-hal-panel-soft/60 px-3 py-2 text-xs text-hal-muted',
          className
        )}
      >
        Refreshing data freshness...
      </div>
    );
  }

  if (provenance === null) {
    return (
      <div
        className={cn(
          'rounded-[var(--hal-radius-sm)] border border-hal-border bg-hal-panel-soft/60 px-3 py-2 text-xs text-hal-muted',
          className
        )}
      >
        Data freshness unavailable
      </div>
    );
  }

  const quoteAsOfEt = formatEt(provenance.source_ts);
  const pulledLocal = formatLocal(provenance.pulled_ts);
  const sourceLabel = provenance.source.replace(/_/g, ' ').toUpperCase();
  const session = sessionLabel[provenance.session] ?? 'UNKNOWN';
  const lag = lagLabel(provenance.lag_seconds);
  const caveat = caveatLabel(provenance);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-[var(--hal-radius-sm)] border border-hal-border bg-hal-panel-soft/45 px-3 py-2',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant={levelVariant[provenance.level]}>{levelLabel[provenance.level]}</Badge>
        <Badge size="sm" variant="neutral">{session}</Badge>
        {provenance.fallback && (
          <Badge size="sm" variant="warning">FALLBACK</Badge>
        )}
        <span className="text-[11px] font-mono text-hal-text-soft">{sourceLabel}</span>
        <span className="text-[11px] font-mono text-hal-text-soft" title={provenance.source_ts ?? 'unknown'}>
          as-of {quoteAsOfEt} ET
        </span>
        {!compact && (
          <span className="text-[11px] font-mono text-hal-muted" title={provenance.pulled_ts}>
            pulled {pulledLocal}
          </span>
        )}
        <span className="text-[11px] font-mono text-hal-muted">{lag}</span>
      </div>
      {!compact && (
        <div className="mt-1 text-[11px] text-hal-muted">{caveat}</div>
      )}
    </div>
  );
}
