import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Activity, ChevronRight, FlaskConical, Play, Radio, TrendingUp } from 'lucide-react';

import { Button } from '../design-system/primitives/Button';
import { Card } from '../design-system/primitives/Card';
import { Input } from '../design-system/primitives/Input';
import { Badge } from '../design-system/primitives/Badge';
import { Spinner } from '../design-system/primitives/Spinner';
import { Combobox, type ComboboxOption } from '../design-system/primitives/Combobox';
import { api } from '../lib/api/client';

const POPULAR_TICKERS: ComboboxOption[] = [
  { value: 'AAPL', label: 'Apple Inc.', description: 'Technology' },
  { value: 'MSFT', label: 'Microsoft Corporation', description: 'Technology' },
  { value: 'NVDA', label: 'NVIDIA Corporation', description: 'Technology' },
  { value: 'AMZN', label: 'Amazon.com Inc.', description: 'Consumer Discretionary' },
  { value: 'GOOGL', label: 'Alphabet Inc.', description: 'Communication Services' },
  { value: 'META', label: 'Meta Platforms Inc.', description: 'Communication Services' },
  { value: 'TSLA', label: 'Tesla Inc.', description: 'Consumer Discretionary' },
  { value: 'JPM', label: 'JPMorgan Chase & Co.', description: 'Financials' },
  { value: 'XOM', label: 'Exxon Mobil Corporation', description: 'Energy' },
  { value: 'UNH', label: 'UnitedHealth Group', description: 'Healthcare' },
  { value: 'BA', label: 'Boeing Co.', description: 'Industrials' },
  { value: 'AVGO', label: 'Broadcom Inc.', description: 'Technology' },
];

const LOOKBACK_OPTIONS = [30, 90, 180, 365];

type LabTab = 'price' | 'signal' | 'scenario';

interface PriceHistoryPoint {
  ticker: string;
  as_of: string;
  open: string;
  high: string;
  low: string;
  close: string;
  adjusted_close: string;
  volume: number;
  sma_20?: string | null;
  sma_50?: string | null;
}

interface StockDecisionSnapshot {
  ticker: string;
  as_of: string;
  lookback_days: number;
  trend_label: 'uptrend' | 'downtrend' | 'sideways';
  latest_adjusted_close: string;
  latest_volume: number;
  average_volume_20d?: number | null;
  relative_volume_20d?: number | null;
  change_1d_pct?: number | null;
  change_5d_pct?: number | null;
  change_20d_pct?: number | null;
  high_52w: string;
  low_52w: string;
  distance_from_52w_high_pct?: number | null;
  distance_from_52w_low_pct?: number | null;
  volatility_20d_pct?: number | null;
  records: PriceHistoryPoint[];
}

interface SignalSnapshot {
  ticker: string;
  as_of: string;
  sentiment_score: number;
  buy_txn_count: number;
  sell_txn_count: number;
  net_notional: string;
}

interface SignalInsight {
  ticker: string;
  as_of: string;
  sentiment_score: number;
  sentiment_label: string;
  pressure_label: string;
  market_average_score?: number | null;
  relative_strength?: number | null;
  percentile?: number | null;
}

interface SignalHistoryPoint {
  ticker: string;
  as_of: string;
  sentiment_score: number;
  sentiment_label: string;
  pressure_label: string;
  market_average_score?: number | null;
  relative_strength?: number | null;
}

interface SignalHistoryPage {
  ticker: string;
  records: SignalHistoryPoint[];
  next_cursor?: string | null;
}

interface SignalCatalyst {
  code: string;
  label: string;
  description: string;
  value: number;
  contribution: number;
  direction: 'bullish' | 'bearish' | 'neutral';
}

interface SignalScenario {
  ticker: string;
  as_of: string;
  lookback_days: number;
  scenario_score: number;
  confidence: number;
  regime: string;
  summary: string;
  catalysts: SignalCatalyst[];
}

