import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '../design-system/primitives/Badge';
import { Button } from '../design-system/primitives/Button';
import { Card } from '../design-system/primitives/Card';
import { Spinner } from '../design-system/primitives/Spinner';
import { DataProvenanceBar } from './DataProvenanceBar';
import { api } from '../lib/api/client';
import type { DataProvenance, LiveSignalBundle } from '../features/market/types';

interface PulseItem {
  ticker: string;
  sentiment: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  change1d: number;
  pressure: string;
  asOf: string;
  provenance: DataProvenance | null;
}

const PULSE_TICKERS = ['SPY', 'QQQ', 'DIA', 'IWM', 'XLF', 'XLK'];
const provenanceLevelRank: Record<DataProvenance['level'], number> = {
  live: 0,
  delayed: 1,
  eod: 2,
  stale: 3,
  unavailable: 4,
};

const badgeForSentiment = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 0.1) {
    return 'success';
  }
  if (score <= -0.1) {
    return 'danger';
  }
  return 'warning';
};

export function MarketNews() {
  const [items, setItems] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [provenance, setProvenance] = useState<DataProvenance | null>(null);

  const loadPulse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settled = await Promise.allSettled(
        PULSE_TICKERS.map((ticker) =>
          api.get<LiveSignalBundle>(`/signals/${ticker}/bundle?lookback_days=30&history_limit=10`)
        )
      );

      const nextItems = settled
        .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
        .reduce<PulseItem[]>((accumulator, bundle) => {
          if (!bundle.signal || !bundle.decision || !bundle.insight) {
            return accumulator;
          }
          accumulator.push({
            ticker: bundle.ticker,
            sentiment: bundle.signal.sentiment_score,
            trend: bundle.decision.trend_label,
            change1d: bundle.decision.change_1d_pct ?? 0,
            pressure: bundle.insight.pressure_label,
            asOf: bundle.quote?.asOf || bundle.pulled_at || bundle.signal.as_of,
            provenance: bundle.provenance ?? bundle.quote?.freshness ?? null,
          });
          return accumulator;
        }, [])
        .sort((left, right) => Math.abs(right.sentiment) - Math.abs(left.sentiment));

      if (!nextItems.length) {
        throw new Error('No live market pulse rows returned.');
      }

      setItems(nextItems);
      const provenanceRows = nextItems
        .map((item) => item.provenance)
        .filter((entry): entry is DataProvenance => entry !== null);
      if (provenanceRows.length > 0) {
        const worst = provenanceRows.reduce((carry, current) => {
          const carryRank = provenanceLevelRank[carry.level] ?? provenanceLevelRank.unavailable;
          const currentRank = provenanceLevelRank[current.level] ?? provenanceLevelRank.unavailable;
          return currentRank > carryRank ? current : carry;
        }, provenanceRows[0]);
        setProvenance(worst);
      } else {
        setProvenance(null);
      }
      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError: unknown) {
      setItems([]);
      setProvenance(null);
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError('Unable to load market pulse right now.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPulse();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPulse]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadPulse();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadPulse]);

  const freshAsOf = useMemo(() => {
    if (!items.length) {
      return null;
    }
    return [...items].sort((left, right) => left.asOf.localeCompare(right.asOf)).at(-1)?.asOf ?? null;
  }, [items]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-medium">Market Pulse</h3>
          <p className="text-[11px] text-hal-muted">
            {lastUpdatedAt ? `Updated ${new Date(lastUpdatedAt).toLocaleTimeString()}` : 'Not updated yet'}
            {freshAsOf ? ` • market as-of ${freshAsOf}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            Live
          </Badge>
          <Button type="button" size="sm" variant="ghost" onClick={() => void loadPulse()} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
        </div>
      </div>
      <DataProvenanceBar provenance={provenance} compact className="mb-4" />

      {error && (
        <div className="rounded-[var(--hal-radius-sm)] border border-hal-danger/40 bg-hal-danger/5 px-3 py-2 text-sm text-hal-danger mb-3">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-hal-muted">
          <Spinner size="sm" />
          Loading live market pulse...
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.ticker} className="border-l-2 border-hal-accent/45 pl-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm leading-snug">
                  <span className="font-medium">{item.ticker}</span> trend is {item.trend.replace('_', ' ')}
                </div>
                <Badge size="sm" variant={badgeForSentiment(item.sentiment)}>
                  {item.sentiment.toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-hal-muted flex-wrap">
                <span>{item.change1d >= 0 ? '+' : ''}{item.change1d.toFixed(2)}% (1D)</span>
                <span>•</span>
                <span>{item.pressure}</span>
                <span>•</span>
                <span>as-of {item.asOf}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
