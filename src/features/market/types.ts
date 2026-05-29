export interface SignalSnapshot {
  ticker: string;
  as_of: string;
  net_shares: number;
  net_notional: string;
  buy_txn_count: number;
  sell_txn_count: number;
  sentiment_score: number;
}

export interface SignalInsight {
  ticker: string;
  as_of: string;
  sentiment_score: number;
  sentiment_label: string;
  pressure_label: string;
  market_average_score?: number | null;
  relative_strength?: number | null;
  percentile?: number | null;
}

export interface SignalHistoryPoint {
  ticker: string;
  as_of: string;
  net_shares: number;
  net_notional: string;
  buy_txn_count: number;
  sell_txn_count: number;
  sentiment_score: number;
  sentiment_label: string;
  pressure_label: string;
  market_average_score?: number | null;
  relative_strength?: number | null;
}

export interface SignalHistoryPage {
  ticker: string;
  records: SignalHistoryPoint[];
  next_cursor?: string | null;
}

export interface PriceHistoryPoint {
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

export interface StockDecisionSnapshot {
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

export interface SignalCatalyst {
  code: string;
  label: string;
  description: string;
  value: number;
  contribution: number;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export interface SignalScenario {
  ticker: string;
  as_of: string;
  lookback_days: number;
  scenario_score: number;
  confidence: number;
  regime: string;
  summary: string;
  catalysts: SignalCatalyst[];
}

export interface DataProvenance {
  source_ts: string | null;
  pulled_ts: string;
  session: 'pre' | 'regular' | 'post' | 'closed' | 'unknown' | 'mixed';
  lag_seconds: number | null;
  level: 'live' | 'delayed' | 'eod' | 'stale' | 'unavailable';
  source: string;
  fallback: boolean;
}

export interface LiveSignalBundle {
  ticker: string;
  pulled_at: string;
  provenance?: DataProvenance | null;
  quote?: {
    ticker: string;
    price: number;
    previousClose?: number | null;
    changePct?: number | null;
    currency?: string | null;
    exchangeName?: string | null;
    asOf: string;
    freshness?: DataProvenance | null;
  } | null;
  signal: SignalSnapshot;
  insight: SignalInsight;
  history: SignalHistoryPage;
  decision: StockDecisionSnapshot;
  scenario: SignalScenario;
}

export interface MarketContextItem {
  ticker: string;
  label: string;
  group: 'US' | 'GLOBAL' | 'ASSET';
  price: number;
  change_pct: number | null;
  as_of: string;
  currency: string;
  exchange: string | null;
  freshness?: DataProvenance | null;
}

export interface MarketContextHeadline {
  uuid?: string;
  title: string;
  publisher: string;
  link: string;
  published_at: string | null;
  source_query: string;
  related_tickers?: string[];
  mention_count?: number;
  popularity_score?: number;
  relevance_score?: number;
  wire_score?: number;
  urgency?: 'normal' | 'elevated' | 'breaking';
}

export interface MarketContextResponse {
  updated_at: string;
  latest_as_of: string | null;
  refresh_hint_seconds: number;
  coverage: string;
  caveat?: string;
  provenance?: DataProvenance | null;
  focus_terms_applied?: string[];
  wire_story_count?: number;
  items: MarketContextItem[];
  highlights: MarketContextHeadline[];
}

export interface SymbolSuggestion {
  ticker: string;
  name: string;
  exchange: string;
  quoteType: string;
  reason: string;
}

export interface SymbolSuggestionResponse {
  query: string;
  updated_at: string;
  suggestions: SymbolSuggestion[];
}

export interface LabIntelligenceHeadline {
  title: string;
  publisher: string;
  link: string;
  published_at: string | null;
  topic: 'market' | 'economic' | 'political' | 'technology' | 'conflict' | 'company' | 'flow';
  relevance_score: number;
  impact_score: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface LabIntelligenceDriver {
  topic: 'market' | 'economic' | 'political' | 'technology' | 'conflict' | 'company' | 'flow';
  title: string;
  detail: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  weight: number;
}

export interface LabIntelligenceResponse {
  ticker: string;
  as_of: string;
  pulled_at: string;
  lookback_days: number;
  signal_context: {
    sentiment_score: number;
    scenario_score: number;
    regime: string;
    trend_label: 'uptrend' | 'downtrend' | 'sideways';
    change_20d_pct: number | null;
    relative_volume_20d: number | null;
  };
  unusual_flow: {
    detected: boolean;
    direction: 'bullish' | 'bearish' | 'neutral';
    current_abs_notional: number;
    baseline_abs_notional: number;
    z_score: number | null;
    explanation: string;
  };
  macro_pulse: {
    market: number;
    economic: number;
    political: number;
    technology: number;
    conflict: number;
  };
  reaction_outlook: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    horizon: '24h' | '1w' | '1m';
    summary: string;
  };
  drivers: LabIntelligenceDriver[];
  headlines: LabIntelligenceHeadline[];
}

export interface SloMetricPct {
  value_pct: number;
  target_pct?: number;
  status: 'healthy' | 'warning' | 'critical';
  detail: string;
}

export interface SloMetricMs {
  value_ms: number;
  target_ms: number;
  status: 'healthy' | 'warning' | 'critical';
  detail: string;
}

export interface SloStatusResponse {
  status: 'healthy' | 'warning' | 'critical';
  checked_at: string;
  window: string;
  sample_size: number;
  failures: number;
  targets: {
    availability_pct: number;
    latency_p95_ms: number;
    freshness_24h_pct: number;
    error_budget_monthly_pct: number;
  };
  metrics: {
    availability: SloMetricPct;
    latency_p95: SloMetricMs;
    freshness_24h: SloMetricPct;
    error_budget_remaining: SloMetricPct;
  };
  policy: {
    release_mode: 'normal' | 'guarded_release' | 'stability_only';
  };
  probe_tickers: string[];
}