const toNumber = (value: string | number | null | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatMoney = (value: number | null): string => {
  if (value === null) {
    return '—';
  }
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });
};

const formatPct = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString(undefined, {
    notation: 'compact',
    maximumFractionDigits: 2,
  });
};

const dayLagFromIsoDate = (isoDate: string): number => {
  const asOfMs = Date.parse(isoDate);
  if (Number.isNaN(asOfMs)) {
    return 0;
  }
  return Math.max(0, Math.floor((Date.now() - asOfMs) / (24 * 60 * 60 * 1000)));
};

const labelFromTrend = (trend: StockDecisionSnapshot['trend_label']): string => {
  if (trend === 'uptrend') {
    return 'Uptrend';
  }
  if (trend === 'downtrend') {
    return 'Downtrend';
  }
  return 'Sideways';
};

const badgeForTrend = (trend: StockDecisionSnapshot['trend_label']): 'success' | 'warning' | 'danger' => {
  if (trend === 'uptrend') {
    return 'success';
  }
  if (trend === 'downtrend') {
    return 'danger';
  }
  return 'warning';
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

function buildErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Unable to load Lab results. Verify API connectivity and try again.';
}

export function DesignSystemPlayground() {
  const [tickerInput, setTickerInput] = useState('MSFT');
  const [lookbackDays, setLookbackDays] = useState<number>(180);
  const [activeTab, setActiveTab] = useState<LabTab>('price');
  const [autoRun, setAutoRun] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [decision, setDecision] = useState<StockDecisionSnapshot | null>(null);
  const [signal, setSignal] = useState<SignalSnapshot | null>(null);
  const [insight, setInsight] = useState<SignalInsight | null>(null);
  const [history, setHistory] = useState<SignalHistoryPage | null>(null);
  const [scenario, setScenario] = useState<SignalScenario | null>(null);

  const runLab = useCallback(
    async (tickerOverride?: string) => {
      const targetTicker = (tickerOverride ?? tickerInput).trim().toUpperCase();

      if (!targetTicker || !/^[A-Z.-]{1,10}$/.test(targetTicker)) {
        setError('Enter a valid ticker (letters, dash, or dot; up to 10 chars).');
        return;
      }

      setTickerInput(targetTicker);
      setLoading(true);
      setError(null);

      try {
        const [decisionResult, signalResult, insightResult, historyResult, scenarioResult] =
          await Promise.allSettled([
            api.get<StockDecisionSnapshot>(
              `/signals/${targetTicker}/decision?lookback_days=${lookbackDays}`
            ),
            api.get<SignalSnapshot>(`/signals/${targetTicker}`),
            api.get<SignalInsight>(`/signals/${targetTicker}/insight`),
            api.get<SignalHistoryPage>(`/signals/${targetTicker}/history?limit=40`),
            api.get<SignalScenario>(
              `/signals/${targetTicker}/scenario?lookback_days=${lookbackDays}`
            ),
          ]);

        if (decisionResult.status === 'rejected') {
          throw decisionResult.reason;
        }

        setDecision(decisionResult.value);
        setSignal(signalResult.status === 'fulfilled' ? signalResult.value : null);
        setInsight(insightResult.status === 'fulfilled' ? insightResult.value : null);
        setHistory(historyResult.status === 'fulfilled' ? historyResult.value : null);
        setScenario(scenarioResult.status === 'fulfilled' ? scenarioResult.value : null);
        setLastUpdatedAt(new Date().toISOString());
      } catch (runError: unknown) {
        setError(buildErrorMessage(runError));
        setDecision(null);
        setSignal(null);
        setInsight(null);
        setHistory(null);
        setScenario(null);
      } finally {
        setLoading(false);
      }
    },
    [lookbackDays, tickerInput]
  );

  useEffect(() => {
    if (!autoRun) {
      return;
    }
    const timer = window.setTimeout(() => {
      void runLab();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [autoRun, runLab]);

  const priceChartData = useMemo(() => {
    if (!decision) {
      return [] as Array<{
        date: string;
        close: number;
        sma20: number | null;
        sma50: number | null;
        volume: number;
      }>;
    }

    return decision.records.map((point) => ({
      date: point.as_of,
      close: toNumber(point.adjusted_close) ?? 0,
      sma20: toNumber(point.sma_20),
      sma50: toNumber(point.sma_50),
      volume: point.volume,
    }));
  }, [decision]);

  const sentimentChartData = useMemo(() => {
    if (!history) {
      return [] as Array<{ date: string; sentiment: number }>;
    }

    return [...history.records]
      .reverse()
      .map((point) => ({
        date: point.as_of,
        sentiment: point.sentiment_score,
      }));
  }, [history]);

  const latestPrice = toNumber(decision?.latest_adjusted_close);
  const high52w = toNumber(decision?.high_52w);
  const low52w = toNumber(decision?.low_52w);
  const lagDays = decision ? dayLagFromIsoDate(decision.as_of) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 border-hal-primary/20">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-hal-primary mb-2">
              <FlaskConical className="h-3.5 w-3.5" />
              Lab Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">Build, Test, Decide</h2>
            <p className="text-hal-muted mt-2 max-w-3xl text-sm sm:text-base">
              Choose any stock, tune your analysis window, and see decision-grade outputs while
              you work. Price structure, insider sentiment, and scenario context update together.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={autoRun ? 'success' : 'neutral'}>
              {autoRun ? 'Live Preview ON' : 'Manual Run'}
            </Badge>
            {lastUpdatedAt && (
              <span className="text-xs text-hal-muted">
                Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-hal-muted">Step 1 · Configure</div>

          <Input
            label="Ticker Symbol"
            value={tickerInput}
            onChange={(event) => setTickerInput(event.target.value.toUpperCase())}
            placeholder="MSFT"
            autoCapitalize="characters"
          />

          <Combobox
            label="Popular Symbols"
            options={POPULAR_TICKERS}
            value={tickerInput}
            onChange={(value) => setTickerInput(value.toUpperCase())}
            placeholder="Select a company"
          />

          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-hal-muted mb-2">
              Lookback Window
            </div>
            <div className="grid grid-cols-4 gap-2">
              {LOOKBACK_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={lookbackDays === option ? 'primary' : 'ghost'}
                  onClick={() => setLookbackDays(option)}
                  className="w-full"
                >
                  {option}d
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-hal-text-soft cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--hal-primary)]"
                checked={autoRun}
                onChange={(event) => setAutoRun(event.target.checked)}
              />
              Auto-run while editing
            </label>

            <Button
              type="button"
              variant="secondary"
              onClick={() => void runLab()}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : <Play className="h-4 w-4" />}
              Run Analysis
            </Button>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-hal-muted mb-2">
              Quick Pick
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TICKERS.slice(0, 8).map((ticker) => (
                <Button
                  key={ticker.value}
                  type="button"
                  size="sm"
                  variant={tickerInput === ticker.value ? 'primary' : 'ghost'}
                  onClick={() => setTickerInput(ticker.value)}
                >
                  {ticker.value}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {error && (
            <Card className="border-hal-danger/50 bg-hal-danger/5 p-4">
              <p className="text-sm text-hal-danger">{error}</p>
            </Card>
          )}

          {loading && !decision && (
            <Card className="flex items-center gap-3 p-5">
              <Spinner size="sm" />
              <span className="text-sm text-hal-muted">Running Lab analysis...</span>
            </Card>
          )}

          {decision && (
            <>
              <Card className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-hal-muted">Step 2 · Results</div>
                    <h3 className="text-xl font-medium tracking-tight mt-1">
                      {decision.ticker} Decision Snapshot
                    </h3>
                    <div className="text-xs text-hal-muted mt-1">
                      Market data as of {decision.as_of}
                      {lagDays > 0 ? ` (${lagDays}d lag)` : ' (latest session)'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeForTrend(decision.trend_label)}>
                      {labelFromTrend(decision.trend_label)}
                    </Badge>
                    {signal && (
                      <Badge variant={badgeForSentiment(signal.sentiment_score)}>
                        Sentiment {signal.sentiment_score.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">Last Price</div>
                    <div className="text-base sm:text-lg font-medium mt-1">{formatMoney(latestPrice)}</div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">1D Change</div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {formatPct(decision.change_1d_pct)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">5D Change</div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {formatPct(decision.change_5d_pct)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">20D Change</div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {formatPct(decision.change_20d_pct)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">52W High / Low</div>
                    <div className="text-sm sm:text-base font-medium mt-1">
                      {formatMoney(high52w)} / {formatMoney(low52w)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">From 52W High</div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {formatPct(decision.distance_from_52w_high_pct)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">Relative Volume</div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {decision.relative_volume_20d?.toFixed(2) ?? '—'}x
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-hal-muted">20D Volatility</div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {formatPct(decision.volatility_20d_pct)}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'price' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('price')}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Price Movement
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'signal' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('signal')}
                  >
                    <Activity className="h-4 w-4" />
                    Signal History
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'scenario' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('scenario')}
                  >
                    <Radio className="h-4 w-4" />
                    Scenario Readout
                  </Button>
                </div>

                {activeTab === 'price' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm uppercase tracking-[0.16em] text-hal-muted mb-2">
                        Adjusted Close + Trend Lines
                      </h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceChartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid stroke="var(--hal-grid)" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }}
                              minTickGap={32}
                            />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} width={54} />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--hal-bg-1)',
                                border: '1px solid var(--hal-panel-border-strong)',
                                borderRadius: '10px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="close"
                              name="Adj Close"
                              stroke="var(--hal-primary)"
                              strokeWidth={2.2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="sma20"
                              name="SMA 20"
                              stroke="var(--hal-warning)"
                              strokeWidth={1.6}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="sma50"
                              name="SMA 50"
                              stroke="var(--hal-cyan)"
                              strokeWidth={1.4}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm uppercase tracking-[0.16em] text-hal-muted mb-2">
                        Volume Profile
                      </h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={priceChartData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                            <CartesianGrid stroke="var(--hal-grid)" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }}
                              minTickGap={34}
                            />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }} width={54} />
                            <Tooltip
                              formatter={(value) => [formatCompact(Number(value)), 'Volume']}
                              contentStyle={{
                                background: 'var(--hal-bg-1)',
                                border: '1px solid var(--hal-panel-border-strong)',
                                borderRadius: '10px',
                              }}
                            />
                            <Bar dataKey="volume" fill="var(--hal-primary-soft)" stroke="var(--hal-primary)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'signal' && (
                  <div className="space-y-4">
                    {history && history.records.length > 0 ? (
                      <>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={sentimentChartData}
                              margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
                            >
                              <CartesianGrid stroke="var(--hal-grid)" strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }}
                                minTickGap={36}
                              />
                              <YAxis
                                domain={[-1, 1]}
                                tick={{ fontSize: 11, fill: 'var(--hal-text-muted)' }}
                                width={48}
                              />
                              <Tooltip
                                formatter={(value) => [Number(value).toFixed(2), 'Sentiment']}
                                contentStyle={{
                                  background: 'var(--hal-bg-1)',
                                  border: '1px solid var(--hal-panel-border-strong)',
                                  borderRadius: '10px',
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="sentiment"
                                stroke="var(--hal-accent)"
                                strokeWidth={2.2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {history.records.slice(0, 4).map((row) => (
                            <div key={row.as_of} className="hal-panel bg-hal-panel-soft p-3">
                              <div className="text-xs text-hal-muted">{row.as_of}</div>
                              <div className="mt-1 flex items-center justify-between gap-3">
                                <div className="font-medium">Sentiment {row.sentiment_score.toFixed(2)}</div>
                                <Badge variant={badgeForSentiment(row.sentiment_score)}>
                                  {row.sentiment_label}
                                </Badge>
                              </div>
                              <div className="text-xs text-hal-muted mt-1">{row.pressure_label}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-hal-muted">
                        Signal history is currently unavailable for this ticker.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'scenario' && (
                  <div className="space-y-4">
                    {scenario ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="hal-panel bg-hal-panel-soft p-3">
                            <div className="text-xs uppercase tracking-[0.14em] text-hal-muted">
                              Scenario Score
                            </div>
                            <div className="text-lg font-medium mt-1">{scenario.scenario_score.toFixed(2)}</div>
                          </div>
                          <div className="hal-panel bg-hal-panel-soft p-3">
                            <div className="text-xs uppercase tracking-[0.14em] text-hal-muted">
                              Confidence
                            </div>
                            <div className="text-lg font-medium mt-1">
                              {(scenario.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="hal-panel bg-hal-panel-soft p-3">
                            <div className="text-xs uppercase tracking-[0.14em] text-hal-muted">Regime</div>
                            <div className="text-lg font-medium mt-1">{scenario.regime}</div>
                          </div>
                        </div>

                        <div className="hal-panel bg-hal-panel-soft p-3">
                          <div className="text-xs uppercase tracking-[0.14em] text-hal-muted mb-1">Summary</div>
                          <p className="text-sm text-hal-text-soft">{scenario.summary}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs uppercase tracking-[0.16em] text-hal-muted">
                            Catalyst Breakdown
                          </div>
                          {scenario.catalysts.slice(0, 6).map((catalyst) => (
                            <div
                              key={`${catalyst.code}-${catalyst.label}`}
                              className="hal-panel bg-hal-panel-soft px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ChevronRight className="h-3.5 w-3.5 text-hal-muted flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{catalyst.label}</div>
                                    <div className="text-xs text-hal-muted truncate">{catalyst.description}</div>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    catalyst.direction === 'bullish'
                                      ? 'success'
                                      : catalyst.direction === 'bearish'
                                        ? 'danger'
                                        : 'neutral'
                                  }
                                >
                                  {catalyst.contribution >= 0 ? '+' : ''}
                                  {catalyst.contribution.toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-hal-muted">
                        Scenario readout is currently unavailable for this ticker.
                      </p>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="text-xs uppercase tracking-[0.18em] text-hal-muted mb-3">
                  Step 3 · Decision Shortcuts
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-hal-muted text-xs uppercase tracking-[0.14em] mb-1">
                      Liquidity Check
                    </div>
                    <div>
                      Avg 20D Volume: {formatCompact(decision.average_volume_20d)} | Current:{' '}
                      {formatCompact(decision.latest_volume)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-hal-muted text-xs uppercase tracking-[0.14em] mb-1">
                      Position In Range
                    </div>
                    <div>
                      From 52W Low: {formatPct(decision.distance_from_52w_low_pct)} | From 52W High:{' '}
                      {formatPct(decision.distance_from_52w_high_pct)}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-hal-muted text-xs uppercase tracking-[0.14em] mb-1">
                      Insider Pressure
                    </div>
                    <div>
                      {insight ? (
                        <>
                          {insight.pressure_label} · {insight.sentiment_label}
                        </>
                      ) : (
                        'No insight returned'
                      )}
                    </div>
                  </div>
                  <div className="hal-panel bg-hal-panel-soft px-3 py-3">
                    <div className="text-hal-muted text-xs uppercase tracking-[0.14em] mb-1">
                      Relative Strength
                    </div>
                    <div>
                      {insight?.relative_strength !== null && insight?.relative_strength !== undefined
                        ? insight.relative_strength.toFixed(2)
                        : '—'}
                      {insight?.percentile !== null && insight?.percentile !== undefined && (
                        <span className="text-hal-muted"> · Percentile {(insight.percentile * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
