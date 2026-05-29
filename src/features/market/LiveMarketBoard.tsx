import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '../../design-system/primitives/Button';
import { Card } from '../../design-system/primitives/Card';
import { Spinner } from '../../design-system/primitives/Spinner';
import { DataProvenanceBar } from '../../components/DataProvenanceBar';
import { api } from '../../lib/api/client';
import { SignalCard } from '../signals';
import type { DataProvenance, LiveSignalBundle } from './types';

interface LiveMarketBoardProps {
  tickers?: string[];
  onSelectTicker?: (ticker: string) => void;
}

interface MarketRow {
  ticker: string;
  sentiment: number;
  change1d: number;
  asOf: string;
}

const provenanceLevelRank: Record<DataProvenance['level'], number> = {
  live: 0,
  delayed: 1,
  eod: 2,
  stale: 3,
  unavailable: 4,
};

const DEFAULT_TICKERS = ['SPY', 'DIA', 'QQQ', 'IWM', 'EFA', 'EEM', 'GLD', 'USO'];

const formatSyncTime = (iso: string | null): string => {
  if (!iso) {
    return 'not yet';
  }
  return new Date(iso).toLocaleTimeString();
};

export function LiveMarketBoard({ tickers = DEFAULT_TICKERS, onSelectTicker }: LiveMarketBoardProps) {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [boardProvenance, setBoardProvenance] = useState<DataProvenance | null>(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const settled = await Promise.allSettled(
        tickers.map((ticker) =>
          api.get<LiveSignalBundle>(
            `/signals/${ticker}/bundle?lookback_days=45&history_limit=12`
          )
        )
      );

      const nextRows = settled
        .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
        .map((bundle) => {
          if (!bundle.signal || !bundle.decision) {
            return null;
          }
          return {
            ticker: bundle.ticker,
            sentiment: bundle.signal.sentiment_score,
            change1d: bundle.decision.change_1d_pct ?? 0,
            asOf: bundle.quote?.asOf || bundle.pulled_at || bundle.signal.as_of,
          };
        })
        .filter((item): item is MarketRow => item !== null)
        .sort((left, right) => Math.abs(right.sentiment) - Math.abs(left.sentiment));
      const provenanceRecords = settled
        .flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
        .map((bundle) => bundle.provenance ?? bundle.quote?.freshness ?? null)
        .filter((entry): entry is DataProvenance => entry !== null);

      if (!nextRows.length) {
        throw new Error('No live market rows were returned.');
      }

      setRows(nextRows);
      if (provenanceRecords.length > 0) {
        const worst = provenanceRecords.reduce((carry, current) => {
          const carryRank = provenanceLevelRank[carry.level] ?? provenanceLevelRank.unavailable;
          const currentRank = provenanceLevelRank[current.level] ?? provenanceLevelRank.unavailable;
          return currentRank > carryRank ? current : carry;
        }, provenanceRecords[0]);
        setBoardProvenance(worst);
      } else {
        setBoardProvenance(null);
      }
      setLastSyncedAt(new Date().toISOString());
    } catch (loadError: unknown) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError('Unable to load live market signals right now.');
      }
      setRows([]);
      setBoardProvenance(null);
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBoard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchBoard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchBoard();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [fetchBoard]);

  const asOfSummary = useMemo(() => {
    if (!rows.length) {
      return null;
    }
    const asOfValues = rows.map((row) => row.asOf).sort();
    return asOfValues[asOfValues.length - 1];
  }, [rows]);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Live Signal Board</h2>
          <p className="text-xs text-hal-muted">
            Last sync {formatSyncTime(lastSyncedAt)} {asOfSummary ? `• quote as-of ${new Date(asOfSummary).toLocaleString()}` : ''}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void fetchBoard()} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Refresh'}
        </Button>
      </div>
      <DataProvenanceBar provenance={boardProvenance} compact className="mb-4" />

      {error && (
        <div className="rounded-[var(--hal-radius-md)] border border-hal-danger/40 bg-hal-danger/5 px-3 py-2 text-sm text-hal-danger mb-3">
          {error}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-3 py-3 text-hal-muted text-sm">
          <Spinner size="sm" />
          Loading live signal board...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {rows.map((row) => (
            <SignalCard
              key={row.ticker}
              ticker={row.ticker}
              sentiment={row.sentiment}
              change={row.change1d}
              onSelect={onSelectTicker}
              asOf={row.asOf}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
