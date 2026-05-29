import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '../../design-system/primitives/Badge';
import { Button } from '../../design-system/primitives/Button';
import { Card } from '../../design-system/primitives/Card';
import { Input } from '../../design-system/primitives/Input';
import { Spinner } from '../../design-system/primitives/Spinner';
import { DataProvenanceBar } from '../../components/DataProvenanceBar';
import { api } from '../../lib/api/client';
import { InsiderIntelligenceSummary } from './InsiderIntelligenceSummary';
import type {
  LiveSignalBundle,
  SymbolSuggestion,
  SymbolSuggestionResponse,
} from '../market/types';

interface InsiderTransaction {
  ticker: string;
  insider_name: string;
  insider_title?: string | null;
  transaction_date: string;
  shares: number;
  price_per_share?: number | null;
  transaction_code: string;
  is_10b5_1?: boolean;
}

interface TickerExplorerProps {
  onOpenLabTicker?: (ticker: string) => void;
}

const tickerPattern = /^[A-Z0-9.-]{1,12}$/;

const formatMoney = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });
};

const formatPct = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Failed to fetch live data. Please try again.';
}

function normalizeSymbolCandidate(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  if (!tickerPattern.test(normalized)) {
    return null;
  }
  return normalized;
}

export function TickerExplorer({ onOpenLabTicker }: TickerExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('MSFT');
  const [selectedTicker, setSelectedTicker] = useState('MSFT');
  const [bundle, setBundle] = useState<LiveSignalBundle | null>(null);
  const [insiders, setInsiders] = useState<InsiderTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const payload = await api.get<SymbolSuggestionResponse>(
          `/search/symbols?q=${encodeURIComponent(trimmed)}&limit=8`
        );
        setSuggestions(payload.suggestions || []);
        if (payload.suggestions?.length) {
          setSuggestionsOpen(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async (targetTicker?: string) => {
    const candidate =
      targetTicker ||
      normalizeSymbolCandidate(searchQuery) ||
      (suggestions.length > 0 ? suggestions[0].ticker.toUpperCase() : null);
    if (!candidate) {
      setError(
        `No stock symbol found for "${searchQuery}". Choose one of the suggestions below.`
      );
      return;
    }

    const activeTicker = candidate.toUpperCase();
    setSelectedTicker(activeTicker);
    setSearchQuery(activeTicker);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setLoading(true);
    setError(null);

    try {
      const [liveBundle, insiderData] = await Promise.all([
        api.get<LiveSignalBundle>(
          `/signals/${activeTicker}/bundle?lookback_days=365&history_limit=60`
        ),
        api
          .get<{ records: InsiderTransaction[] }>(`/insiders/${activeTicker}?limit=8`)
          .catch(() => ({ records: [] })),
      ]);

      setBundle(liveBundle);
      setInsiders(insiderData.records || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setBundle(null);
      setInsiders([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, suggestions]);

  useEffect(() => {
    if (!bundle) {
      return;
    }
    const interval = window.setInterval(() => {
      void fetchData(selectedTicker);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [bundle, fetchData, selectedTicker]);

  const chooseSuggestion = (suggestion: SymbolSuggestion) => {
    setSearchQuery(suggestion.ticker);
    void fetchData(suggestion.ticker);
  };

  const priceChartData = useMemo(() => {
    if (!bundle) {
      return [] as Array<{ date: string; close: number; volume: number }>;
    }
    return bundle.decision.records
      .map((point) => ({
        date: point.as_of,
        close: Number.parseFloat(point.adjusted_close),
        volume: point.volume,
      }))
      .filter((point) => Number.isFinite(point.close) && Number.isFinite(point.volume));
  }, [bundle]);

  const sentimentChartData = useMemo(() => {
    if (!bundle) {
      return [] as Array<{ date: string; sentiment: number }>;
    }
    return [...bundle.history.records]
      .reverse()
      .map((point) => ({
        date: point.as_of,
        sentiment: point.sentiment_score,
      }))
      .filter((point) => Number.isFinite(point.sentiment));
  }, [bundle]);

  const latestPrice = bundle
    ? Number.parseFloat(bundle.quote?.price?.toString() ?? bundle.decision.latest_adjusted_close)
    : null;

  const lastUpdateText = bundle?.quote?.asOf
    ? `Live quote ${new Date(bundle.quote.asOf).toLocaleString()}`
    : bundle?.pulled_at
      ? `Pulled ${new Date(bundle.pulled_at).toLocaleString()}`
      : null;
  const provenance = bundle?.provenance ?? bundle?.quote?.freshness ?? null;

  return (
    <div className="space-y-6">
      <div ref={searchContainerRef} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end relative">
        <div className="relative">
          <Input
            label="Search Any Stock, Company, Or Theme"
            value={searchQuery}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchQuery(nextValue);
              if (nextValue.trim().length < 2) {
                setSuggestions([]);
                setSuggestionsOpen(false);
                setSuggestionsLoading(false);
              }
            }}
            placeholder='Try "Tesla", "TSLA", "copper", "semiconductors"...'
            onFocus={() => {
              if (suggestions.length > 0) {
                setSuggestionsOpen(true);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void fetchData();
              }
            }}
          />

          {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
            <div className="absolute z-30 mt-1 w-full rounded-[var(--hal-radius-md)] border border-hal-border bg-hal-bg-1 shadow-xl">
              {suggestionsLoading && (
                <div className="px-3 py-2 text-xs text-hal-muted flex items-center gap-2">
                  <Spinner size="sm" />
                  Finding live symbol matches...
                </div>
              )}
              {!suggestionsLoading && (
                <ul className="max-h-72 overflow-auto py-1">
                  {suggestions.map((suggestion) => (
                    <li key={`${suggestion.ticker}-${suggestion.exchange}`}>
                      <button
                        type="button"
                        onClick={() => chooseSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-hal-panel-soft transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{suggestion.ticker}</div>
                            <div className="text-xs text-hal-text-soft">{suggestion.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-hal-muted">{suggestion.exchange}</div>
                            <div className="text-[10px] text-hal-primary">{suggestion.reason}</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={() => void fetchData()} disabled={loading || !searchQuery.trim()}>
            {loading ? <Spinner size="sm" /> : 'Load Live Data'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenLabTicker?.(selectedTicker)}
            disabled={!selectedTicker}
          >
            Open In Lab
          </Button>
        </div>
      </div>

      <Card className="border-hal-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-hal-text-soft">
            Suggestions use live symbol search + semantic theme mapping across US and global markets.
          </div>
          <div className="text-[11px] text-hal-muted">
            {lastUpdateText || 'Waiting for symbol load'} {bundle ? '• auto refresh 30s' : ''}
          </div>
        </div>
        {bundle && (
          <DataProvenanceBar
            provenance={provenance}
            compact
            className="mt-3"
          />
        )}
      </Card>

      {error && (
        <Card className="border-hal-danger/50 bg-hal-danger/5">
          <p className="text-hal-danger text-sm">{error}</p>
        </Card>
      )}

      {bundle && (
        <Card className="border-hal-primary/20">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-sm text-hal-muted">{bundle.ticker} Snapshot</div>
              <div className="text-3xl font-medium tabular-nums">{formatMoney(latestPrice)}</div>
              <div className="text-xs text-hal-muted mt-1">
                {lastUpdateText || `Market as-of ${bundle.signal.as_of}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={bundle.signal.sentiment_score >= 0 ? 'success' : 'danger'}>
                Sentiment {bundle.signal.sentiment_score.toFixed(2)}
              </Badge>
              <Badge variant="neutral">{bundle.decision.trend_label}</Badge>
            </div>
          </div>
          <DataProvenanceBar provenance={provenance} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="hal-panel bg-hal-panel-soft px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">1D Change</div>
              <div className="mt-1 font-medium">{formatPct(bundle.decision.change_1d_pct)}</div>
            </div>
            <div className="hal-panel bg-hal-panel-soft px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">5D Change</div>
              <div className="mt-1 font-medium">{formatPct(bundle.decision.change_5d_pct)}</div>
            </div>
            <div className="hal-panel bg-hal-panel-soft px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">20D Change</div>
              <div className="mt-1 font-medium">{formatPct(bundle.decision.change_20d_pct)}</div>
            </div>
            <div className="hal-panel bg-hal-panel-soft px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">Relative Volume</div>
              <div className="mt-1 font-medium">
                {bundle.decision.relative_volume_20d !== null &&
                bundle.decision.relative_volume_20d !== undefined
                  ? `${bundle.decision.relative_volume_20d.toFixed(2)}x`
                  : '—'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {bundle && (
        <>
          <Card>
            <h3 className="font-medium mb-4">Price Movement ({bundle.ticker})</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceChartData}>
                  <CartesianGrid stroke="var(--hal-grid)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} minTickGap={36} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} width={58} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--hal-bg-1)',
                      border: '1px solid var(--hal-panel-border-strong)',
                      borderRadius: '10px',
                    }}
                  />
                  <Line type="monotone" dataKey="close" stroke="var(--hal-primary)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="font-medium mb-4">Signal Movement ({bundle.ticker})</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentChartData}>
                  <CartesianGrid stroke="var(--hal-grid)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} minTickGap={36} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} width={52} />
                  <Tooltip />
                  <Bar dataKey="sentiment" fill="var(--hal-accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {insiders.length > 0 && (
        <InsiderIntelligenceSummary transactions={insiders} ticker={selectedTicker} />
      )}

      {!loading && !bundle && !error && (
        <p className="text-hal-muted text-sm">
          Enter any stock, company name, or theme to see ranked ticker suggestions and live market data.
        </p>
      )}
    </div>
  );
}
